import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, TrendingUp, Award, Flame } from "lucide-react";
import Button from "../ui/Button";
import { useApp } from "../../context/AppContext";

interface TourStep {
  /** Matches a `data-tour="..."` attribute on the real element being introduced. */
  target: string;
  icon: typeof TrendingUp;
  title: string;
  body: string;
}

const steps: TourStep[] = [
  { target: "dashboard-hero", icon: TrendingUp, title: "Your Dashboard", body: "This is home base — your level, XP, streak, and today's quiz status all in one glance." },
  { target: "live-quiz", icon: Trophy, title: "Today's Quiz", body: "Jump into the live MCQ quiz here. You get one attempt, so make it count." },
  { target: "nav-leaderboard", icon: TrendingUp, title: "Track Your Rank", body: "Watch your position shift in real time as you and your peers compete." },
  { target: "badges-section", icon: Award, title: "Earn Badges", body: "Unlock badges for streaks, speed, accuracy, and milestones as you grind." },
  { target: "nav-profile", icon: Flame, title: "Your Profile", body: "Showcase your stats, badges, and achievement timeline from here." },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measure(selector: string): Rect | null {
  // Desktop sidebar and mobile bottom-nav both render in the DOM
  // simultaneously (toggled via CSS `hidden`/`lg:flex`), so pick the first
  // match that's actually visible rather than whichever comes first in the
  // DOM - otherwise a hidden (display:none) element with a zero-size rect
  // could win and break the spotlight.
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${selector}"]`);
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    }
  }
  return null;
}

/**
 * Component-based overlay guided tour (spec section 26): the real UI
 * element is spotlighted and dimmed-around, with an explanatory card
 * anchored next to it - not a generic centered modal.
 */
export default function Tutorial() {
  const { finishTutorial } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const recompute = () => setRect(measure(step.target));

  useLayoutEffect(() => {
    const revealTarget = () => {
      const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`);
      const target = Array.from(candidates).find((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      if (!target) return false;

      const bounds = target.getBoundingClientRect();
      const safeTop = 24;
      const safeBottom = window.innerHeight - 96;
      const preferCardBelow = stepIndex === 0 || stepIndex === 1 || stepIndex === 3;
      if (preferCardBelow && bounds.top > safeTop) {
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
          inline: "nearest",
        });
      } else if (bounds.top < safeTop || bounds.bottom > safeBottom) {
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "center",
          inline: "nearest",
        });
      }
      return true;
    };

    const foundTarget = revealTarget();
    recompute();
    const retry = setTimeout(recompute, 350);
    // The live quiz target can appear after dashboard data loads.
    const observer = !foundTarget
      ? new MutationObserver(() => {
          if (revealTarget()) {
            recompute();
            observer.disconnect();
          }
        })
      : null;
    observer?.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(retry);
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, step.target]);

  useEffect(() => {
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const goNext = () => {
    if (isLast) {
      finishTutorial();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const padding = 8;
  const highlightStyle = rect
    ? {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    : null;

  // Card placement: prefer below the target, flip above if it would run
  // off the bottom of the viewport; clamp horizontally within the viewport.
  const viewportH = typeof window !== "undefined" ? (window.visualViewport?.height ?? window.innerHeight) : 800;
  const viewportW = typeof window !== "undefined" ? (window.visualViewport?.width ?? window.innerWidth) : 400;
  const cardWidth = Math.min(320, viewportW - 32);
  const preferCardBelow = stepIndex === 0 || stepIndex === 1 || stepIndex === 3;
  let cardTop = highlightStyle ? highlightStyle.top + highlightStyle.height + 16 : viewportH / 2 - 100;
  let placement: "below" | "above" = "below";
  if (highlightStyle && !preferCardBelow && cardTop + 260 > viewportH) {
    cardTop = Math.max(16, highlightStyle.top - 260 - 16);
    placement = "above";
  }
  let cardLeft = viewportW < 640
    ? (viewportW - cardWidth) / 2
    : highlightStyle
      ? highlightStyle.left + highlightStyle.width / 2 - cardWidth / 2
      : viewportW / 2 - cardWidth / 2;
  cardLeft = Math.max(16, Math.min(cardLeft, Math.max(16, viewportW - cardWidth - 16)));
  const remainingCardHeight = Math.max(160, viewportH - cardTop - 16);

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* Dimmed backdrop with a cutout over the spotlighted element. Falls
          back to a plain dimmed screen (centered card) if the target isn't
          on screen right now - e.g. no live quiz yet. */}
      {highlightStyle ? (
        <motion.div
          key={`spot-${stepIndex}`}
          className="absolute rounded-2xl pointer-events-none border-2 border-neon-blue"
          style={{
            top: highlightStyle.top,
            left: highlightStyle.left,
            width: highlightStyle.width,
            height: highlightStyle.height,
            boxShadow: "0 0 0 9999px rgba(6,9,20,0.82)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        />
      ) : (
        <div className="absolute inset-0 bg-void-100/85 backdrop-blur-sm" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="absolute box-border glass-strong rounded-2xl p-5 shadow-glow overflow-y-auto"
          style={
            highlightStyle
              ? { top: cardTop, left: cardLeft, width: cardWidth, maxWidth: "calc(100vw - 32px)", maxHeight: preferCardBelow ? remainingCardHeight : "calc(100dvh - 32px)" }
              : { top: "50%", left: "50%", width: cardWidth, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100dvh - 32px)", transform: "translate(-50%, -50%)" }
          }
        >
          {highlightStyle && (
            <div
              className={`absolute w-3 h-3 rotate-45 glass-strong ${placement === "below" ? "-top-1.5" : "-bottom-1.5"}`}
              style={{ left: Math.min(Math.max(highlightStyle.left + highlightStyle.width / 2 - cardLeft - 6, 16), cardWidth - 28) }}
            />
          )}

          <div className="w-11 h-11 rounded-xl bg-aurora flex items-center justify-center mb-3 shadow-glow">
            <Icon className="w-5 h-5 text-white" />
          </div>

          <p className="text-[11px] font-mono text-neon-cyan tracking-wider mb-1">
            STEP {stepIndex + 1} OF {steps.length}
          </p>
          <h3 className="font-display font-bold text-base text-ink mb-1.5">{step.title}</h3>
          <p className="text-ink-dim text-sm mb-5">{step.body}</p>

          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-5 bg-neon-blue" : "w-1.5 bg-surface-border"}`} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="secondary" onClick={goBack} fullWidth>
                Back
              </Button>
            )}
            <Button onClick={goNext} fullWidth>
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
