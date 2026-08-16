import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const OFFICIAL_BASE_URL = 'https://api.deepseek.com';
export const ALLOWED_MODELS = Object.freeze(['deepseek-v4-flash', 'deepseek-v4-pro']);
export const DEFAULT_MODEL = 'deepseek-v4-flash';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadDotEnv(filePath = join(ROOT, '.env')) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const raw of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function maskKey(apiKey) {
  if (!apiKey) return 'unset';
  if (apiKey.length <= 8) return 'set(****)';
  return `set(…${apiKey.slice(-4)})`;
}

export function resolveConfig(env = process.env, fileEnv = loadDotEnv()) {
  const merged = { ...fileEnv, ...env };
  const apiKey = String(merged.DEEPSEEK_API_KEY || '').trim();
  const baseURL = String(merged.DEEPSEEK_BASE_URL || OFFICIAL_BASE_URL).trim().replace(/\/+$/, '');
  const model = String(merged.DEEPSEEK_MODEL || DEFAULT_MODEL).trim();
  const thinkingRaw = String(merged.DEEPSEEK_THINKING || 'disabled').trim().toLowerCase();
  const thinking = thinkingRaw === 'enabled' || thinkingRaw === 'true' || thinkingRaw === '1';

  const errors = [];
  if (!apiKey) {
    errors.push('DEEPSEEK_API_KEY is missing. Copy .env.example to .env and paste the key you bought at https://platform.deepseek.com');
  }
  if (!ALLOWED_MODELS.includes(model)) {
    errors.push(`DEEPSEEK_MODEL must be one of: ${ALLOWED_MODELS.join(', ')}`);
  }
  if (!/^https?:\/\//i.test(baseURL)) {
    errors.push('DEEPSEEK_BASE_URL must be an http(s) URL');
  }

  return {
    ok: errors.length === 0,
    errors,
    apiKey,
    baseURL,
    model,
    thinking,
    keyMasked: maskKey(apiKey),
  };
}

export function requireConfig(env = process.env, fileEnv = loadDotEnv()) {
  const cfg = resolveConfig(env, fileEnv);
  if (!cfg.ok) {
    const err = new Error(cfg.errors.join('\n'));
    err.code = 'CONFIG';
    throw err;
  }
  return cfg;
}
