import { motion } from "framer-motion";
import { CheckCircle2, Clock3 } from "../pixel/PixelLucide";
import type { BackendDailyLeaderboardEntry } from "../../lib/backend";
import { cn } from "../../lib/utils";
import { resolveApiAsset } from "../../lib/api";

function avatarFor(entry: BackendDailyLeaderboardEntry) {
  return resolveApiAsset(entry.avatar) ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(entry.fullName)}&backgroundColor=1A2038`;
}

function formatCompletionTime(ms: number | null) {
  if (ms === null) return "--";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function DailyLeaderboardRow({
  entry,
  highlight,
  index = 0,
}: {
  entry: BackendDailyLeaderboardEntry;
  highlight?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 rounded-xl2 border transition-colors",
        highlight ? "bg-neon-blue/10 border-neon-blue/40 shadow-glow" : "bg-surface/40 border-surface-border"
      )}
    >
      <span className="w-7 text-center font-mono font-bold text-ink text-sm shrink-0">{entry.rank}</span>
      <img src={avatarFor(entry)} alt={entry.fullName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-surface-border shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-ink font-medium text-sm truncate">{entry.fullName}</p>
        <p className="text-ink-faint text-xs truncate">{entry.department ?? "—"}</p>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-ink-dim text-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-state-success" /> {entry.correctAnswers}
      </div>
      <div className="hidden md:flex items-center gap-1 text-ink-dim text-xs">
        <Clock3 className="w-3.5 h-3.5 text-neon-purple" /> {formatCompletionTime(entry.completionTimeMs)}
      </div>
      <div className="text-right shrink-0 w-16 sm:w-20">
        <p className="font-mono font-semibold text-ink text-sm">{entry.score.toLocaleString()}</p>
        <p className="text-ink-faint text-[10px]">points</p>
      </div>
    </motion.div>
  );
}
