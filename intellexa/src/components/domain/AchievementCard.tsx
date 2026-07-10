import { motion } from "framer-motion";
import { Trophy, Moon, Sunrise, Bug, Brain, Swords, Code, Flame, Lock, type LucideIcon } from "lucide-react";
import type { Badge } from "../../types";
import { cn } from "../../lib/utils";

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  moon: Moon,
  sunrise: Sunrise,
  bug: Bug,
  brain: Brain,
  swords: Swords,
  code: Code,
  flame: Flame,
};

const rarityStyle: Record<Badge["rarity"], string> = {
  common: "from-ink-faint/30 to-ink-faint/10 border-ink-faint/30",
  rare: "from-neon-blue/40 to-neon-blue/10 border-neon-blue/40",
  epic: "from-neon-purple/40 to-neon-purple/10 border-neon-purple/40",
  legendary: "from-state-gold/50 to-state-warning/10 border-state-gold/50",
};

export default function AchievementCard({ badge }: { badge: Badge }) {
  const Icon = iconMap[badge.icon] ?? Trophy;
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      className={cn(
        "flex flex-col items-center text-center p-4 rounded-xl2 border bg-gradient-to-b relative",
        badge.earned ? rarityStyle[badge.rarity] : "from-surface-light/40 to-surface/20 border-surface-border opacity-60"
      )}
    >
      {!badge.earned && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3.5 h-3.5 text-ink-faint" />
        </div>
      )}
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-2", badge.earned ? "bg-white/10" : "bg-surface-light")}>
        <Icon className={cn("w-6 h-6", badge.earned ? "text-ink" : "text-ink-faint")} />
      </div>
      <p className="text-xs font-medium text-ink">{badge.name}</p>
      <p className="text-[10px] text-ink-faint mt-0.5 line-clamp-2">{badge.description}</p>
    </motion.div>
  );
}
