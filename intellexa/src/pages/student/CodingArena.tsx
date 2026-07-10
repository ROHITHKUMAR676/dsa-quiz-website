import { useState } from "react";
import { motion } from "framer-motion";
import { ListChecks, Code2 } from "lucide-react";
import QuizCard from "../../components/domain/QuizCard";
import CodingCard from "../../components/domain/CodingCard";
import EmptyState from "../../components/ui/EmptyState";
import { quizzes, codingChallenges } from "../../data/mockData";
import { cn } from "../../lib/utils";

export default function CodingArena() {
  const [tab, setTab] = useState<"quiz" | "coding">("coding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Coding Arena</h1>
        <p className="text-ink-dim text-sm">Quizzes and coding rounds — live, upcoming, and completed.</p>
      </div>

      <div className="flex gap-2 glass rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("coding")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            tab === "coding" ? "bg-aurora text-white shadow-glow" : "text-ink-dim hover:text-ink"
          )}
        >
          <Code2 className="w-4 h-4" /> Coding
        </button>
        <button
          onClick={() => setTab("quiz")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            tab === "quiz" ? "bg-aurora text-white shadow-glow" : "text-ink-dim hover:text-ink"
          )}
        >
          <ListChecks className="w-4 h-4" /> Quizzes
        </button>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {tab === "quiz" &&
          (quizzes.length ? quizzes.map((q) => <QuizCard key={q.id} quiz={q} />) : (
            <EmptyState icon={ListChecks} title="No quizzes yet" description="Check back soon for new quizzes." />
          ))}
        {tab === "coding" &&
          (codingChallenges.length ? codingChallenges.map((c) => <CodingCard key={c.id} challenge={c} />) : (
            <EmptyState icon={Code2} title="No coding rounds yet" description="Check back soon for new challenges." />
          ))}
      </motion.div>
    </div>
  );
}
