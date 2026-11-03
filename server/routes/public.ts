import { Router } from "express";
import { entities } from "../models/entities.js";
import { getDef, list } from "../services/repo.js";
import { getSettings } from "../services/settings.js";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { query } from "../config/db.js";
import { stripTags } from "../models/entities.js";
import { mailConfigured, sendContactMail } from "../services/mailer.js";

export const publicRouter = Router();
publicRouter.use((_req, res, next) => { res.setHeader("Cache-Control", "public, max-age=10"); next(); });

publicRouter.get("/settings", async (_req, res) => res.json(await getSettings()));

publicRouter.get("/updates/:slug", async (req, res) => {
  const r = await query("select * from updates where slug = $1 and published and published_at <= now()", [req.params.slug]);
  if (!r.rowCount) return res.status(404).json({ error: "Update not found" });
  res.json(r.rows[0]);
});

publicRouter.get("/people/:slug", async (req, res) => {
  const r = await query("select * from founders where slug = $1 and published and not archived", [req.params.slug]);
  if (!r.rowCount) return res.status(404).json({ error: "Profile not found" });
  res.json(r.rows[0]);
});

publicRouter.get("/:entity", async (req, res) => {
  if (!(req.params.entity in entities)) return res.status(404).json({ error: "Not found" });
  const rows = await list(getDef(req.params.entity), true);
  res.json(rows);
});

// ---------- Contact form ----------
const oneLine = (max: number, min = 1) =>
  z.string().max(max * 2).transform((v) => stripTags(v).replace(/[\r\n]+/g, " ").trim()).pipe(z.string().min(min, "Required").max(max));
const contactSchema = z.object({
  name: oneLine(100), subject: oneLine(150),
  email: oneLine(200).pipe(z.string().email("Enter a valid email address")),
  message: z.string().max(10000).transform((v) => stripTags(v).replace(/\r\n/g, "\n").trim()).pipe(z.string().min(10, "Please write at least 10 characters").max(5000)),
  website: z.string().max(200).optional() // honeypot: real visitors leave this empty
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many messages from this connection. Please try again later or email us directly." }
});

publicRouter.post("/contact", contactLimiter, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const { website, ...m } = contactSchema.parse(req.body);
  if (website) return res.json({ ok: true, emailed: true }); // bots: pretend success, store nothing
  const row = (await query("insert into contact_messages (name, email, subject, message) values ($1,$2,$3,$4) returning id", [m.name, m.email, m.subject, m.message])).rows[0];
  if (!mailConfigured()) return res.json({ ok: true, emailed: false, reason: "not_configured" });
  try {
    await sendContactMail(m);
    await query("update contact_messages set emailed = true where id = $1", [row.id]);
    res.json({ ok: true, emailed: true });
  } catch (e) {
    console.error("Contact email failed:", (e as Error).message);
    await query("update contact_messages set email_error = $1 where id = $2", [String((e as Error).message).slice(0, 300), row.id]);
    res.json({ ok: true, emailed: false, reason: "send_failed" });
  }
});
