import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { env } from "./env.js";
import { findUp } from "./paths.js";

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: env.pgSsl ? { rejectUnauthorized: false } : undefined,
  max: 10
});

export const query = <T extends pg.QueryResultRow = any>(text: string, params: unknown[] = []) =>
  pool.query<T>(text, params as any[]);

export async function runMigrations() {
  const dir = findUp(path.join("database", "migrations"));
  if (!dir) throw new Error("database/migrations folder not found");
  await query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
  const done = new Set((await query("select name from schema_migrations")).rows.map((r) => r.name));
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue;
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(fs.readFileSync(path.join(dir, file), "utf8"));
      await client.query("insert into schema_migrations(name) values ($1)", [file]);
      await client.query("commit");
      console.log(`migration applied: ${file}`);
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }
}
