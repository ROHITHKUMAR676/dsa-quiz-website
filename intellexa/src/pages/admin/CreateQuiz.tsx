import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Send, CalendarClock, FilePlus2, Loader2 } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../lib/backend";
import { ApiError } from "../../lib/api";

interface DraftQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctAnswer: number;
  points: number;
}

let qCounter = 0;
const newQuestion = (): DraftQuestion => ({
  id: qCounter++,
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  points: 100,
});

export default function CreateQuiz() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("WebDev");
  const [timeLimit, setTimeLimit] = useState(20);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([newQuestion()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQuestion = (id: number, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const updateOption = (id: number, index: number, value: string) =>
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.id !== id) return q;
        const options = [...q.options] as [string, string, string, string];
        options[index] = value;
        return { ...q, options };
      })
    );

  const addQuestion = () => setQuestions((qs) => [...qs, newQuestion()]);
  const removeQuestion = (id: number) => setQuestions((qs) => qs.filter((q) => q.id !== id));

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.some((question) => !question.question.trim() || question.options.some((option) => !option.trim()))) {
      showToast("Please complete every question and option before publishing.", "error");
      return;
    }

    const now = new Date();
    const startsAt = scheduleMode === "later" ? new Date(`${date}T${time}`) : now;
    if (Number.isNaN(startsAt.getTime())) {
      showToast("Please choose a valid schedule time.", "error");
      return;
    }
    // The quiz stays open for a fixed 1-hour window after it goes live -
    // this is completely separate from `timeLimit`, which is only the
    // per-question countdown a student sees once they've entered the
    // arena. Do NOT derive endsAt from timeLimit * questionCount: that
    // made the quiz's entire availability window as short as a single
    // question's timer, closing it to students within minutes.
    const QUIZ_WINDOW_MINUTES = 60;
    const endsAt = new Date(startsAt.getTime() + QUIZ_WINDOW_MINUTES * 60 * 1000);
    const totalSeconds = Math.max(timeLimit * questions.length, 60);

    setIsSubmitting(true);
    try {
      const { quiz } = await adminApi.createQuiz({
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim(),
        difficulty: difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
        competitionDate: startsAt.toISOString(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        timezone: "Asia/Kolkata",
        timeLimit: totalSeconds,
        timeLimitPerQuestion: timeLimit,
      });

      await Promise.all(
        questions.map((question, index) =>
          adminApi.createQuestion(quiz.id, {
            questionText: question.question.trim(),
            difficulty: difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
            points: question.points,
            order: index + 1,
            options: question.options.map((option, optionIndex) => ({
              optionText: option.trim(),
              optionOrder: optionIndex + 1,
              isCorrect: question.correctAnswer === optionIndex,
            })),
          })
        )
      );

      if (scheduleMode === "later") {
        await adminApi.scheduleQuiz(quiz.id, {
          competitionDate: startsAt.toISOString(),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          timezone: "Asia/Kolkata",
          defaultWindowMinutes: QUIZ_WINDOW_MINUTES,
        });
      } else {
        await adminApi.publishQuiz(quiz.id);
      }

      showToast(scheduleMode === "now" ? `"${title}" published to students` : `"${title}" scheduled successfully`, "success");
      navigate("/admin");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't save the quiz. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePublish} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <FilePlus2 className="w-6 h-6 text-neon-blue" /> Create Quiz
        </h1>
        <p className="text-ink-dim text-sm">Build an MCQ quiz for the arena.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Quiz Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React Hooks Deep Dive"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
            />
          </div>
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="WebDev / DSA"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-dim mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short summary shown on the quiz card"
            className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Time Limit / Q (sec)</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-ink">Questions ({questions.length})</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
            <Plus className="w-3.5 h-3.5" /> Add Question
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {questions.map((q, qi) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neon-cyan">QUESTION {qi + 1}</span>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(q.id)} className="text-ink-faint hover:text-state-danger">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  required
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                  placeholder="Enter the question"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(q.id, { correctAnswer: oi })}
                        className="accent-neon-blue shrink-0"
                      />
                      <input
                        required
                        value={opt}
                        onChange={(e) => updateOption(q.id, oi, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className="flex-1 px-3 py-2 rounded-lg bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
                      />
                    </div>
                  ))}
                </div>
                <div className="w-32">
                  <label className="text-xs text-ink-dim mb-1 block">Points</label>
                  <input
                    type="number"
                    value={q.points}
                    onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Card className="p-5 space-y-4">
        <h3 className="font-display font-semibold text-ink">Publishing</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScheduleMode("now")}
            disabled={isSubmitting}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${scheduleMode === "now" ? "bg-aurora text-white border-transparent shadow-glow" : "bg-surface-light border-surface-border text-ink-dim"}`}
          >
            Publish Now
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode("later")}
            disabled={isSubmitting}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${scheduleMode === "later" ? "bg-aurora text-white border-transparent shadow-glow" : "bg-surface-light border-surface-border text-ink-dim"}`}
          >
            Schedule Later
          </button>
        </div>
        {scheduleMode === "later" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink-dim mb-1 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
              />
            </div>
            <div>
              <label className="text-xs text-ink-dim mb-1 block">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
              />
            </div>
          </div>
        )}
      </Card>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {scheduleMode === "now" ? "Publish Quiz" : "Schedule Quiz"}
      </Button>
    </form>
  );
}