import { ActiveWindowLog } from "../tracking/tracker";
import { loadConfig } from "../auth/config";

const API_BASE = process.env.API_URL || "http://localhost:8080/api/v1";

export async function syncToServer(logs: ActiveWindowLog[]): Promise<void> {
  if (logs.length === 0) return;

  const config = await loadConfig();
  if (!config.deviceLinked || !config.authToken) return;

  try {
    await fetch(`${API_BASE}/devices/${config.deviceId}/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.authToken}`,
      },
      body: JSON.stringify({ logs, deviceId: config.deviceId }),
    });
  } catch {
    // Buffer offline — write to local file
    await bufferOffline(logs);
  }
}

export async function bufferOffline(logs: ActiveWindowLog[]): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const bufferPath = path.join(process.env.APPDATA || ".", "kavach-buffer.json");

  let existing: ActiveWindowLog[] = [];
  try {
    const data = await fs.readFile(bufferPath, "utf-8");
    existing = JSON.parse(data);
  } catch {}

  await fs.writeFile(bufferPath, JSON.stringify([...existing, ...logs]));
}

export async function flushOfflineBuffer(): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const bufferPath = path.join(process.env.APPDATA || ".", "kavach-buffer.json");

  try {
    const data = await fs.readFile(bufferPath, "utf-8");
    const logs: ActiveWindowLog[] = JSON.parse(data);
    if (logs.length > 0) {
      await syncToServer(logs);
      await fs.writeFile(bufferPath, "[]");
    }
  } catch {}
}
