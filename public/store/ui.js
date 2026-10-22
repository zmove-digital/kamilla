// ============================================================================
// KAMILLA · helpers de interface e componentes compartilhados
// ============================================================================

import { STORE } from './config.js';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlShort = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function money(cents) {
  return brl.format((Number(cents) || 0) / 100);
}

export function installments(cents, times = STORE.maxInstallments) {
  return `${times}x de ${money(Math.round((Number(cents) || 0) / times))} sem juros`;
}

export function discountPercent(price, compare) {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

export function splitVariant(name) {
  const parts = String(name || '')
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length === 3 ? parts : null;
}

export const ATTR_KEYS = ['storage', 'ram', 'color'];
export const ATTR_LABELS = ['Armazenamento', 'Memória RAM', 'Cor'];

export function stockLabel(stock) {
  if (stock <= 0) return 'Esgotado';
  if (stock <= 5) return `Últimas ${stock} unidades`;
  return 'Em estoque, pronto para envio';
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function parseMoney(value) {
  let raw = String(value ?? '')
    .replace(/[R$\s]/gi, '')
    .trim();
  if (!raw) return 0;
  if (raw.includes(',')) {
    raw = raw.replace(/\./g, '').replace(',', '.');
  } else if ((raw.match(/\./g) || []).length > 1) {
    raw = raw.replace(/\./g, '');
  } else {
    const thousands = raw.match(/^(\d+)\.(\d{3})$/);
    if (thousands) raw = thousands[1] + thousands[2];
  }
  const number = Number(raw);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number * 100);
}

export function moneyInput(cents) {
  return brlShort.format((Number(cents) || 0) / 100);
}

export function productImageUrl(product) {
  let url = product?.image_url || `public/images/${product?.slug || 'placeholder'}.svg`;
  if (url.startsWith('/images/')) url = `public${url}`;
  if (!/^(https?:|data:|\/\/)/i.test(url)) url = `./${url.replace(/^\.?\//, '')}`;
  return url;
}

export function imageFallback() {
  return `onerror="this.onerror=null;this.src='./public/images/placeholder-phone.svg'"`;
}

export function productMinPrice(product) {
  if (!product?.variants?.length) return Number(product?.price_cents) || 0;
  return Math.min(...product.variants.map((v) => Number(v.price_cents) || 0));
}

export function productTotalStock(product) {
  if (!product?.variants?.length) return 0;
  return product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}

export function productComparePrice(product) {
  return Number(product?.compare_at_cents) || 0;
}

export function compareFor(product, price) {
  const base = productMinPrice(product);
  const compare = productComparePrice(product);
  if (!compare || !base || compare <= base) return 0;
  const raw = (price * compare) / base;
  const unit = price >= 100000 ? 10000 : 1000;
  return Math.round(raw / unit) * unit;
}

export function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// ---------------------------------------------------------------------------
// Cartões e blocos
// ---------------------------------------------------------------------------

export function productCard(product) {
  const price = productMinPrice(product);
  const compare = productComparePrice(product);
  const off = discountPercent(price, compare);
  const stock = productTotalStock(product);
  const soldOut = stock <= 0;
  const low = !soldOut && stock <= 5;

  const badges = [];
  if (soldOut) badges.push('<span class="badge badge-soldout">Esgotado</span>');
  else if (product.featured) badges.push('<span class="badge badge-hot">🔥 Mais vendido</span>');
  if (off > 0) badges.push(`<span class="badge badge-off">-${off}% OFF</span>`);
  if (low) badges.push('<span class="badge">⚡ Últimas unidades</span>');

  return `<article class="product-card reveal">
    <a class="product-media" href="#/produto/${encodeURIComponent(product.slug)}" aria-label="${escapeHtml(
      product.name
    )}">
      <img src="${escapeHtml(productImageUrl(product))}" alt="${escapeHtml(product.name)}" loading="lazy" ${imageFallback()}>
      <div class="badge-stack">${badges.join('')}</div>
      <span class="quick-view">Ver detalhes →</span>
    </a>
    <div class="product-info">
      <span class="product-cat">${escapeHtml(product.category)}</span>
      <h3><a href="#/produto/${encodeURIComponent(product.slug)}">${escapeHtml(product.name)}</a></h3>
      <p class="product-sub">${escapeHtml(product.subtitle || '')}</p>
      <div class="price">
        <span class="price-now">${money(price)}</span>
        ${off > 0 ? `<span class="price-compare">${money(compare)}</span>` : ''}
      </div>
      <span class="installments">${installments(price)}</span>
    </div>
  </article>`;
}

export function categoryTiles(products) {
  const map = new Map();
  for (const product of products) {
    if (!map.has(product.category)) map.set(product.category, 0);
    map.set(product.category, map.get(product.category) + 1);
  }
  return [...map.entries()]
    .map(
      ([category, count]) => `<a class="cat-tile reveal" href="#/loja?categoria=${encodeURIComponent(category)}">
        <img src="./public/images/cat-${encodeURIComponent(category)}.svg" alt="${escapeHtml(
        category
      )}" loading="lazy" ${imageFallback()}>
        <span>${escapeHtml(category)}<em>${plural(count, 'modelo', 'modelos')}</em></span>
      </a>`
    )
    .join('');
}

export function variantPicker(product) {
  const variants = product.variants || [];
  const parsed = variants.map((variant) => ({ variant, parts: splitVariant(variant.name) }));
  if (!parsed.length || parsed.some((item) => !item.parts)) return null;

  const attrs = ATTR_KEYS.map((key, index) => ({
    key,
    label: ATTR_LABELS[index],
    values: [...new Set(parsed.map((item) => item.parts[index]))],
  }));

  const initial = variants.find((v) => v.stock > 0) || variants[0];
  const initialParts = splitVariant(initial.name);
  const selected = {
    storage: initialParts[0],
    ram: initialParts[1],
    color: initialParts[2],
  };

  const groups = attrs
    .map(
      (attr) => `<div class="picker" data-attr="${attr.key}">
        <span class="picker-label">${attr.label}${
        attr.key === 'color'
          ? `<em class="picker-current" data-current="color">${escapeHtml(selected.color)}</em>`
          : ''
      }</span>
        <div class="picker-options">
          ${attr.values
            .map(
              (value) =>
                `<button type="button" class="opt${
                  value === selected[attr.key] ? ' is-active' : ''
                }" data-attr="${attr.key}" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`
            )
            .join('')}
        </div>
      </div>`
    )
    .join('');

  const data = parsed.map(({ variant, parts }) => ({
    id: variant.id,
    storage: parts[0],
    ram: parts[1],
    color: parts[2],
    price: variant.price_cents,
    stock: variant.stock,
    compare: compareFor(product, variant.price_cents),
  }));

  return {
    initial,
    html: `<div class="variant-pickers">${groups}</div>
      <input type="hidden" id="variant" name="variant" value="${initial.id}">
      <script type="application/json" id="variant-data">${JSON.stringify(data).replace(
        /</g,
        '\\u003c'
      )}</script>`,
  };
}

export function variantSelect(product) {
  const variants = product.variants || [];
  const firstAvailable = variants.find((v) => v.stock > 0);
  const chosen = firstAvailable || variants[0];
  const options = variants
    .map(
      (variant) =>
        `<option value="${variant.id}" data-price="${variant.price_cents}" data-compare="${compareFor(
          product,
          variant.price_cents
        )}" data-stock="${variant.stock}"${
          variant === chosen ? ' selected' : ''
        }${variant.stock <= 0 ? ' disabled' : ''}>${escapeHtml(variant.name)}${
          variant.stock <= 0 ? ' — esgotado' : ''
        }</option>`
    )
    .join('');
  return `<div class="pdp-field">
    <label for="variant">Escolha a variação</label>
    <select id="variant" name="variant">${options}</select>
  </div>`;
}

export function statusPill(status) {
  const map = {
    pending: ['Aguardando pagamento', 'pill-amber'],
    paid: ['Pago', 'pill-green'],
    shipped: ['Enviado', 'pill-green'],
    cancelled: ['Cancelado', 'pill-red'],
    failed: ['Falhou', 'pill-red'],
  };
  const [label, cls] = map[status] || [status || '—', 'pill-grey'];
  return `<span class="pill ${cls}">${escapeHtml(label)}</span>`;
}

// ---------------------------------------------------------------------------
// Estados, toast e navegação
// ---------------------------------------------------------------------------

let toastTimer = null;
export function toast(message, type = '') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  root.innerHTML = `<div class="toast${type ? ` toast-${type}` : ''}">${escapeHtml(message)}</div>`;
  const el = root.firstElementChild;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }, 3400);
}

export function setBusy(button, busy, busyLabel = 'Aguarde…') {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.innerHTML = `<span class="spinner"></span> ${escapeHtml(busyLabel)}`;
    button.disabled = true;
  } else {
    if (button.dataset.label) button.innerHTML = button.dataset.label;
    button.disabled = false;
  }
}

export function pageLoading(label = 'Carregando…') {
  return `<div class="container section"><div class="loading-state">
    <span class="spinner spinner-lg"></span>
    <p>${escapeHtml(label)}</p>
  </div></div>`;
}

export function errorView(message, retryHref = '#/') {
  return `<div class="container section"><div class="empty-state">
    <span class="empty-icon">😕</span>
    <h2>Algo deu errado</h2>
    <p class="muted">${escapeHtml(message)}</p>
    <a class="btn btn-primary" href="${escapeHtml(retryHref)}">Tentar novamente</a>
  </div></div>`;
}

export function emptyView({ icon = '🛍️', title, text, ctaHref = '#/loja', ctaLabel = 'Ver celulares' }) {
  return `<div class="empty-state">
    <span class="empty-icon">${icon}</span>
    <h2>${escapeHtml(title)}</h2>
    <p class="muted">${escapeHtml(text)}</p>
    <a class="btn btn-primary" href="${ctaHref}">${escapeHtml(ctaLabel)}</a>
  </div>`;
}

// ---------------------------------------------------------------------------
// Animações
// ---------------------------------------------------------------------------

let revealObserver = null;
let revealFallback = null;

export function initReveals() {
  if (revealObserver) revealObserver.disconnect();
  clearTimeout(revealFallback);

  const nodes = [...document.querySelectorAll('.reveal:not(.is-visible)')];
  if (!nodes.length) return;

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach((node) => node.classList.add('is-visible'));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  nodes.forEach((node) => revealObserver.observe(node));

  revealFallback = setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((node) => node.classList.add('is-visible'));
  }, 2600);
}

let countdownTimer = null;
export function initCountdown() {
  clearInterval(countdownTimer);
  const boxes = document.querySelectorAll('[data-countdown]');
  if (!boxes.length) return;

  const tick = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let diff = Math.max(0, end - now);
    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;
    const minutes = Math.floor(diff / 60000);
    diff -= minutes * 60000;
    const seconds = Math.floor(diff / 1000);
    const values = {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
    boxes.forEach((box) => {
      Object.entries(values).forEach(([key, value]) => {
        const target = box.querySelector(`[data-cd="${key}"]`);
        if (target) target.textContent = value;
      });
    });
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

// ---------------------------------------------------------------------------
// UI global (roda uma única vez)
// ---------------------------------------------------------------------------

let globalReady = false;
export function initGlobalUI() {
  if (globalReady) return;
  globalReady = true;

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  navToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) nav?.classList.remove('is-open');
  });

  const helpToggle = document.getElementById('help-toggle');
  const helpPanel = document.getElementById('help-panel');
  helpToggle?.addEventListener('click', () => {
    const open = helpPanel?.classList.toggle('is-open');
    helpToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.querySelectorAll('.newsletter').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input?.value || !input.checkValidity()) {
        toast('Digite um e-mail válido para receber as ofertas.');
        input?.focus();
        return;
      }
      form.reset();
      toast('Tudo certo! Você vai receber nossas ofertas. 💜');
    });
  });

  const year = document.getElementById('footer-year');
  if (year) year.textContent = String(new Date().getFullYear());
}
