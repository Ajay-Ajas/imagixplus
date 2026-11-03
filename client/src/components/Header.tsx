import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { useReducedMotionPref, useTheme } from "../hooks/hooks";

export const NAV = [
  { to: "/", label: "Home" }, { to: "/about", label: "About Us" }, { to: "/projects", label: "Projects" },
  { to: "/portfolio", label: "Portfolio" }, { to: "/team", label: "Team" }, { to: "/contact", label: "Contact" }
];

export function MotionToggle() {
  const { reduced, toggle } = useReducedMotionPref();
  return (
    <button className={`icon-btn ${reduced ? "on" : ""}`} onClick={toggle} aria-pressed={reduced} aria-label="Reduce motion" title={reduced ? "Animations reduced. Click to restore" : "Reduce animations"}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 12h4l3-8 4 16 3-8h4" />{reduced && <path d="M3 21L21 3" />}
      </svg>
    </button>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title="Toggle theme">
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>
      )}
    </button>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <div className="header-inner container-wide">
        <Logo />
        <nav className={`main-nav ${open ? "open" : ""}`} aria-label="Main">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.to === "/"}>{n.label}</NavLink>)}
        </nav>
        <div className="header-actions">
          <MotionToggle />
          <ThemeToggle />
          <button className="icon-btn menu-btn" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
