import fs from "fs/promises";
import path from "path";
import os from "os";

const CONFIG_PATH = path.join(process.env.APPDATA || ".", "kavach-config.json");

export interface AgentConfig {
  deviceLinked: boolean;
  deviceId?: string;
  deviceCode?: string;
  authToken?: string;
  tenantId?: string;
  /**
   * Base API URL. May be either:
   * - http://host:port          (no suffix)
   * - http://host:port/api/v1   (with suffix)
   * Callers normalize by stripping a trailing /api/v1 and re‑adding it.
   */
  apiUrl: string;
  agentVersion: string;
  hostname: string;
}

const DEFAULT_API_URL = "http://localhost:8080/api/v1";

const apiUrlFromEnv = process.env.API_URL || DEFAULT_API_URL;

if (!process.env.API_URL) {
  console.warn(
    "[config] API_URL not set for desktop agent, defaulting to",
    DEFAULT_API_URL
  );
}

const defaultConfig: AgentConfig = {
  deviceLinked: false,
  apiUrl: apiUrlFromEnv,
  agentVersion: "1.2.4",
  hostname: os.hostname(),
};

export async function loadConfig(): Promise<AgentConfig> {
  try {
    const data = await fs.readFile(CONFIG_PATH, "utf-8");
    return { ...defaultConfig, ...JSON.parse(data) };
  } catch {
    return defaultConfig;
  }
}

export async function saveConfig(config: AgentConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}
