import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Send, Clock, Laptop, ShieldAlert, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DifficultyBadge from "../../components/ui/DifficultyBadge";
import { codingChallenges } from "../../data/mockData";
import { cn } from "../../lib/utils";

const languages = ["JavaScript", "Python", "C++", "Java"];

export default function CodingEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const challenge = codingChallenges.find((c) => c.id === id) ?? codingChallenges[0];

  const [code, setCode] = useState(challenge.starterCode);
  const [language, setLanguage] = useState(languages[0]);
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit * 60);
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [score, setScore] = useState(1000);
  const [result, setResult] = useState<null | "pass" | "fail">(null);
  const [submitted, setSubmitted] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const violationCount = useRef(0);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !submitted) {
        violationCount.current += 1;
        const n = violationCount.current;
        const deduction = n === 1 ? 5 : n === 2 ? 10 : 20;
        setViolations(n);
        setScore((s) => Math.max(0, s - deduction));
        setWarning(`Focus on the challenge! You lost ${deduction} points.`);
        setTimeout(() => setWarning(null), 3500);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [submitted]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const runCode = () => {
    setRunning(true);
    setOutput(null);
    setTimeout(() => {
      setOutput(`Ran against ${challenge.examples.length} sample case(s).\nExample 1: Output → ${challenge.examples[0]?.output}\nStatus: OK`);
      setRunning(false);
    }, 900);
  };

  const submitCode = () => {
    setSubmitted(true);
    const pass = code.trim().length > challenge.starterCode.trim().length;
    setResult(pass ? "pass" : "fail");
    if (pass) {
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors: ["#4F7CFF", "#A855F7", "#22D3EE"] });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <Card className="p-3 sm:p-4 flex items-center gap-2 border-neon-cyan/30 bg-neon-cyan/5">
        <Laptop className="w-4 h-4 text-neon-cyan shrink-0" />
        <p className="text-xs sm:text-sm text-ink-dim">For the best coding experience, we recommend using a laptop or desktop. You can continue on any device.</p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DifficultyBadge difficulty={challenge.difficulty} />
            {violations > 0 && (
              <span className="flex items-center gap-1 text-xs text-state-danger">
                <ShieldAlert className="w-3.5 h-3.5" /> {violations} violation{violations > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-ink">{challenge.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm font-mono text-ink">
            <Clock className="w-4 h-4 text-neon-blue" /> {minutes}:{seconds.toString().padStart(2, "0")}
          </div>
          <div className="glass px-3 py-2 rounded-xl text-sm font-mono text-state-gold">{score} pts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 max-h-[70dvh] overflow-y-auto space-y-4">
          <div>
            <h3 className="font-display font-semibold text-ink mb-2">Problem Statement</h3>
            <p className="text-ink-dim text-sm whitespace-pre-line">{challenge.problemStatement}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-semibold text-ink-dim mb-1 uppercase tracking-wide">Input</h4>
              <p className="text-xs text-ink-dim">{challenge.inputFormat}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-ink-dim mb-1 uppercase tracking-wide">Output</h4>
              <p className="text-xs text-ink-dim">{challenge.outputFormat}</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-ink-dim mb-1 uppercase tracking-wide">Constraints</h4>
            <p className="text-xs text-ink-dim whitespace-pre-line font-mono">{challenge.constraints}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Examples</h4>
            {challenge.examples.map((ex, i) => (
              <div key={i} className="glass rounded-xl p-3 font-mono text-xs space-y-1">
                <p className="text-ink-dim">Input: <span className="text-ink">{ex.input}</span></p>
                <p className="text-ink-dim">Output: <span className="text-neon-cyan">{ex.output}</span></p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-sm text-ink font-mono outline-none"
              >
                {languages.map((l) => <option key={l} className="bg-surface">{l}</option>)}
              </select>
              <span className="text-[10px] text-ink-faint font-mono">editor.{language.toLowerCase().slice(0, 2)}</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-64 sm:h-80 bg-void-200 text-ink font-mono text-sm p-4 outline-none resize-none"
            />
          </Card>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={runCode} disabled={running} fullWidth>
              <Play className="w-4 h-4" /> {running ? "Running..." : "Run Code"}
            </Button>
            <Button onClick={submitCode} disabled={submitted} fullWidth>
              <Send className="w-4 h-4" /> Submit
            </Button>
          </div>

          {output && (
            <Card className="p-3 font-mono text-xs text-ink-dim whitespace-pre-line">{output}</Card>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={cn("p-4 flex items-center gap-3", result === "pass" ? "border-state-success/40" : "border-state-danger/40")}>
                  {result === "pass" ? (
                    <CheckCircle2 className="w-6 h-6 text-state-success shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-state-danger shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-ink text-sm">{result === "pass" ? "All test cases passed!" : "Some test cases failed"}</p>
                    <p className="text-xs text-ink-dim">Final score: {score} points</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-strong border border-state-danger/40 rounded-xl px-4 py-3 flex items-center gap-2 shadow-card"
          >
            <ShieldAlert className="w-4 h-4 text-state-danger" />
            <p className="text-sm text-ink">{warning}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
