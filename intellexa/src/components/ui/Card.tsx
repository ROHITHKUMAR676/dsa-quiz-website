import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  hover?: boolean;
  glow?: "blue" | "purple" | "cyan" | "none";
}

export default function Card({ children, className, hover = false, glow = "none", ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } } : undefined}
      className={cn(
        "glass rounded-xl2 shadow-card relative overflow-hidden",
        hover && "cursor-pointer transition-shadow hover:border-neon-blue/40",
        glow === "blue" && "hover:shadow-glow",
        glow === "purple" && "hover:shadow-glow-purple",
        glow === "cyan" && "hover:shadow-glow-cyan",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
