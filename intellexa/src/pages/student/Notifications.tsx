import { motion } from "framer-motion";
import { Bell, Trophy, Award, TrendingUp, Flame, Radio, BellOff, Loader2, TriangleAlert } from "../../components/pixel/PixelLucide";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { useEffect, useState } from "react";
import type { NotificationItem } from "../../types";
import { cn } from "../../lib/utils";
import { studentGamificationApi } from "../../lib/backend";
import { mapBackendNotificationToLegacy } from "../../lib/notificationAdapter";
import { ApiError } from "../../lib/api";

const iconMap: Record<NotificationItem["type"], any> = {
  quiz: Radio,
  badge: Award,
  level: TrendingUp,
  rank: Trophy,
  streak: Flame,
  system: Bell,
};

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    studentGamificationApi
      .notifications()
      .then(({ notifications }) => {
        if (cancelled) return;
        setItems(notifications.map(mapBackendNotificationToLegacy));
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't load notifications. Please try again.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markAllRead = async () => {
    const previous = items;
    setItems((its) => its.map((i) => ({ ...i, read: true })));
    try {
      await studentGamificationApi.markAllNotificationsRead();
    } catch {
      setItems(previous);
    }
  };

  const markRead = async (id: string) => {
    const previous = items;
    setItems((its) => its.map((i) => (i.id === id ? { ...i, read: true } : i)));
    try {
      await studentGamificationApi.markNotificationRead(id);
    } catch {
      setItems(previous);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
            <Bell className="w-6 h-6 text-neon-blue" /> Notifications
          </h1>
          <p className="text-ink-dim text-sm">Stay on top of quizzes, badges, and rank changes.</p>
        </div>
        <button onClick={markAllRead} disabled={items.every((item) => item.read)} className="text-xs text-neon-blue hover:underline shrink-0 disabled:text-ink-faint disabled:no-underline">
          Mark all read
        </button>
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

      {status === "ready" && items.length === 0 ? (
        <EmptyState icon={BellOff} title="You're all caught up" description="New activity will show up here." />
      ) : status === "ready" ? (
        <div className="space-y-2">
          {items.map((n, i) => {
            const Icon = iconMap[n.type];
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => !n.read && markRead(n.id)}>
                <Card className={cn("p-4 flex items-start gap-3", !n.read && "border-neon-blue/30 bg-neon-blue/5")}>
                  <div className="p-2 rounded-lg bg-surface-light shrink-0">
                    <Icon className="w-4 h-4 text-neon-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="text-xs text-ink-dim mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-ink-faint mt-1">{n.time}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-neon-blue mt-1 shrink-0" />}
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
