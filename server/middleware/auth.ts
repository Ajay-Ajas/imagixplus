import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import "express-session";

declare module "express-session" {
  interface SessionData { userId?: number; username?: string; csrf?: string }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: "Please sign in." });
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const sent = req.get("x-csrf-token") ?? "";
    const expected = req.session.csrf ?? "";
    const ok = sent.length === expected.length && sent.length > 0 && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));
    if (!ok) return res.status(403).json({ error: "Your session security token is invalid. Refresh the page and try again." });
  }
  res.setHeader("Cache-Control", "no-store");
  next();
}
