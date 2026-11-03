import { query } from "./db.js";

/** Seeds content taken only from the project brief. Runs once; admins own the content afterwards. */
export async function seedIfNeeded() {
  const done = await query("select 1 from site_settings where key = '__seeded'");
  if (done.rowCount) return;

  const projects = [
    {
      name: "AI Powered House Monitoring", slug: "ai-house-monitoring", sort: 1, category: "Smart monitoring",
      short: "An intelligent house-monitoring concept exploring AI-assisted monitoring, automation and smart-home capabilities.",
      status: "Prototype developed", label: "Prototype Developed · Under Development", badges: ["Prototype", "In development"], flagship: false
    },
    {
      name: "AI Powered Non-Intrusive Electrical Device Monitoring", slug: "ai-electrical-device-monitoring", sort: 2, category: "Smart monitoring",
      short: "An AI-powered electrical monitoring solution designed to monitor electrical behaviour without invasive modifications and identify abnormal device operation.",
      status: "Prototype developed", label: "Prototype Developed · Under Development", badges: ["Prototype", "In development"], flagship: false
    },
    {
      name: "CivicMind AI — Government Civic Complaint Management Platform", slug: "civicmind-ai", sort: 0, category: "Civic technology",
      short: "Our flagship product: an AI-powered platform for civic complaint management, developed by ImagixPlus.",
      status: "Developed", label: "Currently Developed · Under Fine-Tuning · Seeking Deployment", badges: ["Fine-tuning", "Seeking deployment"], flagship: true
    }
  ];
  for (const p of projects) {
    const caps = p.flagship
      ? ["Civic issue reporting", "AI-powered complaint classification", "Priority prediction", "Image-based civic issue detection", "Location-based reporting", "Complaint management and tracking"]
      : [];
    const plans = p.flagship
      ? ["Local village panchayat pilot", "Real-world testing", "User feedback", "Improvements based on pilot results", "Future expansion to other local authorities"]
      : [];
    const desc = p.flagship
      ? "CivicMind AI is our flagship product. It aims to help citizens report civic problems and enables local authorities to manage, classify and prioritize complaints using AI. It is developed by ImagixPlus."
      : p.short;
    await query(
      `insert into projects (name, slug, short_description, description, status, status_label, badges, category, capabilities, future_plans, url, url_label, is_flagship, featured, published, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,$15)`,
      [p.name, p.slug, p.short, desc, p.status, p.label, p.badges, p.category, caps, plans,
        p.flagship ? "https://civicmindai.in" : "", p.flagship ? "Explore CivicMind AI" : "", p.flagship, true, p.sort]
    );
    await query(
      `insert into portfolio (name, description, status, category, url, published, sort_order)
       values ($1,$2,$3,$4,$5,true,$6)`,
      [p.name, desc, p.status, p.flagship ? "Product" : "Prototype", p.flagship ? "https://civicmindai.in" : "", p.sort]
    );
  }

  const ideas = [
    ["Smart monitoring systems", "A research direction exploring how AI can understand the state of a space or a device from simple sensors and signals.", "Research direction", "Concept"],
    ["Intelligent automation", "A research direction exploring automation that adapts to context instead of following fixed rules.", "Research direction", "Concept"],
    ["Civic technology beyond complaints", "A proposed direction exploring how the ideas behind CivicMind AI could support other local-authority workflows.", "Future concept", "Concept"]
  ];
  for (let i = 0; i < ideas.length; i++) {
    await query("insert into ideas (title, description, category, stage, published, sort_order) values ($1,$2,$3,$4,true,$5)", [...ideas[i], i]);
  }
  await query("insert into site_settings (key, value) values ('__seeded', 'true')");
  console.log("Seeded starter content from the project brief.");
}
