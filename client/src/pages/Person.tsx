import { Link, useParams } from "react-router-dom";
import { Chips, Empty, Loading, RichText } from "../components/ui";
import { initials, useData, usePageMeta } from "../hooks/hooks";
import type { Person } from "../types";

export default function PersonPage() {
  const { slug = "" } = useParams();
  const { data: p, loading, error } = useData<Person>(`/api/public/people/${encodeURIComponent(slug)}`);
  usePageMeta(p ? `${p.name}${p.designation ? ` — ${p.designation}` : ""}` : "Profile", p?.intro);
  if (loading) return <div className="container"><Loading /></div>;
  if (error || !p) return <div className="container"><Empty title="Profile not found" text="This profile may have been hidden or moved." /><Link className="text-link" to="/team">Back to the team</Link></div>;
  return (
    <article className="profile">
      <div className="profile-photo">
        {p.photo_url ? <img src={p.photo_url} alt={`Portrait of ${p.name}`} decoding="async" /> : <div className="person-initials big" role="img" aria-label={`${p.name} (photo coming soon)`}>{initials(p.name)}</div>}
      </div>
      <div className="profile-body">
        <Link className="back-link" to="/team">← The team</Link>
        <p className="person-role">{p.designation}{p.is_core ? " · Main Founder" : p.category ? ` · ${p.category}` : ""}</p>
        <h1>{p.name}</h1>
        {p.intro && <p className="lead">{p.intro}</p>}
        {p.bio && <section><h2>Biography</h2><RichText text={p.bio} /></section>}
        {p.qualification && <section><h2>Qualification</h2><p>{p.qualification}</p></section>}
        {p.skills.length > 0 && <section><h2>Skills</h2><Chips items={p.skills} /></section>}
        {p.interests.length > 0 && <section><h2>Interests</h2><Chips items={p.interests} /></section>}
        {p.aim && <section><h2>Aim and vision</h2><RichText text={p.aim} /></section>}
        {p.contributions.length > 0 && <section><h2>Contribution to IMAGIX+</h2><ul className="check-list">{p.contributions.map((c) => <li key={c}>{c}</li>)}</ul></section>}
        {(p.email || p.social_links.length > 0) && (
          <section><h2>Connect</h2>
            <div className="social-row">
              {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
              {p.social_links.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>)}
            </div>
          </section>
        )}
        {!p.bio && !p.qualification && !p.aim && <p className="muted profile-note">More of this profile will be added soon.</p>}
      </div>
    </article>
  );
}
