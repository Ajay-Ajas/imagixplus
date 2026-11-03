import "express-async-errors";
import compression from "compression";
import connectPgSimple from "connect-pg-simple";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import path from "node:path";
import { pool, runMigrations } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureCoreFounders } from "./config/core.js";
import { seedIfNeeded } from "./config/seed.js";
import { errorHandler } from "./middleware/errors.js";
import { adminRouter } from "./routes/admin.js";
import { mediaRouter } from "./routes/media.js";
import { publicRouter } from "./routes/public.js";
import { clientDist, renderHtml, sitemapXml } from "./services/seo.js";

await runMigrations();
await seedIfNeeded();
await ensureCoreFounders();

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "object-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "upgrade-insecure-requests": env.isProd ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));

const PgStore = connectPgSimple(session);
app.use(
  "/api/admin",
  session({
    store: new PgStore({ pool, tableName: "session", pruneSessionInterval: 60 * 15 }),
    name: "imx.sid",
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: env.isProd, maxAge: env.sessionTtlHours * 3_600_000, path: "/" }
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/media", mediaRouter);
app.use("/api/public", publicRouter);
app.use("/api/admin", adminRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

app.get("/robots.txt", (_req, res) =>
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${env.siteUrl}/sitemap.xml\n`)
);
app.get("/sitemap.xml", async (_req, res) => res.type("application/xml").send(await sitemapXml()));

if (clientDist) {
  app.use("/assets", express.static(path.join(clientDist, "assets"), { immutable: true, maxAge: "1y", fallthrough: false }));
  app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
  app.get("*", async (req, res, next) => {
    try {
      const page = await renderHtml(req.path);
      if (!page) return next();
      if (req.path.startsWith("/admin")) res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.status(page.status).type("html").send(page.html);
    } catch (e) { next(e); }
  });
}

app.use(errorHandler);
app.listen(env.port, () => console.log(`IMAGIX+ listening on :${env.port} (${env.nodeEnv})`));
