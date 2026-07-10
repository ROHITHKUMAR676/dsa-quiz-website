import { useState } from "react";
import { Send, Code2, CalendarClock, Plus, Trash2 } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";

interface Example { input: string; output: string }

export default function CreateChallenge() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [constraints, setConstraints] = useState("");
  const [examples, setExamples] = useState<Example[]>([{ input: "", output: "" }]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [starterCode, setStarterCode] = useState("function solve() {\n  // your code here\n}");
  const [testCases, setTestCases] = useState("");
  const [hiddenTestCases, setHiddenTestCases] = useState("");
  const [timeLimit, setTimeLimit] = useState(45);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const addExample = () => setExamples((ex) => [...ex, { input: "", output: "" }]);
  const removeExample = (i: number) => setExamples((ex) => ex.filter((_, idx) => idx !== i));
  const updateExample = (i: number, key: keyof Example, val: string) =>
    setExamples((ex) => ex.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)));

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      scheduleMode === "now" ? `"${title || "Challenge"}" published to all students` : `"${title || "Challenge"}" scheduled successfully`,
      "success"
    );
    navigate("/admin");
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50";

  return (
    <form onSubmit={handlePublish} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <Code2 className="w-6 h-6 text-neon-purple" /> Create Coding Challenge
        </h1>
        <p className="text-ink-dim text-sm">Design a DSA problem for the coding arena.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Challenge Title</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Longest Palindromic Substring" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputCls}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-dim mb-1 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls + " resize-none"} placeholder="Short summary shown on the challenge card" />
        </div>
        <div>
          <label className="text-xs text-ink-dim mb-1 block">Problem Statement</label>
          <textarea required value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} rows={4} className={inputCls + " resize-none"} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Input Format</label>
            <textarea value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} rows={2} className={inputCls + " resize-none"} />
          </div>
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Output Format</label>
            <textarea value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} rows={2} className={inputCls + " resize-none"} />
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-dim mb-1 block">Constraints</label>
          <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={2} className={inputCls + " resize-none font-mono"} />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink">Examples</h3>
          <Button type="button" variant="secondary" size="sm" onClick={addExample}>
            <Plus className="w-3.5 h-3.5" /> Add Example
          </Button>
        </div>
        {examples.map((ex, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <input value={ex.input} onChange={(e) => updateExample(i, "input", e.target.value)} placeholder="Input" className={inputCls + " font-mono"} />
            <div className="flex gap-2">
              <input value={ex.output} onChange={(e) => updateExample(i, "output", e.target.value)} placeholder="Output" className={inputCls + " font-mono"} />
              {examples.length > 1 && (
                <button type="button" onClick={() => removeExample(i)} className="text-ink-faint hover:text-state-danger shrink-0 px-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <label className="text-xs text-ink-dim mb-1 block">Starter Code</label>
          <textarea value={starterCode} onChange={(e) => setStarterCode(e.target.value)} rows={5} className={inputCls + " font-mono resize-none"} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Test Cases</label>
            <textarea value={testCases} onChange={(e) => setTestCases(e.target.value)} rows={3} className={inputCls + " font-mono resize-none"} placeholder="Visible to students" />
          </div>
          <div>
            <label className="text-xs text-ink-dim mb-1 block">Hidden Test Cases</label>
            <textarea value={hiddenTestCases} onChange={(e) => setHiddenTestCases(e.target.value)} rows={3} className={inputCls + " font-mono resize-none"} placeholder="Used for final scoring only" />
          </div>
        </div>
        <div className="w-40">
          <label className="text-xs text-ink-dim mb-1 block">Time Limit (min)</label>
          <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className={inputCls} />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-display font-semibold text-ink">Publishing</h3>
        <div className="flex gap-2">
          <button type="button" onClick={() => setScheduleMode("now")} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${scheduleMode === "now" ? "bg-aurora text-white border-transparent shadow-glow" : "bg-surface-light border-surface-border text-ink-dim"}`}>
            Publish Now
          </button>
          <button type="button" onClick={() => setScheduleMode("later")} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${scheduleMode === "later" ? "bg-aurora text-white border-transparent shadow-glow" : "bg-surface-light border-surface-border text-ink-dim"}`}>
            Schedule Later
          </button>
        </div>
        {scheduleMode === "later" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink-dim mb-1 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-ink-dim mb-1 block">Time</label>
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}
      </Card>

      <Button type="submit" size="lg">
        <Send className="w-4 h-4" /> {scheduleMode === "now" ? "Publish Challenge" : "Schedule Challenge"}
      </Button>
    </form>
  );
}
