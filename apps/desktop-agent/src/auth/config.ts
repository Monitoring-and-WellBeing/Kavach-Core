import fs from "fs/promises";
import path from "path";
import os from "os";
import { AGENT_VERSION } from "../version";
import { BUILD_API_URL } from "../buildTime";

const CONFIG_PATH = path.join(process.env.APPDATA || os.homedir(), "kavach-config.json");

export interface AgentConfig {
  deviceLinked: boolean;
  deviceId?: string;
  deviceCode?: string;
  authToken?: string;
  tenantId?: string;
  apiUrl: string;
  agentVersion: string;
  hostname: string;
}

/**
 * Resolves the API base URL at runtime.
 *
 * Priority:
 *   1. BUILD_API_URL — injected at packaging time by scripts/write-build-config.cjs
 *   2. API_URL env var — set by developer for local dev
 *
 * If neither is set the agent cannot communicate with the backend.
 * This deliberately fails loudly so the misconfiguration is caught immediately.
 */
function resolveApiUrl(): string {
  if (BUILD_API_URL) return BUILD_API_URL;
  if (process.env.API_URL) return process.env.API_URL;
  throw new Error(
    "[KAVACH] No API URL configured. " +
    "Run `pnpm write-config` (CI) or set API_URL in apps/desktop-agent/.env (local dev). " +
    "See env.example for reference."
  );
}

const defaultConfig: AgentConfig = {
  deviceLinked: false,
  apiUrl: resolveApiUrl(),
  agentVersion: AGENT_VERSION,
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
