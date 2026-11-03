import { useState } from "react";
import type { Link } from "../types";
import { ImageInput } from "./ui";

export interface FieldDef {
  name: string; label: string;
  type: "text" | "textarea" | "select" | "toggle" | "tags" | "image" | "gallery" | "links" | "datetime" | "number" | "flags" | "repeater" | "combo" | "multicheck";
  options?: string[]; hint?: string; required?: boolean; rows?: number; maxLength?: number; placeholder?: string;
  flags?: { key: string; label: string }[]; round?: boolean;
}

function Tags({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState("");
  const add = () => { const parts = text.split(",").map((s) => s.trim()).filter(Boolean); if (parts.length) onChange([...new Set([...value, ...parts])]); setText(""); };
  return (
    <div className="tags-input">
      <ul>{value.map((t) => <li key={t}>{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>✕</button></li>)}</ul>
      <input value={text} placeholder="Type and press Enter (comma separates several)" onChange={(e) => setText(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
    </div>
  );
}

const toLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function FieldInput({ def, value, onChange, error }: { def: FieldDef; value: any; onChange: (v: any) => void; error?: string }) {
  const id = `f-${def.name}`;
  let input: React.ReactNode;
  switch (def.type) {
    case "text": input = <input id={id} className="a-input" value={value ?? ""} maxLength={def.maxLength} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />; break;
    case "number": input = <input id={id} className="a-input" type="number" min={0} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value) || 0)} />; break;
    case "combo": input = (<><input id={id} className="a-input" list={`${id}-list`} value={value ?? ""} maxLength={def.maxLength} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} /><datalist id={`${id}-list`}>{def.options?.map((o) => <option key={o} value={o} />)}</datalist></>); break;
    case "multicheck": input = (
      <div className="flags">{def.options?.map((o) => (
        <label key={o} className="toggle"><input type="checkbox" checked={(value ?? []).includes(o)} onChange={(e) => onChange(e.target.checked ? [...(value ?? []), o] : (value ?? []).filter((x: string) => x !== o))} /><span /> {o}</label>
      ))}</div>); break;
    case "textarea": input = <textarea id={id} className="a-input" rows={def.rows ?? 5} value={value ?? ""} maxLength={def.maxLength} onChange={(e) => onChange(e.target.value)} />; break;
    case "select": input = <select id={id} className="a-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{def.options?.map((o) => <option key={o}>{o}</option>)}</select>; break;
    case "toggle": input = <label className="toggle"><input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><span /> {value ? "Yes" : "No"}</label>; break;
    case "tags": input = <Tags value={value ?? []} onChange={onChange} />; break;
    case "image": input = <ImageInput value={value ?? ""} onChange={onChange} round={def.round} />; break;
    case "datetime": input = <input id={id} className="a-input" type="datetime-local" value={toLocal(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />; break;
    case "gallery": {
      const list: string[] = value ?? [];
      input = (
        <div className="gallery-input">
          {list.map((u, i) => (
            <div key={i} className="gallery-item"><ImageInput value={u} onChange={(v) => onChange(v ? list.map((x, j) => (j === i ? v : x)) : list.filter((_, j) => j !== i))} /></div>
          ))}
          <button type="button" className="a-btn" onClick={() => onChange([...list, ""])}>Add screenshot</button>
        </div>
      );
      break;
    }
    case "links": {
      const list: Link[] = value ?? [];
      const set = (i: number, k: keyof Link, v: string) => onChange(list.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
      input = (
        <div className="rows-input">
          {list.map((l, i) => (
            <div className="row-pair" key={i}>
              <input className="a-input" placeholder="Label (e.g. GitHub)" value={l.label} onChange={(e) => set(i, "label", e.target.value)} aria-label="Link label" />
              <input className="a-input" placeholder="https://…" value={l.url} onChange={(e) => set(i, "url", e.target.value)} aria-label="Link URL" />
              <button type="button" className="a-btn ghost" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove link">✕</button>
            </div>
          ))}
          <button type="button" className="a-btn" onClick={() => onChange([...list, { label: "", url: "" }])}>Add link</button>
        </div>
      );
      break;
    }
    case "repeater": {
      const list: { title: string; description: string }[] = value ?? [];
      const set = (i: number, k: string, v: string) => onChange(list.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
      input = (
        <div className="rows-input">
          {list.map((l, i) => (
            <div className="row-stack" key={i}>
              <input className="a-input" placeholder="Title" value={l.title} onChange={(e) => set(i, "title", e.target.value)} aria-label="Title" />
              <textarea className="a-input" rows={2} placeholder="Description" value={l.description} onChange={(e) => set(i, "description", e.target.value)} aria-label="Description" />
              <button type="button" className="a-btn ghost" onClick={() => onChange(list.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className="a-btn" onClick={() => onChange([...list, { title: "", description: "" }])}>Add item</button>
        </div>
      );
      break;
    }
    case "flags":
      input = (
        <div className="flags">
          {def.flags?.map((f) => (
            <label key={f.key} className="toggle"><input type="checkbox" checked={!!value?.[f.key]} onChange={(e) => onChange({ ...value, [f.key]: e.target.checked })} /><span /> {f.label}</label>
          ))}
        </div>
      );
      break;
  }
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{def.label}{def.required && <b aria-hidden="true"> *</b>}</label>
      {input}
      {def.hint && <p className="hint">{def.hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

/** Returns a map of field name -> message for client-side validation. */
export function validate(fields: FieldDef[], data: Record<string, any>) {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = data[f.name];
    if (f.required && (v === undefined || v === null || String(v).trim() === "")) errors[f.name] = `${f.label} is required.`;
    if (f.type === "links" && Array.isArray(v)) {
      for (const l of v) if ((l.label || l.url) && !/^https?:\/\/\S+$/i.test(l.url)) { errors[f.name] = "Every link needs a label and a full URL starting with http:// or https://."; break; }
    }
    if (f.type === "text" && f.name.match(/url$/i) && v && !/^https?:\/\/\S+$/i.test(v) && !String(v).startsWith("/api/media/")) errors[f.name] = "Enter a full link starting with http:// or https://.";
    if ((f.name === "email") && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors[f.name] = "Enter a valid email address.";
  }
  return errors;
}
