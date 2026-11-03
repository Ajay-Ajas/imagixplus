import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError, api, uploadImage } from "../services/api";

/* ---------- toasts ---------- */
interface Toast { id: number; kind: "ok" | "err"; msg: string }
const ToastCtx = createContext<(kind: "ok" | "err", msg: string) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, set] = useState<Toast[]>([]);
  const push = useCallback((kind: "ok" | "err", msg: string) => {
    const id = Date.now() + Math.random();
    set((t) => [...t, { id, kind, msg }]);
    window.setTimeout(() => set((t) => t.filter((x) => x.id !== id)), kind === "ok" ? 3500 : 7000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`} role={t.kind === "err" ? "alert" : "status"}>{t.msg}</div>)}</div>
    </ToastCtx.Provider>
  );
}

/* ---------- dialogs ---------- */
export function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="a-backdrop" onClick={onClose}>
      <div className={`a-dialog ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="a-dialog-head"><h3>{title}</h3><button className="a-btn ghost" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}
export function Confirm({ title, text, confirmLabel = "Delete", onConfirm, onCancel }: { title: string; text: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <p>{text}</p>
      <div className="a-actions"><button className="a-btn" onClick={onCancel} autoFocus>Cancel</button><button className="a-btn danger" onClick={onConfirm}>{confirmLabel}</button></div>
    </Dialog>
  );
}

/* ---------- media ---------- */
export interface MediaRow { id: string; filename: string; size: number; url: string; storage: string; created_at: string }
export function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [rows, setRows] = useState<MediaRow[] | null>(null);
  useEffect(() => { api.get<MediaRow[]>("/api/admin/media").then(setRows).catch(() => setRows([])); }, []);
  return (
    <Dialog title="Choose from image library" onClose={onClose} wide>
      {!rows ? <p>Loading…</p> : rows.length === 0 ? <p>No images uploaded yet. Close this and use “Upload image”.</p> : (
        <div className="media-grid">{rows.map((m) => <button key={m.id} className="media-tile" onClick={() => { onPick(m.url); onClose(); }}><img src={m.url} alt={m.filename || "Uploaded image"} loading="lazy" /><span>{m.filename}</span></button>)}</div>
      )}
    </Dialog>
  );
}

export function ImageInput({ value, onChange, round = false }: { value: string; onChange: (v: string) => void; round?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState("");
  const [picker, setPicker] = useState(false);
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const toast = useToast();
  async function pick(f?: File) {
    if (!f) return;
    setErr("");
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(f.type)) return setErr("Choose a JPG, PNG, WebP, GIF or AVIF image.");
    if (f.size > 10 * 1024 * 1024) return setErr("Image is larger than 10 MB.");
    setLocal(URL.createObjectURL(f));
    setBusy(true);
    try { const r = await uploadImage(f); onChange(r.url); toast("ok", "Image uploaded."); }
    catch (e) { setErr((e as ApiError).message); setLocal(""); }
    finally { setBusy(false); if (file.current) file.current.value = ""; }
  }
  const shown = local && busy ? local : value;
  return (
    <div className="image-input">
      <div className={`image-preview ${round ? "round" : ""}`}>{shown ? <img src={shown} alt="Selected" /> : <span>No image</span>}{busy && <div className="image-busy">Uploading…</div>}</div>
      <div className="image-actions">
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" className="a-btn" onClick={() => file.current?.click()} disabled={busy}>{value ? "Replace image" : "Upload image"}</button>
        <button type="button" className="a-btn ghost" onClick={() => setPicker(true)} disabled={busy}>Choose from library</button>
        {value && <button type="button" className="a-btn ghost" onClick={() => { onChange(""); setLocal(""); }}>Remove</button>}
      </div>
      {err && <p className="field-error">{err}</p>}
      {picker && <MediaPicker onPick={onChange} onClose={() => setPicker(false)} />}
    </div>
  );
}
