import { pool, runMigrations } from "./db.js";
import { ensureCoreFounders } from "./core.js";
import { seedIfNeeded } from "./seed.js";

await runMigrations();
await seedIfNeeded();
await ensureCoreFounders();
await pool.end();
console.log("Database is up to date.");
