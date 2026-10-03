import { useEffect, useState } from "react";
import { CalendarClock, ListChecks, Pencil, Trash2, Loader2, TriangleAlert } from "lucide-react";
import Card from "../../components/ui/Card";
import DifficultyBadge from "../../components/ui/DifficultyBadge";
import BadgePill from "../../components/ui/BadgePill";
import EmptyState from "../../components/ui/EmptyState";
import { adminApi, type BackendAdminQuiz } from "../../lib/backend";
import { ApiError } from "../../lib/api";

const difficultyMap = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" } as const;

export default function ScheduledQuizzes() {
  const [quizzes, setQuizzes] = useState<BackendAdminQuiz[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi
      .listQuizzes("SCHEDULED")
      .then(({ quizzes }) => {
        if (cancelled) return;
        setQuizzes(quizzes);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't load scheduled quizzes. Please try again.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const deleteQuiz = async (id: string) => {
    const previous = quizzes;
    setQuizzes((items) => items.filter((quiz) => quiz.id !== id));
    try {
      await adminApi.deleteQuiz(id);
    } catch {
      setQuizzes(previous);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-state-warning" /> Scheduled Quizzes
        </h1>
        <p className="text-ink-dim text-sm">Daily quizzes open automatically at 8:00 PM IST and close at 9:00 PM IST.</p>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
        </div>
      )}

      {status === "error" && (
        <Card className="p-6 text-center">
          <TriangleAlert className="w-6 h-6 text-state-warning mx-auto mb-2" />
          <p className="text-ink text-sm">{errorMessage}</p>
        </Card>
      )}

      {status === "ready" && quizzes.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing scheduled" description="Create a quiz and choose its daily release date." />
      ) : status === "ready" ? (
        <div className="space-y-3">
          {quizzes.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-surface-light shrink-0">
                <ListChecks className="w-4.5 h-4.5 text-neon-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <DifficultyBadge difficulty={difficultyMap[item.difficulty]} />
                </div>
                <p className="text-xs text-ink-faint">
                  {item.startsAt
                    ? new Date(item.startsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " IST"
                    : "Awaiting schedule"}
                </p>
              </div>
              <BadgePill variant="warning" className="hidden sm:inline-flex">Scheduled</BadgePill>
              <div className="flex items-center gap-1 shrink-0">
                <button disabled className="p-2 rounded-lg text-ink-faint opacity-50">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteQuiz(item.id)} className="p-2 rounded-lg hover:bg-state-danger/10 text-ink-dim hover:text-state-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
