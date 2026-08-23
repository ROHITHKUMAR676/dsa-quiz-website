import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, Flame, Award } from "lucide-react";
import type { LeaderboardEntry } from "../../types";
import { cn } from "../../lib/utils";
import BadgePill from "../ui/BadgePill";

export default function LeaderboardRow({ entry, highlight, index = 0 }: { entry: LeaderboardEntry; highlight?: boolean; index?: number }) {
  const delta = entry.previousRank - entry.rank;
  const DeltaIcon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const deltaColor = delta > 0 ? "text-state-success" : delta < 0 ? "text-state-danger" : "text-ink-faint";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ delay: Math.min(index * 0.045, 0.32), type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 rounded-xl2 border transition-colors will-change-transform",
        highlight
          ? "bg-neon-blue/10 border-neon-blue/40 shadow-glow"
          : "bg-surface/40 border-surface-border hover:border-neon-blue/20"
      )}
    >
      <div className="w-8 flex flex-col items-center shrink-0">
        <span className="font-mono font-bold text-ink text-sm">{entry.rank}</span>
        <span className={cn("flex items-center text-[10px]", deltaColor)}>
          <DeltaIcon className="w-2.5 h-2.5" />
        </span>
      </div>
      <img src={entry.avatar} alt={entry.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-surface-border shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-ink font-medium text-sm truncate">{entry.name}</p>
        <p className="text-ink-faint text-xs truncate">{entry.department}</p>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-ink-dim text-xs">
        <Flame className="w-3.5 h-3.5 text-state-warning" /> {entry.streak}
      </div>
      <div className="hidden md:flex items-center gap-1 text-ink-dim text-xs">
        <Award className="w-3.5 h-3.5 text-neon-purple" /> {entry.badges}
      </div>
      <BadgePill variant="blue" className="hidden xs:inline-flex shrink-0">{entry.tier}</BadgePill>
      <div className="text-right shrink-0 w-16 sm:w-20">
        <p className="font-mono font-semibold text-ink text-sm">{entry.points.toLocaleString()}</p>
        <p className="text-ink-faint text-[10px]">points</p>
      </div>
    </motion.div>
  );
}
