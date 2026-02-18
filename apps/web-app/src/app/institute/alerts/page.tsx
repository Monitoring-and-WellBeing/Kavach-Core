"use client";

import { useAlerts } from "@/hooks/useAlerts";
import { AlertItem } from "@/components/alerts/AlertItem";
import { Button } from "@/components/ui/Button";

export default function InstituteAlertsPage() {
  const { alerts, markRead, markAllRead } = useAlerts();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#64748B]">{alerts.filter(a => !a.read).length} unread</p>
        <Button size="sm" variant="outline" onClick={markAllRead}>Mark all read</Button>
      </div>
      {alerts.map(alert => (
        <AlertItem key={alert.id} alert={alert} onMarkRead={markRead} />
      ))}
    </div>
  );
}
