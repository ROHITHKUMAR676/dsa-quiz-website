import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Award, CheckSquare, Pencil, Target, TrendingUp, Loader2, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import BadgePill from "../../components/ui/BadgePill";
import XPBar from "../../components/ui/XPBar";
import AchievementCard from "../../components/domain/AchievementCard";
import { useApp } from "../../context/AppContext";
import { authApi, studentGamificationApi } from "../../lib/backend";
import { mapBackendBadgeToLegacy } from "../../lib/badgeAdapter";
import { ApiError } from "../../lib/api";
import type { Badge } from "../../types";
import AvatarPicker from "../../components/auth/AvatarPicker";
import { useToast } from "../../context/ToastContext";

function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 250) + 1);
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useApp();
  const { showToast } = useToast();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [badgeStatus, setBadgeStatus] = useState<"loading" | "ready" | "error">("loading");
  const [badgeError, setBadgeError] = useState("");

  useEffect(() => {
    let cancelled = false;
    studentGamificationApi
      .badges()
      .then(({ badges }) => {
        if (cancelled) return;
        setBadges(badges.map(mapBackendBadgeToLegacy));
        setBadgeStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setBadgeError(error instanceof ApiError ? error.message : "Couldn't load badges. Please try again.");
        setBadgeStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user?.fullName ?? "Student";
  const fallbackAvatar = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=1A2038`;
  const department = user?.department ?? "Department not set";
  const year = user?.year ?? "Year not set";
  const registerNumber = user?.registerNumber ?? "Register number not set";
  const bio = user?.bio ?? "No bio added yet.";
  const xp = user?.xp ?? 0;
  const level = levelFromXp(xp);
  const xpToNext = Math.max(level * 250, xp + 1);
  const earnedBadges = badges.filter((badge) => badge.earned).length;
  const uploadAvatar = async (file: File) => {
    setAvatarLoading(true);
    try {
      const { user: updatedUser } = await authApi.uploadAvatar(file);
      updateUser(updatedUser);
      showToast("Profile photo updated.", "success");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't upload the photo. Please try again.", "error");
      throw error;
    } finally {
      setAvatarLoading(false);
    }
  };
  const stats = [
    { label: "Total Correct", value: user?.totalCorrectAnswers ?? 0, icon: Target },
    { label: "Competition Points", value: user?.totalCompetitionPoints ?? 0, icon: CheckSquare },
    { label: "Longest Streak", value: user?.longestStreak ?? 0, icon: TrendingUp },
    { label: "Badges Earned", value: earnedBadges, icon: Award },
  ];
  const timeline = [
    user?.lastActiveAt ? { label: "Last active", time: new Date(user.lastActiveAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) } : null,
    user?.updatedAt ? { label: "Profile updated", time: new Date(user.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) } : null,
    user?.createdAt ? { label: "Joined", time: new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) } : null,
  ].filter(Boolean) as Array<{ label: string; time: string }>;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-28 sm:h-36 bg-aurora relative">
          <div className="absolute inset-0 bg-void-100/20" />
        </div>
        <div className="px-5 sm:px-8 pb-6 -mt-12 sm:-mt-14 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <AvatarPicker
              value={user?.avatar ?? fallbackAvatar}
              onSelect={uploadAvatar}
              label="Change profile photo"
              size="profile"
              shape="square"
              disabled={avatarLoading}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-xl sm:text-2xl text-ink">{displayName}</h1>
                <BadgePill variant="purple">Level {level}</BadgePill>
              </div>
              <p className="text-ink-dim text-sm">{department} / {year} / {registerNumber}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate("/onboarding/profile")}>
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </Button>
          </div>
          <p className="text-ink-dim text-sm mt-4 max-w-xl">{bio}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-faint">
            <span>{user?.email ?? "Email not available"}</span>
            {user?.phone && <span>/ {user.phone}</span>}
            {user?.preferredLanguage && <span>/ {user.preferredLanguage}</span>}
          </div>
          <div className="mt-5 max-w-md">
            <XPBar xp={xp} xpToNext={xpToNext} level={level} />
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
          <p className="font-display font-semibold text-ink">{s.value.toLocaleString()}</p>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="font-display font-semibold text-lg text-ink mb-3 flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-neon-purple" /> Badge Collection
        </h2>
        {badgeStatus === "loading" && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-neon-blue animate-spin" />
          </div>
        )}
        {badgeStatus === "error" && (
          <Card className="p-5 text-center">
            <TriangleAlert className="w-5 h-5 text-state-warning mx-auto mb-2" />
            <p className="text-sm text-ink">{badgeError}</p>
          </Card>
        )}
        {badgeStatus === "ready" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((b) => (
              <AchievementCard key={b.id} badge={b} />
            ))}
            {badges.length === 0 && <p className="text-ink-faint text-sm col-span-2 sm:col-span-4 py-6 text-center">No badges are configured yet.</p>}
          </div>
        )}
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
