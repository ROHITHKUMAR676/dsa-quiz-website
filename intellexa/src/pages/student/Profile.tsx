import { motion } from "framer-motion";
import { Pencil, Target, CheckSquare, TrendingUp, Award } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import BadgePill from "../../components/ui/BadgePill";
import XPBar from "../../components/ui/XPBar";
import AchievementCard from "../../components/domain/AchievementCard";
import { currentUser } from "../../data/mockData";

const stats = [
  { label: "Accuracy", value: `${currentUser.accuracy}%`, icon: Target },
  { label: "Questions Solved", value: currentUser.questionsSolved, icon: CheckSquare },
  { label: "Fastest Response", value: `${currentUser.fastestResponseSec}s`, icon: TrendingUp },
];

const timeline = [
  { label: "Reached Level 14", time: "2 days ago" },
  { label: "Earned Consistency badge", time: "5 days ago" },
  { label: "Top 3 in Frontend Ninja quiz", time: "1 week ago" },
  { label: "Joined Intellexa", time: "3 months ago" },
];

export default function Profile() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-28 sm:h-36 bg-aurora relative">
          <div className="absolute inset-0 bg-void-100/20" />
        </div>
        <div className="px-5 sm:px-8 pb-6 -mt-12 sm:-mt-14 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <img src={currentUser.avatar} className="w-24 h-24 rounded-2xl border-4 border-void-100 shadow-card" alt={currentUser.name} />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-xl sm:text-2xl text-ink">{currentUser.name}</h1>
                <BadgePill variant="purple">{currentUser.tier}</BadgePill>
              </div>
              <p className="text-ink-dim text-sm">{currentUser.department} · {currentUser.year} · {currentUser.registerNumber}</p>
            </div>
            <Button variant="secondary" size="sm">
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </Button>
          </div>
          <p className="text-ink-dim text-sm mt-4 max-w-xl">{currentUser.bio}</p>
          <div className="mt-5 max-w-md">
            <XPBar xp={currentUser.xp} xpToNext={currentUser.xpToNextLevel} level={currentUser.level} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-blue/10">
              <s.icon className="w-4 h-4 text-neon-blue" />
            </div>
            <div>
              <p className="text-ink-faint text-[11px]">{s.label}</p>
              <p className="font-display font-semibold text-ink">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="font-display font-semibold text-lg text-ink mb-3 flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-neon-purple" /> Badge Collection
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {currentUser.badges.map((b) => (
            <AchievementCard key={b.id} badge={b} />
          ))}
        </div>
      </div>

      <Card className="p-5">
        <h2 className="font-display font-semibold text-lg text-ink mb-4">Achievement Timeline</h2>
        <div className="space-y-4">
          {timeline.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-neon-blue mt-1.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-ink">{item.label}</p>
                <p className="text-xs text-ink-faint">{item.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
