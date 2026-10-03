import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Loader2, TriangleAlert, Sparkles, X } from "lucide-react";
import Podium from "../../components/domain/Podium";
import LeaderboardRow from "../../components/domain/LeaderboardRow";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { leaderboardApi } from "../../lib/backend";
import { mapBackendGlobalEntryToLegacy } from "../../lib/leaderboardAdapter";
import { ApiError } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import type { LeaderboardEntry } from "../../types";
import { cn } from "../../lib/utils";

type Status = "loading" | "ready" | "error";

function getLeaderboardErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return "This leaderboard is available to student accounts. Please sign in with a student profile to view rankings.";
  }
  return error instanceof ApiError ? error.message : "Couldn't load the leaderboard. Please try again.";
}

export default function Leaderboard() {
  const { user } = useApp();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [periodLabel, setPeriodLabel] = useState("");
  const [awardWinners, setAwardWinners] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadLeaderboard = async () => {
      try {
        const { leaderboard, period, previousMonthTop3 } = await leaderboardApi.global();
        if (cancelled) return;
        setEntries(leaderboard.map(mapBackendGlobalEntryToLegacy));
        setPeriodLabel(period.label);
        const awardKey = `intellexa.monthly-award.${period.key}`;
        try {
          if (previousMonthTop3.length && localStorage.getItem(awardKey) !== "shown") {
            setAwardWinners(previousMonthTop3.map(mapBackendGlobalEntryToLegacy));
            localStorage.setItem(awardKey, "shown");
          }
        } catch {
          // Keep the monthly rankings available if browser storage is disabled.
        }
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(getLeaderboardErrorMessage(error));
        setStatus("error");
      }
    };
    void loadLeaderboard();
    const refreshTimer = window.setInterval(() => void loadLeaderboard(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const me = user ? entries.find((entry) => entry.userId === user.id) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
            <Trophy className="w-6 h-6 text-state-gold" /> Leaderboard
          </h1>
          <p className="text-ink-dim text-sm">{periodLabel ? `${periodLabel} monthly rankings. Points reset each month; your XP and badges stay with you.` : "Monthly rankings. Points reset each month."}</p>
        </div>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
        </div>
      )}

      {status === "error" && (
        <Card className="p-6 text-center">
          <TriangleAlert className="w-6 h-6 text-state-warning mx-auto mb-2" />
          <p className="text-ink text-sm">{errorMessage}</p>
        </Card>
      )}

      {status === "ready" && entries.length === 0 && (
        <EmptyState icon={Trophy} title="No students yet" description="Students will appear here as soon as they have an account." />
      )}

      <AnimatePresence mode="wait">
        {status === "ready" && entries.length > 0 && (
        <>
          <Podium top3={top3} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            {rest.map((entry, index) => (
              <LeaderboardRow key={entry.userId} entry={entry} index={index} highlight={user ? entry.userId === user.id : false} />
            ))}
          </motion.div>

          {me && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 220, damping: 22 }}
              className={cn(
                "sticky bottom-20 lg:bottom-4"
              )}
            >
              <Card className="p-4 sm:p-5 flex items-center justify-between gap-3 border-neon-blue/30 bg-neon-blue/5">
                <div className="flex items-center gap-3">
                  <img src={me.avatar} className="w-9 h-9 rounded-full" alt="you" />
                  <div>
                    <p className="text-sm text-ink font-medium">You're rank #{me.rank}</p>
                    <p className="text-xs text-ink-dim">Keep it up to climb higher</p>
                  </div>
                </div>
                <span className="font-mono text-neon-cyan text-sm shrink-0">{me.points.toLocaleString()} pts</span>
              </Card>
            </motion.div>
          )}
        </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {awardWinners.length > 0 && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-void-100/80 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="monthly-awards-title" className="w-full max-w-lg rounded-3xl border border-state-gold/30 bg-surface p-6 sm:p-8 text-center shadow-glow relative overflow-hidden" initial={{ y: 30, scale: 0.92 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }}>
              <button aria-label="Close" onClick={() => setAwardWinners([])} className="absolute right-4 top-4 p-2 text-ink-faint hover:text-ink"><X className="w-5 h-5" /></button>
              <motion.div animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] }} transition={{ duration: 1.8, repeat: 2 }} className="mx-auto mb-3 w-16 h-16 rounded-full bg-state-gold/15 flex items-center justify-center"><Trophy className="w-8 h-8 text-state-gold" /></motion.div>
              <h2 id="monthly-awards-title" className="font-display font-bold text-2xl text-ink">A round of applause!</h2>
              <p className="text-sm text-ink-dim mt-2">Congratulations to last month's top three. A fresh monthly leaderboard starts now.</p>
              <div className="mt-6 space-y-2 text-left">
                {awardWinners.map((winner) => <motion.div key={winner.userId} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: winner.rank * 0.15 }} className="flex items-center gap-3 rounded-xl bg-surface-light p-3"><span className="w-7 text-center font-display font-bold text-state-gold">#{winner.rank}</span><img src={winner.avatar} alt="" className="w-10 h-10 rounded-full" /><span className="flex-1 text-sm font-medium text-ink">{winner.name}</span><span className="font-mono text-xs text-neon-cyan">{winner.points.toLocaleString()} pts</span><Sparkles className="w-4 h-4 text-state-gold" /></motion.div>)}
              </div>
              <button onClick={() => setAwardWinners([])} className="mt-6 rounded-xl bg-aurora px-5 py-2.5 text-sm font-semibold text-white">Let's begin</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
