import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Filter } from "lucide-react";
import Podium from "../../components/domain/Podium";
import LeaderboardRow from "../../components/domain/LeaderboardRow";
import Card from "../../components/ui/Card";
import { leaderboard, currentUser } from "../../data/mockData";
import { cn } from "../../lib/utils";

const filters = ["Overall", "Weekly", "WebDev", "DSA"];

export default function Leaderboard() {
  const [filter, setFilter] = useState("Overall");
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
            <Trophy className="w-6 h-6 text-state-gold" /> Leaderboard
          </h1>
          <p className="text-ink-dim text-sm">See where you stand among Intellexa's finest.</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-xl p-1">
          <Filter className="w-3.5 h-3.5 text-ink-faint ml-2" />
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === f ? "bg-aurora text-white shadow-glow" : "text-ink-dim hover:text-ink"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Podium top3={top3} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {rest.map((entry) => (
          <LeaderboardRow key={entry.userId} entry={entry} highlight={entry.userId === currentUser.id} />
        ))}
      </motion.div>

      <Card className="p-4 sm:p-5 flex items-center justify-between gap-3 border-neon-blue/30 bg-neon-blue/5 sticky bottom-20 lg:bottom-4">
        <div className="flex items-center gap-3">
          <img src={currentUser.avatar} className="w-9 h-9 rounded-full" alt="you" />
          <div>
            <p className="text-sm text-ink font-medium">You're rank #{currentUser.rank}</p>
            <p className="text-xs text-ink-dim">Climb 3 more spots to hit the top 5</p>
          </div>
        </div>
        <span className="font-mono text-neon-cyan text-sm shrink-0">{currentUser.xp.toLocaleString()} XP</span>
      </Card>
    </div>
  );
}
