import fs from "node:fs";
import path from "node:path";

// Local, git-ignored config store. Lives on the same (D:) drive as the project.
// Holds the API key override and user preferences so they persist across runs
// without editing .env. Read only on the server.

const CONFIG_DIR = path.join(process.cwd(), ".frontier");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export interface FrontierConfig {
  apiKey?: string;
  research?: {
    onDemand: boolean;
    dailyDigest: boolean;
  };
}

const DEFAULTS: FrontierConfig = {
  research: { onDemand: true, dailyDigest: true },
};

export function getConfig(): FrontierConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeConfig(config: FrontierConfig) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

/** The active API key: a key saved in Settings wins, else the .env value. */
export function getApiKey(): string | null {
  const fromConfig = getConfig().apiKey?.trim();
  if (fromConfig) return fromConfig;
  const fromEnv = process.env.ANTHROPIC_API_KEY?.trim();
  return fromEnv || null;
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

/** Whether the active key came from a Settings override (vs .env). */
export function keyIsFromConfig(): boolean {
  return Boolean(getConfig().apiKey?.trim());
}

export function saveApiKey(key: string) {
  const config = getConfig();
  config.apiKey = key.trim();
  writeConfig(config);
}

export function clearApiKey() {
  const config = getConfig();
  delete config.apiKey;
  writeConfig(config);
}

/** A masked preview like "sk-ant-…pgAA" for display. */
export function maskKey(key: string): string {
  if (key.length <= 12) return "••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}
