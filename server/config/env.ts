import dotenv from "dotenv";
import { findUp } from "./paths.js";

const envFile = findUp(".env");
if (envFile) dotenv.config({ path: envFile });

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};
const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  nodeEnv,
  isProd: nodeEnv === "production",
  port: num(process.env.PORT, 4000),
  siteUrl: (process.env.SITE_URL ?? "http://localhost:4000").replace(/\/+$/, ""),
  databaseUrl: process.env.DATABASE_URL ?? "",
  pgSsl: process.env.PGSSL === "true",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  sessionTtlHours: num(process.env.SESSION_TTL_HOURS, 8),
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: num(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? ""
  },
  mailFrom: process.env.MAIL_FROM ?? "",
  contactTo: process.env.CONTACT_TO ?? "contact@civicmindai.in",
  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    key: process.env.CLOUDINARY_API_KEY ?? "",
    secret: process.env.CLOUDINARY_API_SECRET ?? ""
  }
};
export const hasMail = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
export const hasCloudinary = Boolean(env.cloudinary.name && env.cloudinary.key && env.cloudinary.secret);

if (!env.databaseUrl) throw new Error("DATABASE_URL is not set");
if (env.sessionSecret.length < (env.isProd ? 32 : 16)) {
  throw new Error("SESSION_SECRET is missing or too short (use at least 32 random characters)");
}
