import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..');

// Tiny .env loader (no dependency). Does not override existing process.env.
function loadDotEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

function num(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

const databasePath = process.env.DATABASE_PATH || './data/store.db';

export const config = {
  port: num('PORT', 3000),
  baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  storeName: process.env.STORE_NAME || 'KAMILLA',
  storeTagline: process.env.STORE_TAGLINE || 'Smartphones & Tecnologia',
  currency: (process.env.CURRENCY || 'brl').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  mockPayments: bool('MOCK_PAYMENTS', true),
  shippingFlatCents: num('SHIPPING_FLAT_CENTS', 2990),
  freeShippingThresholdCents: num('FREE_SHIPPING_THRESHOLD_CENTS', 29900),
  databasePath: resolve(ROOT, databasePath),
  seedOnBoot: bool('SEED_ON_BOOT', true),
};

// Stripe is "live" only when a key exists AND mock mode is off.
config.stripeEnabled = Boolean(config.stripeSecretKey) && !config.mockPayments;
