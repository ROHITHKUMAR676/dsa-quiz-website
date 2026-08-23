import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Timer, Flag, CalendarClock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import BadgePill from "../ui/BadgePill";
import { useCountdown, formatCountdown } from "../../lib/useCountdown";
import type { Quiz } from "../../types";

interface DailyChallengeTimerProps {
  liveQuiz?: Quiz;
  upcomingQuiz?: Quiz;
  /** Fired once, the moment the live quiz's countdown hits zero. */
  onLiveQuizClosed?: (quizId: string) => void;
}

/**
 * "Daily Timer Challenge" widget for the student dashboard.
 * - A live quiz counts down to its auto-close (endsAt / 1hr after start).
 * - Otherwise the next upcoming quiz counts down to its start time.
 * - With nothing scheduled, it shows a calm "no challenge today" state.
 */
export default function DailyChallengeTimer({ liveQuiz, upcomingQuiz, onLiveQuizClosed }: DailyChallengeTimerProps) {
  const navigate = useNavigate();
  const firedRef = useRef(false);

  const { msRemaining: liveMsRemaining, isDone: liveIsDone } = useCountdown(liveQuiz?.endsAt);
  const { msRemaining: upcomingMsRemaining } = useCountdown(!liveQuiz ? upcomingQuiz?.startsAt : null);

  useEffect(() => {
    if (liveQuiz && liveIsDone && !firedRef.current) {
      firedRef.current = true;
      onLiveQuizClosed?.(liveQuiz.id);
    }
    if (!liveQuiz) firedRef.current = false;
  }, [liveQuiz, liveIsDone, onLiveQuizClosed]);

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

  if (upcomingQuiz && upcomingMsRemaining !== null) {
    return (
      <Card className="p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-neon-purple/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center shrink-0 border border-surface-border">
            <CalendarClock className="w-7 h-7 text-neon-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-ink mb-1">Daily Timer Challenge</h3>
            <p className="text-ink-dim text-xs mb-2 truncate">{upcomingQuiz.title} unlocks in</p>
            <p className="font-mono font-bold text-2xl sm:text-3xl text-ink">{formatCountdown(upcomingMsRemaining)}</p>
          </div>
          <Button variant="secondary" disabled className="shrink-0">
            <Flag className="w-4 h-4" /> Not open yet
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center shrink-0 border border-surface-border">
          <Timer className="w-7 h-7 text-ink-faint" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-ink mb-1">Daily Timer Challenge</h3>
          <p className="text-ink-dim text-xs">No challenge scheduled right now - check back soon.</p>
        </div>
      </div>
    </Card>
  );
}