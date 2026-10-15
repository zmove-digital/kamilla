import { hashString, PALETTES, escapeHtml } from './util.js';

// Generates a deterministic, on-brand SVG "product photo" so the store is fully
// self-contained (no external image hosting needed). Swap these for real
// photos later by putting files in /public/images and referencing them.
export function productImageSvg(seed, label = '', width = 900, height = 1100) {
  const h = hashString(seed);
  const [c1, c2] = PALETTES[h % PALETTES.length];
  const angle = 120 + (h % 90);
  const initials = escapeHtml(
    String(label)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'A'
  );
  const brand = 'AURELLE';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)}">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="25%" r="80%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g opacity="0.18" fill="none" stroke="#fff" stroke-width="2">
    ${Array.from({ length: 9 })
      .map((_, i) => `<path d="M ${-100 + i * 130} ${height} C ${80 + i * 120} ${height * 0.6}, ${-20 + i * 140} ${height * 0.3}, ${120 + i * 130} ${-40}"/>`)
      .join('\n    ')}
  </g>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(height * 0.22)}" fill="#ffffff" fill-opacity="0.85" letter-spacing="4">${initials}</text>
  <text x="50%" y="${height - 60}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="${Math.round(height * 0.028)}" fill="#ffffff" fill-opacity="0.8" letter-spacing="10">${brand}</text>
</svg>`;
}
