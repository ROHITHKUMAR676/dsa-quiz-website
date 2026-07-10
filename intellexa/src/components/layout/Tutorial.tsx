import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Code2, TrendingUp, Award, Flame, BarChart3, User, X } from "lucide-react";
import Button from "../ui/Button";
import { useApp } from "../../context/AppContext";

const steps = [
  { icon: TrendingUp, title: "Your Dashboard", body: "This is home base — greeting, level, XP, streak, and today's challenge all in one glance." },
  { icon: Trophy, title: "Attempt Quizzes", body: "Jump into live MCQ quizzes. Answer fast for bonus points — speed is rewarded here." },
  { icon: Code2, title: "Join Coding Rounds", body: "Solve real DSA problems in a full code editor with test cases and instant feedback." },
  { icon: BarChart3, title: "Track Your Rank", body: "Watch your position shift in real time as you and your peers compete." },
  { icon: Award, title: "Earn Badges", body: "Unlock badges for streaks, speed, accuracy, and milestones as you grind." },
  { icon: Flame, title: "Improve Your Streak", body: "Come back daily to keep your streak alive and multiply your rewards." },
  { icon: User, title: "Your Profile", body: "Showcase your stats, badges, and achievement timeline. Edit anytime." },
];

export default function Tutorial() {
  const { finishTutorial } = useApp();
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;
  const Icon = steps[step].icon;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void-100/85 backdrop-blur-md" />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="relative glass-strong rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-glow"
        >
          <button onClick={finishTutorial} className="absolute top-4 right-4 text-ink-faint hover:text-ink">
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-aurora mx-auto flex items-center justify-center mb-5 shadow-glow animate-pulse-glow">
            <Icon className="w-8 h-8 text-white" />
          </div>

          <p className="text-xs font-mono text-neon-cyan tracking-wider mb-2">
            {step === 0 ? "WELCOME TO INTELLEXA" : `STEP ${step} OF ${steps.length - 1}`}
          </p>
          <h3 className="font-display font-bold text-xl text-ink mb-2">{steps[step].title}</h3>
          <p className="text-ink-dim text-sm mb-6">{steps[step].body}</p>

          <div className="flex items-center justify-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-neon-blue" : "w-1.5 bg-surface-border"}`} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)} fullWidth>
                Previous
              </Button>
            )}
            {!isLast && (
              <Button variant="ghost" onClick={finishTutorial} fullWidth>
                Skip
              </Button>
            )}
            <Button onClick={() => (isLast ? finishTutorial() : setStep((s) => s + 1))} fullWidth>
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
