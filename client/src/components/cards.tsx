import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fmtDate, initials } from "../hooks/hooks";
import type { Idea, Link as LinkT, Person, PortfolioItem, Project, Update } from "../types";
import { Badges, Chips, Cover, ExternalLink, PlusMark, StatusBadge } from "./ui";

export function IdeaCard({ idea }: { idea: Idea }) {
  const implemented = idea.stage === "Implemented";
  return (
    <article className="idea-card">
      <Cover src={idea.image_url} alt={`Illustration for ${idea.title}`} label={idea.category} className="idea-img" />
      <div className="idea-body">
        <div className="idea-tags">
          <span className={`kind ${implemented ? "implemented" : "proposed"}`}>{implemented ? "Implemented product" : "Proposed idea"}</span>
          {idea.category && <span className="muted">{idea.category}</span>}
        </div>
        <h3>{idea.title}</h3>
        <p>{idea.description}</p>
        <dl className="meta">
          <div><dt>Stage</dt><dd>{idea.stage}</dd></div>
          <div><dt>Updated</dt><dd>{fmtDate(idea.updated_at)}</dd></div>
        </dl>
      </div>
    </article>
  );
}

export function ProjectRow({ project, expanded = false }: { project: Project; expanded?: boolean }) {
  const links: LinkT[] = [...(project.url ? [{ label: project.url_label || "Visit project", url: project.url }] : []), ...project.links];
  return (
    <article className={`project-row ${project.is_flagship ? "flagship" : ""}`}>
      <div className="project-media">
        <Cover src={project.cover_image} alt={`${project.name} cover`} label={project.category || "IMAGIX+"} className="project-img" />
      </div>
      <div className="project-main">
        <div className="project-head">
          {project.is_flagship && <span className="kind implemented">Flagship product</span>}
          {project.category && <span className="muted">{project.category}</span>}
        </div>
        <h3>{project.name}</h3>
        <Badges items={project.badges} />
        {project.status_label && <p className="status-label">{project.status_label}</p>}
        <p className="lead">{project.short_description}</p>
        {expanded && project.description && project.description !== project.short_description && <p>{project.description}</p>}
        {project.status_note && <p className="status-note">{project.status_note}</p>}
        {expanded && project.capabilities.length > 0 && (<><h4>Capabilities</h4><ul className="check-list">{project.capabilities.map((c) => <li key={c}>{c}</li>)}</ul></>)}
        {expanded && project.future_plans.length > 0 && (<><h4>Future plans</h4><ul className="check-list plans">{project.future_plans.map((c) => <li key={c}>{c}</li>)}</ul></>)}
        {project.technologies.length > 0 && (<><h4>Technologies</h4><Chips items={project.technologies} /></>)}
        {links.length > 0 && (
          <div className="btn-row">
            {links.map((l, i) => <ExternalLink key={l.url} href={l.url} className={i === 0 ? "btn btn-primary" : "btn"}>{l.label}</ExternalLink>)}
          </div>
        )}
      </div>
    </article>
  );
}

export function UpdateCard({ update, large = false }: { update: Update; large?: boolean }) {
  return (
    <article className={`update-card ${large ? "large" : ""}`}>
      <Link to={`/updates/${update.slug}`} className="update-link" aria-label={update.title}>
        <Cover src={update.cover_image} alt={`Cover for ${update.title}`} label={update.category} className="update-img" />
        <div className="update-body">
          <div className="idea-tags"><span className="kind proposed">{update.category}</span><time dateTime={update.published_at ?? ""}>{fmtDate(update.published_at)}</time></div>
          <h3>{update.title}</h3>
          <p>{update.summary}</p>
          {update.author && <span className="muted">By {update.author}</span>}
        </div>
      </Link>
    </article>
  );
}

export function PersonCard({ person, large = false }: { person: Person; large?: boolean }) {
  return (
    <Link to={`/team/${person.slug}`} className={`person-card ${large ? "large" : ""}`} aria-label={`${person.name}, ${person.designation}. View profile`}>
      <div className="person-photo">
        {person.photo_url ? <img src={person.photo_url} alt={`Portrait of ${person.name}`} loading="lazy" decoding="async" /> : <div className="person-initials" role="img" aria-label={`${person.name} (photo coming soon)`}>{initials(person.name)}</div>}
      </div>
      <div className="person-info">
        <span className="person-role">{person.designation || person.category}</span>
        <h3>{person.name}</h3>
        {person.intro && <p>{person.intro}</p>}
        <span className="person-cta">View profile</span>
      </div>
    </Link>
  );
}

export function PortfolioCard({ item, onOpen }: { item: PortfolioItem; onOpen: (i: PortfolioItem) => void }) {
  return (
    <button className="portfolio-card" onClick={() => onOpen(item)} aria-label={`Open ${item.name}`}>
      <Cover src={item.cover_image} alt={`${item.name} cover`} label={item.name} className="portfolio-img" />
      <span className="portfolio-info">
        <span className="muted">{item.category}</span>
        <strong>{item.name}</strong>
        <StatusBadge status={item.status} />
      </span>
    </button>
  );
}

export function PortfolioModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const images = [item.cover_image, ...item.gallery].filter(Boolean);
  useEffect(() => {
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={item.name} onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="icon-btn modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="modal-media">
          <Cover src={images[idx]} alt={`${item.name} screenshot ${idx + 1}`} label={item.name} className="modal-img" />
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((src, i) => (
                <button key={src + i} className={i === idx ? "on" : ""} onClick={() => setIdx(i)} aria-label={`Show image ${i + 1}`}><img src={src} alt="" loading="lazy" /></button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-body">
          <p className="muted">{item.category}</p>
          <h3>{item.name}</h3>
          <StatusBadge status={item.status} />
          <p>{item.description}</p>
          <Chips items={item.technologies} />
          <p className="muted">Last updated {fmtDate(item.updated_at)}</p>
          {item.url && <ExternalLink href={item.url} className="btn btn-primary">View working project</ExternalLink>}
        </div>
      </div>
    </div>
  );
}
export { PlusMark };
