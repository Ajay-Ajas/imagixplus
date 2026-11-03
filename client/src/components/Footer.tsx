import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { NAV } from "./Header";
import { useSettings } from "../hooks/hooks";

export function Footer() {
  const { contact } = useSettings();
  const email = contact.email || "contact@civicmindai.in";
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="footer-lead">Moving Towards the Future.</p>
          <p className="footer-note">IMAGIX+ is an innovation-focused technology and startup brand building intelligent products. <a href="https://civicmindai.in" target="_blank" rel="noopener noreferrer">CivicMind AI</a> is developed by IMAGIX+.</p>
        </div>
        <nav aria-label="Footer">
          <h4>Explore</h4>
          {NAV.map((n) => <Link key={n.to} to={n.to}>{n.label}</Link>)}
          <Link to="/ideas">Ideas &amp; Innovations</Link>
          <Link to="/updates">Latest Updates</Link>
        </nav>
        <div className="footer-contact">
          <h4>Contact</h4>
          <a href={`mailto:${email}`}>{email}</a>
          {contact.phone && <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>}
          {contact.socials.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>)}
        </div>
      </div>
      <div className="container footer-base">© {new Date().getFullYear()} IMAGIX+ (ImagixPlus). All rights reserved.</div>
    </footer>
  );
}
