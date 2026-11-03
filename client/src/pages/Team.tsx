import { useMemo, useState } from "react";
import { PersonCard } from "../components/cards";
import { Empty, Loading, PageHero } from "../components/ui";
import { useData, usePageMeta } from "../hooks/hooks";
import type { Person } from "../types";

export default function Team() {
  usePageMeta("Our Team", "Meet the four main founders of IMAGIX+ and the people building with them.");
  const founders = useData<Person[]>("/api/public/founders");
  const team = useData<Person[]>("/api/public/team");
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...Array.from(new Set((team.data ?? []).map((p) => p.category).filter(Boolean)))], [team.data]);
  const shown = (team.data ?? []).filter((p) => cat === "All" || p.category === cat);
  return (
    <>
      <PageHero title="The people of IMAGIX+" intro="Four founders started IMAGIX+. They are joined by a growing team." />
      <section className="container team-section" aria-labelledby="founders-h">
        <h2 id="founders-h">Main Founders</h2>
        {founders.loading ? <Loading /> : founders.error ? <Empty title="Could not load the founders" text={founders.error} /> : (
          <div className="person-grid large">{founders.data?.map((p) => <PersonCard key={p.id} person={p} large />)}</div>
        )}
      </section>
      <section className="container team-section" aria-labelledby="team-h">
        <h2 id="team-h">Team</h2>
        {cats.length > 2 && <div className="filters" role="group" aria-label="Filter by category">{cats.map((c) => <button key={c} className={c === cat ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div>}
        {team.loading ? <Loading /> : team.error ? <Empty title="Could not load the team" text={team.error} /> : shown.length ? (
          <div className="person-grid">{shown.map((p) => <PersonCard key={p.id} person={p} />)}</div>
        ) : <Empty title="The team is growing" text="New members will be introduced here as they join IMAGIX+." />}
      </section>
    </>
  );
}
