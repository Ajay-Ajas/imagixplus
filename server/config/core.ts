import { query } from "./db.js";

const CORE = [
  { name: "Audlin Sanjay U N", slug: "audlin-sanjay-u-n" },
  { name: "ABIN K A", slug: "abin-k-a" },
  { name: "JESWIN C S", slug: "jeswin-c-s" },
  { name: "AJAY L", slug: "ajay-l" }
];

/** Runs on every start: the four main founders always exist, are core, visible and not archived. */
export async function ensureCoreFounders() {
  for (let i = 0; i < CORE.length; i++) {
    await query(
      `insert into founders (name, slug, designation, is_core, category, published, archived, sort_order)
       values ($1, $2, 'Founder', true, 'Main Founder', true, false, $3)
       on conflict (slug) do update set is_core = true, published = true, archived = false`,
      [CORE[i].name, CORE[i].slug, i]
    );
  }
}
