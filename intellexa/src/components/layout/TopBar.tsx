import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Flame, Coins, Zap } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { studentGamificationApi } from "../../lib/backend";

export default function TopBar() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [unread, setUnread] = useState(0);
  const displayName = user?.fullName ?? "Student";
  const avatar =
    user?.avatar ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=1A2038`;
  const streak = user?.currentStreak ?? 0;
  const coins = user?.coins ?? 0;

  useEffect(() => {
    let cancelled = false;
    studentGamificationApi
      .notifications()
      .then(({ notifications }) => {
        if (!cancelled) setUnread(notifications.filter((notification) => !notification.isRead).length);
      })
      .catch(() => {
        if (!cancelled) setUnread(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 glass border-b border-surface-border px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-8 h-8 rounded-lg bg-aurora flex items-center justify-center shadow-glow">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-ink text-sm">INTELLEXA</span>
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs">
          <Flame className="w-3.5 h-3.5 text-state-warning" />
          <span className="font-mono text-ink">{streak}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs">
          <Coins className="w-3.5 h-3.5 text-state-gold" />
          <span className="font-mono text-ink">{coins.toLocaleString()}</span>
        </div>
        <button
          onClick={() => navigate("/student/notifications")}
          className="relative p-2 rounded-xl glass hover:bg-surface-light transition-colors"
        >
          <Bell className="w-4.5 h-4.5 text-ink-dim" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-state-danger text-white text-[9px] flex items-center justify-center font-bold">
              {unread}
            </span>
          )}
        </button>
        <button onClick={() => navigate("/student/profile")}>
          <img src={avatar} alt={displayName} className="w-8 h-8 rounded-full border border-surface-border" />
        </button>
      </div>
    </header>
  );
}
