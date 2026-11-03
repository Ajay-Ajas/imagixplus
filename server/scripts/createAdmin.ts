import argon2 from "argon2";
import { pool, query, runMigrations } from "../config/db.js";
import "../config/env.js";

const username = (process.env.ADMIN_USERNAME ?? "").trim();
const password = process.env.ADMIN_PASSWORD ?? "";
if (username.length < 3 || password.length < 12) {
  console.error("Set ADMIN_USERNAME (3+ chars) and ADMIN_PASSWORD (12+ chars) in the environment, then run again.");
  process.exit(1);
}
await runMigrations();
const hash = await argon2.hash(password, { type: argon2.argon2id });
const existing = await query("select id from users where lower(username) = lower($1)", [username]);
if (existing.rowCount) {
  await query("update users set password_hash = $1 where id = $2", [hash, existing.rows[0].id]);
  console.log(`Updated password for admin "${username}".`);
} else {
  await query("insert into users (username, password_hash) values ($1, $2)", [username, hash]);
  console.log(`Created admin "${username}".`);
}
await pool.end();
console.log("Now REMOVE ADMIN_USERNAME / ADMIN_PASSWORD from your environment.");
