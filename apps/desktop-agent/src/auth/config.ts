import fs from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.env.APPDATA || ".", "kavach-config.json");

export interface AgentConfig {
  deviceLinked: boolean;
  deviceId?: string;
  deviceCode?: string;
  authToken?: string;
  tenantId?: string;
  apiUrl: string;
}

const defaultConfig: AgentConfig = {
  deviceLinked: false,
  apiUrl: "http://localhost:8080/api/v1",
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
