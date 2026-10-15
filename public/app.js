// KAMILLA storefront client
(function () {
  'use strict';

  function toast(message) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  async function api(path, body) {
    const res = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  function updateCartCount(n) {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = n;
  }

  // ---- Product detail page ------------------------------------------------
  const addBtn = document.getElementById('add-to-cart');
  if (addBtn) {
    const variantSelect = document.getElementById('variant');
    const priceEl = document.getElementById('pdp-price');
    const qtyInput = document.getElementById('qty');
    const stockLine = document.getElementById('stock-line');

    function money(cents) {
      return '$' + (cents / 100).toFixed(2);
    }

    function refreshVariant() {
      const opt = variantSelect.options[variantSelect.selectedIndex];
      if (!opt) return;
      const price = Number(opt.dataset.price.replace(/[^0-9.]/g, '')) * 100;
      priceEl.textContent = opt.dataset.price;
      const stock = Number(opt.dataset.stock);
      qtyInput.max = Math.max(stock, 1);
      if (Number(qtyInput.value) > stock) qtyInput.value = Math.max(stock, 1);
      stockLine.textContent = stock > 0 ? (stock <= 3 ? 'Only ' + stock + ' left' : 'In stock') : 'Sold out';
      stockLine.style.color = stock <= 3 ? 'var(--amber)' : 'var(--green)';
    }
    variantSelect.addEventListener('change', refreshVariant);
    refreshVariant();

    document.querySelectorAll('.stepper [data-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = Number(btn.dataset.step);
        let v = parseInt(qtyInput.value || '1', 10) + step;
        const max = parseInt(qtyInput.max || '99', 10);
        v = Math.max(1, Math.min(v, max));
        qtyInput.value = v;
      });
    });

    addBtn.addEventListener('click', async () => {
      addBtn.disabled = true;
      try {
        const data = await api('/api/cart', {
          action: 'add',
          variant_id: Number(variantSelect.value),
          quantity: Number(qtyInput.value || 1),
        });
        if (data.ok) {
          updateCartCount(data.cart.count);
          toast('Added to your bag');
        } else {
          toast(data.error || 'Could not add to bag');
        }
      } catch {
        toast('Network error');
      } finally {
        addBtn.disabled = false;
      }
    });
  }

  // ---- Cart page ----------------------------------------------------------
  document.querySelectorAll('[data-cart-step]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const variantId = Number(btn.dataset.variant);
      const input = document.querySelector(`[data-cart-qty][data-variant="${variantId}"]`);
      const next = Math.max(0, parseInt(input.value || '1', 10) + Number(btn.dataset.cartStep));
      await setQty(variantId, next);
    });
  });

  document.querySelectorAll('[data-cart-qty]').forEach((input) => {
    input.addEventListener('change', async () => {
      await setQty(Number(input.dataset.variant), Math.max(1, parseInt(input.value || '1', 10)));
    });
  });

  document.querySelectorAll('[data-cart-remove]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await setQty(Number(btn.dataset.variant), 0);
    });
  });

  async function setQty(variantId, quantity) {
    const data = await api('/api/cart', { action: 'set', variant_id: variantId, quantity });
    if (data.ok) {
      updateCartCount(data.cart.count);
      location.reload();
    } else {
      toast(data.error || 'Could not update');
    }
  }

  // ---- Checkout -----------------------------------------------------------
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('pay-btn');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Redirecting…';
      const form = new FormData(checkoutForm);
      try {
        const data = await api('/api/checkout', Object.fromEntries(form.entries()));
        if (data.ok && data.url) {
          window.location.href = data.url;
        } else {
          toast(data.error || 'Checkout failed');
          btn.disabled = false;
          btn.textContent = original;
        }
      } catch {
        toast('Network error');
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  // ---- Mock payment screen ------------------------------------------------
  const mockSuccess = document.getElementById('mock-pay-success');
  if (mockSuccess) {
    mockSuccess.addEventListener('click', async () => {
      const data = await api('/api/mock-pay', { order: mockSuccess.dataset.order, outcome: 'success' });
      if (data.ok) window.location.href = data.redirect;
      else toast(data.error || 'Payment failed');
    });
    document.getElementById('mock-pay-fail').addEventListener('click', async () => {
      const data = await api('/api/mock-pay', { order: document.getElementById('mock-pay-fail').dataset.order, outcome: 'fail' });
      if (data.ok) window.location.href = data.redirect;
    });
  }
})();
