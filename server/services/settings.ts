import { query } from "../config/db.js";
import { defaultSettings } from "../config/defaults.js";
import { settingsSchemas, type SettingKey } from "../models/entities.js";

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
function merge<T>(base: T, over: unknown): T {
  if (!isObj(base) || !isObj(over)) return (over ?? base) as T;
  const out: Record<string, any> = { ...base };
  for (const k of Object.keys(over)) out[k] = isObj(base[k]) ? merge(base[k], over[k]) : over[k];
  return out as T;
}

let cache: { at: number; value: typeof defaultSettings } | null = null;

export async function getSettings() {
  if (cache && Date.now() - cache.at < 15_000) return cache.value;
  const rows = (await query("select key, value from site_settings where key <> '__seeded'")).rows;
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const value = Object.fromEntries(
    Object.entries(defaultSettings).map(([k, v]) => [k, merge(v, stored[k])])
  ) as typeof defaultSettings;
  cache = { at: Date.now(), value };
  return value;
}

export async function saveSetting(key: SettingKey, body: unknown) {
  const parsed = settingsSchemas[key].parse(body);
  await query(
    `insert into site_settings (key, value, updated_at) values ($1, $2, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, JSON.stringify(parsed)]
  );
  cache = null;
  return (await getSettings())[key];
}
