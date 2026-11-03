import { Link, useParams } from "react-router-dom";
import { Cover, Empty, Loading, RichText } from "../components/ui";
import { fmtDate, useData, usePageMeta } from "../hooks/hooks";
import type { Update } from "../types";

export default function UpdateDetail() {
  const { slug = "" } = useParams();
  const { data, loading, error } = useData<Update>(`/api/public/updates/${encodeURIComponent(slug)}`);
  usePageMeta(data?.title ?? "Update", data?.summary);
  if (loading) return <div className="container"><Loading /></div>;
  if (error || !data) return <div className="container"><Empty title="Update not found" text="It may have been unpublished." /><Link className="text-link" to="/updates">Back to all updates</Link></div>;
  return (
    <article className="container article">
      <Link className="text-link" to="/updates">All updates</Link>
      <p className="muted">{data.category} · <time dateTime={data.published_at ?? ""}>{fmtDate(data.published_at)}</time>{data.author && ` · By ${data.author}`}</p>
      <h1>{data.title}</h1>
      {data.summary && <p className="lead">{data.summary}</p>}
      {data.cover_image && <Cover src={data.cover_image} alt={`Cover for ${data.title}`} className="article-cover" />}
      <RichText text={data.content} />
    </article>
  );
}
