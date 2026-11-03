import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

export default function PublicLayout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <div className="bg-field" aria-hidden="true" />
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main key={pathname} id="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {outlet}
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  );
}
