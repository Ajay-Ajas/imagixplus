import { z } from "zod";
import { query } from "../config/db.js";
import { entities, type EntityDef } from "../models/entities.js";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80) || "item";

async function uniqueSlug(def: EntityDef, wanted: string, excludeId?: number) {
  const base = slugify(wanted);
  for (let i = 1; i < 200; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const r = await query(`select 1 from ${def.table} where slug = $1 and ($2::int is null or id <> $2)`, [slug, excludeId ?? null]);
    if (!r.rowCount) return slug;
  }
  return `${base}-${Date.now()}`;
}

export function getDef(name: string): EntityDef {
  const def = Object.hasOwn(entities, name) ? entities[name] : undefined;
  if (!def) throw new HttpError(404, "Unknown content type");
  return def;
}

const serialise = (def: EntityDef, key: string, value: unknown) =>
  def.jsonCols?.includes(key) ? JSON.stringify(value) : value;

export async function list(def: EntityDef, publicOnly: boolean) {
  const conds = [def.where];
  if (publicOnly) {
    conds.push(def.hasPublishedAt ? "published and published_at <= now()" : "published");
    if (def.archivable) conds.push("not archived");
  }
  const where = conds.filter(Boolean).join(" and ");
  return (await query(`select * from ${def.table} ${where ? `where ${where}` : ""} order by ${def.order}`)).rows;
}

export async function getById(def: EntityDef, id: number) {
  const r = await query(`select * from ${def.table} where id = $1 ${def.where ? `and ${def.where}` : ""}`, [id]);
  if (!r.rowCount) throw new HttpError(404, "Not found");
  return r.rows[0];
}

export async function create(def: EntityDef, body: unknown) {
  if (def.core) throw new HttpError(405, "The main founders are fixed. Add new people under Team members.");
  const data = { ...(z.object(def.shape).parse(body) as Record<string, any>), ...(def.forceValues ?? {}) };
  if (def.slugFrom) data.slug = await uniqueSlug(def, data.slug || data[def.slugFrom]);
  if (def.hasPublishedAt && data.published && !data.published_at) data.published_at = new Date().toISOString();
  const keys = Object.keys(data);
  const sql = `insert into ${def.table} (${keys.join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")}) returning *`;
  return (await query(sql, keys.map((k) => serialise(def, k, data[k])))).rows[0];
}

export async function update(def: EntityDef, id: number, body: unknown) {
  const current = await getById(def, id);
  const data = z.object(def.shape).partial().parse(body) as Record<string, any>;
  for (const k of Object.keys(data)) if (data[k] === undefined) delete data[k];
  // A null date means "use the moment of publishing"; never overwrite an existing date with null.
  if (def.hasPublishedAt && data.published_at === null) delete data.published_at;
  if (def.slugFrom && "slug" in data) data.slug = await uniqueSlug(def, data.slug || data[def.slugFrom] || current[def.slugFrom], id);
  const keys = Object.keys(data);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`);
  if (def.hasPublishedAt && data.published === true && data.published_at === undefined) {
    sets.push("published_at = coalesce(published_at, now())");
  }
  sets.push("updated_at = now()");
  const sql = `update ${def.table} set ${sets.join(", ")} where id = $${keys.length + 1} returning *`;
  return (await query(sql, [...keys.map((k) => serialise(def, k, data[k])), id])).rows[0];
}

export async function setPublished(def: EntityDef, id: number, published: boolean) {
  if (def.core) throw new HttpError(403, "The main founders are permanent and always visible.");
  return update(def, id, { published });
}

export async function setArchived(def: EntityDef, id: number, archived: boolean) {
  if (def.core) throw new HttpError(403, "The main founders are permanent and cannot be archived.");
  if (!def.archivable) throw new HttpError(400, "This content type cannot be archived.");
  return update(def, id, { archived });
}

export async function remove(def: EntityDef, id: number) {
  if (def.core) throw new HttpError(403, "The main founders are permanent and cannot be deleted.");
  const r = await query(`delete from ${def.table} where id = $1 ${def.where ? `and ${def.where}` : ""}`, [id]);
  if (!r.rowCount) throw new HttpError(404, "Not found");
}

export async function stats() {
  const counts: Record<string, { published: number; draft: number; archived: number }> = {};
  for (const [name, def] of Object.entries(entities)) {
    const arch = def.archivable ? "archived" : "false";
    const r = await query(
      `select count(*) filter (where published and not ${arch})::int as published,
              count(*) filter (where not published and not ${arch})::int as draft,
              count(*) filter (where ${arch})::int as archived
       from ${def.table} ${def.where ? `where ${def.where}` : ""}`
    );
    counts[name] = r.rows[0];
  }
  const union = Object.entries(entities)
    .map(([name, def]) => `select '${name}' as type, id, ${def.titleCol} as label, published, updated_at from ${def.table} ${def.where ? `where ${def.where}` : ""}`)
    .join(" union all ");
  const latest = (await query(`select * from (${union}) t order by updated_at desc limit 8`)).rows;
  const unread = (await query("select count(*)::int as n from contact_messages where not is_read")).rows[0].n;
  return { counts, latest, unreadMessages: unread };
}
