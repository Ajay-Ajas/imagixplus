import { Link } from "react-router-dom";
import { IdeaCard, PersonCard, ProjectRow, UpdateCard } from "../components/cards";
import { LogoImage } from "../components/Logo";
import { Chips, Empty, ExternalLink, Reveal, SectionHeading } from "../components/ui";
import { useData, usePageMeta, useSettings } from "../hooks/hooks";
import type { Idea, Person, Project, Update } from "../types";

export default function Home() {
  const { home, about, contact, site } = useSettings();
  usePageMeta("", site.seoDescription);
  const s = home.sections;
  const projects = useData<Project[]>("/api/public/projects").data ?? [];
  const ideas = useData<Idea[]>("/api/public/ideas").data ?? [];
  const founders = useData<Person[]>("/api/public/founders").data ?? [];
  const updates = useData<Update[]>("/api/public/updates").data ?? [];
  const flagship = projects.find((p) => p.is_flagship);
  const featured = projects.filter((p) => p.featured && !p.is_flagship);
  const topUpdates = [...updates].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3);

  return (
    <>
      <section className="hero">
        {home.heroImage && <img className="hero-bg" src={home.heroImage} alt="" />}
        <div className="hero-cross" aria-hidden="true"><i className="h" /><i className="v" /><i className="dot" /></div>
        <div className="container hero-inner">
          <LogoImage className="hero-logo" />
          <h1>{home.heroHeadline}</h1>
          <p className="hero-desc">{home.heroDescription}</p>
          <p className="hero-tag">{home.tagline}</p>
          <div className="btn-row">
            <Link className="btn btn-primary" to="/projects">Explore Our Work</Link>
            <Link className="btn" to="/team">Meet Our Team</Link>
          </div>
        </div>
      </section>

      {s.about && (
        <section className="section container split">
          <Reveal>
            <SectionHeading title="About IMAGIX+" />
            <p className="lead">{about.intro}</p>
            <Link className="text-link" to="/about">Read our story</Link>
          </Reveal>
          {home.aboutImage && <img className="side-img" src={home.aboutImage} alt="The ImagixPlus team at work" loading="lazy" />}
        </section>
      )}

      {s.build && home.whatWeBuild.length > 0 && (
        <section className="section container">
          <SectionHeading title="What We Build" />
          <div className="build-grid">
            {home.whatWeBuild.map((b) => (
              <Reveal key={b.title}><div className="build-item"><h3>{b.title}</h3><p>{b.description}</p></div></Reveal>
            ))}
          </div>
          <Chips items={about.technicalInterests} />
        </section>
      )}

      {s.ideas && (
        <section className="section container">
          <SectionHeading title="Our Ideas and Innovations" intro="Concepts and research directions. Proposed ideas are labelled so they are never confused with finished products." />
          {ideas.length ? <div className="card-grid">{ideas.slice(0, 3).map((i) => <IdeaCard key={i.id} idea={i} />)}</div> : <Empty title="No ideas published yet" />}
          <Link className="text-link" to="/ideas">All ideas and innovations</Link>
        </section>
      )}

      {s.projects && (
        <section className="section container">
          <SectionHeading title="Featured Projects" />
          {featured.length ? <div className="project-list">{featured.map((p) => <ProjectRow key={p.id} project={p} />)}</div> : <Empty title="No featured projects selected" text="Choose featured projects in the admin dashboard." />}
          <Link className="text-link" to="/projects">All projects</Link>
        </section>
      )}

      {s.flagship && flagship && (
        <section className="section flagship-band">
          <div className="container">
            <SectionHeading title="CivicMind AI — Flagship Product" intro="Developed by ImagixPlus." />
            <ProjectRow project={flagship} expanded />
          </div>
        </section>
      )}

      {s.team && (
        <section className="section container">
          <SectionHeading title="Main Founders" intro="The four founders who started IMAGIX+." />
          {founders.length ? <div className="person-grid large">{founders.map((f) => <PersonCard key={f.id} person={f} large />)}</div> : <Empty title="Team profiles coming soon" />}
          <Link className="text-link" to="/team">Meet the full team</Link>
        </section>
      )}

      {s.updates && (
        <section className="section container">
          <SectionHeading title="Latest Updates" />
          {topUpdates.length ? <div className="card-grid">{topUpdates.map((u) => <UpdateCard key={u.id} update={u} />)}</div> : <Empty title="No updates published yet" text="Progress news about our projects will appear here." />}
          <Link className="text-link" to="/updates">All updates</Link>
        </section>
      )}

      {s.contact && (
        <section className="section container contact-band">
          <SectionHeading title="Contact" intro={contact.note || "Questions, ideas or collaboration enquiries are welcome."} />
          <div className="btn-row">
            {contact.email ? <a className="btn btn-primary" href={`mailto:${contact.email}`}>{contact.email}</a> : <Link className="btn btn-primary" to="/contact">Contact details</Link>}
            <ExternalLink href="https://civicmindai.in">Visit CivicMind AI</ExternalLink>
          </div>
        </section>
      )}
    </>
  );
}
