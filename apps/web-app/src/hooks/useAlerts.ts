import { useState } from "react";
import { Alert } from "@kavach/shared-types";
import { mockAlerts } from "@/mock/alerts";

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  const markRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return { alerts, markRead, markAllRead, unreadCount };
}
