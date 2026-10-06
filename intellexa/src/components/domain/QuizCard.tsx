import { Clock, Users, Radio, CalendarClock, CheckCircle2 } from "../pixel/PixelLucide";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import DifficultyBadge from "../ui/DifficultyBadge";
import Button from "../ui/Button";
import BadgePill from "../ui/BadgePill";
import type { Quiz } from "../../types";

export default function QuizCard({ quiz }: { quiz: Quiz }) {
  const navigate = useNavigate();

  const statusConfig = {
    live: { icon: Radio, label: "Live now", cls: "danger" as const },
    upcoming: { icon: CalendarClock, label: "Scheduled", cls: "warning" as const },
    completed: { icon: CheckCircle2, label: "Completed", cls: "success" as const },
  };
  const status = statusConfig[quiz.status];
  const StatusIcon = status.icon;

  return (
    <Card hover glow="blue" className="p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <DifficultyBadge difficulty={quiz.difficulty} />
          <BadgePill variant="neutral">{quiz.category}</BadgePill>
        </div>
        <BadgePill variant={status.cls}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
          {quiz.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-state-danger animate-pulse ml-0.5" />}
        </BadgePill>
      </div>

      <div>
        <h3 className="font-display font-semibold text-lg text-ink mb-1">{quiz.title}</h3>
        <p className="text-ink-dim text-sm line-clamp-2">{quiz.description}</p>
      </div>

      <div className="flex items-center gap-4 text-xs text-ink-faint mt-auto pt-2 border-t border-surface-border">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> {quiz.timeLimitPerQuestion}s/question
        </span>
        {typeof quiz.participants === "number" && (
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {quiz.participants}
          </span>
        )}
      </div>

      <Button
        variant={quiz.status === "live" ? "primary" : "secondary"}
        fullWidth
        disabled={quiz.status === "upcoming"}
        onClick={() =>
          navigate(
            quiz.status === "completed" || (quiz.status === "live" && quiz.hasAttempted)
              ? `/student/quiz/${quiz.id}/results`
              : `/student/quiz/${quiz.id}`
          )
        }
      >
        {quiz.status === "live"
          ? quiz.hasAttempted
            ? "View Results"
            : "Enter Arena"
          : quiz.status === "upcoming"
          ? `Starts ${quiz.scheduledAt ? new Date(quiz.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "soon"}`
          : "View Results"}
      </Button>
    </Card>
  );
}