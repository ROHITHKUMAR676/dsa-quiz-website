import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Timer, Sparkles, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import BadgePill from "../ui/BadgePill";
import { useCountdown, formatCountdown } from "../../lib/useCountdown";
import type { Quiz } from "../../types";

interface DailyChallengeTimerProps {
  liveQuiz?: Quiz;
  upcomingQuiz?: Quiz;
  /** Most recently closed quiz, still within its 24h "stay visible" window. */
  closedQuiz?: Quiz;
  /** Fired once, the moment the live quiz's countdown hits zero. */
  onLiveQuizClosed?: (quizId: string) => void;
  onUpcomingQuizOpened?: (quizId: string) => void;
}

function getNextDailyQuizTime(now = new Date()) {
  const indiaNow = new Date(now.getTime() + 330 * 60_000);
  const nextSlot = new Date(Date.UTC(indiaNow.getUTCFullYear(), indiaNow.getUTCMonth(), indiaNow.getUTCDate(), 14, 30));
  if (now >= nextSlot) nextSlot.setUTCDate(nextSlot.getUTCDate() + 1);
  return nextSlot.toISOString();
}

/**
 * "Daily Timer Challenge" widget for the student dashboard.
 * Shows the daily opening countdown throughout the day. After today's quiz
 * closes, its results link is available from 9 PM until midnight IST.
 */
export default function DailyChallengeTimer({ liveQuiz, upcomingQuiz, closedQuiz, onLiveQuizClosed, onUpcomingQuizOpened }: DailyChallengeTimerProps) {
  const navigate = useNavigate();
  const firedRef = useRef(false);
  const openedRef = useRef<string | null>(null);
  const [fallbackQuizTarget, setFallbackQuizTarget] = useState(getNextDailyQuizTime);

  const { msRemaining: liveMsRemaining, isDone: liveIsDone } = useCountdown(liveQuiz?.endsAt);
  const nextQuizTarget = upcomingQuiz?.startsAt ?? fallbackQuizTarget;
  const { msRemaining: upcomingMsRemaining, isDone: upcomingIsDone } = useCountdown(nextQuizTarget);

  useEffect(() => {
    if (!upcomingQuiz && new Date(fallbackQuizTarget).getTime() <= Date.now()) {
      setFallbackQuizTarget(getNextDailyQuizTime());
    }
  }, [upcomingQuiz, fallbackQuizTarget]);

  useEffect(() => {
    if (liveQuiz && liveIsDone && !firedRef.current) {
      firedRef.current = true;
      onLiveQuizClosed?.(liveQuiz.id);
    }
    if (!liveQuiz) firedRef.current = false;
  }, [liveQuiz, liveIsDone, onLiveQuizClosed]);

  useEffect(() => {
    if (!upcomingIsDone || openedRef.current === nextQuizTarget) return;
    openedRef.current = nextQuizTarget;
    onUpcomingQuizOpened?.(upcomingQuiz?.id ?? "");
  }, [upcomingQuiz?.id, nextQuizTarget, upcomingIsDone, onUpcomingQuizOpened]);

  if (liveQuiz && !liveIsDone) {
    const urgent = liveMsRemaining !== null && liveMsRemaining < 5 * 60 * 1000;
    return (
      <Card glow="blue" className="p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-neon-cyan/15 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-aurora flex items-center justify-center shrink-0 shadow-glow">
            <Timer className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-semibold text-ink">Daily Timer Challenge</h3>
              <BadgePill variant="danger" size="sm">
                <span className="w-1.5 h-1.5 rounded-full bg-state-danger animate-pulse" /> Live
              </BadgePill>
            </div>
            <p className="text-ink-dim text-xs mb-2 truncate">{liveQuiz.title} closes automatically when the timer hits zero.</p>
            <motion.p
              key={urgent ? "urgent" : "normal"}
              className={`font-mono font-bold text-2xl sm:text-3xl ${urgent ? "text-state-danger" : "text-ink"}`}
            >
              {liveMsRemaining !== null ? formatCountdown(liveMsRemaining) : "--"}
            </motion.p>
          </div>
          <Button onClick={() => navigate(`/student/quiz/${liveQuiz.id}`)} className="shrink-0">
            <Sparkles className="w-4 h-4" /> Enter Challenge
          </Button>
        </div>
      </Card>
    );
  }

  const indiaNow = new Date(Date.now() + 330 * 60_000);
  const resultsTimeOpen = indiaNow.getUTCHours() >= 21;
  const quizHasClosed = Boolean(closedQuiz?.endsAt && Date.now() >= new Date(closedQuiz.endsAt).getTime());
  const showResults = Boolean(closedQuiz && quizHasClosed && resultsTimeOpen);

  return (
    <Card className="group relative overflow-hidden border-neon-blue/20 bg-gradient-to-br from-surface via-surface to-neon-blue/[0.07] p-5 shadow-[0_18px_55px_rgba(20,35,90,0.16)] sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-neon-blue/10 blur-3xl transition-opacity duration-500 group-hover:opacity-150" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-neon-blue/[0.035] to-transparent" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-neon-blue/25 bg-gradient-to-br from-neon-blue/20 to-neon-blue/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div aria-hidden="true" className="absolute inset-1 rounded-[1rem] border border-white/[0.04]" />
          <Timer className="h-7 w-7 text-neon-blue drop-shadow-[0_0_12px_rgba(91,124,255,0.45)]" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-display text-base font-semibold tracking-tight text-ink sm:text-lg">Daily Timer Challenge</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-blue/20 bg-neon-blue/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neon-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(91,124,255,0.8)]" /> Daily · 8 PM IST
            </span>
          </div>
          <p className="mb-2 text-sm text-ink-dim">
            {upcomingQuiz?.title ? `${upcomingQuiz.title} opens at 8 PM IST` : "Your next quiz opens at 8 PM IST"}
          </p>
          <motion.p
            key={Math.floor((upcomingMsRemaining ?? 0) / 1000)}
            initial={{ opacity: 0.7, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            aria-label={`Quiz opens in ${upcomingMsRemaining !== null ? formatCountdown(upcomingMsRemaining) : "time unavailable"}`}
            className="font-mono text-3xl font-bold leading-none tracking-tight text-ink tabular-nums sm:text-[2.65rem]"
          >
            {upcomingMsRemaining !== null ? formatCountdown(upcomingMsRemaining) : "--"}
          </motion.p>
        </div>
        {showResults && closedQuiz && (
          <Button variant="secondary" onClick={() => navigate(`/student/quiz/${closedQuiz.id}/results`)} className="shrink-0">
            <Trophy className="w-4 h-4" /> View Results
          </Button>
        )}
      </div>
    </Card>
  );
}
