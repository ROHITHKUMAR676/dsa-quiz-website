import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import BrandMark from "../components/brand/BrandMark";

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
  const [phase, setPhase] = useState<"logo" | "zoom">("logo");

  useEffect(() => {
    const zoomTimer = setTimeout(() => setPhase("zoom"), 3000);
    const navigationTimer = setTimeout(() => {
      markSplashSeen();
      navigate("/login");
    }, 3900);
    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(navigationTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-void-100 overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-glow" />
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

      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <motion.line x1="10%" y1="20%" x2="45%" y2="55%" stroke="#6c90c6" strokeWidth="1"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.2 }} />
        <motion.line x1="90%" y1="15%" x2="55%" y2="50%" stroke="#8778ED" strokeWidth="1"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.5 }} />
        <motion.line x1="15%" y1="85%" x2="50%" y2="55%" stroke="#568CB3" strokeWidth="1"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.8 }} />
      </svg>

      <motion.div
        animate={phase === "zoom" ? { scale: 8, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeIn" }}
        className="relative z-10 flex flex-col items-center px-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "backOut" }}
          className="w-[min(78vw,420px)] drop-shadow-[0_0_32px_rgba(108,144,198,0.22)]"
        >
          <BrandMark className="w-full" />
        </motion.div>
      </motion.div>
    </div>
  );
}
