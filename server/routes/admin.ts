import argon2 from "argon2";
import crypto from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { z } from "zod";
import { query } from "../config/db.js";
import { settingsSchemas, type SettingKey } from "../models/entities.js";
import { requireAdmin } from "../middleware/auth.js";
import * as repo from "../services/repo.js";
import { deleteMedia, listMedia, saveImage, storageStatus } from "../services/media.js";
import { mailConfigured } from "../services/mailer.js";
import { getSettings, saveSetting } from "../services/settings.js";

export const adminRouter = Router();

// ---------- Authentication ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: true,
  message: { error: "Too many sign-in attempts. Try again in 15 minutes." }
});
const DUMMY_HASH = await argon2.hash(crypto.randomBytes(16).toString("hex"), { type: argon2.argon2id });

adminRouter.post("/auth/login", loginLimiter, async (req, res) => {
  const { username, password } = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(200) }).parse(req.body);
  const r = await query("select id, username, password_hash from users where lower(username) = lower($1)", [username.trim()]);
  const user = r.rows[0];
  const ok = await argon2.verify(user?.password_hash ?? DUMMY_HASH, password).catch(() => false);
  if (!user || !ok) return res.status(401).json({ error: "Incorrect username or password." });
  await new Promise<void>((resolve, reject) => req.session.regenerate((e) => (e ? reject(e) : resolve())));
  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.csrf = crypto.randomBytes(32).toString("hex");
  await query("update users set last_login_at = now() where id = $1", [user.id]);
  res.json({ username: user.username, csrf: req.session.csrf });
});

adminRouter.get("/auth/me", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!req.session.userId) return res.status(401).json({ error: "Not signed in." });
  res.json({ username: req.session.username, csrf: req.session.csrf });
});

adminRouter.post("/auth/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("imx.sid");
    res.json({ ok: true });
  });
});

// Everything below requires a signed-in administrator (server-side) and a valid CSRF token on writes.
adminRouter.use(requireAdmin);

adminRouter.get("/stats", async (_req, res) => res.json(await repo.stats()));

// ---------- Settings ----------
adminRouter.get("/settings", async (_req, res) => res.json(await getSettings()));
adminRouter.put("/settings/:key", async (req, res) => {
  if (!(req.params.key in settingsSchemas)) throw new repo.HttpError(404, "Unknown settings group");
  res.json(await saveSetting(req.params.key as SettingKey, req.body));
});

// ---------- Media ----------
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
const uploadLimiter = rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: true, legacyHeaders: false });
adminRouter.get("/media/status", async (_req, res) => res.json({ ...(await storageStatus()), email: mailConfigured() }));
adminRouter.get("/media", async (_req, res) => res.json(await listMedia()));
adminRouter.post("/media", uploadLimiter, upload.single("file"), async (req, res) => {
  if (!req.file) throw new repo.HttpError(400, "Choose an image to upload.");
  res.status(201).json(await saveImage(req.file.buffer, req.file.originalname));
});
adminRouter.delete("/media/:id", async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) throw new repo.HttpError(404, "Image not found");
  await deleteMedia(req.params.id);
  res.json({ ok: true });
});

// ---------- Contact messages ----------
adminRouter.get("/messages", async (_req, res) => res.json((await query("select * from contact_messages order by created_at desc limit 500")).rows));
adminRouter.patch("/messages/:id/read", async (req, res) => {
  const { read } = z.object({ read: z.boolean() }).parse(req.body);
  await query("update contact_messages set is_read = $1 where id = $2", [read, Number(req.params.id) || 0]);
  res.json({ ok: true });
});
adminRouter.delete("/messages/:id", async (req, res) => {
  await query("delete from contact_messages where id = $1", [Number(req.params.id) || 0]);
  res.json({ ok: true });
});

// ---------- Content CRUD (ideas, projects, portfolio, founders, updates) ----------
const idOf = (v: string) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new repo.HttpError(404, "Not found");
  return n;
};
adminRouter.get("/:entity", async (req, res) => res.json(await repo.list(repo.getDef(req.params.entity), false)));
adminRouter.get("/:entity/:id", async (req, res) => res.json(await repo.getById(repo.getDef(req.params.entity), idOf(req.params.id))));
adminRouter.post("/:entity", async (req, res) => res.status(201).json(await repo.create(repo.getDef(req.params.entity), req.body)));
adminRouter.put("/:entity/:id", async (req, res) => res.json(await repo.update(repo.getDef(req.params.entity), idOf(req.params.id), req.body)));
adminRouter.patch("/:entity/:id/publish", async (req, res) => {
  const { published } = z.object({ published: z.boolean() }).parse(req.body);
  res.json(await repo.setPublished(repo.getDef(req.params.entity), idOf(req.params.id), published));
});
adminRouter.patch("/:entity/:id/archive", async (req, res) => {
  const { archived } = z.object({ archived: z.boolean() }).parse(req.body);
  res.json(await repo.setArchived(repo.getDef(req.params.entity), idOf(req.params.id), archived));
});
adminRouter.delete("/:entity/:id", async (req, res) => {
  await repo.remove(repo.getDef(req.params.entity), idOf(req.params.id));
  res.json({ ok: true });
});
