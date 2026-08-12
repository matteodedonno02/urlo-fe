import { config as devConfig } from "./config.dev.ts";
import { config as prodConfig } from "./config.prod.ts";
import { config as testConfig } from "./config.test.ts";

export interface AppConfig {
  host: string;
  port: string;
  apiBaseUrl: string;
}

const SEPARATOR = "__";

const configs: { [key: string]: AppConfig } = {
  "production": prodConfig,
  "test": testConfig
}

const nodeEnv = process.env.NODE_ENV

const selected: AppConfig = configs[nodeEnv] ?? devConfig

export const config: AppConfig = applyEnvOverrides(selected);

function normalizeSegment(segment: string): string {
  return segment.replace(/_/g, "").toLowerCase();
}

function coerce(current: unknown, raw: string): unknown {
  if (typeof current === "number") {
    const num = Number(raw);
    return Number.isNaN(num) ? current : num;
  }
  if (typeof current === "boolean") {
    return raw === "true" || raw === "1";
  }
  if (typeof current === "string") {
    return raw;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function setValue(node: Record<string, unknown>, path: string[], raw: string): void {
  const key = Object.keys(node).find((k) => normalizeSegment(k) === path[0]);
  if (key === undefined) return;
  if (path.length === 1) {
    node[key] = coerce(node[key], raw);
    return;
  }
  const current = node[key];
  if (current !== null && typeof current === "object" && !Array.isArray(current)) {
    setValue(current as Record<string, unknown>, path.slice(1), raw);
  }
}

function applyEnvOverrides(base: AppConfig): AppConfig {
  const result = structuredClone(base);
  for (const [name, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    const path = name.split(SEPARATOR).map(normalizeSegment);
    if (path.length === 0 || path.some((segment) => segment === "")) continue;
    setValue(result as unknown as Record<string, unknown>, path, value);
  }
  return result;
}
