import { escapeHtml } from '../lib/util.js';
import { config } from '../config.js';

const LOGO_MARK = `<svg class="brand-mark" viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
  <defs>
    <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="52%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="14" fill="url(#brandGrad)"/>
  <path d="M16 13v22M16 24l9-11M16 24l10 11" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="35" cy="14" r="2.6" fill="#fff" fill-opacity="0.9"/>
</svg>`;

export function layout({ title, body, cartCount = 0, active = '' }) {
  const nav = [
    ['/', 'Início'],
    ['/shop', 'Celulares'],
    ['/shop?category=Apple', 'Apple'],
    ['/shop?category=Samsung', 'Samsung'],
    ['/shop?category=Xiaomi', 'Xiaomi'],
  ]
    .map(
      ([href, label]) =>
        `<a href="${href}" class="nav-link${active === label ? ' is-active' : ''}">${label}</a>`
    )
    .join('');

  const announceItems = [
    '🚚 Frete grátis acima de R$ 299',
    '💳 Até 12x sem juros',
    '🔒 Compra 100% segura',
    '↩️ Troca em até 7 dias',
    '⚡ Envio em até 24h',
  ]
    .map((t) => `<span>${t}</span>`)
    .join('');

  const footerCategories = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Realme']
    .map((c) => `<a href="/shop?category=${encodeURIComponent(c)}">${c}</a>`)
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · ${escapeHtml(config.storeName)}</title>
  <meta name="description" content="${escapeHtml(config.storeName)} — ${escapeHtml(config.storeTagline)}. Celulares das melhores marcas com 12x sem juros, frete grátis acima de R$ 299 e garantia de 12 meses.">
  <meta name="theme-color" content="#0a0b16">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
  <script>
    document.documentElement.classList.add('js');
    // Safety net: if the storefront script fails to load, never leave content hidden.
    setTimeout(function () {
      if (!window.KAMILLA_READY) {
        document.querySelectorAll('.reveal').forEach(function (el) {
          el.classList.add('is-visible');
        });
      }
    }, 3000);
  </script>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" href="/favicon.svg">
</head>
<body data-currency="${escapeHtml(config.currency.toUpperCase())}" data-locale="pt-BR">
  <div class="announce">
    <div class="announce-track">${announceItems}${announceItems}</div>
  </div>

  <header class="site-header">
    <div class="container header-inner">
      <button class="nav-toggle" aria-label="Abrir menu">☰</button>
      <a class="brand" href="/" aria-label="${escapeHtml(config.storeName)} — página inicial">
        ${LOGO_MARK}
        <span class="brand-word">${escapeHtml(config.storeName)}<small>tech store</small></span>
      </a>
      <nav class="main-nav">${nav}</nav>
      <div class="header-actions">
        <a href="/shop" class="icon-btn" aria-label="Buscar celulares">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
        </a>
        <a href="/cart" class="icon-btn cart-btn" aria-label="Abrir sacola">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
          <span class="cart-count" id="cart-count">${cartCount}</span>
        </a>
      </div>
    </div>
  </header>

  <main>${body}</main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-intro">
        <a class="footer-brand" href="/">${LOGO_MARK}<span>${escapeHtml(config.storeName)}<small>tech store</small></span></a>
        <p class="muted">Smartphones das melhores marcas, com preço justo, parcelamento sem juros e atendimento de verdade. A KAMILLA leva tecnologia até você.</p>
        <div class="pay-badges">
          <span>Visa</span><span>Master</span><span>Elo</span><span>Pix</span><span>Boleto</span>
        </div>
      </div>
      <div>
        <h4>Comprar</h4>
        <a href="/shop">Todos os celulares</a>
        ${footerCategories}
      </div>
      <div>
        <h4>Ajuda</h4>
        <a href="/shop">Central de ajuda</a>
        <a href="/shop">Trocas e devoluções</a>
        <a href="/shop">Garantia de 12 meses</a>
        <a href="/cart">Minha sacola</a>
      </div>
      <div>
        <h4>Fique por dentro</h4>
        <p class="muted small">Ofertas exclusivas e lançamentos no seu e-mail.</p>
        <form class="newsletter" onsubmit="return false;">
          <input type="email" placeholder="Seu melhor e-mail" aria-label="E-mail">
          <button type="submit">Quero ofertas</button>
        </form>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© ${new Date().getFullYear()} ${escapeHtml(config.storeName)}. Todos os direitos reservados.</span>
      <span>CNPJ 00.000.000/0001-00 · Pagamento seguro via Stripe</span>
    </div>
  </footer>

  <div class="help-bubble">
    <div class="help-panel" id="help-panel">
      <strong>Precisa de ajuda? 💬</strong>
      <p>Atendimento de segunda a sexta, das 9h às 18h.</p>
      <a href="mailto:contato@kamilla.com.br">contato@kamilla.com.br</a>
    </div>
    <button class="help-btn" id="help-toggle" aria-label="Abrir atendimento" aria-expanded="false">💬</button>
  </div>

  <script src="/app.js" defer></script>
</body>
</html>`;
}
