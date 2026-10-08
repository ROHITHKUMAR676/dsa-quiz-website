import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  children?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<string, string> = {
  primary: "bg-ink text-void border-2 border-ink shadow-pixel active:shadow-pixel-pressed hover:bg-ink-dim",
  secondary: "bg-surface-light text-ink border-2 border-surface-border hover:border-ink",
  ghost: "bg-transparent text-ink-dim hover:text-ink hover:bg-surface-light",
  danger: "bg-state-danger/15 text-state-danger border border-state-danger/30 hover:bg-state-danger/25",
  outline: "bg-transparent border-2 border-ink/60 text-ink hover:bg-ink/10",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3.5 text-base rounded-xl gap-2.5",
  icon: "p-2.5 rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ x: 2, y: 2 }}
      transition={{ duration: 0.08 }}
      className={cn(
        "relative font-display tracking-wide uppercase inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
