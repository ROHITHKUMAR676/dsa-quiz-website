import { cn } from "../../lib/utils";

interface BadgePillProps {
  children: React.ReactNode;
  variant?: "blue" | "purple" | "cyan" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

const variants: Record<string, string> = {
  blue: "bg-neon-blue/15 text-neon-blue border-neon-blue/30",
  purple: "bg-neon-purple/15 text-neon-purple border-neon-purple/30",
  cyan: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30",
  success: "bg-state-success/15 text-state-success border-state-success/30",
  warning: "bg-state-warning/15 text-state-warning border-state-warning/30",
  danger: "bg-state-danger/15 text-state-danger border-state-danger/30",
  neutral: "bg-surface-light text-ink-dim border-surface-border",
};

export default function BadgePill({ children, variant = "neutral", size = "sm", className }: BadgePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        variants[variant],
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      {children}
    </span>
  );
}
