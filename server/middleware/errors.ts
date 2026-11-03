import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../services/repo.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const i of err.issues) fields[i.path.join(".") || "_"] ??= i.message;
    return res.status(400).json({ error: "Please fix the highlighted fields.", fields });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "Image is larger than 10 MB." : "Upload failed." });
  }
  if ((err as any)?.code === "P0001") return res.status(403).json({ error: (err as Error).message });
  if ((err as any)?.code === "23505") return res.status(409).json({ error: "That value is already in use." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
}
