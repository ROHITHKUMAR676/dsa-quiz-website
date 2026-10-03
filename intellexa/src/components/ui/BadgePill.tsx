import { cn } from "../../lib/utils";

interface BadgePillProps {
  children: React.ReactNode;
  variant?: "blue" | "purple" | "cyan" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

const variants: Record<string, string> = {
  blue: "bg-neon-blue/25 text-neon-blue border-neon-blue",
  purple: "bg-neon-purple/25 text-neon-purple border-neon-purple",
  cyan: "bg-neon-cyan/25 text-neon-cyan border-neon-cyan",
  success: "bg-state-success/25 text-state-success border-state-success",
  warning: "bg-state-warning/25 text-state-warning border-state-warning",
  danger: "bg-state-danger/25 text-state-danger border-state-danger",
  neutral: "bg-surface-light text-ink-dim border-surface-border",
};

export default function BadgePill({ children, variant = "neutral", size = "sm", className }: BadgePillProps) {
  return (
    <span
      className={cn(
        "badge-pixel inline-flex items-center gap-1 rounded-sm border-2 font-semibold uppercase tracking-wider",
        variants[variant],
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {children}
    </span>
  );
}
