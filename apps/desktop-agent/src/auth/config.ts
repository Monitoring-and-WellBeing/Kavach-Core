import fs from "fs/promises";
import path from "path";
import os from "os";

const CONFIG_PATH = path.join(process.env.APPDATA || ".", "kavach-config.json");

export interface AgentConfig {
  deviceLinked: boolean;
  deviceId?: string;          // UUID from backend after linking
  deviceCode?: string;        // the 6-char code shown to user
  authToken?: string;         // not used for agent — device uses deviceId
  tenantId?: string;
  apiUrl: string;
  agentVersion: string;
  hostname: string;
}

// API_URL is baked into the build via electron-builder's extraMetadata / env injection.
// In production builds this env var is set to the Railway backend URL.
// The localhost fallback is for local development ONLY — never ships in production.
const defaultConfig: AgentConfig = {
  deviceLinked: false,
  apiUrl: process.env.API_URL || 'https://kavach-core-production.up.railway.app',
  agentVersion: '1.2.4',
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
