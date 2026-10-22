import { randomUUID, randomBytes } from 'node:crypto';
import { config } from '../config.js';

export function uuid() {
  return randomUUID();
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString('hex');
}

// Brazilian Portuguese money formatting (R$ 1.299,00 by default).
export function formatMoney(cents, currency = config.currency) {
  const value = (cents || 0) / 100;
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: String(currency).toUpperCase(),
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
}

// Formats a SQLite datetime ("2026-10-22 13:45:00", stored in UTC) for display.
export function formatDate(value) {
  if (!value) return '';
  const raw = String(value);
  const iso = raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

// "12x de R$ 458,25 sem juros" helper.
export function formatInstallments(cents, times = 12) {
  return `${times}x de ${formatMoney(Math.round((cents || 0) / times))} sem juros`;
}

export function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function parseCookies(req) {
  const header = req.headers['cookie'] || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export function serializeCookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  return parts.join('; ');
}

export function sendJson(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

export function sendHtml(res, status, html, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
    ...headers,
  });
  res.end(html);
}

export function sendRedirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

export function readBody(req, { limit = 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    return {};
  }
}

export async function readForm(req) {
  const raw = await readBody(req);
  const params = new URLSearchParams(raw.toString('utf8'));
  const out = {};
  for (const [k, v] of params.entries()) {
    // Accumulate repeated keys (e.g. multiple variant rows) into arrays.
    if (k in out) {
      if (Array.isArray(out[k])) out[k].push(v);
      else out[k] = [out[k], v];
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function parseCents(input) {
  if (input == null || input === '') return 0;
  const cleaned = String(input).replace(/[^0-9.,-]/g, '');
  // Treat comma as decimal separator when there is no dot.
  let normalized = cleaned;
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    normalized = cleaned.replace(',', '.');
  } else {
    normalized = cleaned.replace(/,/g, '');
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

// Deterministic gradient palette per string (used by the SVG image generator).
export function hashString(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) {
    h = (Math.imul(31, h) + String(str).charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export const PALETTES = [
  ['#7c3aed', '#22d3ee'],
  ['#2563eb', '#8b5cf6'],
  ['#06b6d4', '#3b82f6'],
  ['#db2777', '#7c3aed'],
  ['#0ea5e9', '#14b8a6'],
  ['#f59e0b', '#ef4444'],
  ['#8b5cf6', '#ec4899'],
  ['#10b981', '#0ea5e9'],
];
