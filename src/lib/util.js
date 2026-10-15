import { randomUUID, randomBytes } from 'node:crypto';

export function uuid() {
  return randomUUID();
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString('hex');
}

export function formatMoney(cents, currency = 'usd') {
  const value = (cents || 0) / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
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
  ['#c9a27e', '#8c5a3c'],
  ['#e7cba9', '#b98a5e'],
  ['#d9b8a2', '#7d5b45'],
  ['#b3927a', '#5f4130'],
  ['#e4bfa0', '#a86f4c'],
  ['#cfa98d', '#6f4a34'],
  ['#dcc3ad', '#9a6b4b'],
  ['#bfa08a', '#6a4a38'],
];
