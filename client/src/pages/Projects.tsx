import { ProjectRow } from "../components/cards";
import { Empty, Loading, PageHero } from "../components/ui";
import { useData, usePageMeta } from "../hooks/hooks";
import type { Project } from "../types";

export default function Projects() {
  usePageMeta("Projects", "ImagixPlus projects with honest development status, including CivicMind AI, our flagship product.");
  const { data, loading, error } = useData<Project[]>("/api/public/projects");
  return (
    <>
      <PageHero title="Projects" intro="What we are building, and exactly how far along each project is." />
      <div className="container project-list">
        {loading ? <Loading /> : error ? <Empty title="Could not load projects" text={error} /> : data?.length ? data.map((p) => <ProjectRow key={p.id} project={p} expanded />) : <Empty title="No projects published yet" />}
      </div>
    </>
  );
}
