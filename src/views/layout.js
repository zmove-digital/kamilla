import { escapeHtml } from '../lib/util.js';
import { config } from '../config.js';

export function layout({ title, body, cartCount = 0, active = '' }) {
  const nav = [
    ['/', 'Home'],
    ['/shop', 'Shop'],
    ['/shop?category=Clip-In', 'Clip-In'],
    ['/shop?category=Tape-In', 'Tape-In'],
    ['/shop?category=Bundles', 'Bundles'],
  ]
    .map(
      ([href, label]) =>
        `<a href="${href}" class="nav-link${active === label ? ' is-active' : ''}">${label}</a>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · ${escapeHtml(config.storeName)}</title>
  <meta name="description" content="${escapeHtml(config.storeName)} — ${escapeHtml(config.storeTagline)}.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" href="/favicon.svg">
</head>
<body>
  <div class="announce">Free worldwide shipping on orders over $150 · 30-day returns</div>
  <header class="site-header">
    <div class="container header-inner">
      <button class="nav-toggle" aria-label="Menu">☰</button>
      <a class="brand" href="/">${escapeHtml(config.storeName)}</a>
      <nav class="main-nav">${nav}</nav>
      <div class="header-actions">
        <a href="/shop" class="icon-btn" aria-label="Search">⌕</a>
        <a href="/cart" class="icon-btn cart-btn" aria-label="Bag">
          <span aria-hidden="true">🛍</span>
          <span class="cart-count" id="cart-count">${cartCount}</span>
        </a>
      </div>
    </div>
  </header>
  <main>${body}</main>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <div class="footer-brand">${escapeHtml(config.storeName)}</div>
        <p class="muted">${escapeHtml(config.storeTagline)}. Ethically sourced, salon quality, delivered worldwide.</p>
      </div>
      <div>
        <h4>Shop</h4>
        <a href="/shop?category=Clip-In">Clip-In</a>
        <a href="/shop?category=Tape-In">Tape-In</a>
        <a href="/shop?category=Bundles">Bundles</a>
        <a href="/shop?category=Accessories">Accessories</a>
      </div>
      <div>
        <h4>Help</h4>
        <a href="/shop">Shipping &amp; Returns</a>
        <a href="/shop">Hair Care Guide</a>
        <a href="/shop">Contact</a>
      </div>
      <div>
        <h4>Stay in touch</h4>
        <form class="newsletter" onsubmit="return false;">
          <input type="email" placeholder="Email address" aria-label="Email">
          <button type="submit">Join</button>
        </form>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© ${new Date().getFullYear()} ${escapeHtml(config.storeName)}. All rights reserved.</span>
      <span>Secure checkout · Powered by Stripe</span>
    </div>
  </footer>
  <script src="/app.js" defer></script>
</body>
</html>`;
}
