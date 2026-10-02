import { useEffect, useState } from "react";
import { Users, Radio, Activity, CheckSquare, CalendarClock, TrendingUp, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import BadgePill from "../../components/ui/BadgePill";
import { Loader2, TriangleAlert } from "lucide-react";
import { adminApi, type BackendAdminQuiz, type BackendPlatformStats } from "../../lib/backend";
import { mapBackendGlobalEntryToLegacy } from "../../lib/leaderboardAdapter";
import { ApiError } from "../../lib/api";
import type { LeaderboardEntry } from "../../types";

function formatQuizTime(quiz: BackendAdminQuiz) {
  const value = quiz.startsAt ?? quiz.createdAt;
  return value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not scheduled";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<BackendPlatformStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<LeaderboardEntry[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<BackendAdminQuiz[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ stats }, { leaderboard }, { quizzes }] = await Promise.all([
          adminApi.platformStats(),
          adminApi.leaderboard(),
          adminApi.listQuizzes(),
        ]);
        if (cancelled) return;
        setStats(stats);
        setTopPerformers(leaderboard.slice(0, 4).map(mapBackendGlobalEntryToLegacy));
        setRecentQuizzes(quizzes.slice(0, 4));
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't load admin dashboard data. Please try again.");
        setStatus("error");
      }
    })();
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">Admin Dashboard</h1>
        <p className="text-ink-dim text-sm">Real-time overview of Intellexa's arena.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Users" value={stats.totalStudents} icon={Users} accent="blue" />
        <StatCard label="Live Participants" value={stats.liveParticipants} icon={Radio} accent="danger" />
        <StatCard label="Completed Quizzes" value={stats.completedQuizzes} icon={CheckSquare} accent="success" />
        <StatCard label="Pending Scheduled" value={stats.pendingScheduled} icon={CalendarClock} accent="warning" />
        <StatCard label="Weekly Active Users" value={stats.activeStudentsLast7Days} icon={TrendingUp} accent="cyan" />
        <Card className="p-4 sm:p-5 col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-neon-blue" />
            <p className="text-ink-dim text-xs sm:text-sm">Today's Quiz</p>
          </div>
          <p className="font-display font-semibold text-ink text-lg">{stats.todaysQuiz ?? "No live quiz"}</p>
          <BadgePill variant={stats.todaysQuiz ? "danger" : "neutral"} className="mt-2">{stats.todaysQuiz ? "Live now" : "Idle"}</BadgePill>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-ink mb-4">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyActivity}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c90c6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6c90c6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8778ED" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#8778ED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#323E5C" />
                <XAxis dataKey="day" stroke="#6e7a9c" fontSize={12} />
                <YAxis stroke="#6e7a9c" fontSize={12} />
                <Tooltip contentStyle={{ background: "#1E2334", border: "1px solid #38425C", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="users" stroke="#6c90c6" fill="url(#colorUsers)" strokeWidth={2} />
                <Area type="monotone" dataKey="submissions" stroke="#8778ED" fill="url(#colorSubs)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Difficulty Split</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.difficultyBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={4}>
                  {stats.difficultyBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1E2334", border: "1px solid #38425C", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {stats.difficultyBreakdown.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-ink-dim">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} /> {d.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-neon-cyan" />
            <h3 className="font-display font-semibold text-ink">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentQuizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-2 shrink-0" />
                <div className="flex-1">
                  <p className="text-ink">{quiz.title}</p>
                  <p className="text-ink-faint text-xs">{quiz.status} / {formatQuizTime(quiz)}</p>
                </div>
              </div>
            ))}
            {recentQuizzes.length === 0 && <p className="text-ink-faint text-sm">No quizzes have been created yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.map((e) => (
              <div key={e.userId} className="flex items-center gap-2">
                <img src={e.avatar} className="w-7 h-7 rounded-full" alt={e.name} />
                <span className="text-sm text-ink flex-1 truncate">{e.name}</span>
                <span className="font-mono text-xs text-neon-cyan">{e.points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
