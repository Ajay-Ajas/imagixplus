import { Router } from "express";
import { query } from "../config/db.js";

export const mediaRouter = Router();
mediaRouter.get("/:id", async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.status(404).end();
  const r = await query("select mime, data, url, storage from media where id = $1", [req.params.id]);
  if (!r.rowCount) return res.status(404).end();
  const m = r.rows[0];
  if (m.storage === "cloudinary") return res.redirect(302, m.url);
  res.setHeader("Content-Type", m.mime);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(m.data);
});
