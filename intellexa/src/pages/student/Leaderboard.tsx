import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Loader2, TriangleAlert } from "lucide-react";
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { leaderboard } = await leaderboardApi.global();
        if (cancelled) return;
        setEntries(leaderboard.map(mapBackendGlobalEntryToLegacy));
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(getLeaderboardErrorMessage(error));
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
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
          <p className="text-ink-dim text-sm">Ranked by total XP across every finalized daily quiz.</p>
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
        <EmptyState icon={Trophy} title="No rankings yet" description="Complete a quiz to appear on the leaderboard." />
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
                <span className="font-mono text-neon-cyan text-sm shrink-0">{me.xp.toLocaleString()} XP</span>
              </Card>
            </motion.div>
          )}
        </>
        )}
      </AnimatePresence>
    </div>
  );
}
