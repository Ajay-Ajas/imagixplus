import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { LogoImage } from "./Logo";
import { useReducedMotionPref, useSettings } from "../hooks/hooks";

const KEY = "imx-intro-session";
export function shouldShowIntro() {
  if (window.location.pathname.startsWith("/admin")) return false;
  try {
    return !sessionStorage.getItem(KEY);
  } catch { return true; }
}

const ease = [0.22, 1, 0.36, 1] as const;

export function Intro({ onDone }: { onDone: () => void }) {
  const os = useReducedMotion();
  const { reduced: pref } = useReducedMotionPref();
  const reduce = !!os || pref;
  const { home } = useSettings();
  const finish = () => {
    try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    onDone();
  };
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(finish, reduce ? 1800 : 12000);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter") finish(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.clearTimeout(t); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div className="intro" role="dialog" aria-label="IMAGIX+ introduction" exit={{ opacity: 0 }} transition={{ duration: 1 }}>
      {!reduce && (
        <div className="intro-lines" aria-hidden="true">
          <motion.i className="il-h" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 2.8, ease }} />
          <motion.i className="il-v" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.1, duration: 2.8, ease }} />
          <motion.span className="il-plus" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 2.4] }} transition={{ delay: 0.5, duration: 4.2, times: [0, 0.25, 0.6, 1], ease: "easeOut" }} />
        </div>
      )}
      <motion.div className="intro-logo"
        initial={reduce ? false : { opacity: 0, scale: 0.95, filter: "brightness(0.2) blur(12px)" }}
        animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
        transition={{ delay: reduce ? 0 : 2.8, duration: reduce ? 0 : 2.8, ease }}>
        <LogoImage />
        {!reduce && <motion.span className="intro-sweep" initial={{ x: "-120%" }} animate={{ x: "320%" }} transition={{ delay: 6.2, duration: 2.1, ease: "easeInOut" }} />}
      </motion.div>
      <motion.p className="intro-tagline"
        initial={{ opacity: 0, letterSpacing: reduce ? "0.18em" : "0.4em" }} animate={{ opacity: 1, letterSpacing: "0.18em" }}
        transition={{ delay: reduce ? 0 : 7.4, duration: reduce ? 0 : 2.0, ease }}>
        {home.tagline.replace(/\.$/, "")}
      </motion.p>
      <button className="intro-skip" onClick={finish} aria-label="Skip IMAGIX+ introduction">Skip intro <span aria-hidden="true">→</span></button>
    </motion.div>
  );
}
