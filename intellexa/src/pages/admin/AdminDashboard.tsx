import { Users, Radio, Activity, CheckSquare, CalendarClock, Code2, TrendingUp, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import BadgePill from "../../components/ui/BadgePill";
import { adminStats, weeklyActivity, difficultyBreakdown, leaderboard } from "../../data/mockData";

const recentActivity = [
  { text: "Meera Iyer completed React Hooks Deep Dive", time: "2m ago" },
  { text: "45 new participants joined the coding round", time: "12m ago" },
  { text: "Rohan Das earned DSA Warrior badge", time: "28m ago" },
  { text: "Graph Traversals quiz scheduled for Jul 12", time: "1h ago" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">Admin Dashboard</h1>
        <p className="text-ink-dim text-sm">Real-time overview of Intellexa's arena.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Users" value={adminStats.totalUsers} icon={Users} accent="blue" trend="+38 this week" />
        <StatCard label="Live Participants" value={adminStats.liveParticipants} icon={Radio} accent="danger" />
        <StatCard label="Completed Quizzes" value={adminStats.completedQuizzes} icon={CheckSquare} accent="success" />
        <StatCard label="Pending Scheduled" value={adminStats.pendingScheduled} icon={CalendarClock} accent="warning" />
        <StatCard label="Coding Challenges" value={adminStats.codingChallenges} icon={Code2} accent="purple" />
        <StatCard label="Weekly Active Users" value={adminStats.weeklyActiveUsers} icon={TrendingUp} accent="cyan" trend="+12% vs last week" />
        <Card className="p-4 sm:p-5 col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-neon-blue" />
            <p className="text-ink-dim text-xs sm:text-sm">Today's Quiz</p>
          </div>
          <p className="font-display font-semibold text-ink text-lg">{adminStats.todaysQuiz}</p>
          <BadgePill variant="danger" className="mt-2">Live now</BadgePill>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-ink mb-4">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivity}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F7CFF" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#4F7CFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232B47" />
                <XAxis dataKey="day" stroke="#5B6488" fontSize={12} />
                <YAxis stroke="#5B6488" fontSize={12} />
                <Tooltip contentStyle={{ background: "#12172A", border: "1px solid #232B47", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="users" stroke="#4F7CFF" fill="url(#colorUsers)" strokeWidth={2} />
                <Area type="monotone" dataKey="submissions" stroke="#A855F7" fill="url(#colorSubs)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Difficulty Split</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={difficultyBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={4}>
                  {difficultyBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#12172A", border: "1px solid #232B47", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {difficultyBreakdown.map((d) => (
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
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-2 shrink-0" />
                <div className="flex-1">
                  <p className="text-ink">{a.text}</p>
                  <p className="text-ink-faint text-xs">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Top Performers</h3>
          <div className="space-y-3">
            {leaderboard.slice(0, 4).map((e) => (
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
