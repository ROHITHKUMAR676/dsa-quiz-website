import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import BrandMark from "../components/brand/BrandMark";
import PacReveal from "../components/pixel/PacReveal";
import PixelSprite, { type PixelKind } from "../components/pixel/PixelSprite";

const codeSnippets = [
  "const solve = (n) =>",
  "if (root === null)",
  "O(log n)",
  "while (left <= right)",
  "return dp[n][k]",
  "<div className=",
  "for i in range(n):",
  "git commit -m",
];

const sprites: { kind: PixelKind; left: string; top: string; delay: number }[] = [
  { kind: "tree", left: "6%", top: "12%", delay: 0 },
  { kind: "stack", left: "84%", top: "14%", delay: 0.4 },
  { kind: "graph", left: "10%", top: "70%", delay: 0.8 },
  { kind: "list", left: "66%", top: "76%", delay: 1.2 },
  { kind: "queue", left: "78%", top: "46%", delay: 0.6 },
  { kind: "array", left: "18%", top: "44%", delay: 1 },
];

export default function Splash() {
  const navigate = useNavigate();
  const { markSplashSeen } = useApp();
  const [phase, setPhase] = useState<"logo" | "zoom">("logo");
  const [ready, setReady] = useState(false);

  // Safety net: if the logo is slow or fails to load, start anyway after 2s
  useEffect(() => {
    const fallback = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(fallback);
  }, []);

  // Timers only start once the logo is ready
  useEffect(() => {
    if (!ready) return;
    const zoomTimer = setTimeout(() => setPhase("zoom"), 3000);
    const navigationTimer = setTimeout(() => {
      markSplashSeen();
      navigate("/login");
    }, 3900);
    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(navigationTimer);
    };
  }, [ready]);

  return (
    <div className="fixed inset-0 bg-void-100 overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-glow" />

      {/* Floating code snippets */}
      {codeSnippets.map((code, i) => (
        <motion.span
          key={code}
          className="absolute font-mono text-xs sm:text-sm text-neon-blue/25 select-none whitespace-nowrap"
          style={{ left: `${(i * 37) % 90}%`, top: `${(i * 53) % 90}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
        >
          {code}
        </motion.span>
      ))}

      {/* Pixel DSA sprites that pop in, one by one */}
      {sprites.map((s) => (
        <motion.div
          key={s.kind}
          className="absolute opacity-50 hidden sm:block"
          style={{ left: s.left, top: s.top }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.3 + s.delay, duration: 0.2, ease: "linear" }}
        >
          <PixelSprite kind={s.kind} size={4} bob />
        </motion.div>
      ))}


      {/* Logo: pops in once loaded, then zooms out */}
      <motion.div
        animate={phase === "zoom" ? { scale: 8, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeIn" }}
        className="relative z-10 flex flex-col items-center px-4"
      >
        <div className="w-[min(78vw,420px)] drop-shadow-[0_0_32px_rgba(108,144,198,0.22)]">
          <PacReveal play={ready}>
            <BrandMark className="w-full" onLoad={() => setReady(true)} />
          </PacReveal>
        </div>
      </motion.div>
    </div>
  );
}
