import { IdeaCard, PersonCard, PortfolioCard, ProjectRow, UpdateCard } from "../components/cards";
import { RichText } from "../components/ui";
import { IDEA_STAGES, PROJECT_BADGES, PROJECT_STATUSES } from "../types";
import type { EntityConfig } from "./EntityManager";
import type { FieldDef } from "./fields";

const now = () => new Date().toISOString();
const stamp = (d: any) => ({ id: 0, created_at: now(), updated_at: now(), sort_order: 0, ...d });
const order: FieldDef = { name: "sort_order", label: "Display order", type: "number", hint: "Lower numbers appear first." };

export const ideasCfg: EntityConfig = {
  entity: "ideas", title: "Ideas", singular: "Idea", titleKey: "title", subtitle: (r) => `${r.stage}${r.category ? ` · ${r.category}` : ""}`,
  intro: "Concepts and research directions. Ideas at any stage other than “Implemented” are shown to visitors as proposed ideas.",
  defaults: { title: "", description: "", image_url: "", category: "", stage: "Concept", published: false, sort_order: 0 },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea", rows: 6 },
    { name: "image_url", label: "Image", type: "image" },
    { name: "category", label: "Category", type: "text", placeholder: "e.g. Research direction, Future concept" },
    { name: "stage", label: "Development stage", type: "select", options: IDEA_STAGES },
    order
  ],
  preview: (d) => <div style={{ maxWidth: 380 }}><IdeaCard idea={stamp(d)} /></div>
};

export const projectsCfg: EntityConfig = {
  entity: "projects", title: "Projects", singular: "Project", titleKey: "name", archivable: true,
  subtitle: (r) => r.status_label || r.status,
  intro: "Real projects with an honest development status. Published projects appear on the website immediately. Archive a project to hide it without losing it.",
  defaults: { name: "", slug: "", category: "", short_description: "", description: "", status: "Concept", status_label: "", badges: [], status_note: "", cover_image: "", technologies: [], capabilities: [], future_plans: [], url: "", url_label: "", links: [], is_flagship: false, featured: false, published: false, sort_order: 0 },
  fields: [
    { name: "name", label: "Project name", type: "text", required: true },
    { name: "cover_image", label: "Cover image", type: "image", hint: "Shown on project cards and the project page." },
    { name: "category", label: "Category", type: "text", placeholder: "e.g. Civic technology, Smart monitoring" },
    { name: "short_description", label: "Short description", type: "textarea", rows: 3, maxLength: 400, hint: "Shown on cards and the homepage." },
    { name: "description", label: "Detailed description", type: "textarea", rows: 7 },
    { name: "badges", label: "Status badges", type: "multicheck", options: PROJECT_BADGES, hint: "Shown as badges on the project card." },
    { name: "status_label", label: "Status wording", type: "text", placeholder: "Prototype Developed · Under Development", hint: "The exact wording shown under the badges. Describe the real stage honestly." },
    { name: "status", label: "Overall stage", type: "select", options: PROJECT_STATUSES, hint: "Used for the progress meter." },
    { name: "status_note", label: "Additional status note", type: "text" },
    { name: "technologies", label: "Technologies used", type: "tags" },
    { name: "capabilities", label: "Capabilities", type: "tags" },
    { name: "future_plans", label: "Future plans", type: "tags" },
    { name: "url", label: "Main project link", type: "text", placeholder: "https://…" },
    { name: "url_label", label: "Main link button text", type: "text", placeholder: "Explore CivicMind AI" },
    { name: "links", label: "Other project links", type: "links" },
    { name: "is_flagship", label: "Flagship product", type: "toggle", hint: "Shown in the homepage flagship section." },
    { name: "featured", label: "Featured on homepage", type: "toggle" },
    { name: "slug", label: "URL slug", type: "text", hint: "Leave blank to generate from the name." },
    order
  ],
  preview: (d) => <ProjectRow project={stamp(d)} expanded />
};

export const portfolioCfg: EntityConfig = {
  entity: "portfolio", title: "Portfolio", singular: "Portfolio entry", titleKey: "name", subtitle: (r) => `${r.category || "Uncategorised"} · ${r.status}`,
  defaults: { name: "", description: "", cover_image: "", gallery: [], technologies: [], status: "Prototype developed", category: "", url: "", published: false, sort_order: 0 },
  fields: [
    { name: "name", label: "Project name", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea", rows: 6 },
    { name: "cover_image", label: "Cover image", type: "image" },
    { name: "gallery", label: "Screenshots / gallery", type: "gallery" },
    { name: "technologies", label: "Technologies used", type: "tags" },
    { name: "status", label: "Development status", type: "select", options: PROJECT_STATUSES },
    { name: "category", label: "Category", type: "text", placeholder: "e.g. Product, Prototype, Experiment" },
    { name: "url", label: "Working project URL", type: "text", placeholder: "https://…" },
    order
  ],
  preview: (d) => (
    <div style={{ maxWidth: 420 }}><PortfolioCard item={stamp(d)} onOpen={() => undefined} /><p style={{ marginTop: "1rem" }}>{d.description}</p>
      <div className="preview-gallery">{(d.gallery ?? []).filter(Boolean).map((g: string) => <img key={g} src={g} alt="Gallery screenshot" />)}</div></div>
  )
};

const ROLES = ["Co-Founder", "CEO", "President", "HR", "Technical Lead", "Developer", "Designer", "Marketing", "Advisor"];
const personFields = (core: boolean): FieldDef[] => [
  { name: "name", label: "Full name", type: "text", required: true },
  { name: "photo_url", label: "Profile photograph", type: "image", round: true, hint: "A portrait works best (taller than wide). JPG, PNG or WebP up to 10 MB." },
  { name: "designation", label: core ? "Founder title / role" : "Role", type: "combo", options: ROLES, hint: core ? "e.g. Founder, Co-Founder" : "Choose a suggestion or type a custom role." },
  ...(core ? [] : [{ name: "category", label: "Category", type: "select", options: ["Co-Founder", "Leadership", "Technical", "Design", "Marketing", "Operations", "Advisor", "Other"] } as FieldDef]),
  { name: "intro", label: "Short introduction", type: "textarea", rows: 3, maxLength: 800, hint: "Shown on the card. Only add information the person has approved." },
  { name: "bio", label: "Biography", type: "textarea", rows: 7 },
  { name: "qualification", label: "Qualification", type: "text" },
  { name: "skills", label: "Skills", type: "tags" },
  { name: "interests", label: "Interests", type: "tags" },
  { name: "aim", label: "Personal aim or vision", type: "textarea", rows: 4 },
  { name: "contributions", label: "Contribution to IMAGIX+", type: "tags" },
  { name: "social_links", label: "Professional / social links (optional)", type: "links" },
  { name: "email", label: "Public email (optional)", type: "text", hint: "Only shown on the profile if you add one here." }
];
const personDefaults = { name: "", designation: "", intro: "", bio: "", qualification: "", aim: "", photo_url: "", skills: [], interests: [], contributions: [], social_links: [], email: "" };
const personPreview = (d: any) => <div style={{ maxWidth: 360 }}><PersonCard person={stamp({ slug: "preview", category: "", is_core: false, archived: false, ...d, designation: d.designation || "Role" })} large /></div>;

export const foundersCfg: EntityConfig = {
  entity: "founders", title: "Main Founders", singular: "Founder", titleKey: "name", core: true, subtitle: (r) => r.designation,
  intro: "The four permanent founders of IMAGIX+. You can edit their details and photographs here. They cannot be deleted, hidden or archived.",
  defaults: { ...personDefaults, designation: "Founder" }, fields: personFields(true), preview: personPreview
};
export const teamCfg: EntityConfig = {
  entity: "team", title: "Team Members", singular: "Team member", titleKey: "name", archivable: true, subtitle: (r) => `${r.designation || "No role"} · ${r.category}`,
  intro: "People who join IMAGIX+ after the main founders. Published members appear under “Team” on the website.",
  defaults: { ...personDefaults, category: "Other", published: false, sort_order: 0 },
  fields: [...personFields(false), order], preview: personPreview
};

export const updatesCfg: EntityConfig = {
  entity: "updates", title: "Updates", singular: "Update", titleKey: "title", subtitle: (r) => r.category,
  intro: "Announcements and progress news. Drafts are private; published updates appear on the Latest Updates page. Use a blank line between paragraphs, “## ” for a heading and “- ” for bullet points.",
  defaults: { title: "", slug: "", summary: "", content: "", cover_image: "", category: "Company", author: "", featured: false, published: false, published_at: null },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "summary", label: "Short summary", type: "textarea", rows: 3, maxLength: 500, required: true },
    { name: "content", label: "Full article", type: "textarea", rows: 14 },
    { name: "cover_image", label: "Cover image", type: "image" },
    { name: "category", label: "Category", type: "text", placeholder: "e.g. CivicMind AI, Company, Prototype, Research" },
    { name: "author", label: "Author", type: "text" },
    { name: "published_at", label: "Publication date", type: "datetime", hint: "Leave empty to use the moment you publish. A future date schedules the update." },
    { name: "featured", label: "Featured announcement", type: "toggle" },
    { name: "slug", label: "URL slug", type: "text", hint: "Leave blank to generate from the title." }
  ],
  preview: (d) => (
    <div><UpdateCard update={stamp({ ...d, slug: "preview", published_at: d.published_at ?? now() })} large /><div className="article" style={{ padding: "2rem 0" }}><RichText text={d.content ?? ""} /></div></div>
  )
};
