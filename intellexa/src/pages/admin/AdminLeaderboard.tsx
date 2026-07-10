import { Trophy } from "lucide-react";
import Podium from "../../components/domain/Podium";
import LeaderboardRow from "../../components/domain/LeaderboardRow";
import { leaderboard } from "../../data/mockData";

export default function AdminLeaderboard() {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <Trophy className="w-6 h-6 text-state-gold" /> Leaderboard
        </h1>
        <p className="text-ink-dim text-sm">Platform-wide student rankings.</p>
      </div>
      <Podium top3={top3} />
      <div className="space-y-2">
        {rest.map((entry) => <LeaderboardRow key={entry.userId} entry={entry} />)}
      </div>
    </div>
  );
}
