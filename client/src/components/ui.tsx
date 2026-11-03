import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { PROJECT_STATUSES } from "../types";

export const PlusMark = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className="plus-mark">
    <path d="M8 1h4v7h7v4h-7v7H8v-7H1V8h7z" fill="currentColor" />
  </svg>
);

export function SectionHeading({ title, intro, as: Tag = "h2" }: { title: string; intro?: string; as?: "h1" | "h2" }) {
  return (
    <div className="section-heading">
      <Tag>{title}</Tag>
      {intro && <p>{intro}</p>}
    </div>
  );
}

export function PageHero({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="page-hero container">
      <PlusMark size={22} />
      <h1>{title}</h1>
      {intro && <p>{intro}</p>}
    </header>
  );
}

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay }}>
      {children}
    </motion.div>
  );
}

export function Cover({ src, alt, label, className = "" }: { src?: string; alt: string; label?: string; className?: string }) {
  if (src) return <img className={`cover ${className}`} src={src} alt={alt} loading="lazy" decoding="async" />;
  return (
    <div className={`cover cover-fallback ${className}`} role="img" aria-label={alt}>
      <PlusMark size={40} />
      {label && <span>{label}</span>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const idx = PROJECT_STATUSES.indexOf(status);
  return (
    <span className="status" title={`Development status: ${status}`}>
      <span className="status-meter" aria-hidden="true">
        {PROJECT_STATUSES.map((_, i) => <i key={i} className={i <= idx ? "on" : ""} />)}
      </span>
      {status}
    </span>
  );
}

export const Chips = ({ items }: { items: string[] }) =>
  items.length ? <ul className="chips">{items.map((t) => <li key={t}>{t}</li>)}</ul> : null;

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="empty">
      <PlusMark size={28} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}

export const Loading = () => <div className="loading" role="status" aria-live="polite"><span /> Loading…</div>;

/** Renders plain text safely: blank line = paragraph, "## " = heading, lines starting "- " = list. No HTML is ever injected. */
export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="richtext">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h3 key={i}>{b.slice(3)}</h3>;
        const lines = b.split("\n");
        if (lines.every((l) => l.startsWith("- "))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
        return <p key={i}>{lines.map((l, j) => (j ? [<br key={`b${j}`} />, l] : l))}</p>;
      })}
    </div>
  );
}

export const ExternalLink = ({ href, children, className = "btn" }: { href: string; children: ReactNode; className?: string }) => (
  <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>
);

export const Badges = ({ items }: { items: string[] }) =>
  items.length ? (
    <ul className="badges" aria-label="Development status">
      {items.map((b) => <li key={b} className={`badge b-${b.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{b}</li>)}
    </ul>
  ) : null;
