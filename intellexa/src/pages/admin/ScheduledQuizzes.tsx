import { CalendarClock, Code2, ListChecks, Pencil, Trash2 } from "lucide-react";
import Card from "../../components/ui/Card";
import DifficultyBadge from "../../components/ui/DifficultyBadge";
import BadgePill from "../../components/ui/BadgePill";
import EmptyState from "../../components/ui/EmptyState";
import { quizzes, codingChallenges } from "../../data/mockData";

export default function ScheduledQuizzes() {
  const scheduledQuizzes = quizzes.filter((q) => q.status === "upcoming");
  const scheduledChallenges = codingChallenges.filter((c) => c.status === "upcoming");
  const allScheduled = [
    ...scheduledQuizzes.map((q) => ({ ...q, kind: "quiz" as const })),
    ...scheduledChallenges.map((c) => ({ ...c, kind: "coding" as const })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-state-warning" /> Scheduled Quizzes
        </h1>
        <p className="text-ink-dim text-sm">Upcoming quizzes and coding rounds queued for release.</p>
      </div>

      {allScheduled.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing scheduled" description="Create a quiz or challenge and schedule it for later." />
      ) : (
        <div className="space-y-3">
          {allScheduled.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-surface-light shrink-0">
                {item.kind === "quiz" ? <ListChecks className="w-4.5 h-4.5 text-neon-blue" /> : <Code2 className="w-4.5 h-4.5 text-neon-purple" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <DifficultyBadge difficulty={item.difficulty} />
                </div>
                <p className="text-xs text-ink-faint">
                  {"scheduledAt" in item && item.scheduledAt
                    ? new Date(item.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "Awaiting schedule"}
                </p>
              </div>
              <BadgePill variant="warning" className="hidden sm:inline-flex">Scheduled</BadgePill>
              <div className="flex items-center gap-1 shrink-0">
                <button className="p-2 rounded-lg hover:bg-surface-light text-ink-dim hover:text-ink">
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-state-danger/10 text-ink-dim hover:text-state-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
