import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { hashString, PALETTES, escapeHtml } from './util.js';
import { ROOT } from '../config.js';

// Real (user-supplied) photos live in public/images/. These are the file
// extensions we look for, in priority order.
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const IMAGES_DIR = join(ROOT, 'public', 'images');

// Resolves a real photo for `name` (a slug, "slug-2", "cat-<Category>",
// "hero-kamilla", …) inside public/images/. Returns { url, path, ext } or null.
export function realImage(name) {
  const base = String(name).replace(/\.svg$/i, '').replace(/[^a-zA-Z0-9._-]/g, '');
  for (const ext of IMAGE_EXTENSIONS) {
    const filePath = join(IMAGES_DIR, base + ext);
    if (existsSync(filePath)) return { url: `/images/${base}${ext}`, path: filePath, ext };
  }
  return null;
}

// Convenience wrapper: returns just the public URL, or null.
export function realImageUrl(name) {
  const hit = realImage(name);
  return hit ? hit.url : null;
}

function initialsOf(label) {
  return (
    String(label)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'K'
  );
}

// Generates a deterministic, on-brand SVG "product photo" so the store is fully
// self-contained (no external image hosting needed). Draws a smartphone mockup
// over a vivid gradient so the demo catalog looks like a real phone store.
// Swap these for real photos by dropping files in /public/images.
export function productImageSvg(seed, label = '', width = 900, height = 1100) {
  const h = hashString(seed + label);
  const [c1, c2] = PALETTES[h % PALETTES.length];
  const angle = 110 + (h % 80);
  const initials = escapeHtml(initialsOf(label));

  const phoneW = Math.round(width * 0.4);
  const phoneH = Math.round(phoneW * 2.06);
  const px = Math.round((width - phoneW) / 2);
  const py = Math.round((height - phoneH) / 2 - height * 0.015);
  const frame = 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)}">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1020"/>
      <stop offset="100%" stop-color="#1d2947"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c2}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${c1}" stop-opacity="0.95"/>
    </linearGradient>
    <radialGradient id="glow" cx="28%" cy="18%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-20%" width="160%" height="150%">
      <feDropShadow dx="0" dy="26" stdDeviation="26" flood-color="#05070f" flood-opacity="0.45"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>

  <!-- decorative rings -->
  <g fill="none" stroke="#ffffff" stroke-opacity="0.14">
    <circle cx="${width * 0.14}" cy="${height * 0.12}" r="${width * 0.26}" stroke-width="2"/>
    <circle cx="${width * 0.92}" cy="${height * 0.86}" r="${width * 0.34}" stroke-width="2"/>
  </g>

  <!-- floating spec chips -->
  <g font-family="'Helvetica Neue', Arial, sans-serif" font-size="${Math.round(width * 0.032)}" font-weight="700">
    <g transform="translate(${width * 0.08}, ${height * 0.22})">
      <rect width="${width * 0.17}" height="${width * 0.075}" rx="${width * 0.037}" fill="#ffffff" fill-opacity="0.16"/>
      <text x="${(width * 0.17) / 2}" y="${width * 0.049}" text-anchor="middle" fill="#ffffff" fill-opacity="0.92">5G</text>
    </g>
    <g transform="translate(${width * 0.74}, ${height * 0.7})">
      <rect width="${width * 0.19}" height="${width * 0.075}" rx="${width * 0.037}" fill="#ffffff" fill-opacity="0.16"/>
      <text x="${(width * 0.19) / 2}" y="${width * 0.049}" text-anchor="middle" fill="#ffffff" fill-opacity="0.92">AI</text>
    </g>
  </g>

  <!-- phone -->
  <g filter="url(#shadow)">
    <rect x="${px}" y="${py}" width="${phoneW}" height="${phoneH}" rx="${Math.round(phoneW * 0.16)}" fill="#0a0e18" stroke="#f8fafc" stroke-opacity="0.35" stroke-width="2"/>
    <rect x="${px + frame}" y="${py + frame}" width="${phoneW - frame * 2}" height="${phoneH - frame * 2}" rx="${Math.round(phoneW * 0.13)}" fill="url(#screen)"/>

    <!-- dynamic island -->
    <rect x="${px + phoneW / 2 - phoneW * 0.13}" y="${py + frame + 14}" width="${phoneW * 0.26}" height="${Math.round(phoneW * 0.07)}" rx="${Math.round(phoneW * 0.035)}" fill="#020409"/>

    <!-- screen artwork -->
    <g>
      <rect x="${px + frame + 18}" y="${py + phoneH * 0.22}" width="${phoneW - frame * 2 - 36}" height="${phoneH * 0.34}" rx="${Math.round(phoneW * 0.09)}" fill="url(#glass)" fill-opacity="0.95"/>
      <text x="${px + phoneW / 2}" y="${py + phoneH * 0.44}" text-anchor="middle" dominant-baseline="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="${Math.round(phoneW * 0.34)}" font-weight="800" fill="#ffffff" fill-opacity="0.94" letter-spacing="2">${initials}</text>
      <rect x="${px + frame + 18}" y="${py + phoneH * 0.62}" width="${(phoneW - frame * 2 - 46) * 0.62}" height="${Math.round(phoneW * 0.035)}" rx="${Math.round(phoneW * 0.018)}" fill="#ffffff" fill-opacity="0.5"/>
      <rect x="${px + frame + 18}" y="${py + phoneH * 0.68}" width="${(phoneW - frame * 2 - 46) * 0.42}" height="${Math.round(phoneW * 0.035)}" rx="${Math.round(phoneW * 0.018)}" fill="#ffffff" fill-opacity="0.28"/>
    </g>

    <!-- screen glare -->
    <path d="M ${px + frame + 10} ${py + phoneH * 0.72} L ${px + phoneW * 0.78} ${py + frame + 10} L ${px + phoneW * 0.9} ${py + frame + 10} L ${px + frame + 10} ${py + phoneH * 0.86} Z" fill="url(#shine)" fill-opacity="0.35"/>
  </g>

  <text x="50%" y="${height - 54}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="${Math.round(height * 0.026)}" font-weight="700" fill="#ffffff" fill-opacity="0.82" letter-spacing="12">KAMILLA</text>
</svg>`;
}
