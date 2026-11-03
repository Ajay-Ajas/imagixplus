import { useMemo, useState } from "react";
import { UpdateCard } from "../components/cards";
import { Empty, Loading, PageHero } from "../components/ui";
import { useData, usePageMeta } from "../hooks/hooks";
import type { Update } from "../types";

export default function Updates() {
  usePageMeta("Latest Updates", "News and progress updates from ImagixPlus and CivicMind AI.");
  const { data, loading, error } = useData<Update[]>("/api/public/updates");
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...Array.from(new Set((data ?? []).map((u) => u.category).filter(Boolean)))], [data]);
  const all = data ?? [];
  const featured = all.find((u) => u.featured);
  const rest = all.filter((u) => u !== featured && (cat === "All" || u.category === cat));
  const showFeatured = featured && (cat === "All" || featured.category === cat);
  return (
    <>
      <PageHero title="Latest Updates" intro="Announcements and progress from ImagixPlus: prototypes, testing, launches and what we are exploring next." />
      <div className="container">
        {cats.length > 2 && <div className="filters" role="group" aria-label="Filter by category">{cats.map((c) => <button key={c} className={c === cat ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div>}
        {loading ? <Loading /> : error ? <Empty title="Could not load updates" text={error} /> : !all.length ? <Empty title="No updates published yet" text="Check back soon for news about our projects." /> : (
          <>
            {showFeatured && <div className="featured-update"><UpdateCard update={featured} large /></div>}
            {rest.length ? <div className="card-grid">{rest.map((u) => <UpdateCard key={u.id} update={u} />)}</div> : !showFeatured && <Empty title="Nothing in this category yet" />}
          </>
        )}
      </div>
    </>
  );
}
