import { motion, useReducedMotion } from "framer-motion";
import Logo from "./ui/Logo";

// Shown for a moment while the app checks the visitor's session. Calm and on-brand: no counters or fake progress.
const LoadingPage = () => {
  const reduce = useReducedMotion();

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream text-gold-800">
      <Logo className="w-24" label="Venure" />
      <p className="mt-6 font-display text-tagline font-light italic">Preparing your venues</p>
      <span aria-hidden="true" className="mt-8 block h-px w-44 overflow-hidden bg-line">
        <motion.span
          className="block h-full w-1/3 bg-gold"
          initial={{ x: reduce ? "100%" : "-100%" }}
          animate={reduce ? undefined : { x: "300%" }}
          transition={reduce ? undefined : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default LoadingPage;
