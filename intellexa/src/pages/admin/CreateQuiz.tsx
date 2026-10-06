import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Send, CalendarClock, FilePlus2, Loader2 } from "../../components/pixel/PixelLucide";
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
}

let qCounter = 0;
const newQuestion = (): DraftQuestion => ({
  id: qCounter++,
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
});

function currentIstDateKey() {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default function CreateQuiz() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("WebDev");
  const [quizDate, setQuizDate] = useState(currentIstDateKey());
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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(quizDate)) {
      showToast("Choose the quiz day.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const { quiz } = await adminApi.createQuiz({
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim(),
        difficulty: difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
        timeLimit: 3600,
      });

      await Promise.all(
        questions.map((question, index) =>
          adminApi.createQuestion(quiz.id, {
            questionText: question.question.trim(),
            difficulty: difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
            points: 100,
            order: index + 1,
            options: question.options.map((option, optionIndex) => ({
              optionText: option.trim(),
              optionOrder: optionIndex + 1,
              isCorrect: question.correctAnswer === optionIndex,
            })),
          })
        )
      );

      await adminApi.scheduleQuiz(quiz.id, { competitionDate: quizDate });

      showToast(`"${title}" scheduled for ${quizDate} at 8:00 PM IST`, "success");
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
          <p className="text-xs text-ink-dim self-end pb-3">Each question has a fixed 30-second timer.</p>
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
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Card className="p-5 space-y-4">
        <h3 className="font-display font-semibold text-ink">Daily quiz schedule</h3>
        <p className="text-xs text-ink-dim">The quiz opens at 8:00 PM IST and closes at 9:00 PM IST on this day.</p>
        <label className="text-xs text-ink-dim mb-1 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> Quiz day (IST)</label>
        <input type="date" required value={quizDate} onChange={(e) => setQuizDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50" />
      </Card>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Schedule Daily Quiz
      </Button>
    </form>
  );
}
