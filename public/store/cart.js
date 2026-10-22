// ============================================================================
// KAMILLA · sacola (localStorage) + cálculo de totais
// ============================================================================

import { STORE } from './config.js';
import { getVariantsByIds } from './api.js';
import { toast } from './ui.js';

const CART_KEY = 'kamilla_cart_v1';

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        variant_id: Number(item.variant_id),
        quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
      }))
      .filter((item) => Number.isFinite(item.variant_id) && item.variant_id > 0);
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* modo privado */
  }
  updateBadge();
  document.dispatchEvent(new CustomEvent('cart:change', { detail: items }));
}

export function getCart() {
  return read();
}

export function cartCount() {
  return read().reduce((sum, item) => sum + item.quantity, 0);
}

export function updateBadge() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  const count = cartCount();
  el.textContent = String(count);
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

export function addToCart(variant, quantity = 1) {
  if (!variant || variant.stock <= 0) {
    toast('Este produto está esgotado no momento.');
    return false;
  }

  const items = read();
  const existing = items.find((item) => item.variant_id === variant.id);
  const current = existing?.quantity || 0;
  const desired = current + Math.max(1, Number(quantity) || 1);
  const next = Math.min(desired, variant.stock);

  if (existing) existing.quantity = next;
  else items.push({ variant_id: variant.id, quantity: next });

  write(items);

  if (desired > variant.stock) {
    toast(`Adicionamos o máximo disponível: ${variant.stock} unidade(s).`);
  } else {
    toast('Produto adicionado à sacola 🛍️');
  }
  return true;
}

export function setQuantity(variantId, quantity, maxStock = 99) {
  const items = read();
  const item = items.find((entry) => entry.variant_id === Number(variantId));
  if (!item) return;
  const next = Math.max(0, Math.min(Number(quantity) || 0, Number(maxStock) || 99));
  if (next <= 0) {
    write(items.filter((entry) => entry.variant_id !== Number(variantId)));
    return;
  }
  item.quantity = next;
  write(items);
}

export function removeFromCart(variantId) {
  write(read().filter((item) => item.variant_id !== Number(variantId)));
}

export function clearCart() {
  write([]);
}

export function checkoutItems(lines) {
  return lines.map((line) => ({ variant_id: line.variant_id, quantity: line.quantity }));
}

export async function loadCartDetails() {
  const items = read();
  if (!items.length) return { lines: [], removed: 0, adjusted: 0 };

  const variants = await getVariantsByIds(items.map((item) => item.variant_id));
  const byId = new Map(variants.map((variant) => [Number(variant.id), variant]));

  const lines = [];
  let removed = 0;
  let adjusted = 0;
  const next = [];

  for (const item of items) {
    const variant = byId.get(item.variant_id);
    if (!variant || variant.stock <= 0) {
      removed += 1;
      continue;
    }
    const quantity = Math.min(item.quantity, variant.stock);
    if (quantity !== item.quantity) adjusted += 1;
    next.push({ variant_id: item.variant_id, quantity });
    lines.push({
      variant_id: item.variant_id,
      quantity,
      variant,
      product: variant.product,
      unit_price_cents: Number(variant.price_cents) || 0,
      line_total_cents: (Number(variant.price_cents) || 0) * quantity,
    });
  }

  if (removed || adjusted) write(next);

  return { lines, removed, adjusted };
}

export function cartTotals(lines) {
  const subtotal = (lines || []).reduce((sum, line) => sum + line.line_total_cents, 0);
  const shipping = subtotal <= 0 ? 0 : subtotal >= STORE.freeShippingFrom ? 0 : STORE.shippingCents;
  const total = subtotal + shipping;
  const missing = Math.max(0, STORE.freeShippingFrom - subtotal);
  const progress = Math.min(100, Math.round((subtotal / STORE.freeShippingFrom) * 100));
  return {
    subtotal,
    shipping,
    total,
    missing,
    progress,
    freeShipping: subtotal >= STORE.freeShippingFrom && subtotal > 0,
    count: (lines || []).reduce((sum, line) => sum + line.quantity, 0),
  };
}

export function freeShippingBar(totals) {
  if (!totals.subtotal) return '';
  const done = totals.freeShipping;
  return `<div class="ship-progress${done ? ' is-done' : ''}">
    <div class="ship-progress-top">
      <span>${
        done
          ? '🎉 <strong>Frete grátis liberado!</strong>'
          : `Faltam <strong>${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totals.missing / 100)}</strong> para o frete grátis`
      }</span>
      <span>${done ? '✓' : `${totals.progress}%`}</span>
    </div>
    <div class="ship-bar"><i style="width:${done ? 100 : totals.progress}%"></i></div>
  </div>`;
}
