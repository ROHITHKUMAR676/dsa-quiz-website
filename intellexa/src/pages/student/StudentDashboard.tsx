import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Coins, Trophy, Zap, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProgressRing from "../../components/ui/ProgressRing";
import XPBar from "../../components/ui/XPBar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import BadgePill from "../../components/ui/BadgePill";
import QuizCard from "../../components/domain/QuizCard";
import AchievementCard from "../../components/domain/AchievementCard";
import DailyChallengeTimer from "../../components/domain/DailyChallengeTimer";
import { useApp } from "../../context/AppContext";
import { studentQuizApi, leaderboardApi, studentGamificationApi } from "../../lib/backend";
import { mapBackendQuizToLegacy } from "../../lib/quizAdapter";
import { mapBackendGlobalEntryToLegacy } from "../../lib/leaderboardAdapter";
import { mapBackendBadgeToLegacy } from "../../lib/badgeAdapter";
import type { Quiz, LeaderboardEntry, Badge } from "../../types";

// XP-to-level curve is presentational only - the backend tracks raw XP,
// not a "level" concept, so this derives one client-side for the UI.
function levelFromXp(xp: number) {
  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const xpToNextLevel = level * 250;
  return { level, xpToNextLevel };
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useApp();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [topRanks, setTopRanks] = useState<LeaderboardEntry[]>([]);
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ quizzes: backendQuizzes }, { leaderboard: globalLeaderboard }, { badges }] = await Promise.all([
          studentQuizApi.list(),
          leaderboardApi.global(),
          studentGamificationApi.badges(),
        ]);
        if (cancelled) return;
        setQuizzes(backendQuizzes.map(mapBackendQuizToLegacy));
        setTopRanks(globalLeaderboard.slice(0, 5).map(mapBackendGlobalEntryToLegacy));
        setRecentBadges(badges.filter((badge) => badge.earned).slice(0, 4).map(mapBackendBadgeToLegacy));
      } catch {
        // Dashboard degrades gracefully to empty sections rather than a
        // hard error - the person can still navigate elsewhere.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * The moment the daily timer challenge's countdown reaches zero, ping the
   * quiz's daily leaderboard once in the background. The backend
   * auto-finalizes results (awarding rank/points) the first time that
   * endpoint is hit after the quiz's window + release delay elapse - so
   * without this, points/rank only ever appeared once *some* student
   * happened to open a results page. Then refresh the dashboard's own
   * quizzes + leaderboard so the change shows up without a manual reload.
   */
  const handleLiveQuizClosed = async (quizId: string) => {
    try {
      await leaderboardApi.daily(quizId);
      const [{ quizzes: backendQuizzes }, { leaderboard: globalLeaderboard }] = await Promise.all([
        studentQuizApi.list(),
        leaderboardApi.global(),
      ]);
      setQuizzes(backendQuizzes.map(mapBackendQuizToLegacy));
      setTopRanks(globalLeaderboard.slice(0, 5).map(mapBackendGlobalEntryToLegacy));
    } catch {
      // Best-effort - the next visit to the results page will finalize and
      // refresh things regardless.
    }
  };

  const liveQuiz = quizzes.find((q) => q.status === "live");
  const upcomingQuizzes = quizzes.filter((q) => q.status === "upcoming");

  const displayName = user?.fullName ?? "Student";
  const xp = user?.xp ?? 0;
  const coins = user?.coins ?? 0;
  const streak = user?.currentStreak ?? 0;
  const { level, xpToNextLevel } = levelFromXp(xp);
  const myRank = topRanks.find((entry) => user && entry.userId === user.id)?.rank;
  const todayProgress = liveQuiz ? 0 : 100;
  const completedCount = quizzes.filter((q) => q.status === "completed").length;
  const totalVisibleQuizzes = quizzes.length;
  const quizProgress = totalVisibleQuizzes ? Math.round((completedCount / totalVisibleQuizzes) * 100) : 0;
  const quizStats = [
    { label: "Live", value: liveQuiz ? 1 : 0 },
    { label: "Upcoming", value: upcomingQuizzes.length },
    { label: "Completed", value: completedCount },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Greeting + hero stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card data-tour="dashboard-hero" className="p-5 sm:p-7 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-neon-purple/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-neon-blue/15 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-ink-dim text-sm mb-1">Welcome back,</p>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-3">{displayName.split(" ")[0]} ⚡</h1>
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <BadgePill variant="blue" size="md"><Trophy className="w-3.5 h-3.5" /> {myRank ? `Rank #${myRank}` : "Unranked"}</BadgePill>
                <BadgePill variant="warning" size="md"><Flame className="w-3.5 h-3.5" /> {streak}-day streak</BadgePill>
                <BadgePill variant="neutral" size="md"><Coins className="w-3.5 h-3.5 text-state-gold" /> {coins.toLocaleString()}</BadgePill>
              </div>
              <XPBar xp={xp} xpToNext={xpToNextLevel} level={level} />
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ProgressRing progress={todayProgress} size={110} strokeWidth={9}>
                <div className="text-center">
                  <p className="font-display font-bold text-xl text-ink">{todayProgress}%</p>
                  <p className="text-[10px] text-ink-faint">today</p>
                </div>
              </ProgressRing>
              <p className="text-xs text-ink-dim">Today's Quiz</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Daily timer challenge */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <DailyChallengeTimer liveQuiz={liveQuiz} upcomingQuiz={upcomingQuizzes[0]} onLiveQuizClosed={handleLiveQuizClosed} />
      </motion.div>

      {/* Live sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-neon-cyan" /> Live &amp; Upcoming
            </h2>
            <button onClick={() => navigate("/student/leaderboard")} className="text-xs text-neon-blue flex items-center hover:underline">
              Leaderboard <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-neon-blue animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {liveQuiz && (
                <div data-tour="live-quiz">
                  <QuizCard quiz={liveQuiz} />
                </div>
              )}
              {upcomingQuizzes.slice(0, 2).map((q) => <QuizCard key={q.id} quiz={q} />)}
              {!liveQuiz && upcomingQuizzes.length === 0 && (
                <p className="text-ink-faint text-sm col-span-2 py-6 text-center">No quizzes scheduled right now - check back soon.</p>
              )}
            </div>
          )}
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
                className={`flex items-center gap-3 px-2 py-2 rounded-xl ${user && entry.userId === user.id ? "bg-neon-blue/10" : ""}`}
              >
                <span className="w-5 text-center font-mono text-xs text-ink-faint">{entry.rank}</span>
                <img src={entry.avatar} className="w-8 h-8 rounded-full" alt={entry.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{entry.name}</p>
                </div>
                <span className="font-mono text-xs text-neon-cyan">{entry.points.toLocaleString()}</span>
              </div>
            ))}
            {!loading && topRanks.length === 0 && <p className="text-ink-faint text-xs text-center py-4">No rankings yet.</p>}
          </Card>
        </div>
      </div>

      {/* Badges + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4" data-tour="badges-section">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-ink">Recent Badges</h2>
            <button onClick={() => navigate("/student/profile")} className="text-xs text-neon-blue flex items-center hover:underline">
              All badges <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentBadges.map((b) => <AchievementCard key={b.id} badge={b} />)}
            {!loading && recentBadges.length === 0 && (
              <p className="text-ink-faint text-sm col-span-2 sm:col-span-4 py-6 text-center">No badges earned yet.</p>
            )}
          </div>
        </div>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Quiz Progress</h3>
          <div className="space-y-3">
            {quizStats.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-ink-faint w-16">{item.label}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-light overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalVisibleQuizzes ? Math.round((item.value / totalVisibleQuizzes) * 100) : 0}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-aurora rounded-full"
                  />
                </div>
                <span className="text-xs font-mono text-ink">{item.value}</span>
              </div>
            ))}
            <p className="text-xs text-ink-faint pt-1">{quizProgress}% of visible quizzes are completed.</p>
          </div>
          <Button
            variant="secondary"
            fullWidth
            className="mt-5"
            onClick={() => (liveQuiz ? navigate(`/student/quiz/${liveQuiz.id}`) : navigate("/student/leaderboard"))}
          >
            <Zap className="w-4 h-4" /> {liveQuiz ? "Jump into today's quiz" : "Check the leaderboard"}
          </Button>
        </Card>
      </div>
    </div>
  );
}