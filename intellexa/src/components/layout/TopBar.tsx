import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Flame, Coins } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { studentGamificationApi } from "../../lib/backend";
import ThemeToggle from "../ui/ThemeToggle";
import { resolveApiAsset } from "../../lib/api";

export default function TopBar() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [unread, setUnread] = useState(0);
  const displayName = user?.fullName ?? "Student";
  const avatar = resolveApiAsset(user?.avatar) ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=1A2038`;
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
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neon-cyan/25 bg-gradient-to-br from-neon-cyan/20 to-neon-blue/10 shadow-[0_0_18px_rgba(72,211,255,0.12)] sm:h-10 sm:w-10">
          <span className="font-sans text-lg font-black tracking-tight text-neon-cyan sm:text-xl">C</span>
        </div>
        <div className="min-w-0">
          <div className="font-sans text-xl font-extrabold leading-none tracking-tight text-gradient sm:text-2xl">Codexa</div>
          <div className="mt-1 font-sans text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-ink-dim sm:text-[11px]">Your DSA partner</div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle compact />
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
