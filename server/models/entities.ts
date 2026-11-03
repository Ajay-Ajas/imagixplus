import { z } from "zod";

/** Remove HTML tags and control characters. React escapes on render; this is defence in depth. */
export const stripTags = (s: string) =>
  s.replace(/<[^>]*>/g, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

export const text = (max: number, min = 0) =>
  z.string().max(max * 2).transform((s) => stripTags(s).trim()).pipe(z.string().min(min, "Required").max(max));

export const longText = (max: number) =>
  z.string().max(max * 2).transform((s) => stripTags(s).replace(/\r\n/g, "\n").trim()).pipe(z.string().max(max));

export const urlField = z
  .string()
  .max(800)
  .transform((s) => s.trim())
  .refine(
    (v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v) || /^\/api\/media\/[0-9a-f-]{36}$/i.test(v),
    "Must be a full http(s) link or an uploaded image"
  );

export const list = z
  .array(text(160))
  .max(40)
  .transform((a) => a.filter(Boolean));

export const links = z
  .array(z.object({ label: text(60), url: urlField }))
  .max(20)
  .transform((a) => a.filter((l) => l.label && l.url));

export const PROJECT_STATUSES = [
  "Concept", "Prototype developed", "In development", "Testing and fine-tuning",
  "Pilot preparation", "Developed", "Launched"
] as const;
export const PROJECT_BADGES = ["Prototype", "In development", "Fine-tuning", "Seeking deployment", "Completed"] as const;
export const IDEA_STAGES = ["Concept", "Research", "Experimental", "Planned", "In development", "Implemented"] as const;

export interface EntityDef {
  table: string;
  shape: z.ZodRawShape;
  jsonCols?: string[];
  order: string;
  slugFrom?: string;
  hasPublishedAt?: boolean;
  titleCol: string;
  /** SQL condition that scopes this entity inside its table (e.g. core founders vs team members). */
  where?: string;
  forceValues?: Record<string, unknown>;
  archivable?: boolean;
  /** Permanent records: cannot be created, deleted, hidden or archived through the API. */
  core?: boolean;
}

const base = { published: z.boolean().default(false), sort_order: z.number().int().min(0).max(100000).default(0) };
const emailOpt = z.string().max(200).transform((s) => s.trim()).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address");
const person = {
  name: text(120, 1), designation: text(120).default(""), intro: longText(800).default(""), bio: longText(6000).default(""),
  qualification: text(300).default(""), aim: longText(1500).default(""), photo_url: urlField.default(""),
  skills: list.default([]), interests: list.default([]), contributions: list.default([]),
  social_links: links.default([]), email: emailOpt.default("")
};

export const entities: Record<string, EntityDef> = {
  ideas: {
    table: "ideas", titleCol: "title", order: "sort_order asc, updated_at desc",
    shape: {
      title: text(160, 1), description: longText(4000).default(""), image_url: urlField.default(""),
      category: text(80).default(""), stage: z.enum(IDEA_STAGES).default("Concept"), ...base
    }
  },
  projects: {
    table: "projects", titleCol: "name", order: "sort_order asc, id asc", slugFrom: "name", archivable: true,
    jsonCols: ["links"],
    shape: {
      name: text(200, 1), slug: text(120).default(""), short_description: text(400).default(""),
      description: longText(6000).default(""), status: z.enum(PROJECT_STATUSES).default("Concept"),
      status_label: text(160).default(""), badges: z.array(z.enum(PROJECT_BADGES)).max(5).default([]),
      status_note: text(300).default(""), category: text(80).default(""), cover_image: urlField.default(""),
      technologies: list.default([]), capabilities: list.default([]), future_plans: list.default([]),
      url: urlField.default(""), url_label: text(60).default(""), links: links.default([]),
      is_flagship: z.boolean().default(false), featured: z.boolean().default(false), archived: z.boolean().default(false), ...base
    }
  },
  portfolio: {
    table: "portfolio", titleCol: "name", order: "sort_order asc, updated_at desc",
    shape: {
      name: text(200, 1), description: longText(4000).default(""), cover_image: urlField.default(""),
      gallery: z.array(urlField).max(20).transform((a) => a.filter(Boolean)).default([]),
      technologies: list.default([]), status: z.enum(PROJECT_STATUSES).default("Concept"),
      category: text(80).default(""), url: urlField.default(""), ...base
    }
  },
  /** The four permanent main founders. Editable, never creatable/deletable/hideable. */
  founders: {
    table: "founders", titleCol: "name", order: "sort_order asc, id asc", jsonCols: ["social_links"],
    where: "is_core", core: true, shape: { ...person, designation: text(120).default("Founder") }
  },
  /** Everyone else: the expanding team. */
  team: {
    table: "founders", titleCol: "name", order: "sort_order asc, id asc", jsonCols: ["social_links"], slugFrom: "name",
    where: "not is_core", forceValues: { is_core: false }, archivable: true,
    shape: { ...person, slug: text(120).default(""), category: text(80).default("Team"), archived: z.boolean().default(false), ...base }
  },
  updates: {
    table: "updates", titleCol: "title", order: "published_at desc nulls last, id desc", slugFrom: "title", hasPublishedAt: true,
    shape: {
      title: text(200, 1), slug: text(120).default(""), summary: text(500).default(""),
      content: longText(30000).default(""), cover_image: urlField.default(""), category: text(80).default("Company"),
      author: text(120).default(""), featured: z.boolean().default(false), published: z.boolean().default(false),
      published_at: z.string().datetime({ offset: true }).nullable().optional()
    }
  }
};

/** Site-wide settings (singletons stored as JSON). */
const sectionFlags = z.object({
  about: z.boolean(), build: z.boolean(), ideas: z.boolean(), projects: z.boolean(),
  flagship: z.boolean(), team: z.boolean(), updates: z.boolean(), contact: z.boolean()
});
export const settingsSchemas = {
  home: z.object({
    heroHeadline: text(160, 1), heroDescription: text(500), tagline: text(120), heroImage: urlField, aboutImage: urlField,
    sections: sectionFlags,
    whatWeBuild: z.array(z.object({ title: text(80, 1), description: text(300) })).max(8)
  }),
  about: z.object({
    intro: longText(3000), story: longText(3000), vision: longText(2000), mission: longText(2000),
    whatWeDevelop: list, technicalInterests: list, approach: longText(3000), futureDirection: longText(3000),
    companyInfo: longText(2000), image: urlField
  }),
  contact: z.object({
    email: z.string().max(200).transform((s) => s.trim()).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
    phone: text(60), location: text(200), note: text(500), socials: links
  }),
  site: z.object({
    siteName: text(80, 1), seoTitle: text(70), seoDescription: text(200), logoUrl: urlField, faviconUrl: urlField,
    socialImageUrl: urlField, defaultTheme: z.enum(["dark", "light", "system"])
  })
};
export type SettingKey = keyof typeof settingsSchemas;
