import { motion } from "framer-motion";
import { Moon, Sun } from "../pixel/PixelLucide";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../lib/utils";

export default function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
        className={cn(
          "relative p-2 rounded-xl glass hover:bg-surface-light transition-colors overflow-hidden",
          className
        )}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {isLight ? <Sun className="w-4.5 h-4.5 text-state-gold" /> : <Moon className="w-4.5 h-4.5 text-neon-cyan" />}
        </motion.div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      className={cn(
        "relative flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-dim hover:text-ink hover:bg-surface-light transition-colors",
        className
      )}
    >
      <span className="relative w-9 h-5 rounded-full bg-surface-light border border-surface-border shrink-0">
        <motion.span
          className={cn(
            "absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center",
            isLight ? "bg-ink" : "bg-ink"
          )}
          animate={{ x: isLight ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
        >
          {isLight ? <Sun className="w-2.5 h-2.5 text-void" /> : <Moon className="w-2.5 h-2.5 text-void" />}
        </motion.span>
      </span>
      {isLight ? "Paper (light) theme" : "Deep Space (dark) theme"}
    </button>
  );
}