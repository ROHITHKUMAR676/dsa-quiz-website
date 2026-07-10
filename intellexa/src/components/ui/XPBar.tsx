import { motion } from "framer-motion";

interface XPBarProps {
  xp: number;
  xpToNext: number;
  level: number;
}

export default function XPBar({ xp, xpToNext, level }: XPBarProps) {
  const pct = Math.min(100, (xp / xpToNext) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5 text-xs">
        <span className="text-ink-dim font-mono">LVL {level}</span>
        <span className="text-ink-dim font-mono">{xp.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-light overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full bg-aurora relative"
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse-glow" />
        </motion.div>
      </div>
    </div>
  );
}
