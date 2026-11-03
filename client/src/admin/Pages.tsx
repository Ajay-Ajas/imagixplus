import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fmtDate } from "../hooks/hooks";
import { ApiError, api, uploadImage } from "../services/api";
import type { Project, Settings } from "../types";
import { FieldInput, validate, type FieldDef } from "./fields";
import { Confirm, useToast, type MediaRow } from "./ui";

interface StorageInfo { storage: string; note: string; email: boolean; cloudinary: { configured: boolean; ok: boolean; error: string } }

/* ---------------- Dashboard ---------------- */
interface Count { published: number; draft: number; archived: number }
interface Stats { counts: Record<string, Count>; latest: { type: string; id: number; label: string; published: boolean; updated_at: string }[]; unreadMessages: number }
const TYPE_LABEL: Record<string, string> = { projects: "Project", portfolio: "Portfolio", updates: "Update", ideas: "Idea", founders: "Main founder", team: "Team member" };
const TYPE_ROUTE: Record<string, string> = { projects: "projects", portfolio: "portfolio", updates: "updates", ideas: "ideas", founders: "founders", team: "team" };

export function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [updates, setUpdates] = useState<{ id: number; title: string; published: boolean; published_at: string | null; updated_at: string }[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.get<Stats>("/api/admin/stats").then(setS).catch((e: ApiError) => setErr(e.message));
    api.get<any[]>("/api/admin/updates").then((u) => setUpdates(u.slice(0, 4))).catch(() => undefined);
  }, []);
  if (err) return <div className="a-page"><p className="field-error">{err}</p></div>;
  if (!s) return <div className="a-page"><div className="a-page-head"><h1>Dashboard</h1></div><div className="stat-grid skeleton-grid" aria-busy="true"><i /><i /><i /><i /></div></div>;
  const c = s.counts;
  const projectsTotal = c.projects.published + c.projects.draft + c.projects.archived;
  const people = c.founders.published + c.team.published;
  const tiles: [string, number, string, string][] = [
    ["Total projects", projectsTotal, `${c.projects.draft} draft · ${c.projects.archived} archived`, "projects"],
    ["Published projects", c.projects.published, "Visible on the website", "projects"],
    ["Team members", people, `${c.founders.published} main founders · ${c.team.published} team`, "team"],
    ["Updates published", c.updates.published, `${c.updates.draft} draft`, "updates"],
    ["Unread messages", s.unreadMessages, "From the contact form", "messages"]
  ];
  return (
    <div className="a-page wide">
      <div className="a-page-head"><div><h1>Dashboard</h1><p className="hint">What is live on the website right now.</p></div>
        <div className="a-actions-row"><Link className="a-btn primary" to="/admin/projects">Add project</Link><Link className="a-btn" to="/admin/updates">Write update</Link></div></div>
      <div className="stat-grid">
        {tiles.map(([label, n, sub, to]) => (
          <Link key={label} to={`/admin/${to}`} className={`stat ${to === "messages" && n > 0 ? "alert" : ""}`}><span>{label}</span><strong>{n}</strong><em>{sub}</em></Link>
        ))}
      </div>
      <div className="dash-cols">
        <section><h2 className="a-h2">Recent updates</h2>
          {updates.length === 0 ? <div className="a-empty"><p>No updates yet.</p><Link className="a-btn primary" to="/admin/updates">Write the first update</Link></div> : (
            <ul className="latest">{updates.map((u) => <li key={u.id}><Link to="/admin/updates"><strong>{u.title}</strong></Link><span>{u.published ? "Published" : "Draft"}</span><time>{fmtDate(u.published_at ?? u.updated_at)}</time></li>)}</ul>
          )}
        </section>
        <section><h2 className="a-h2">Latest content changes</h2>
          {s.latest.length === 0 ? <p>No content yet.</p> : (
            <ul className="latest">{s.latest.map((l) => <li key={`${l.type}-${l.id}`}><Link to={`/admin/${TYPE_ROUTE[l.type]}`}><strong>{l.label}</strong></Link><span>{TYPE_LABEL[l.type]}</span><time>{fmtDate(l.updated_at)}</time></li>)}</ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------------- Messages ---------------- */
interface Msg { id: number; name: string; email: string; subject: string; message: string; emailed: boolean; email_error: string; is_read: boolean; created_at: string }
export function Messages() {
  const [rows, setRows] = useState<Msg[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [del, setDel] = useState<Msg | null>(null);
  const toast = useToast();
  const load = () => api.get<Msg[]>("/api/admin/messages").then(setRows).catch((e: ApiError) => toast("err", e.message));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  async function toggle(m: Msg, read: boolean) { try { await api.patch(`/api/admin/messages/${m.id}/read`, { read }); load(); } catch (e) { toast("err", (e as ApiError).message); } }
  async function remove() { try { await api.del(`/api/admin/messages/${del!.id}`); toast("ok", "Message deleted."); } catch (e) { toast("err", (e as ApiError).message); } setDel(null); load(); }
  return (
    <div className="a-page">
      <div className="a-page-head"><div><h1>Messages</h1><p className="hint">Everything sent through the website contact form is saved here, even if email delivery is not configured.</p></div></div>
      {!rows ? <div className="skeleton-list" aria-busy="true"><i /><i /><i /></div> : rows.length === 0 ? <div className="a-empty"><p>No messages yet.</p></div> : (
        <ul className="msg-list">
          {rows.map((m) => (
            <li key={m.id} className={m.is_read ? "" : "unread"}>
              <button className="msg-head" onClick={() => { setOpen(open === m.id ? null : m.id); if (!m.is_read) toggle(m, true); }} aria-expanded={open === m.id}>
                <strong>{m.subject}</strong><span>{m.name} · {m.email}</span><time>{fmtDate(m.created_at)}</time>
              </button>
              {open === m.id && (
                <div className="msg-body">
                  <p className="pre">{m.message}</p>
                  <p className="hint">{m.emailed ? "Also delivered to the official inbox." : m.email_error ? `Email delivery failed: ${m.email_error}` : "Not emailed (email delivery is not configured)."}</p>
                  <div className="a-actions-row">
                    <a className="a-btn primary" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject)}`}>Reply</a>
                    <button className="a-btn" onClick={() => toggle(m, !m.is_read)}>{m.is_read ? "Mark unread" : "Mark read"}</button>
                    <button className="a-btn danger-ghost" onClick={() => setDel(m)}>Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {del && <Confirm title="Delete message?" text={`“${del.subject}” from ${del.name} will be permanently deleted.`} onConfirm={remove} onCancel={() => setDel(null)} />}
    </div>
  );
}

/* ---------------- Settings editors ---------------- */
type Key = keyof Settings;
const SECTION_FLAGS = [
  { key: "about", label: "About ImagixPlus" }, { key: "build", label: "What We Build" }, { key: "ideas", label: "Ideas and Innovations" },
  { key: "projects", label: "Featured Projects" }, { key: "flagship", label: "CivicMind AI flagship" }, { key: "team", label: "Founding Team" },
  { key: "updates", label: "Latest Updates" }, { key: "contact", label: "Contact" }
];
const SETTINGS: Record<Key, { title: string; intro?: string; live?: string; fields: FieldDef[] }> = {
  home: {
    title: "Manage Homepage", live: "/", intro: "Edit the hero, homepage images and which sections appear.",
    fields: [
      { name: "heroHeadline", label: "Hero heading", type: "text", required: true },
      { name: "heroDescription", label: "Hero description", type: "textarea", rows: 3 },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "heroImage", label: "Hero background image", type: "image", hint: "Optional. Shown faintly behind the heading." },
      { name: "aboutImage", label: "About section image", type: "image" },
      { name: "sections", label: "Homepage sections", type: "flags", flags: SECTION_FLAGS, hint: "Turn sections off to hide them from the homepage." },
      { name: "whatWeBuild", label: "What We Build items", type: "repeater" }
    ]
  },
  about: {
    title: "Manage About Us", live: "/about",
    fields: [
      { name: "intro", label: "Company introduction", type: "textarea", rows: 4 }, { name: "story", label: "Our story", type: "textarea", rows: 6 },
      { name: "vision", label: "Vision", type: "textarea", rows: 3 }, { name: "mission", label: "Mission", type: "textarea", rows: 3 },
      { name: "whatWeDevelop", label: "What we develop", type: "tags" }, { name: "technicalInterests", label: "Technical interests", type: "tags" },
      { name: "approach", label: "Our approach to solving real-world problems", type: "textarea", rows: 4 },
      { name: "futureDirection", label: "Our future direction", type: "textarea", rows: 4 },
      { name: "companyInfo", label: "Company information", type: "textarea", rows: 3, hint: "Only add verified facts (for example registration details once they exist)." },
      { name: "image", label: "About page image", type: "image" }
    ]
  },
  contact: {
    title: "Manage Contact Information", live: "/contact",
    fields: [
      { name: "email", label: "Official contact email", type: "text", hint: "Shown in the footer and on the Contact page. Default: contact@civicmindai.in" }, { name: "phone", label: "Phone", type: "text" }, { name: "location", label: "Location", type: "text" },
      { name: "note", label: "Contact page introduction", type: "textarea", rows: 3 }, { name: "socials", label: "Social links", type: "links" }
    ]
  },
  site: {
    title: "Website Settings", live: "/",
    fields: [
      { name: "siteName", label: "Site name", type: "text", required: true },
      { name: "seoTitle", label: "SEO title (home page)", type: "text", maxLength: 70, hint: "Up to 70 characters." },
      { name: "seoDescription", label: "SEO description", type: "textarea", rows: 3, maxLength: 200, hint: "Up to 200 characters. Shown in search results." },
      { name: "logoUrl", label: "Site logo override", type: "image", hint: "Leave empty to use the official IMAGIX+ logo. Do not replace it with a redesigned version." },
      { name: "faviconUrl", label: "Favicon", type: "image", hint: "Square PNG, at least 64×64." },
      { name: "socialImageUrl", label: "Social preview image", type: "image", hint: "1200×630 recommended. Used when links are shared." },
      { name: "defaultTheme", label: "Default theme", type: "select", options: ["dark", "light", "system"], hint: "Visitors can still switch themes themselves." }
    ]
  }
};

function FeaturedPicker() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const toast = useToast();
  useEffect(() => { api.get<Project[]>("/api/admin/projects").then(setProjects).catch(() => setProjects([])); }, []);
  async function flip(p: Project) {
    try {
      const u = await api.put<Project>(`/api/admin/projects/${p.id}`, { featured: !p.featured });
      setProjects((list) => list!.map((x) => (x.id === p.id ? u : x)));
      toast("ok", "Featured projects updated.");
    } catch (e) { toast("err", (e as ApiError).message); }
  }
  return (
    <div className="field">
      <label>Featured projects on the homepage</label>
      <div className="flags">{projects?.filter((p) => !p.is_flagship).map((p) => (
        <label key={p.id} className="toggle"><input type="checkbox" checked={p.featured} onChange={() => flip(p)} /><span /> {p.name} {!p.published && <em className="hint">(draft)</em>}</label>
      ))}</div>
      <p className="hint">Changes here apply immediately. The flagship product has its own section.</p>
    </div>
  );
}

export function SettingsEditor({ k, onSaved }: { k: Key; onSaved: () => void }) {
  const cfg = SETTINGS[k];
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  useEffect(() => { setData(null); api.get<Settings>("/api/admin/settings").then((s) => setData(s[k] as any)).catch((e: ApiError) => toast("err", e.message)); }, [k, toast]);
  if (!data) return <div className="a-page"><p>Loading…</p></div>;
  async function save() {
    const errs = validate(cfg.fields, data!);
    if (Object.keys(errs).length) { setErrors(errs); toast("err", "Please fix the highlighted fields."); return; }
    setSaving(true);
    try { await api.put(`/api/admin/settings/${k}`, data); setErrors({}); toast("ok", "Saved. The change is live on the website."); onSaved(); }
    catch (e) { setErrors((e as ApiError).fields ?? {}); toast("err", (e as ApiError).message); }
    finally { setSaving(false); }
  }
  return (
    <div className="a-page">
      <div className="a-page-head"><div><h1>{cfg.title}</h1>{cfg.intro && <p className="hint">{cfg.intro}</p>}</div>{cfg.live && <a className="a-btn" href={cfg.live} target="_blank" rel="noopener noreferrer">View live page</a>}</div>
      <form className="a-form" onSubmit={(e) => e.preventDefault()} noValidate>
        {cfg.fields.map((f) => <FieldInput key={f.name} def={f} value={data[f.name]} onChange={(v) => { setData({ ...data, [f.name]: v }); setErrors((x) => ({ ...x, [f.name]: "" })); }} error={errors[f.name]} />)}
        {k === "home" && <FeaturedPicker />}
        <div className="a-sticky-actions"><button className="a-btn primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save and publish changes"}</button></div>
      </form>
    </div>
  );
}

/* ---------------- Media library ---------------- */
export function MediaLibrary() {
  const [rows, setRows] = useState<MediaRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<MediaRow | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const toast = useToast();
  useEffect(() => { api.get<StorageInfo>("/api/admin/media/status").then(setInfo).catch(() => undefined); }, []);
  const load = () => api.get<MediaRow[]>("/api/admin/media").then(setRows).catch((e: ApiError) => toast("err", e.message));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  async function upload(files: FileList | File[]) {
    setBusy(true);
    for (const f of Array.from(files)) {
      try { await uploadImage(f); toast("ok", `Uploaded ${f.name}`); } catch (e) { toast("err", `${f.name}: ${(e as ApiError).message}`); }
    }
    setBusy(false); load();
  }
  async function remove() {
    try { await api.del(`/api/admin/media/${del!.id}`); toast("ok", "Image deleted."); } catch (e) { toast("err", (e as ApiError).message); }
    setDel(null); load();
  }
  return (
    <div className="a-page">
      <div className="a-page-head"><div><h1>Media Library</h1><p className="hint">All uploaded images. JPG, PNG, WebP, GIF or AVIF up to 10 MB. Images are checked, stripped of metadata and optimised on upload.</p></div>
        <button className="a-btn primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading…" : "Upload images"}</button></div>
      {info && <div className={`storage-banner ${info.cloudinary.configured && !info.cloudinary.ok ? "bad" : ""}`}><strong>{info.storage === "cloudinary" ? "Cloud storage (Cloudinary)" : "Database storage"}</strong> {info.note}{info.cloudinary.error && <> Details: {info.cloudinary.error}.</>}</div>}
      <input ref={input} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={(e) => e.target.files && upload(e.target.files)} />
      <div className={`dropzone ${drag ? "on" : ""}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}>
        Drag and drop images here
      </div>
      {!rows ? <p>Loading…</p> : rows.length === 0 ? <div className="a-empty"><p>No images yet.</p></div> : (
        <div className="media-grid">{rows.map((m) => (
          <div key={m.id} className="media-tile static"><img src={m.url} alt={m.filename || "Uploaded image"} loading="lazy" />
            <span>{m.filename || "image"}<small>{Math.round(m.size / 1024)} KB · {fmtDate(m.created_at)}</small></span>
            <div className="media-actions">
              <button className="a-btn" onClick={() => navigator.clipboard?.writeText(location.origin + m.url).then(() => toast("ok", "Image link copied."))}>Copy link</button>
              <button className="a-btn danger-ghost" onClick={() => setDel(m)}>Delete</button>
            </div></div>))}
        </div>
      )}
      {del && <Confirm title="Delete image?" text="If this image is used on a page, it will show as missing there. This cannot be undone." onConfirm={remove} onCancel={() => setDel(null)} />}
    </div>
  );
}
