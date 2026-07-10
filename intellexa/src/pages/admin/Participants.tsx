import { useState } from "react";
import { Users, Search } from "lucide-react";
import Card from "../../components/ui/Card";
import BadgePill from "../../components/ui/BadgePill";
import { leaderboard } from "../../data/mockData";

export default function Participants() {
  const [query, setQuery] = useState("");
  const filtered = leaderboard.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
            <Users className="w-6 h-6 text-neon-blue" /> Participants
          </h1>
          <p className="text-ink-dim text-sm">1,284 students registered on Intellexa.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
          />
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-surface-border text-ink-faint text-xs uppercase tracking-wide">
              <th className="text-left px-5 py-3">Student</th>
              <th className="text-left px-5 py-3">Department</th>
              <th className="text-left px-5 py-3">Tier</th>
              <th className="text-left px-5 py-3">XP</th>
              <th className="text-left px-5 py-3">Streak</th>
              <th className="text-left px-5 py-3">Badges</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.userId} className="border-b border-surface-border/50 hover:bg-surface-light/40 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <img src={p.avatar} className="w-8 h-8 rounded-full" alt={p.name} />
                    <span className="text-ink font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-dim">{p.department}</td>
                <td className="px-5 py-3"><BadgePill variant="purple">{p.tier}</BadgePill></td>
                <td className="px-5 py-3 font-mono text-ink">{p.xp.toLocaleString()}</td>
                <td className="px-5 py-3 text-ink-dim">{p.streak} days</td>
                <td className="px-5 py-3 text-ink-dim">{p.badges}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
