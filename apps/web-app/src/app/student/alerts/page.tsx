"use client";

import { useAlerts } from "@/hooks/useAlerts";
import { AlertItem } from "@/components/alerts/AlertItem";
import { Button } from "@/components/ui/Button";

export default function StudentAlertsPage() {
  const { alerts, markRead, markAllRead } = useAlerts();
  const myAlerts = alerts.filter(a => a.deviceId === "dev-001");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#64748B]">{myAlerts.filter(a => !a.read).length} unread</p>
        <Button size="sm" variant="outline" onClick={markAllRead}>
          Mark all read
        </Button>
      </div>
      {myAlerts.map((a) => (
        <AlertItem key={a.id} alert={a} onMarkRead={markRead} />
      ))}
    </div>
  );
}
