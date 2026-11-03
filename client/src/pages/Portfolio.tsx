import { useMemo, useState } from "react";
import { PortfolioCard, PortfolioModal } from "../components/cards";
import { Empty, Loading, PageHero } from "../components/ui";
import { useData, usePageMeta } from "../hooks/hooks";
import type { PortfolioItem } from "../types";

export default function Portfolio() {
  usePageMeta("Portfolio", "Developed projects, working prototypes, ongoing projects and experiments from ImagixPlus.");
  const { data, loading, error } = useData<PortfolioItem[]>("/api/public/portfolio");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<PortfolioItem | null>(null);
  const cats = useMemo(() => ["All", ...Array.from(new Set((data ?? []).map((i) => i.category).filter(Boolean)))], [data]);
  const shown = (data ?? []).filter((i) => cat === "All" || i.category === cat);
  return (
    <>
      <PageHero title="Portfolio" intro="Developed projects, working prototypes, ongoing work and experiments." />
      <div className="container">
        {cats.length > 2 && <div className="filters" role="group" aria-label="Filter by category">{cats.map((c) => <button key={c} className={c === cat ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div>}
        {loading ? <Loading /> : error ? <Empty title="Could not load portfolio" text={error} /> : shown.length ? <div className="portfolio-grid">{shown.map((i) => <PortfolioCard key={i.id} item={i} onOpen={setOpen} />)}</div> : <Empty title="No portfolio entries yet" />}
      </div>
      {open && <PortfolioModal item={open} onClose={() => setOpen(null)} />}
    </>
  );
}
