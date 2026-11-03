import { AnimatePresence, MotionConfig } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Intro, shouldShowIntro } from "./components/Intro";
import { SettingsContext, useReducedMotionPref } from "./hooks/hooks";
import PublicLayout from "./layouts/PublicLayout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Ideas from "./pages/Ideas";
import NotFound from "./pages/NotFound";
import Portfolio from "./pages/Portfolio";
import Projects from "./pages/Projects";
import PersonPage from "./pages/Person";
import Team from "./pages/Team";
import UpdateDetail from "./pages/UpdateDetail";
import Updates from "./pages/Updates";
import { api } from "./services/api";
import type { Settings } from "./types";

const Admin = lazy(() => import("./admin/AdminApp"));

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [failed, setFailed] = useState(false);
  const [intro, setIntro] = useState(shouldShowIntro);
  const { reduced } = useReducedMotionPref();
  const load = () => { setFailed(false); api.get<Settings>("/api/public/settings").then(setSettings).catch(() => setFailed(true)); };
  useEffect(load, []);

  if (failed) return <div className="fatal"><p>The site could not load right now.</p><button className="btn btn-primary" onClick={load}>Try again</button></div>;
  if (!settings) return <div className="boot" />;
  return (
    <SettingsContext.Provider value={settings}>
      <MotionConfig reducedMotion={reduced ? "always" : "user"}>
        <AnimatePresence>{intro && <Intro onDone={() => setIntro(false)} />}</AnimatePresence>
        <Routes>
          <Route path="/admin/*" element={<Suspense fallback={<div className="boot" />}><Admin onSettingsChanged={load} /></Suspense>} />
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="ideas" element={<Ideas />} />
            <Route path="projects" element={<Projects />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="team" element={<Team />} />
            <Route path="team/:slug" element={<PersonPage />} />
            <Route path="updates" element={<Updates />} />
            <Route path="updates/:slug" element={<UpdateDetail />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </MotionConfig>
    </SettingsContext.Provider>
  );
}
