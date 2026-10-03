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
  const [deadline, setDeadline] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [questionDeadlines, setQuestionDeadlines] = useState<Record<string, string>>({});
  const [completedQuestions, setCompletedQuestions] = useState<Record<string, boolean>>({});
  const [frozenSeconds, setFrozenSeconds] = useState<Record<string, number>>({});
  const timeoutInFlight = useRef(new Set<string>());
  const [now, setNow] = useState(Date.now());
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

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
          setDeadline(attempt.deadline);
          if (attempt.serverTime) setServerOffsetMs(new Date(attempt.serverTime).getTime() - Date.now());
          const states = attempt.questionStates ?? [];
          setAnswers(Object.fromEntries(states.map((state) => [state.questionId, state.selectedOptionId])));
          setQuestionDeadlines(Object.fromEntries(states.map((state) => [state.questionId, state.deadline])));
          setCompletedQuestions(Object.fromEntries(states.filter((state) => state.selectedOptionId || state.responseTimeMs !== null).map((state) => [state.questionId, true])));
          const questionList = attempt.questions;
          const firstOpen = questionList.findIndex((item) => {
            const state = states.find((candidate) => candidate.questionId === item.id);
            return !state || (!state.selectedOptionId && state.responseTimeMs === null);
          });
          const activeIndex = firstOpen < 0 ? Math.max(0, questionList.length - 1) : firstOpen;
          setQIndex(activeIndex);
          if (!states.some((state) => state.questionId === questionList[activeIndex]?.id)) {
            const timer = await studentQuizApi.startQuestion(attempt.id, questionList[activeIndex].id);
            setServerOffsetMs(new Date(timer.serverTime).getTime() - Date.now());
            setQuestionDeadlines((previous) => ({ ...previous, [questionList[activeIndex].id]: timer.deadline }));
          }
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

  // Tick once a second while an attempt is in progress, purely to drive the
  // countdown display - the backend, not this timer, is what actually
  // enforces the deadline.
  useEffect(() => {
    if (stage !== "playing") return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [stage]);

  const secondsRemaining = useMemo(() => {
    if (!deadline) return null;
    return Math.max(0, Math.floor((new Date(deadline).getTime() - (now + serverOffsetMs)) / 1000));
  }, [deadline, now, serverOffsetMs]);

  const question = questions[qIndex];

  const startQuiz = useCallback(async () => {
    if (!quizId) return;
    setStage("loading");
    try {
      const result = await studentQuizApi.start(quizId);
      setAttemptId(result.attempt.id);
      setQuestions(result.questions);
      setDeadline(result.deadline);
      setAnswers({});
      setCompletedQuestions({});
      const firstTimer = await studentQuizApi.startQuestion(result.attempt.id, result.questions[0].id);
      setServerOffsetMs(new Date(firstTimer.serverTime).getTime() - Date.now());
      setQuestionDeadlines({ [result.questions[0].id]: firstTimer.deadline });
      setQIndex(0);
      setStage("playing");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Couldn't start the quiz. Please try again.";
      showToast(message, "error");
      setStage("intro");
    }
  }, [quizId, showToast]);

  const selectOption = async (questionId: string, optionId: string) => {
    if (!attemptId || completedQuestions[questionId]) return;
    const secondsLeft = Math.max(0, (new Date(questionDeadlines[questionId] ?? Date.now()).getTime() - (Date.now() + serverOffsetMs)) / 1000);
    timeoutInFlight.current.add(questionId);
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setCompletedQuestions((prev) => ({ ...prev, [questionId]: true }));
    setFrozenSeconds((prev) => ({ ...prev, [questionId]: secondsLeft }));
    try {
      await studentQuizApi.answerQuestion(attemptId, questionId, optionId);
    } catch (error) {
      setAnswers((prev) => ({ ...prev, [questionId]: null }));
      setCompletedQuestions((prev) => ({ ...prev, [questionId]: false }));
      showToast(error instanceof ApiError ? error.message : "Couldn't record that answer.", "error");
    } finally {
      timeoutInFlight.current.delete(questionId);
    }
  };

  const submit = useCallback(async () => {
    if (!attemptId) return;
    setStage("submitting");
    try {
      const payload = questions.map((q) => ({ questionId: q.id, selectedOptionId: answers[q.id] ?? null }));
      const result = await studentQuizApi.submit(attemptId, payload);
      showToast(result.attempt.message, "success");
      setStage("done");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Couldn't submit your quiz. Please try again.";
      showToast(message, "error");
      setStage("playing");
    }
  }, [attemptId, answers, questions, showToast]);

  const currentQuestionDeadline = question ? questionDeadlines[question.id] : undefined;
  const questionSecondsRemaining = completedQuestions[question?.id ?? ""]
    ? frozenSeconds[question?.id ?? ""] ?? 0
    : currentQuestionDeadline ? Math.max(0, (new Date(currentQuestionDeadline).getTime() - (now + serverOffsetMs)) / 1000) : 30;

  useEffect(() => {
    if (stage !== "playing" || !attemptId || !question || !currentQuestionDeadline || questionSecondsRemaining > 0 || completedQuestions[question.id] || timeoutInFlight.current.has(question.id)) return;
    timeoutInFlight.current.add(question.id);
    void studentQuizApi.answerQuestion(attemptId, question.id, null).then((result) => {
      setServerOffsetMs(new Date(result.serverTime).getTime() - Date.now());
      if (!result.answered) {
        setNow(Date.now());
        return;
      }
      setCompletedQuestions((prev) => ({ ...prev, [question.id]: true }));
      setFrozenSeconds((prev) => ({ ...prev, [question.id]: 0 }));
      const nextIndex = qIndex + 1;
      if (nextIndex < questions.length) {
        void studentQuizApi.startQuestion(attemptId, questions[nextIndex].id).then((timer) => {
          setServerOffsetMs(new Date(timer.serverTime).getTime() - Date.now());
          setQuestionDeadlines((prev) => ({ ...prev, [questions[nextIndex].id]: timer.deadline }));
          setQIndex(nextIndex);
        });
      }
    }).catch((error) => showToast(error instanceof ApiError ? error.message : "Couldn't record the timeout.", "error")).finally(() => timeoutInFlight.current.delete(question.id));
  }, [stage, attemptId, question, currentQuestionDeadline, questionSecondsRemaining, completedQuestions, qIndex, questions, showToast]);

  // Overall deadline remains independently enforced by the server.
  useEffect(() => {
    if (stage === "playing" && secondsRemaining === 0) {
      void submit();
    }
  }, [stage, secondsRemaining, submit]);

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
                Your answers are locked in. Results, XP, and rank will be revealed once the official reveal happens -
                check the leaderboard then.
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
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const timerColor = questionSecondsRemaining > 20 ? "#35d07f" : questionSecondsRemaining > 10 ? "#f5c542" : "#ff5364";
  const timerOffset = 2 * Math.PI * 19 * (1 - questionSecondsRemaining / 30);

  const goNext = async () => {
    if (!attemptId || !completedQuestions[question.id] || isLast) return;
    const nextIndex = qIndex + 1;
    try {
      const timer = await studentQuizApi.startQuestion(attemptId, questions[nextIndex].id);
      setServerOffsetMs(new Date(timer.serverTime).getTime() - Date.now());
      setQuestionDeadlines((prev) => ({ ...prev, [questions[nextIndex].id]: timer.deadline }));
      setQIndex(nextIndex);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't start the next question.", "error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-ink-dim font-mono">
          Question {qIndex + 1} / {questions.length}
        </span>
        <div className="relative w-14 h-14 shrink-0" aria-label={`${Math.ceil(questionSecondsRemaining)} seconds left`}>
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-border" />
            <circle cx="24" cy="24" r="19" fill="none" stroke={timerColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 19} strokeDashoffset={timerOffset} style={{ transition: "stroke-dashoffset 100ms linear, stroke 200ms" }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold" style={{ color: timerColor }}>{Math.ceil(questionSecondsRemaining)}</span>
        </div>
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
            <h2 className="font-sans font-semibold text-lg sm:text-xl text-ink mb-6">{question.questionText}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => void selectOption(question.id, opt.id)}
                    disabled={completedQuestions[question.id] || questionSecondsRemaining <= 0}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative text-left px-4 py-3.5 rounded-xl border text-sm font-medium font-sans transition-colors",
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
        <Button variant="secondary" onClick={() => setQIndex((i) => Math.max(0, i - 1))} disabled={qIndex === 0}>
          Previous
        </Button>
        <div className="flex-1 text-center text-xs text-ink-faint font-mono">{answeredCount} / {questions.length} answered</div>
        {isLast ? (
          <Button onClick={submit} disabled={stage === "submitting"}>
            {stage === "submitting" ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : (
          <Button onClick={() => void goNext()} disabled={!completedQuestions[question.id]}>Next</Button>
        )}
      </div>
    </div>
  );
}
