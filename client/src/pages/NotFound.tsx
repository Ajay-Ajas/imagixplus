import { Link } from "react-router-dom";
import { PageHero } from "../components/ui";
import { usePageMeta } from "../hooks/hooks";

export default function NotFound() {
  usePageMeta("Page not found");
  return (<><PageHero title="Page not found" intro="That page does not exist or has moved." /><div className="container"><Link className="btn btn-primary" to="/">Back to home</Link></div></>);
}
