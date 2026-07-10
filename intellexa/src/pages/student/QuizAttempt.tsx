import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, Trophy, ArrowLeft, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DifficultyBadge from "../../components/ui/DifficultyBadge";
import { quizzes } from "../../data/mockData";
import { cn } from "../../lib/utils";

function scoreForTime(elapsed: number, limit: number, base: number) {
  const ratio = elapsed / limit;
  if (ratio <= 0.25) return base;
  if (ratio <= 0.5) return Math.round(base * 0.85);
  if (ratio <= 0.8) return Math.round(base * 0.7);
  return Math.round(base * 0.4);
}

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quiz = quizzes.find((q) => q.id === id) ?? quizzes[0];
  const limit = quiz.timeLimitPerQuestion;

  const [stage, setStage] = useState<"intro" | "playing" | "done">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(limit);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastGain, setLastGain] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(Date.now());

  const question = quiz.questions[qIndex];

  useEffect(() => {
    if (stage !== "playing" || locked) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 0.1), 100);
    return () => clearTimeout(t);
  }, [timeLeft, stage, locked]);

  const startQuiz = () => {
    setStage("playing");
    setStartTime(Date.now());
    setTimeLeft(limit);
  };

  const handleAnswer = (optionIndex: number) => {
    if (locked) return;
    setLocked(true);
    setSelected(optionIndex);
    const elapsed = (Date.now() - startTime) / 1000;
    const isCorrect = optionIndex === question.correctAnswer;
    const gained = isCorrect ? scoreForTime(elapsed, limit, question.points) : 0;
    setLastGain(gained);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setTotalScore((s) => s + gained);
    }

    setTimeout(() => {
      if (qIndex + 1 < quiz.questions.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
        setLocked(false);
        setLastGain(null);
        setStartTime(Date.now());
        setTimeLeft(limit);
      } else {
        setStage("done");
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ["#4F7CFF", "#A855F7", "#22D3EE"] });
      }
    }, 1400);
  };

  if (stage === "intro") {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-6 sm:p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <DifficultyBadge difficulty={quiz.difficulty} />
          </div>
          <h1 className="font-display font-bold text-2xl text-ink mb-2">{quiz.title}</h1>
          <p className="text-ink-dim text-sm mb-6">{quiz.description}</p>
          <div className="grid grid-cols-2 gap-3 mb-6 text-left">
            <div className="glass rounded-xl p-3">
              <p className="text-ink-faint text-xs">Questions</p>
              <p className="font-mono text-ink font-semibold">{quiz.questions.length}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-ink-faint text-xs">Per question</p>
              <p className="font-mono text-ink font-semibold">{limit}s</p>
            </div>
          </div>
          <p className="text-xs text-ink-faint mb-6">Faster answers earn more points. Wrong answers earn zero.</p>
          <Button fullWidth size="lg" onClick={startQuiz}>
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
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-16 h-16 rounded-2xl bg-aurora mx-auto flex items-center justify-center mb-4 shadow-glow"
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-display font-bold text-2xl text-ink mb-1">Quiz Complete!</h1>
              <p className="text-ink-dim text-sm mb-6">
                {correctCount} / {quiz.questions.length} correct
              </p>
              <div className="text-5xl font-display font-black text-gradient mb-6">+{totalScore}</div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass rounded-xl p-3">
                  <p className="text-ink-faint text-xs">Accuracy</p>
                  <p className="font-mono text-ink font-semibold">{Math.round((correctCount / quiz.questions.length) * 100)}%</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-ink-faint text-xs">XP Earned</p>
                  <p className="font-mono text-state-success font-semibold">+{Math.round(totalScore * 0.6)}</p>
                </div>
              </div>
              <Button fullWidth size="lg" onClick={() => navigate("/student")}>
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const pct = (timeLeft / limit) * 100;
  const isCorrect = selected === question.correctAnswer;

  return (
    <div className="max-w-2xl mx-auto px-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-ink-dim font-mono">
          Question {qIndex + 1} / {quiz.questions.length}
        </span>
        <div className="flex items-center gap-1.5 text-xs font-mono text-ink-dim">
          <Clock className="w-3.5 h-3.5" /> {Math.max(0, timeLeft).toFixed(1)}s
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-surface-light overflow-hidden mb-2">
        <div className="h-full bg-aurora rounded-full transition-all" style={{ width: `${((qIndex) / quiz.questions.length) * 100}%` }} />
      </div>
      <div className="h-1 rounded-full bg-surface-light overflow-hidden mb-6">
        <motion.div
          className={cn("h-full rounded-full", pct < 30 ? "bg-state-danger" : "bg-neon-cyan")}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-5 sm:p-7 mb-4">
            <h2 className="font-display font-semibold text-lg sm:text-xl text-ink mb-6">{question.question}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((opt, i) => {
                const isSelected = selected === i;
                const showCorrect = locked && i === question.correctAnswer;
                const showWrong = locked && isSelected && i !== question.correctAnswer;
                return (
                  <motion.button
                    key={i}
                    disabled={locked}
                    onClick={() => handleAnswer(i)}
                    whileHover={!locked ? { scale: 1.02, y: -2 } : undefined}
                    whileTap={!locked ? { scale: 0.98 } : undefined}
                    animate={showWrong ? { x: [0, -6, 6, -6, 0] } : {}}
                    className={cn(
                      "relative text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center justify-between gap-2",
                      "bg-surface-light border-surface-border text-ink",
                      !locked && "hover:border-neon-blue/50 hover:bg-surface-light/80",
                      showCorrect && "bg-state-success/15 border-state-success text-state-success",
                      showWrong && "bg-state-danger/15 border-state-danger text-state-danger"
                    )}
                  >
                    {opt}
                    {showCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    {showWrong && <XCircle className="w-4 h-4 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {locked && lastGain !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className={cn(
                "px-5 py-2.5 rounded-full font-display font-bold text-lg shadow-glow",
                isCorrect ? "bg-state-success text-void-100" : "bg-state-danger/90 text-white"
              )}
            >
              {isCorrect ? `+${lastGain} XP` : "No points"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
