import { motion } from "framer-motion";
import { Flame, Coins, Trophy, Zap, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProgressRing from "../../components/ui/ProgressRing";
import XPBar from "../../components/ui/XPBar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import BadgePill from "../../components/ui/BadgePill";
import QuizCard from "../../components/domain/QuizCard";
import CodingCard from "../../components/domain/CodingCard";
import AchievementCard from "../../components/domain/AchievementCard";
import { currentUser, quizzes, codingChallenges, leaderboard } from "../../data/mockData";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const liveQuiz = quizzes.find((q) => q.status === "live");
  const upcomingQuizzes = quizzes.filter((q) => q.status === "upcoming");
  const liveChallenge = codingChallenges.find((c) => c.status === "live");
  const recentBadges = currentUser.badges.filter((b) => b.earned).slice(0, 4);
  const topRanks = leaderboard.slice(0, 5);
  const todayProgress = 62;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Greeting + hero stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 sm:p-7 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-neon-purple/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-neon-blue/15 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-ink-dim text-sm mb-1">Welcome back,</p>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-3">{currentUser.name.split(" ")[0]} ⚡</h1>
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <BadgePill variant="blue" size="md"><Trophy className="w-3.5 h-3.5" /> Rank #{currentUser.rank}</BadgePill>
                <BadgePill variant="purple" size="md">{currentUser.tier}</BadgePill>
                <BadgePill variant="warning" size="md"><Flame className="w-3.5 h-3.5" /> {currentUser.streak}-day streak</BadgePill>
                <BadgePill variant="neutral" size="md"><Coins className="w-3.5 h-3.5 text-state-gold" /> {currentUser.coins.toLocaleString()}</BadgePill>
              </div>
              <XPBar xp={currentUser.xp} xpToNext={currentUser.xpToNextLevel} level={currentUser.level} />
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ProgressRing progress={todayProgress} size={110} strokeWidth={9}>
                <div className="text-center">
                  <p className="font-display font-bold text-xl text-ink">{todayProgress}%</p>
                  <p className="text-[10px] text-ink-faint">today</p>
                </div>
              </ProgressRing>
              <p className="text-xs text-ink-dim">Today's Challenge</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Live sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-neon-cyan" /> Live &amp; Upcoming
            </h2>
            <button onClick={() => navigate("/student/coding")} className="text-xs text-neon-blue flex items-center hover:underline">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liveQuiz && <QuizCard quiz={liveQuiz} />}
            {liveChallenge && <CodingCard challenge={liveChallenge} />}
            {upcomingQuizzes.slice(0, 2).map((q) => <QuizCard key={q.id} quiz={q} />)}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-ink">Leaderboard</h2>
            <button onClick={() => navigate("/student/leaderboard")} className="text-xs text-neon-blue flex items-center hover:underline">
              Full <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <Card className="p-3 space-y-1">
            {topRanks.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 px-2 py-2 rounded-xl ${entry.userId === currentUser.id ? "bg-neon-blue/10" : ""}`}
              >
                <span className="w-5 text-center font-mono text-xs text-ink-faint">{entry.rank}</span>
                <img src={entry.avatar} className="w-8 h-8 rounded-full" alt={entry.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{entry.name}</p>
                </div>
                <span className="font-mono text-xs text-neon-cyan">{entry.points.toLocaleString()}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Badges + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-ink">Recent Badges</h2>
            <button onClick={() => navigate("/student/profile")} className="text-xs text-neon-blue flex items-center hover:underline">
              All badges <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentBadges.map((b) => <AchievementCard key={b.id} badge={b} />)}
          </div>
        </div>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Weekly Progress</h3>
          <div className="space-y-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-xs text-ink-faint w-8">{day}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-light overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${[70, 45, 90, 60, 85][i]}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-aurora rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" fullWidth className="mt-5" onClick={() => navigate("/student/coding")}>
            <Zap className="w-4 h-4" /> Keep the momentum
          </Button>
        </Card>
      </div>
    </div>
  );
}
