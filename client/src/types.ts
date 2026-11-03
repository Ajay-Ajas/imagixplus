export interface Link { label: string; url: string }
export interface Settings {
  home: {
    heroHeadline: string; heroDescription: string; tagline: string; heroImage: string; aboutImage: string;
    sections: Record<"about" | "build" | "ideas" | "projects" | "flagship" | "team" | "updates" | "contact", boolean>;
    whatWeBuild: { title: string; description: string }[];
  };
  about: {
    intro: string; story: string; vision: string; mission: string; whatWeDevelop: string[]; technicalInterests: string[];
    approach: string; futureDirection: string; companyInfo: string; image: string;
  };
  contact: { email: string; phone: string; location: string; note: string; socials: Link[] };
  site: { siteName: string; seoTitle: string; seoDescription: string; logoUrl: string; faviconUrl: string; socialImageUrl: string; defaultTheme: "dark" | "light" | "system" };
}
interface Base { id: number; published: boolean; sort_order: number; created_at: string; updated_at: string }
export interface Idea extends Base { title: string; description: string; image_url: string; category: string; stage: string }
export interface Project extends Base {
  name: string; slug: string; short_description: string; description: string; status: string; status_label: string; badges: string[];
  status_note: string; category: string; cover_image: string; technologies: string[]; capabilities: string[]; future_plans: string[];
  url: string; url_label: string; links: Link[]; is_flagship: boolean; featured: boolean; archived: boolean;
}
export interface PortfolioItem extends Base {
  name: string; description: string; cover_image: string; gallery: string[]; technologies: string[]; status: string; category: string; url: string;
}
export interface Person extends Base {
  name: string; slug: string; designation: string; category: string; is_core: boolean; intro: string; bio: string; qualification: string;
  aim: string; photo_url: string; skills: string[]; interests: string[]; contributions: string[]; social_links: Link[]; email: string; archived: boolean;
}
export type Founder = Person;
export interface Update extends Base {
  title: string; slug: string; summary: string; content: string; cover_image: string; category: string; author: string;
  featured: boolean; published_at: string | null;
}
export const PROJECT_STATUSES = ["Concept", "Prototype developed", "In development", "Testing and fine-tuning", "Pilot preparation", "Developed", "Launched"];
export const IDEA_STAGES = ["Concept", "Research", "Experimental", "Planned", "In development", "Implemented"];
export const PROJECT_BADGES = ["Prototype", "In development", "Fine-tuning", "Seeking deployment", "Completed"];
