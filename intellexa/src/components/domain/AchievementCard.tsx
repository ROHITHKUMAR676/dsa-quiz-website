import { motion } from "framer-motion";
import { Lock } from "../pixel/PixelLucide";
import type { Badge } from "../../types";
import { cn } from "../../lib/utils";
import PixelIcon, { type PixelIconName } from "../pixel/PixelIcon";

const ICON_NAMES: PixelIconName[] = ["trophy", "moon", "sunrise", "bug", "brain", "swords", "code", "flame"];

const rarityStyle: Record<Badge["rarity"], { card: string; frame: string; label: string }> = {
  common: { card: "border-ink-faint", frame: "bg-ink-faint/50", label: "text-ink-dim" },
  rare: { card: "border-neon-blue", frame: "bg-neon-blue/60", label: "text-neon-blue" },
  epic: { card: "border-neon-purple", frame: "bg-neon-purple/60", label: "text-neon-purple" },
  legendary: { card: "border-state-gold", frame: "bg-state-gold/70", label: "text-state-gold" },
};

export default function AchievementCard({ badge }: { badge: Badge }) {
  const icon = (ICON_NAMES as string[]).includes(badge.icon) ? (badge.icon as PixelIconName) : "trophy";
  const r = rarityStyle[badge.rarity];
  const shiny = badge.earned && (badge.rarity === "epic" || badge.rarity === "legendary");
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.08 }}
      className={cn(
        "badge-pixel flex flex-col items-center text-center p-3 rounded-sm border-2 bg-surface-light relative",
        badge.earned ? r.card : "border-dashed border-surface-border grayscale opacity-70"
      )}
    >
      {shiny && (
        <>
          <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-white animate-pixel-twinkle" />
          <span className="absolute top-4 right-2 w-1 h-1 bg-white animate-pixel-twinkle [animation-delay:0.6s]" />
          <span className="absolute bottom-6 left-2 w-1 h-1 bg-white animate-pixel-twinkle [animation-delay:0.3s]" />
        </>
      )}
      {!badge.earned && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3.5 h-3.5 text-ink-faint" />
        </div>
      )}
      <p className={cn("text-[9px] font-bold uppercase tracking-widest mb-2", badge.earned ? r.label : "text-ink-faint")}>
        {badge.earned ? badge.rarity : "Locked"}
      </p>
      <div
        className={cn(
          "w-14 h-14 rounded-sm border-2 flex items-center justify-center mb-2 bg-[#161925] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.07),inset_0_-4px_0_0_rgba(0,0,0,0.35)]",
          badge.earned ? r.card : "border-surface-border"
        )}
      >
        <PixelIcon name={icon} scale={3} className={badge.earned ? "" : "brightness-50 opacity-70"} />
      </div>
      <p className="text-xs font-semibold text-ink">{badge.name}</p>
      <p className="text-[10px] text-ink-faint mt-0.5 line-clamp-2">{badge.description}</p>
    </motion.div>
  );
}
