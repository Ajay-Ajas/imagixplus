import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { api } from "../services/api";
import type { Settings } from "../types";

export function useData<T>(url: string) {
  const [state, set] = useState<{ data: T | null; loading: boolean; error: string }>({ data: null, loading: true, error: "" });
  useEffect(() => {
    let live = true;
    set((s) => ({ ...s, loading: true, error: "" }));
    api.get<T>(url)
      .then((d) => live && set({ data: d, loading: false, error: "" }))
      .catch((e: Error) => live && set({ data: null, loading: false, error: e.message }));
    return () => { live = false; };
  }, [url]);
  return state;
}

export const SettingsContext = createContext<Settings | null>(null);
export const useSettings = () => {
  const s = useContext(SettingsContext);
  if (!s) throw new Error("Settings not loaded");
  return s;
};

export function usePageMeta(title: string, description?: string) {
  const { site } = useSettings();
  useEffect(() => {
    document.title = title ? `${title} | ${site.siteName}` : site.seoTitle;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description, site]);
}

type Theme = "dark" | "light";
const resolve = (pref: string | null): Theme =>
  pref === "light" || pref === "dark" ? pref : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
export function initTheme() {
  let stored: string | null = null;
  try { stored = localStorage.getItem("imx-theme"); } catch { /* storage unavailable */ }
  const def = document.querySelector('meta[name="default-theme"]')?.getAttribute("content") ?? "dark";
  document.documentElement.dataset.theme = resolve(stored ?? (def === "system" ? null : def));
}
export function useTheme() {
  const [theme, set] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) || "dark");
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 500);
    root.dataset.theme = next;
    try { localStorage.setItem("imx-theme", next); } catch { /* ignore */ }
    set(next);
  };
  return { theme, toggle };
}
export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

/* ---- reduce-motion preference (in addition to the OS setting) ---- */
const listeners = new Set<() => void>();
const readMotion = () => document.documentElement.dataset.motion === "reduced";
export function initMotion() {
  let stored: string | null = null;
  try { stored = localStorage.getItem("imx-motion"); } catch { /* ignore */ }
  if (stored === "reduced") document.documentElement.dataset.motion = "reduced";
}
export function useReducedMotionPref() {
  const reduced = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, readMotion);
  const toggle = () => {
    const next = !readMotion();
    if (next) document.documentElement.dataset.motion = "reduced"; else delete document.documentElement.dataset.motion;
    try { localStorage.setItem("imx-motion", next ? "reduced" : "full"); } catch { /* ignore */ }
    listeners.forEach((l) => l());
  };
  return { reduced, toggle };
}
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
