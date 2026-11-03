import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LogoImage } from "../components/Logo";
import { ThemeToggle } from "../components/Header";
import { usePageMeta } from "../hooks/hooks";
import { ApiError, api, setCsrf } from "../services/api";
import EntityManager from "./EntityManager";
import { foundersCfg, ideasCfg, portfolioCfg, projectsCfg, teamCfg, updatesCfg } from "./configs";
import { Dashboard, MediaLibrary, Messages, SettingsEditor } from "./Pages";
import { ToastProvider, useToast } from "./ui";

const I = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z", home: "M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z",
  info: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-5M12 8h.01", bulb: "M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V16h8v-1.3A7 7 0 0012 2z",
  box: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v9", image: "M4 4h16v16H4zM4 15l5-5 4 4 3-3 4 4M9 8h.01",
  users: "M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM21 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8", star: "M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z",
  news: "M4 5h13v14H5a1 1 0 01-1-1zM17 9h3v9a1 1 0 01-1 1M8 9h5M8 13h5", mail: "M3 5h18v14H3zM3 6l9 7 9-7", phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  cog: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"
};
const Icon = ({ d }: { d: string }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const NAV: { group: string; items: [string, string, string][] }[] = [
  { group: "Overview", items: [["/admin", "Dashboard", I.grid]] },
  { group: "Website", items: [["/admin/homepage", "Homepage", I.home], ["/admin/about", "About Us", I.info], ["/admin/projects", "Projects", I.box], ["/admin/portfolio", "Portfolio", I.image], ["/admin/ideas", "Ideas", I.bulb], ["/admin/updates", "Updates", I.news]] },
  { group: "People", items: [["/admin/founders", "Main Founders", I.star], ["/admin/team", "Team Members", I.users]] },
  { group: "Library & inbox", items: [["/admin/media", "Media Library", I.image], ["/admin/messages", "Messages", I.mail]] },
  { group: "Settings", items: [["/admin/contact", "Contact Information", I.phone], ["/admin/settings", "Website Settings", I.cog]] }
];

function Login({ onIn }: { onIn: (u: string) => void }) {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  usePageMeta("Admin sign in");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return setErr("Enter your username and password.");
    setBusy(true); setErr("");
    try {
      const r = await api.post<{ username: string; csrf: string }>("/api/admin/auth/login", { username, password });
      setCsrf(r.csrf); onIn(r.username); nav("/admin", { replace: true });
    } catch (e2) { setErr((e2 as ApiError).message); setP(""); }
    finally { setBusy(false); }
  }
  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit} noValidate>
        <LogoImage className="login-logo" />
        <h1>Admin sign in</h1>
        <div className="field"><label htmlFor="u">Username</label><input id="u" className="a-input" autoComplete="username" value={username} onChange={(e) => setU(e.target.value)} autoFocus /></div>
        <div className="field"><label htmlFor="p">Password</label><input id="p" className="a-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setP(e.target.value)} /></div>
        {err && <p className="field-error" role="alert">{err}</p>}
        <button className="a-btn primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <Link className="hint" to="/">← Back to website</Link>
      </form>
    </div>
  );
}

function Shell({ user, onOut, onSettings }: { user: string; onOut: () => void; onSettings: () => void }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  async function logout() { try { await api.post("/api/admin/auth/logout"); } catch (e) { toast("err", (e as ApiError).message); } setCsrf(""); onOut(); }
  return (
    <div className="a-shell">
      <aside className={`a-side ${open ? "open" : ""}`}>
        <Link to="/admin" className="a-brand"><LogoImage /><span>Admin</span></Link>
        <nav onClick={() => setOpen(false)} aria-label="Admin">
          {NAV.map((g) => (
            <div key={g.group} className="a-group"><p>{g.group}</p>
              {g.items.map(([to, label, d]) => <NavLink key={to} to={to} end={to === "/admin"}><Icon d={d} />{label}</NavLink>)}
            </div>
          ))}
        </nav>
        <div className="a-side-foot">
          <a href="/" target="_blank" rel="noopener noreferrer">View website ↗</a>
          <div className="a-user"><span>{user}</span><ThemeToggle /></div>
          <button className="a-btn full" onClick={logout}>Log out</button>
        </div>
      </aside>
      <div className="a-main">
        <div className="a-topbar"><button className="a-btn" onClick={() => setOpen(!open)} aria-expanded={open}>☰ Menu</button></div>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="homepage" element={<SettingsEditor k="home" onSaved={onSettings} />} />
          <Route path="about" element={<SettingsEditor k="about" onSaved={onSettings} />} />
          <Route path="contact" element={<SettingsEditor k="contact" onSaved={onSettings} />} />
          <Route path="settings" element={<SettingsEditor k="site" onSaved={onSettings} />} />
          <Route path="ideas" element={<EntityManager cfg={ideasCfg} />} />
          <Route path="projects" element={<EntityManager cfg={projectsCfg} />} />
          <Route path="portfolio" element={<EntityManager cfg={portfolioCfg} />} />
          <Route path="founders" element={<EntityManager cfg={foundersCfg} />} />
          <Route path="team" element={<EntityManager cfg={teamCfg} />} />
          <Route path="messages" element={<Messages />} />
          <Route path="updates" element={<EntityManager cfg={updatesCfg} />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function AdminApp({ onSettingsChanged }: { onSettingsChanged: () => void }) {
  const [user, setUser] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const out = () => setUser(null);
    window.addEventListener("admin-unauthorized", out);
    api.get<{ username: string; csrf: string }>("/api/admin/auth/me").then((r) => { setCsrf(r.csrf); setUser(r.username); }).catch(() => setUser(null)).finally(() => setChecked(true));
    return () => window.removeEventListener("admin-unauthorized", out);
  }, []);
  if (!checked) return <div className="boot" />;
  return (
    <ToastProvider>
      <div className="admin-root">
        <Routes>
          <Route path="login" element={user ? <Navigate to="/admin" replace /> : <Login onIn={setUser} />} />
          <Route path="*" element={user ? <Shell user={user} onOut={() => setUser(null)} onSettings={onSettingsChanged} /> : <Navigate to="/admin/login" replace />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}
