import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { query } from "../config/db.js";
import { env, hasCloudinary } from "../config/env.js";
import { HttpError } from "./repo.js";

if (hasCloudinary) {
  cloudinary.config({ cloud_name: env.cloudinary.name, api_key: env.cloudinary.key, api_secret: env.cloudinary.secret, secure: true });
}
const ALLOWED = new Set(["jpeg", "png", "webp", "gif", "avif"]);

/** Validates the real file content (not the extension), strips metadata, resizes and converts to WebP. */
export async function processImage(buffer: Buffer) {
  try {
    const img = sharp(buffer, { limitInputPixels: 60_000_000 });
    const meta = await img.metadata();
    if (meta.format === "heif") throw new HttpError(400, "HEIC/HEIF photos are not supported. Export the photo as JPG or PNG and upload that.");
    if (!meta.format || !ALLOWED.has(meta.format)) throw new Error("format");
    return await img.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "That file is not a valid image. Upload a JPG, PNG, WebP, GIF or AVIF.");
  }
}

export async function saveImage(buffer: Buffer, originalName: string) {
  const data = await processImage(buffer);
  const filename = originalName.replace(/[^\w.\- ]/g, "").slice(0, 120);
  if (hasCloudinary) {
    let up: any;
    try {
      up = await new Promise((resolve, reject) =>
        cloudinary.uploader.upload_stream({ folder: "imagixplus", resource_type: "image" }, (e, r) => (e ? reject(e) : resolve(r))).end(data)
      );
    } catch (e: any) {
      const reason = e?.message ?? e?.error?.message ?? "unknown error";
      console.error("Cloudinary upload failed:", reason);
      throw new HttpError(502, `Cloud storage rejected the upload (${reason}). Check the CLOUDINARY_* settings on the server.`);
    }
    const r = await query(
      "insert into media (filename, mime, size, storage, url, public_id) values ($1,'image/webp',$2,'cloudinary',$3,$4) returning id, url, filename, size, created_at",
      [filename, data.length, up.secure_url, up.public_id]
    );
    return r.rows[0];
  }
  const r = await query(
    "insert into media (filename, mime, size, storage, data) values ($1,'image/webp',$2,'database',$3) returning id, filename, size, created_at",
    [filename, data.length, data]
  );
  const row = r.rows[0];
  row.url = `/api/media/${row.id}`;
  await query("update media set url = $1 where id = $2", [row.url, row.id]);
  return row;
}

export async function listMedia() {
  return (await query("select id, filename, size, storage, url, created_at from media order by created_at desc limit 500")).rows;
}

export async function deleteMedia(id: string) {
  const r = await query("delete from media where id = $1 returning storage, public_id", [id]);
  if (!r.rowCount) throw new HttpError(404, "Image not found");
  if (r.rows[0].storage === "cloudinary" && r.rows[0].public_id && hasCloudinary) {
    await cloudinary.uploader.destroy(r.rows[0].public_id).catch(() => undefined);
  }
}

/** Tells the admin where images go and whether cloud storage is actually reachable. */
export async function storageStatus() {
  if (!hasCloudinary) {
    return { storage: "database", cloudinary: { configured: false, ok: false, error: "" },
      note: "Cloudinary is not configured. Images are stored in the PostgreSQL database (persistent, but best for small sites)." };
  }
  try {
    await Promise.race([cloudinary.api.ping(), new Promise((_, rej) => setTimeout(() => rej(new Error("timed out")), 8000))]);
    return { storage: "cloudinary", cloudinary: { configured: true, ok: true, error: "" }, note: "Images are stored on Cloudinary." };
  } catch (e: any) {
    const error = e?.message ?? e?.error?.message ?? "Could not reach Cloudinary";
    return { storage: "cloudinary", cloudinary: { configured: true, ok: false, error }, note: "Cloudinary is configured but not working. Uploads will fail until this is fixed." };
  }
}
