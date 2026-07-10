import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-14 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4 animate-float">
        <Icon className="w-7 h-7 text-neon-blue" />
      </div>
      <h3 className="font-display font-semibold text-lg text-ink mb-1">{title}</h3>
      <p className="text-ink-dim text-sm max-w-xs mb-4">{description}</p>
      {action}
    </motion.div>
  );
}
