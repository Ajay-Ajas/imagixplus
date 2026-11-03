import { useMemo, useState } from "react";
import { IdeaCard } from "../components/cards";
import { Empty, Loading, PageHero } from "../components/ui";
import { useData, usePageMeta } from "../hooks/hooks";
import type { Idea } from "../types";

export default function Ideas() {
  usePageMeta("Ideas & Innovations", "Explore ImagixPlus ideas, concepts, research directions and future innovations.");
  const { data, loading, error } = useData<Idea[]>("/api/public/ideas");
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...Array.from(new Set((data ?? []).map((i) => i.category).filter(Boolean)))], [data]);
  const shown = (data ?? []).filter((i) => cat === "All" || i.category === cat);
  return (
    <>
      <PageHero title="Ideas & Innovations" intro="Current ideas, experimental concepts, research interests and future product concepts. Every card says whether it is a proposed idea or an implemented product." />
      <div className="container">
        {cats.length > 2 && <div className="filters" role="group" aria-label="Filter by category">{cats.map((c) => <button key={c} className={c === cat ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div>}
        {loading ? <Loading /> : error ? <Empty title="Could not load ideas" text={error} /> : shown.length ? <div className="card-grid">{shown.map((i) => <IdeaCard key={i.id} idea={i} />)}</div> : <Empty title="No ideas published yet" />}
      </div>
    </>
  );
}
