import { Check } from "../pixel/PixelLucide";
import { cn } from "../../lib/utils";

export function ThemeSwatch({
  active,
  label,
  sublabel,
  previewBg,
  previewAccent,
  onClick,
}: {
  active: boolean;
  label: string;
  sublabel: string;
  previewBg: string;
  previewAccent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex-1 rounded-xl2 border-2 p-3 text-left transition-colors",
        active ? "border-neon-blue shadow-glow" : "border-surface-border hover:border-neon-blue/40"
      )}
    >
      {active && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-neon-blue flex items-center justify-center z-10">
          <Check className="w-3 h-3 text-white" />
        </span>
      )}
      <div
        className="h-14 rounded-lg mb-2 flex items-end p-2 gap-1"
        style={{ background: previewBg, border: "1px solid rgba(128,128,128,0.2)" }}
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: previewAccent }} />
        <span className="h-2 w-8 rounded-full opacity-60" style={{ background: previewAccent }} />
      </div>
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-ink-faint">{sublabel}</p>
    </button>
  );
}