import { motion } from "framer-motion";
import { Lock, Hourglass } from "../pixel/PixelLucide";
import Card from "../ui/Card";
import { useCountdown, formatCountdown } from "../../lib/useCountdown";

interface ResultsLockedBannerProps {
  /** ISO timestamp results will be revealed at. */
  resultsAvailableAt: string | null;
  /** "LIVE" while the quiz is still running, "WAITING_FOR_RESULTS" once it's closed. */
  resultState: "LIVE" | "WAITING_FOR_RESULTS";
}

/**
 * "Come back after 1 hour" banner. Shown instead of the leaderboard for as
 * long as a quiz's results are LIVE or WAITING_FOR_RESULTS - the leaderboard
 * itself only ever renders once the backend reports resultState PUBLISHED.
 */
export default function ResultsLockedBanner({ resultsAvailableAt, resultState }: ResultsLockedBannerProps) {
  const { msRemaining } = useCountdown(resultsAvailableAt);

  return (
    <Card className="p-6 sm:p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-aurora-soft opacity-10" />
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-surface-light border border-surface-border mx-auto flex items-center justify-center mb-4"
        >
          <Lock className="w-7 h-7 text-neon-blue" />
        </motion.div>
        <h2 className="font-display font-bold text-xl text-ink mb-2">Results are locked for now</h2>
        <p className="text-ink-dim text-sm max-w-sm mx-auto mb-5">
          {resultState === "LIVE"
            ? "This challenge is still running. The leaderboard unlocks one hour after it starts."
            : "The challenge has closed. Rankings and points are being finalized and unlock shortly."}
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl2 bg-surface-light border border-surface-border">
          <Hourglass className="w-4 h-4 text-neon-cyan" />
          {msRemaining !== null && msRemaining > 0 ? (
            <span className="font-mono font-semibold text-ink text-sm">
              Come back in {formatCountdown(msRemaining)}
            </span>
          ) : (
            <span className="font-mono font-semibold text-ink text-sm">Finalizing results...</span>
          )}
        </div>

        {resultsAvailableAt && (
          <p className="text-ink-faint text-xs mt-4">
            Unlocks at {new Date(resultsAvailableAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
          </p>
        )}
      </div>
    </Card>
  );
}