import { useEffect, useState } from "react";
import { BarChart3, Loader2, TriangleAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import Card from "../../components/ui/Card";
import { adminApi, type BackendPlatformStats } from "../../lib/backend";
import { ApiError } from "../../lib/api";

export default function Analytics() {
  const [stats, setStats] = useState<BackendPlatformStats | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi
      .platformStats()
      .then(({ stats }) => {
        if (cancelled) return;
        setStats(stats);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't load analytics. Please try again.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-neon-blue animate-spin" /></div>;
  }

  if (status === "error" || !stats) {
    return (
      <Card className="p-6 text-center">
        <TriangleAlert className="w-6 h-6 text-state-warning mx-auto mb-2" />
        <p className="text-ink text-sm">{errorMessage}</p>
      </Card>
    );
  }

  const peakActivity = stats.weeklyActivity.reduce(
    (best, item) => (item.users > best.users ? item : best),
    { day: "N/A", users: 0, submissions: 0 }
  );
  const lowestCategory = stats.categoryPerformance.reduce(
    (lowest, item) => (item.avgScore < lowest.avgScore ? item : lowest),
    stats.categoryPerformance[0]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-neon-cyan" /> Analytics
        </h1>
        <p className="text-ink-dim text-sm">Engagement and performance across the platform.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Active Users vs Submissions</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232B47" />
                <XAxis dataKey="day" stroke="#5B6488" fontSize={12} />
                <YAxis stroke="#5B6488" fontSize={12} />
                <Tooltip contentStyle={{ background: "#12172A", border: "1px solid #232B47", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="users" stroke="#4F7CFF" strokeWidth={2} name="Active Users" />
                <Line type="monotone" dataKey="submissions" stroke="#22D3EE" strokeWidth={2} name="Submissions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Average Score by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232B47" />
                <XAxis dataKey="category" stroke="#5B6488" fontSize={12} />
                <YAxis stroke="#5B6488" fontSize={12} />
                <Tooltip contentStyle={{ background: "#12172A", border: "1px solid #232B47", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="avgScore" fill="#A855F7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-display font-semibold text-ink mb-4">Key Insights</h3>
        {stats.weeklyActivity.length === 0 && stats.categoryPerformance.length === 0 ? (
          <p className="text-sm text-ink-dim">No analytics data is available yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-ink-dim list-disc list-inside">
            <li>{peakActivity.day} currently has the highest activity with {peakActivity.users.toLocaleString()} active users.</li>
            <li>{stats.totalSubmittedAttempts.toLocaleString()} submitted attempts have been recorded across the platform.</li>
            {lowestCategory && <li>{lowestCategory.category} has the lowest recorded average score at {lowestCategory.avgScore}%.</li>}
          </ul>
        )}
      </Card>
    </div>
  );
}
