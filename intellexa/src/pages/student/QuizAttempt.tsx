import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Trophy, Loader2, TriangleAlert } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { cn } from "../../lib/utils";
import { studentQuizApi, type BackendQuestion, type BackendQuizSummary } from "../../lib/backend";
import { ApiError } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

type Stage = "loading" | "intro" | "playing" | "submitting" | "done" | "unavailable" | "error";

/**
 * Real-backend quiz attempt flow. Unlike the old mock version, this never
 * reveals correctness locally - the backend withholds isCorrect from every
 * question (spec section 24) and withholds the score from the submit
 * response too (spec sections 9-10: results only surface after the
 * official release). So there is no per-question "correct!" flash here by
 * design - only a confirmation that the attempt was recorded.
 */
export default function QuizAttempt() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [stage, setStage] = useState<Stage>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [quiz, setQuiz] = useState<BackendQuizSummary | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<BackendQuestion[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState<string | null>(null);
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [now, setNow] = useState(Date.now());
  const answeringRef = useRef(false);

  // Load the quiz's public details, and recover any already-in-progress
  // attempt so a page refresh mid-quiz doesn't lose the student's place.
  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;

    (async () => {
      try {
        const [{ quiz: quizDetail }, { attempt }] = await Promise.all([
          studentQuizApi.get(quizId),
          studentQuizApi.myAttempt(quizId),
        ]);
        if (cancelled) return;
        setQuiz(quizDetail);

        if (attempt && attempt.status === "IN_PROGRESS" && attempt.questions) {
          setAttemptId(attempt.id);
          setQuestions(attempt.questions);
          setQuestionStartedAt(attempt.questionStartedAt);
          setServerClockOffsetMs(Date.now() - new Date(attempt.serverTime).getTime());
          setQIndex(attempt.currentQuestionIndex);
          setStage("playing");
        } else if (attempt && attempt.status !== "IN_PROGRESS") {
          // Already attempted - send them to the results page, which shows
          // the "come back after 1hr" banner until results are published.
          navigate(`/student/quiz/${quizId}/results`, { replace: true });
          return;
        } else {
          setStage("intro");
        }
      } catch (error) {
        if (cancelled) return;
        setStage("error");
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't load this quiz. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quizId, navigate]);

  // Tick smoothly for the circular countdown. The server timestamp is the
  // source of truth for scoring and timeout enforcement.
  useEffect(() => {
    if (stage !== "playing") return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [stage]);

  const remainingMs = useMemo(() => {
    if (!questionStartedAt) return null;
    return Math.max(0, 30_000 - (now - serverClockOffsetMs - new Date(questionStartedAt).getTime()));
  }, [questionStartedAt, serverClockOffsetMs, now]);
  const secondsRemaining = remainingMs === null ? null : Math.ceil(remainingMs / 1000);

  const question = questions[qIndex];

  const startQuiz = useCallback(async () => {
    if (!quizId) return;
    setStage("loading");
    try {
      const result = await studentQuizApi.start(quizId);
      setAttemptId(result.attempt.id);
      setQuestions(result.questions);
      setQuestionStartedAt(result.questionStartedAt);
      setServerClockOffsetMs(Date.now() - new Date(result.serverTime).getTime());
      setAnswers({});
      setQIndex(0);
      setStage("playing");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Couldn't start the quiz. Please try again.";
      showToast(message, "error");
      setStage("intro");
    }
  }, [quizId, showToast]);

  const selectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const submitCurrentAnswer = useCallback(async (selectedOptionId: string | null) => {
    if (!attemptId || !question || answeringRef.current) return;
    answeringRef.current = true;
    // Stop the visible timer the moment the student submits.
    setStage("submitting");
    try {
      const { attempt: result } = await studentQuizApi.answer(attemptId, question.id, selectedOptionId);
      setServerClockOffsetMs(Date.now() - new Date(result.serverTime).getTime());
      if (result.status === "SUBMITTED") {
        showToast(result.message ?? "Quiz submitted", "success");
        setStage("done");
      } else {
        setQIndex(result.currentQuestionIndex);
        setQuestionStartedAt(result.questionStartedAt);
        setNow(Date.now());
        setStage("playing");
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Couldn't save your answer. Please try again.";
      showToast(message, "error");
      setStage("playing");
    } finally {
      answeringRef.current = false;
    }
  }, [attemptId, question, showToast]);

  // Send a null answer at timeout. The server independently checks its own
  // clock and awards zero once 30 seconds have elapsed.
  useEffect(() => {
    if (stage === "playing" && remainingMs === 0) {
      void submitCurrentAnswer(null);
    }
  }, [stage, remainingMs, submitCurrentAnswer]);

  if (stage === "loading") {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
      </div>
    );
  }

  if (stage === "error" || stage === "unavailable") {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-6 sm:p-8 text-center">
          <TriangleAlert className="w-8 h-8 text-state-warning mx-auto mb-3" />
          <p className="text-ink text-sm mb-6">{errorMessage}</p>
          <Button fullWidth onClick={() => navigate("/student")}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === "intro" && quiz) {
    const isLive = quiz.availability === "LIVE";
    return (
      <div className="min-h-[80dvh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-6 sm:p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-ink mb-2">{quiz.title}</h1>
          <p className="text-ink-dim text-sm mb-6">{quiz.description}</p>
          <div className="grid grid-cols-2 gap-3 mb-6 text-left">
            <div className="glass rounded-xl p-3">
              <p className="text-ink-faint text-xs">Category</p>
              <p className="font-mono text-ink font-semibold">{quiz.category}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-ink-faint text-xs">Difficulty</p>
              <p className="font-mono text-ink font-semibold">{quiz.difficulty}</p>
            </div>
          </div>
          {!isLive && (
            <p className="text-xs text-state-warning mb-4">
              This quiz isn't live right now (status: {quiz.availability.toLowerCase()}).
            </p>
          )}
          <p className="text-xs text-ink-faint mb-6">
            You get one attempt. Once submitted, it's final - results are revealed after the official release.
          </p>
          <Button fullWidth size="lg" onClick={startQuiz} disabled={!isLive}>
            <Zap className="w-4 h-4" /> Start Quiz
          </Button>
          <button onClick={() => navigate(-1)} className="mt-3 text-xs text-ink-faint hover:text-ink flex items-center gap-1 mx-auto">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </Card>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-aurora-soft opacity-20" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-aurora mx-auto flex items-center justify-center mb-4 shadow-glow">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-display font-bold text-2xl text-ink mb-2">Quiz Submitted!</h1>
              <p className="text-ink-dim text-sm mb-6">
                Your answers are locked in. You can view your quiz results between 9 PM and 12 AM IST today.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button fullWidth size="lg" variant="secondary" onClick={() => navigate(`/student/quiz/${quizId}/results`)}>
                  View Results
                </Button>
                <Button fullWidth size="lg" onClick={() => navigate("/student")}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
      </div>
    );
  }

  const isLast = qIndex === questions.length - 1;
  const selectedOptionId = answers[question.id] ?? null;
  const timerColor = secondsRemaining !== null && secondsRemaining <= 10 ? "#ef4444" : secondsRemaining !== null && secondsRemaining <= 20 ? "#eab308" : "#22c55e";
  const timerCircumference = 2 * Math.PI * 20;
  const timerProgress = remainingMs === null ? 0 : remainingMs / 30_000;

  return (
    <div className="max-w-2xl mx-auto px-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-ink-dim font-mono">
          Question {qIndex + 1} / {questions.length}
        </span>
        {secondsRemaining !== null && (
          <div className="flex items-center gap-2" aria-label={`${secondsRemaining} seconds remaining`}>
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48" role="img" aria-hidden="true">
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-surface-border" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke={timerColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={timerCircumference} strokeDashoffset={timerCircumference * (1 - timerProgress)} className="transition-[stroke-dashoffset,stroke] duration-100" />
            </svg>
            <span className="font-mono font-bold text-xl tabular-nums" style={{ color: timerColor }}>{secondsRemaining}s</span>
          </div>
        )}
      </div>

      <div className="h-1.5 rounded-full bg-surface-light overflow-hidden mb-6">
        <div className="h-full bg-aurora rounded-full transition-all" style={{ width: `${(qIndex / questions.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-5 sm:p-7 mb-4">
            <h2 className="font-display font-semibold text-lg sm:text-xl text-ink mb-6">{question.questionText}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => selectOption(question.id, opt.id)}
                    disabled={stage !== "playing" || remainingMs === 0}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors",
                      "bg-surface-light border-surface-border text-ink hover:border-neon-blue/50 hover:bg-surface-light/80",
                      isSelected && "bg-neon-blue/15 border-neon-blue text-neon-blue"
                    )}
                  >
                    {opt.optionText}
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <div className="flex-1 text-center text-xs text-ink-faint font-mono">{qIndex + 1} of {questions.length}</div>
        <Button onClick={() => void submitCurrentAnswer(selectedOptionId)} disabled={stage !== "playing" || remainingMs === 0}>
          {stage === "submitting" ? "Saving..." : isLast ? "Submit Quiz" : "Lock Answer & Continue"}
        </Button>
      </div>
    </div>
  );
}
