# IMAGIX+ website and admin CMS

Parent-brand website for **IMAGIX+ (ImagixPlus)** with a private admin dashboard at `/admin`. Everything public is read from the database, so the team can change content without touching code.

**Stack:** React + Vite + TypeScript + React Router + Framer Motion (client) · Node + Express + TypeScript (server) · PostgreSQL · optional Cloudinary for images.

```
imagixplus/
├── client/            React app (public site + /admin)
│   ├── src/pages      public pages
│   ├── src/admin      dashboard, forms, media library
│   ├── src/components shared UI (cards, intro, header…)
│   └── public/        favicon, default social image
├── server/
│   ├── routes/        public.ts, admin.ts, media.ts
│   ├── models/        entity definitions + validation
│   ├── services/      repo (CRUD), settings, media, seo
│   ├── middleware/    auth + CSRF, error handling
│   ├── config/        env, db, migrate, seed, defaults
│   └── scripts/       createAdmin.ts
├── database/migrations/001_init.sql
├── render.yaml        Render blueprint
└── .env.example
```

## 1. Run locally

Requirements: Node 20+, PostgreSQL 14+.

```bash
cp .env.example .env            # then fill it in (never commit .env)
npm install
npm run migrate                 # creates tables and loads starter content
npm run create-admin            # creates the first administrator (see below)
npm run dev                     # site at http://localhost:5173, API at :4000
```

Generate `SESSION_SECRET` with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Production-style run: `npm run build && npm start` (serves the site and API on `PORT`).

Migrations also run automatically every time the server starts; they are idempotent.

## 2. Create the first admin securely

There is no default account and no password in the code. Put credentials in your **environment only**, run the script once, then remove them:

```bash
ADMIN_USERNAME=your-username ADMIN_PASSWORD='a-long-unique-password' npm run create-admin
```

- Passwords must be at least 12 characters and are stored as **argon2id** hashes.
- Running it again for the same username resets that password. This is also how you change a password.
- Sign in at `/admin`.

## 3. Image storage and uploads

Every image field in the admin (project covers, founder and team photos, gallery, favicon…) and the **Media Library** upload through `/api/admin/media`. Files are checked by their real content, stripped of metadata, resized (max 2400px) and converted to WebP. SVG and HEIC are rejected on purpose. Max 10 MB.

- **Cloudinary (use this in production):** set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Cloudinary dashboard → Settings → API Keys). Images then live on Cloudinary and survive redeploys.
- **Not configured (development fallback):** images are stored in PostgreSQL and served from `/api/media/<id>`. They persist, and nothing is written to the server disk.
- **Check it:** *Admin → Media Library* shows which storage is active and, for Cloudinary, whether the credentials actually work. A failing upload now says why (for example "Invalid API key") instead of a generic error.

## 4. Contact form and email

The Contact page and footer show **contact@civicmindai.in** (editable under *Contact Information*). The form validates input, blocks bots (hidden field + rate limit of 5 messages/hour per IP) and **always saves the message** to *Admin → Messages*.

To also deliver it by email, set the SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `CONTACT_TO`) from any provider. For example, if `contact@civicmindai.in` is a mailbox at your domain host, use that host's SMTP settings. Without them the site never claims an email was sent: visitors are told the message was received but email delivery is not active, and are pointed to the address.

## 5. Team and founders

- **Main Founders** (*Admin → Main Founders*): Audlin Sanjay U N, ABIN K A, JESWIN C S, AJAY L. You can edit their profiles and photos. They **cannot be created, deleted, hidden, archived or demoted**: the API refuses, the validation ignores such fields, and a database trigger blocks it even from SQL. The server also re-creates them on start if they were ever missing.
- **Team Members** (*Admin → Team Members*): add anyone else with a role (suggestions: Co-Founder, CEO, President, HR, Technical Lead, Developer, Designer, Marketing, Advisor, or type your own), category, photo and full profile. Publish, hide (unpublish), archive or delete.
- Each person has a full-screen profile at `/team/<name>`. Founders' personal emails are shown only if you type one into their profile; nothing is invented.

## 6. Deploy to GitHub + Render (imagix.civicmindai.in)

**Content updates** (projects, people, text, images, messages) are done in the live admin and need no deployment. **Code or design changes** go through GitHub and a redeploy.

1. Push to GitHub. `.env` is git-ignored; check `git status` first.
2. Render → **New → Blueprint** → select the repo (`render.yaml` creates the web service and database). Set the `CLOUDINARY_*` and `SMTP_*` values in the service's Environment tab.
3. Migrations run automatically on every start. Existing data is kept: the update migration (`002_team_projects_contact.sql`) only adds columns and tables and upgrades the original starter rows (founder names, project wording).
4. Create the admin once (from your computer, using the database's *External Database URL*):
   ```bash
   DATABASE_URL='<external url>' PGSSL=true SESSION_SECRET=any-16-plus-characters \
   ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run create-admin
   ```
5. **Custom domain:** service → *Settings → Custom Domains* → add `imagix.civicmindai.in`. At your DNS provider add a **CNAME** for host `imagix` pointing to the `*.onrender.com` address Render shows. Nothing else in DNS changes, so `civicmindai.in` and the CivicMind AI deployment are untouched. Render issues HTTPS automatically. `SITE_URL` must be `https://imagix.civicmindai.in`.
6. Visit `https://imagix.civicmindai.in/admin`. There is intentionally no link to it on the public site.

Page refreshes on any route work because the server serves the app for every non-API path. Free Render web services sleep and free databases expire; use paid plans for launch.

## 7. Environment variables

| Variable | Purpose |
|---|---|
| `NODE_ENV`, `PORT` | runtime (Render sets `PORT`) |
| `SITE_URL` | canonical URL: `https://imagix.civicmindai.in` |
| `DATABASE_URL`, `PGSSL` | PostgreSQL connection, SSL toggle |
| `SESSION_SECRET`, `SESSION_TTL_HOURS` | admin sessions |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | persistent image storage |
| `SMTP_HOST/PORT/SECURE/USER/PASS`, `MAIL_FROM`, `CONTACT_TO` | contact-form email |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | only for `npm run create-admin` |

## 8. SEO and security

Server-rendered titles, descriptions, canonical URLs and Open Graph tags per page and per profile/update, `robots.txt`, live `sitemap.xml` (includes profiles and updates), Organization / Person / NewsArticle structured data, `noindex` on `/admin`. Submit the sitemap in Google Search Console; ranking is never guaranteed.

Security: server-side sessions (httpOnly, SameSite, Secure in production) stored in PostgreSQL, CSRF token on every write, argon2id passwords, login and contact rate limiting, zod validation, tags stripped, strict CSP and Helmet headers, content-checked uploads, secrets only in environment variables.

## 9. Pre-launch checklist

- [ ] Change the bootstrap admin password (`npm run create-admin` again)
- [ ] Set Cloudinary and SMTP variables; confirm *Media Library* shows storage OK and send a test message from the Contact page
- [ ] Add founder photos and approved bios
- [ ] Add project cover images
- [ ] Add social links; upload favicon and a 1200×630 social image
- [ ] Verify the domain in Search Console and submit `/sitemap.xml`
