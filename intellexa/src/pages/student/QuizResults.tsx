import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Loader2, TriangleAlert } from "../../components/pixel/PixelLucide";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ResultsLockedBanner from "../../components/domain/ResultsLockedBanner";
import DailyLeaderboardRow from "../../components/domain/DailyLeaderboardRow";
import { leaderboardApi, studentQuizApi, type BackendDailyLeaderboard } from "../../lib/backend";
import { ApiError } from "../../lib/api";
import { useApp } from "../../context/AppContext";

type Status = "loading" | "ready" | "error";

export default function QuizResults() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [leaderboard, setLeaderboard] = useState<BackendDailyLeaderboard | null>(null);

  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;

    (async () => {
      try {
        const [{ quiz }, { leaderboard: daily }] = await Promise.all([
          studentQuizApi.get(quizId),
          leaderboardApi.daily(quizId),
        ]);
        if (cancelled) return;
        setQuizTitle(quiz.title);
        setLeaderboard(daily);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't load results. Please try again.");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quizId]);

  // While results are still locked, poll every 20s so the banner flips to
  // the leaderboard on its own the moment the backend finalizes - no manual
  // refresh needed once the 1hr window (or release delay) has passed.
  useEffect(() => {
    if (!quizId || status !== "ready" || !leaderboard || leaderboard.resultState === "PUBLISHED") return;
    const t = setInterval(async () => {
      try {
        const { leaderboard: daily } = await leaderboardApi.daily(quizId);
        setLeaderboard(daily);
      } catch {
        // Silent - the next tick (or a manual back/forward) will retry.
      }
    }, 20000);
    return () => clearInterval(t);
  }, [quizId, status, leaderboard]);

  return (
    <div className="max-w-2xl mx-auto px-1 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/student")} className="text-ink-faint hover:text-ink flex items-center gap-1 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
        </div>
      )}

      {status === "error" && (
        <Card className="p-6 text-center">
          <TriangleAlert className="w-6 h-6 text-state-warning mx-auto mb-2" />
          <p className="text-ink text-sm mb-5">{errorMessage}</p>
          <Button onClick={() => navigate("/student")}>Back to Dashboard</Button>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {status === "ready" && leaderboard && (
          <motion.div key={leaderboard.resultState} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
                <Trophy className="w-6 h-6 text-state-gold" /> Results
              </h1>
              <p className="text-ink-dim text-sm truncate">{quizTitle}</p>
            </div>

            {leaderboard.resultState !== "PUBLISHED" ? (
              <ResultsLockedBanner resultsAvailableAt={leaderboard.resultsAvailableAt} resultState={leaderboard.resultState} />
            ) : leaderboard.entries.length === 0 ? (
              <EmptyState icon={Trophy} title="No entries yet" description="No one submitted this quiz in time, so there's nothing to rank." />
            ) : (
              <div className="space-y-2">
                {leaderboard.entries.map((entry, index) => (
                  <DailyLeaderboardRow key={entry.userId} entry={entry} index={index} highlight={user ? entry.userId === user.id : false} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}