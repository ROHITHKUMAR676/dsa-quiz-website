import { useEffect, useState } from "react";
import { Users, Search, Loader2, TriangleAlert } from "../../components/pixel/PixelLucide";
import Card from "../../components/ui/Card";
import BadgePill from "../../components/ui/BadgePill";
import EmptyState from "../../components/ui/EmptyState";
import { adminApi, type BackendParticipant } from "../../lib/backend";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/api";

function tierFromXp(xp: number) {
  if (xp >= 8000) return "Grandmaster";
  if (xp >= 6000) return "Champion";
  if (xp >= 4000) return "Legend";
  if (xp >= 2000) return "Elite";
  if (xp >= 1000) return "Gold";
  if (xp >= 300) return "Silver";
  return "Bronze";
}

export default function Participants() {
  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState<BackendParticipant[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi
      .participants()
      .then(({ participants }) => {
        if (cancelled) return;
        setParticipants(participants);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't load participants. Please try again.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedQuery = query.toLowerCase();
  const filtered = participants.filter((p) =>
    [p.fullName, p.email, p.department, p.registerNumber].some((value) => value?.toLowerCase().includes(normalizedQuery))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
            <Users className="w-6 h-6 text-neon-blue" /> Participants
          </h1>
          <p className="text-ink-dim text-sm">{participants.length.toLocaleString()} students registered on Codexa.</p>
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

      {status === "ready" && filtered.length === 0 ? (
        <EmptyState icon={Users} title="No participants found" description={query ? "Try a different search." : "Students will appear here after they register."} />
      ) : status === "ready" ? (
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
              {filtered.map((p) => {
                const avatar = resolveApiAsset(p.avatar) ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(p.fullName)}&backgroundColor=1A2038`;
                return (
                  <tr key={p.id} className="border-b border-surface-border/50 hover:bg-surface-light/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={avatar} className="w-8 h-8 rounded-full" alt={p.fullName} />
                        <span className="text-ink font-medium">{p.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-dim">{p.department ?? "Not set"}</td>
                    <td className="px-5 py-3"><BadgePill variant="purple">{tierFromXp(p.xp)}</BadgePill></td>
                    <td className="px-5 py-3 font-mono text-ink">{p.xp.toLocaleString()}</td>
                    <td className="px-5 py-3 text-ink-dim">{p.currentStreak} days</td>
                    <td className="px-5 py-3 text-ink-dim">{p._count.badges}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
}
