import { useState, type FormEvent } from "react";
import { ExternalLink, PageHero } from "../components/ui";
import { usePageMeta, useSettings } from "../hooks/hooks";
import { ApiError, api } from "../services/api";

type Result = { kind: "sent" } | { kind: "saved" } | { kind: "error"; msg: string } | null;
const EMPTY = { name: "", email: "", subject: "", message: "", website: "" };

export default function Contact() {
  const { contact } = useSettings();
  usePageMeta("Contact", "Contact the IMAGIX+ team. Official email: contact@civicmindai.in.");
  const official = contact.email || "contact@civicmindai.in";
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const set = (k: keyof typeof EMPTY, v: string) => { setF({ ...f, [k]: v }); setErrors((e) => ({ ...e, [k]: "" })); };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errs.email = "Enter a valid email address.";
    if (!f.subject.trim()) errs.subject = "Please add a subject.";
    if (f.message.trim().length < 10) errs.message = "Please write at least 10 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setResult(null);
    try {
      const r = await api.post<{ emailed: boolean }>("/api/public/contact", f);
      setResult({ kind: r.emailed ? "sent" : "saved" });
      setF(EMPTY);
    } catch (err) {
      const a = err as ApiError;
      setErrors(a.fields ?? {});
      setResult({ kind: "error", msg: a.message });
    } finally { setBusy(false); }
  }

  const field = (k: keyof typeof EMPTY, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={`cf-field ${errors[k] ? "has-error" : ""}`}>
      <label htmlFor={`c-${k}`}>{label}</label>
      <input id={`c-${k}`} value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} {...props} />
      {errors[k] && <p className="cf-error" id={`e-${k}`} role="alert">{errors[k]}</p>}
    </div>
  );

  return (
    <>
      <PageHero title="Contact" intro={contact.note || "Questions, ideas or collaboration enquiries are welcome."} />
      <div className="container contact-layout">
        <form className="contact-form" onSubmit={submit} noValidate>
          <div className="cf-row">{field("name", "Name", { autoComplete: "name", maxLength: 100 })}{field("email", "Email", { type: "email", autoComplete: "email", maxLength: 200 })}</div>
          {field("subject", "Subject", { maxLength: 150 })}
          <div className={`cf-field ${errors.message ? "has-error" : ""}`}>
            <label htmlFor="c-message">Message</label>
            <textarea id="c-message" rows={7} maxLength={5000} value={f.message} onChange={(e) => set("message", e.target.value)} aria-invalid={!!errors.message} />
            {errors.message && <p className="cf-error" role="alert">{errors.message}</p>}
          </div>
          <div className="cf-trap" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} /></label></div>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
          <div aria-live="polite">
            {result?.kind === "sent" && <p className="cf-note ok">Thank you. Your message has been sent and we will reply by email.</p>}
            {result?.kind === "saved" && <p className="cf-note warn">Your message was received, but automatic email delivery is not switched on yet, so we may not see it straight away. For anything urgent, please email <a href={`mailto:${official}`}>{official}</a> directly.</p>}
            {result?.kind === "error" && <p className="cf-note err" role="alert">{result.msg} You can also email <a href={`mailto:${official}`}>{official}</a>.</p>}
          </div>
        </form>
        <aside className="contact-side">
          <h2>Official contact</h2>
          <p className="contact-mail"><a href={`mailto:${official}`}>{official}</a></p>
          {contact.phone && <p><a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></p>}
          {contact.location && <p>{contact.location}</p>}
          {contact.socials.length > 0 && <div className="social-row">{contact.socials.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>)}</div>}
          <hr />
          <p>Looking for our flagship product? CivicMind AI is developed by IMAGIX+.</p>
          <ExternalLink href="https://civicmindai.in" className="btn">Explore CivicMind AI</ExternalLink>
        </aside>
      </div>
    </>
  );
}
