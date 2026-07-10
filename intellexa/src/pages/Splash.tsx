import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

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

export default function Splash() {
  const navigate = useNavigate();
  const { markSplashSeen } = useApp();
  const [phase, setPhase] = useState<"logo" | "tagline" | "zoom">("logo");
  const title = "INTELLEXA";

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("tagline"), 1400);
    const t2 = setTimeout(() => setPhase("zoom"), 3000);
    const t3 = setTimeout(() => {
      markSplashSeen();
      navigate("/login");
    }, 3900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-void-100 overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-glow" />
      {/* floating code snippets */}
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
      {/* glowing network lines */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <motion.line x1="10%" y1="20%" x2="45%" y2="55%" stroke="#4F7CFF" strokeWidth="1"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.2 }} />
        <motion.line x1="90%" y1="15%" x2="55%" y2="50%" stroke="#A855F7" strokeWidth="1"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.5 }} />
        <motion.line x1="15%" y1="85%" x2="50%" y2="55%" stroke="#22D3EE" strokeWidth="1"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.8 }} />
      </svg>

      <motion.div
        animate={phase === "zoom" ? { scale: 8, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeIn" }}
        className="relative z-10 flex flex-col items-center px-4"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "backOut" }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-aurora flex items-center justify-center mb-6 animate-pulse-glow shadow-glow"
        >
          <span className="font-display font-black text-2xl sm:text-3xl text-white">I</span>
        </motion.div>

        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-tight flex">
          {title.split("").map((letter, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.5, ease: "backOut" }}
              className="text-gradient"
            >
              {letter}
            </motion.span>
          ))}
        </h1>

        <AnimatePresence>
          {(phase === "tagline" || phase === "zoom") && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 font-mono text-ink-dim text-sm sm:text-base tracking-[0.3em]"
            >
              WEBDEV × DSA
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
