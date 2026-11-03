import { Link } from "react-router-dom";
import { Chips, PageHero, Reveal, RichText } from "../components/ui";
import { usePageMeta, useSettings } from "../hooks/hooks";

export default function About() {
  const { about } = useSettings();
  usePageMeta("About Us", about.intro.slice(0, 160));
  const blocks: [string, string][] = [["Our story", about.story], ["Vision", about.vision], ["Mission", about.mission], ["Our approach to real-world problems", about.approach], ["Our future direction", about.futureDirection]];
  return (
    <>
      <PageHero title="About ImagixPlus" intro={about.intro} />
      <div className="container prose-layout">
        {about.image && <img className="side-img wide" src={about.image} alt="ImagixPlus" loading="lazy" />}
        {blocks.filter(([, t]) => t).map(([h, t]) => (
          <Reveal key={h}><section className="prose-block"><h2>{h}</h2><RichText text={t} /></section></Reveal>
        ))}
        {about.whatWeDevelop.length > 0 && (
          <section className="prose-block"><h2>What we develop</h2><ul className="check-list">{about.whatWeDevelop.map((x) => <li key={x}>{x}</li>)}</ul></section>
        )}
        {about.technicalInterests.length > 0 && (
          <section className="prose-block"><h2>Our technical interests</h2><Chips items={about.technicalInterests} /></section>
        )}
        {about.companyInfo && <section className="prose-block"><h2>Company information</h2><RichText text={about.companyInfo} /></section>}
        <p><Link className="text-link" to="/projects">See what we are building</Link> · <Link className="text-link" to="/team">Meet the founders</Link></p>
      </div>
    </>
  );
}
