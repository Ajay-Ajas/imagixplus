import { useCallback, useEffect, useState, type ReactNode } from "react";
import { fmtDate } from "../hooks/hooks";
import { ApiError, api } from "../services/api";
import { FieldInput, validate, type FieldDef } from "./fields";
import { Confirm, Dialog, useToast } from "./ui";

export interface EntityConfig {
  entity: string; title: string; singular: string; titleKey: string; subtitle?: (row: any) => string;
  fields: FieldDef[]; defaults: Record<string, any>; preview: (draft: any) => ReactNode; intro?: string;
  core?: boolean; archivable?: boolean;
}

export default function EntityManager({ cfg }: { cfg: EntityConfig }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<null | "new" | number>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [del, setDel] = useState<any>(null);
  const toast = useToast();
  const base = `/api/admin/${cfg.entity}`;

  const load = useCallback(() => api.get<any[]>(base).then(setRows).catch((e: ApiError) => toast("err", e.message)), [base, toast]);
  useEffect(() => { setRows(null); setEditing(null); load(); }, [load]);

  const open = (row?: any) => {
    setErrors({});
    if (row) { setDraft(Object.fromEntries([...cfg.fields.map((f) => f.name), "published"].map((k) => [k, row[k] ?? cfg.defaults[k]]))); setEditing(row.id); }
    else { setDraft({ ...cfg.defaults }); setEditing("new"); }
  };
  const set = (name: string, v: any) => { setDraft((d) => ({ ...d, [name]: v })); setErrors((e) => { const n = { ...e }; delete n[name]; return n; }); };

  async function save(published: boolean) {
    const errs = validate(cfg.fields, draft);
    if (Object.keys(errs).length) { setErrors(errs); toast("err", "Please fix the highlighted fields."); return; }
    setSaving(true);
    try {
      const body = { ...draft, published };
      if (editing === "new") await api.post(base, body); else await api.put(`${base}/${editing}`, body);
      toast("ok", published ? `${cfg.singular} published.` : `${cfg.singular} saved as draft.`);
      setEditing(null);
      load();
    } catch (e) {
      const err = e as ApiError;
      setErrors(err.fields ?? {});
      toast("err", err.message);
    } finally { setSaving(false); }
  }
  async function toggle(row: any) {
    try { await api.patch(`${base}/${row.id}/publish`, { published: !row.published }); toast("ok", row.published ? "Unpublished." : "Published."); load(); }
    catch (e) { toast("err", (e as ApiError).message); }
  }
  async function archive(row: any) {
    try { await api.patch(`${base}/${row.id}/archive`, { archived: !row.archived }); toast("ok", row.archived ? "Restored." : "Archived. It is hidden from the website."); load(); }
    catch (e) { toast("err", (e as ApiError).message); }
  }
  async function remove() {
    try { await api.del(`${base}/${del.id}`); toast("ok", `${cfg.singular} deleted.`); setDel(null); load(); }
    catch (e) { toast("err", (e as ApiError).message); setDel(null); }
  }

  if (editing !== null) {
    const isPub = !!draft.published && editing !== "new";
    return (
      <div className="a-page">
        <div className="a-page-head">
          <div><button className="a-btn ghost" onClick={() => setEditing(null)}>← Back to {cfg.title}</button><h1>{editing === "new" ? `New ${cfg.singular.toLowerCase()}` : `Edit ${cfg.singular.toLowerCase()}`}</h1></div>
        </div>
        <form className="a-form" onSubmit={(e) => e.preventDefault()} noValidate>
          {cfg.fields.map((f) => <FieldInput key={f.name} def={f} value={draft[f.name]} onChange={(v) => set(f.name, v)} error={errors[f.name]} />)}
          <div className="a-sticky-actions">
            <button type="button" className="a-btn" onClick={() => setPreview(true)}>Preview</button>
            {!cfg.core && <button type="button" className="a-btn" disabled={saving} onClick={() => save(false)}>{isPub ? "Unpublish and save as draft" : "Save draft"}</button>}
            <button type="button" className="a-btn primary" disabled={saving} onClick={() => save(true)}>{saving ? "Saving…" : cfg.core ? "Save changes" : isPub ? "Save and keep published" : "Publish"}</button>
          </div>
        </form>
        {preview && (
          <Dialog title="Preview" wide onClose={() => setPreview(false)}>
            <p className="hint">This is how it will look on the website. Nothing is visible to visitors until you publish.</p>
            <div className="preview-frame">{cfg.preview(draft)}</div>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div><h1>{cfg.title}</h1>{cfg.intro && <p className="hint">{cfg.intro}</p>}</div>
        {!cfg.core && <button className="a-btn primary" onClick={() => open()}>Add {cfg.singular.toLowerCase()}</button>}
      </div>
      {!rows ? <div className="skeleton-list" aria-busy="true"><i /><i /><i /></div> : rows.length === 0 ? (
        <div className="a-empty"><p>No {cfg.title.toLowerCase()} yet.</p><button className="a-btn primary" onClick={() => open()}>Add the first {cfg.singular.toLowerCase()}</button></div>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead><tr><th>Title</th><th>Status</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r[cfg.titleKey]}</strong>{cfg.subtitle && <div className="hint">{cfg.subtitle(r)}</div>}</td>
                  <td>{cfg.core ? <span className="pill pub">Permanent</span> : r.archived ? <span className="pill">Archived</span> : <span className={`pill ${r.published ? "pub" : "draft"}`}>{r.published ? "Published" : "Draft"}</span>}</td>
                  <td>{fmtDate(r.updated_at)}</td>
                  <td className="row-actions">
                    <button className="a-btn" onClick={() => open(r)}>Edit</button>
                    {!cfg.core && !r.archived && <button className="a-btn" onClick={() => toggle(r)}>{r.published ? "Unpublish" : "Publish"}</button>}
                    {cfg.archivable && <button className="a-btn" onClick={() => archive(r)}>{r.archived ? "Restore" : "Archive"}</button>}
                    {!cfg.core && <button className="a-btn danger-ghost" onClick={() => setDel(r)}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {del && <Confirm title={`Delete ${cfg.singular.toLowerCase()}?`} text={`“${del[cfg.titleKey]}” will be permanently removed from the website. This cannot be undone.`} onConfirm={remove} onCancel={() => setDel(null)} />}
    </div>
  );
}
