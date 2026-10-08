import { useEffect, useState } from "react";

/**
 * Ticks once a second toward `targetIso`. Purely presentational - like the
 * QuizAttempt question timer, the backend (not this hook) is the source of
 * truth for when a quiz actually opens/closes/reveals results.
 */
export function useCountdown(targetIso?: string | null) {
  const targetMs = targetIso ? new Date(targetIso).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs === null || Number.isNaN(targetMs)) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  if (targetMs === null || Number.isNaN(targetMs)) {
    return { msRemaining: null as number | null, isDone: false };
  }

  const msRemaining = Math.max(0, targetMs - now);
  return { msRemaining, isDone: msRemaining <= 0 };
}

/** "1h 04m 32s" / "04:32" style formatting depending on magnitude. */
export function formatCountdown(ms: number, compact = false) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (compact) {
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}