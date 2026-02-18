export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateDeviceCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getRiskColor(level: string): string {
  const map: Record<string, string> = {
    LOW: "#22c55e",
    MODERATE: "#f59e0b",
    HIGH: "#ef4444",
  };
  return map[level] || "#6b7280";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ONLINE: "#22c55e",
    OFFLINE: "#6b7280",
    PAUSED: "#f59e0b",
    FOCUS_MODE: "#3b82f6",
  };
  return map[status] || "#6b7280";
}

export function percentageOf(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}
