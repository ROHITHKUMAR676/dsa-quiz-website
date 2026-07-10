import type { LucideIcon } from "lucide-react";
import Card from "./Card";
import AnimatedCounter from "./AnimatedCounter";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: "blue" | "purple" | "cyan" | "success" | "warning" | "danger";
  suffix?: string;
  trend?: string;
}

const accentMap: Record<string, string> = {
  blue: "text-neon-blue bg-neon-blue/10",
  purple: "text-neon-purple bg-neon-purple/10",
  cyan: "text-neon-cyan bg-neon-cyan/10",
  success: "text-state-success bg-state-success/10",
  warning: "text-state-warning bg-state-warning/10",
  danger: "text-state-danger bg-state-danger/10",
};

export default function StatCard({ label, value, icon: Icon, accent = "blue", suffix = "", trend }: StatCardProps) {
  return (
    <Card hover glow={accent === "danger" || accent === "warning" || accent === "success" ? "none" : (accent as any)} className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-ink-dim text-xs sm:text-sm mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-display font-semibold text-ink">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
          {trend && <p className="text-xs text-state-success mt-1">{trend}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl", accentMap[accent])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
