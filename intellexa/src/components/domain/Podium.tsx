import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import type { LeaderboardEntry } from "../../types";
import { cn } from "../../lib/utils";

const podiumStyle = {
  1: { height: "h-40 sm:h-48", ring: "ring-state-gold", crownColor: "text-state-gold", order: "order-2", glow: "shadow-glow" },
  2: { height: "h-32 sm:h-36", ring: "ring-state-silver", crownColor: "text-state-silver", order: "order-1", glow: "" },
  3: { height: "h-28 sm:h-32", ring: "ring-state-bronze", crownColor: "text-state-bronze", order: "order-3", glow: "" },
};

export default function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex items-end justify-center gap-3 sm:gap-6 mb-8 px-2"
    >
      {top3.map((entry, i) => {
        const rank = entry.rank as 1 | 2 | 3;
        const style = podiumStyle[rank];
        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 42, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -4 }}
            transition={{ delay: i * 0.15, type: "spring", stiffness: 200, damping: 18 }}
            className={cn("flex flex-col items-center", style.order)}
          >
            <div className="relative mb-2">
              {rank === 1 && (
                <Crown className={cn("w-6 h-6 absolute -top-6 left-1/2 -translate-x-1/2 animate-float", style.crownColor)} fill="currentColor" />
              )}
              <img
                src={entry.avatar}
                alt={entry.name}
                className={cn("w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-4 object-cover", style.ring)}
              />
            </div>
            <p className="text-ink font-medium text-xs sm:text-sm text-center max-w-[80px] sm:max-w-[100px] truncate">{entry.name}</p>
            <p className="font-mono text-neon-cyan text-xs mb-2">{entry.points.toLocaleString()} pts</p>
            <div
              className={cn(
                "w-20 sm:w-28 rounded-t-xl2 glass-strong flex items-start justify-center pt-2 relative overflow-hidden",
                style.height,
                style.glow
              )}
            >
              <div className="absolute inset-0 bg-aurora-soft opacity-40" />
              <span className="relative font-display font-bold text-2xl sm:text-3xl text-ink">{rank}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
