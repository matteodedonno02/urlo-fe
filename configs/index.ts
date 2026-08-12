import { config as devConfig } from "./config.dev.ts";
import { config as prodConfig } from "./config.prod.ts";
import { config as testConfig } from "./config.test.ts";

export interface AppConfig {
  host: string;
  port: string;
  apiBaseUrl: string;
}

const configs: { [key: string]: AppConfig } = {
  "production": prodConfig,
  "test": testConfig
}

const nodeEnv = process.env.NODE_ENV

const selected: AppConfig = configs[nodeEnv] ?? devConfig

export const config: AppConfig = applyEnvOverrides(selected);

function applyEnvOverrides(base: AppConfig): AppConfig {
  const result = deepClone(base);
  for (const [name, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    const path = name.split("__").map(normalizeSegment);
    if (path.length === 0 || path.some((segment) => segment === "")) continue;
    setValue(result as unknown as Record<string, unknown>, path, value);
  }
  return result;
}

function normalizeSegment(segment: string): string {
  return segment.replace(/_/g, "").toLowerCase();
}

function setValue(node: Record<string, unknown>, path: string[], value: string): void {
  const key = Object.keys(node).find((k) => normalizeSegment(k) === path[0]);
  if (key === undefined) return;
  const current = node[key];
  if (path.length === 1) {
    if (typeof current === "number") {
      const num = Number(value);
      if (!Number.isNaN(num)) node[key] = num;
    } else if (typeof current === "boolean") {
      node[key] = value === "true" || value === "1";
    } else if (typeof current === "string") {
      node[key] = value;
    }
    return;
  }
  if (current !== null && typeof current === "object" && !Array.isArray(current)) {
    setValue(current as Record<string, unknown>, path.slice(1), value);
  }
}

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => deepClone(v)) as T;
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepClone(v);
    }
    return out as T;
  }
  return value;
}
