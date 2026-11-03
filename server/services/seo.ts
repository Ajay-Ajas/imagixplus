import fs from "node:fs";
import path from "node:path";
import { query } from "../config/db.js";
import { env } from "../config/env.js";
import { findUp } from "../config/paths.js";
import { getSettings } from "./settings.js";

export const clientDist = findUp(path.join("client", "dist"));
const abs0 = (u: string) => (u.startsWith("http") ? u : `${env.siteUrl}${u}`);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const PAGES: Record<string, { title: string; description: string }> = {
  "/about": { title: "About Us", description: "Learn about ImagixPlus: our story, vision, mission and the technologies we are developing." },
  "/ideas": { title: "Ideas & Innovations", description: "Explore the ideas, concepts and research directions ImagixPlus is developing, and see which stage each is at." },
  "/projects": { title: "Projects", description: "ImagixPlus projects and their development status, including our flagship product CivicMind AI." },
  "/portfolio": { title: "Portfolio", description: "Developed projects, working prototypes and ongoing experiments from ImagixPlus." },
  "/team": { title: "Our Team", description: "Meet the four main founders of IMAGIX+ and the people building with them." },
  "/updates": { title: "Latest Updates", description: "News and progress updates from ImagixPlus and CivicMind AI." },
  "/contact": { title: "Contact", description: "Get in touch with the ImagixPlus team." }
};

export const knownPaths = ["/", ...Object.keys(PAGES)];

export async function renderHtml(urlPath: string): Promise<{ status: number; html: string } | null> {
  if (!clientDist) return null;
  const file = path.join(clientDist, "index.html");
  if (!fs.existsSync(file)) return null;
  const template = fs.readFileSync(file, "utf8").replace(/<title>[\s\S]*?<\/title>/, "");
  const s = await getSettings();
  const clean = urlPath.replace(/\/+$/, "") || "/";
  const isAdmin = clean === "/admin" || clean.startsWith("/admin/");

  let title = s.site.seoTitle, description = s.site.seoDescription, status = 200, type = "website";
  let image = s.site.socialImageUrl || "/og-default.png";
  let jsonLd: object[] = [{
    "@context": "https://schema.org", "@type": "Organization", name: "IMAGIX+", alternateName: "ImagixPlus",
    url: env.siteUrl, logo: `${env.siteUrl}/favicon.png`, slogan: "Moving Towards the Future.",
    description: "IMAGIX+ (ImagixPlus) is a technology and innovation company. CivicMind AI is a product developed by ImagixPlus.",
    sameAs: s.contact.socials.map((x) => x.url).filter((u) => /^https?:/.test(u))
  }];

  if (PAGES[clean]) {
    title = `${PAGES[clean].title} | ${s.site.siteName}`;
    description = PAGES[clean].description;
  } else if (/^\/team\/[\w-]+$/.test(clean)) {
    const r = await query("select name, designation, intro, photo_url from founders where slug = $1 and published and not archived", [clean.split("/")[2]]);
    if (r.rowCount) {
      const p = r.rows[0];
      title = `${p.name}${p.designation ? ` — ${p.designation}` : ""} | ${s.site.siteName}`;
      description = p.intro || `${p.name} at IMAGIX+.`; type = "profile";
      if (p.photo_url) image = p.photo_url;
      jsonLd.push({ "@context": "https://schema.org", "@type": "Person", name: p.name, jobTitle: p.designation || undefined, worksFor: { "@type": "Organization", name: "IMAGIX+" }, image: p.photo_url ? abs0(p.photo_url) : undefined });
    } else { status = 404; title = `Page not found | ${s.site.siteName}`; }
  } else if (/^\/updates\/[\w-]+$/.test(clean)) {
    const r = await query("select title, summary, cover_image, author, published_at, updated_at from updates where slug = $1 and published and published_at <= now()", [clean.split("/")[2]]);
    if (r.rowCount) {
      const u = r.rows[0];
      title = `${u.title} | ${s.site.siteName}`; description = u.summary || description; type = "article";
      if (u.cover_image) image = u.cover_image;
      jsonLd.push({
        "@context": "https://schema.org", "@type": "NewsArticle", headline: u.title, description: u.summary,
        datePublished: u.published_at, dateModified: u.updated_at, author: { "@type": "Person", name: u.author || "ImagixPlus" },
        publisher: { "@type": "Organization", name: "IMAGIX+" }, mainEntityOfPage: `${env.siteUrl}${clean}`
      });
    } else { status = 404; title = `Page not found | ${s.site.siteName}`; }
  } else if (clean !== "/" && !isAdmin) {
    status = 404; title = `Page not found | ${s.site.siteName}`;
  }
  if (isAdmin) title = `Admin | ${s.site.siteName}`;

  const abs = (u: string) => (u.startsWith("http") ? u : `${env.siteUrl}${u}`);
  const canonical = `${env.siteUrl}${clean === "/" ? "/" : clean}`;
  const favicon = s.site.faviconUrl || "/favicon.png";
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    isAdmin || status === 404 ? `<meta name="robots" content="noindex, nofollow" />` : `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<link rel="icon" href="${esc(favicon)}" />`,
    `<meta property="og:site_name" content="${esc(s.site.siteName)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(abs(image))}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(abs(image))}" />`,
    `<meta name="default-theme" content="${s.site.defaultTheme}" />`,
    isAdmin ? "" : `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
  ].join("\n    ");
  return { status, html: template.replace("<!--SEO_HEAD-->", head) };
}

export async function sitemapXml() {
  const rows = (await query("select slug, updated_at from updates where published and published_at <= now() order by published_at desc")).rows;
  const people = (await query("select slug, updated_at from founders where published and not archived")).rows;
  const urls = knownPaths.map((p) => `<url><loc>${env.siteUrl}${p}</loc></url>`).concat(
    rows.map((r) => `<url><loc>${env.siteUrl}/updates/${r.slug}</loc><lastmod>${new Date(r.updated_at).toISOString()}</lastmod></url>`),
    people.map((r) => `<url><loc>${env.siteUrl}/team/${r.slug}</loc><lastmod>${new Date(r.updated_at).toISOString()}</lastmod></url>`)
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}
