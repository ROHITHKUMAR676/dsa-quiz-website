import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="absolute inset-0 bg-void-100/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={`relative glass-strong w-full ${maxWidth} rounded-t-2xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border sticky top-0 bg-surface/90 backdrop-blur-xl z-10">
              <h3 className="font-display font-semibold text-lg text-ink">{title}</h3>
              <button onClick={onClose} className="text-ink-faint hover:text-ink p-1 rounded-lg hover:bg-surface-light">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
