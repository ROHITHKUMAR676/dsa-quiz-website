import type { BackendNotification } from "./backend";
import type { NotificationItem } from "../types";

function relativeTime(value: string) {
  const createdAt = new Date(value).getTime();
  const deltaMs = Date.now() - createdAt;
  const minutes = Math.max(0, Math.floor(deltaMs / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function mapBackendNotificationToLegacy(notification: BackendNotification): NotificationItem {
  return {
    id: notification.id,
    type: notification.type.toLowerCase() as NotificationItem["type"],
    title: notification.title,
    message: notification.message,
    time: relativeTime(notification.createdAt),
    read: notification.isRead,
  };
}
