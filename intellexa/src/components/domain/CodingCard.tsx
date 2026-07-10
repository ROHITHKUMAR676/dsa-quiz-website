import { Code2, Users, Timer, Radio, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import DifficultyBadge from "../ui/DifficultyBadge";
import Button from "../ui/Button";
import BadgePill from "../ui/BadgePill";
import type { CodingChallenge } from "../../types";

export default function CodingCard({ challenge }: { challenge: CodingChallenge }) {
  const navigate = useNavigate();
  const isLive = challenge.status === "live";

  return (
    <Card hover glow="purple" className="p-5 flex flex-col gap-4 h-full relative">
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-purple/20 rounded-full blur-3xl" />
      <div className="flex items-start justify-between gap-2 relative">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-neon-purple/15">
            <Code2 className="w-4 h-4 text-neon-purple" />
          </div>
          <DifficultyBadge difficulty={challenge.difficulty} />
        </div>
        <BadgePill variant={isLive ? "danger" : "warning"}>
          {isLive ? <Radio className="w-3 h-3" /> : <CalendarClock className="w-3 h-3" />}
          {isLive ? "Live" : "Upcoming"}
        </BadgePill>
      </div>

      <div>
        <h3 className="font-display font-semibold text-lg text-ink mb-1">{challenge.title}</h3>
        <p className="text-ink-dim text-sm line-clamp-2">{challenge.description}</p>
      </div>

      <div className="flex items-center gap-4 text-xs text-ink-faint mt-auto pt-2 border-t border-surface-border">
        <span className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5" /> {challenge.timeLimit} min
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {challenge.participants}
        </span>
      </div>

      <Button
        variant={isLive ? "primary" : "secondary"}
        fullWidth
        disabled={!isLive}
        onClick={() => navigate(`/student/coding/${challenge.id}`)}
      >
        {isLive ? "Open Editor" : "Not started yet"}
      </Button>
    </Card>
  );
}
