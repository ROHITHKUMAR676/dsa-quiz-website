import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Loader2, TriangleAlert } from "lucide-react";
import Podium from "../../components/domain/Podium";
import LeaderboardRow from "../../components/domain/LeaderboardRow";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { adminApi } from "../../lib/backend";
import { mapBackendGlobalEntryToLegacy } from "../../lib/leaderboardAdapter";
import { ApiError } from "../../lib/api";
import type { LeaderboardEntry } from "../../types";

function getLeaderboardErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return "Admin leaderboard access requires an admin account. Please switch to an admin session to view platform rankings.";
  }
  return error instanceof ApiError ? error.message : "Couldn't load leaderboard. Please try again.";
}

export default function AdminLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi
      .leaderboard()
      .then(({ leaderboard, period }) => {
        if (cancelled) return;
        setEntries(leaderboard.map(mapBackendGlobalEntryToLegacy));
        setPeriodLabel(period.label);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(getLeaderboardErrorMessage(error));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <Trophy className="w-6 h-6 text-state-gold" /> Leaderboard
        </h1>
        <p className="text-ink-dim text-sm">{periodLabel ? `${periodLabel} monthly student rankings.` : "Monthly student rankings."}</p>
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

      <AnimatePresence mode="wait">
        {status === "ready" && entries.length === 0 ? (
        <EmptyState icon={Trophy} title="No rankings yet" description="Students will appear after finalized quiz rewards are recorded." />
      ) : status === "ready" ? (
        <>
          <Podium top3={top3} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.15 }} className="space-y-2">
            {rest.map((entry, index) => <LeaderboardRow key={entry.userId} entry={entry} index={index} />)}
          </motion.div>
        </>
      ) : null}
      </AnimatePresence>
    </div>
  );
}
