// KAMILLA · storefront (pt-BR)
(function () {
  'use strict';

  const bodyEl = document.body;
  const LOCALE = bodyEl.dataset.locale || 'pt-BR';
  const CURRENCY = bodyEl.dataset.currency || 'BRL';
  const nf = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });
  const money = (cents) => nf.format((cents || 0) / 100);
  const installmentText = (cents) => `12x de ${money(Math.round((cents || 0) / 12))} sem juros`;

  // ---- Shared helpers -----------------------------------------------------
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
    el._t = setTimeout(() => el.classList.remove('show'), 2800);
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
    if (el) {
      el.textContent = n;
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
  }

  // ---- Reveal on scroll ---------------------------------------------------
  document.documentElement.classList.add('js');
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
  window.KAMILLA_READY = true;

  // ---- Countdown (resets every day at midnight) ---------------------------
  const countdown = document.getElementById('countdown');
  if (countdown) {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      let diff = Math.max(0, end - now);
      const h = Math.floor(diff / 3600000);
      diff -= h * 3600000;
      const m = Math.floor(diff / 60000);
      diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      const set = (key, val) => {
        const el = countdown.querySelector(`[data-cd="${key}"]`);
        if (el) el.textContent = String(val).padStart(2, '0');
      };
      set('hours', h);
      set('minutes', m);
      set('seconds', s);
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---- Help bubble + mobile nav ------------------------------------------
  const helpToggle = document.getElementById('help-toggle');
  const helpPanel = document.getElementById('help-panel');
  if (helpToggle && helpPanel) {
    helpToggle.addEventListener('click', () => {
      const open = helpPanel.classList.toggle('is-open');
      helpToggle.setAttribute('aria-expanded', String(open));
    });
  }

  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => mainNav.classList.toggle('is-open'));
  }

  // ---- Product detail page ------------------------------------------------
  const addBtn = document.getElementById('add-to-cart');
  if (addBtn) {
    const priceEl = document.getElementById('pdp-price');
    const instEl = document.getElementById('pdp-installments');
    const qtyInput = document.getElementById('qty');
    const stockLine = document.getElementById('stock-line');
    const variantInput = document.getElementById('variant');
    const compareEl = document.getElementById('pdp-compare');
    let canBuy = !addBtn.disabled;

    function paintStock(stock) {
      stockLine.textContent =
        stock > 0 ? (stock <= 5 ? `Últimas ${stock} unidades` : 'Em estoque, pronto para envio') : 'Esgotado';
      stockLine.classList.toggle('is-out', stock <= 0);
      stockLine.classList.toggle('is-low', stock > 0 && stock <= 5);
    }

    function paintVariant(cents, stock, compare = 0) {
      canBuy = stock > 0;
      priceEl.textContent = money(cents);
      priceEl.dataset.cents = String(cents);
      if (instEl) instEl.textContent = installmentText(cents);
      if (compareEl) {
        if (compare > cents) {
          const off = Math.round(((compare - cents) / compare) * 100);
          compareEl.innerHTML = `${money(compare)} <span class="off-tag">-${off}%</span>`;
        } else {
          compareEl.textContent = '';
        }
      }
      paintStock(stock);
      qtyInput.max = String(Math.max(stock, 1));
      if (Number(qtyInput.value) > stock) qtyInput.value = String(Math.max(stock, 1));
      addBtn.disabled = !canBuy;
      addBtn.textContent = canBuy ? 'Adicionar à sacola 🛍️' : 'Produto esgotado';
    }

    // Structured pickers (Armazenamento · RAM · Cor).
    const dataEl = document.getElementById('variant-data');
    if (dataEl && variantInput) {
      let variants = [];
      try {
        variants = JSON.parse(dataEl.textContent);
      } catch {
        variants = [];
      }
      const pickers = [...document.querySelectorAll('.picker')];
      const state = {};
      pickers.forEach((p) => {
        const active = p.querySelector('.opt.is-active');
        if (active) state[p.dataset.attr] = active.dataset.value;
      });
      const currentColor = document.querySelector('[data-current="color"]');

      const matches = (v, sel) => Object.keys(sel).every((k) => v[k] === sel[k]);
      const exact = () => variants.find((v) => matches(v, state));
      const available = (attr, value) => {
        const test = { ...state, [attr]: value };
        return variants.some((v) => v.stock > 0 && matches(v, test));
      };

      const render = () => {
        pickers.forEach((p) => {
          const attr = p.dataset.attr;
          p.querySelectorAll('.opt').forEach((btn) => {
            const ok = available(attr, btn.dataset.value);
            btn.classList.toggle('is-active', state[attr] === btn.dataset.value);
            btn.classList.toggle('is-disabled', !ok);
            btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
            btn.title = ok ? '' : 'Indisponível nesta combinação';
          });
        });
        if (currentColor) currentColor.textContent = state.color || '';
        const v = exact();
        if (!v) return;
        variantInput.value = String(v.id);
        paintVariant(v.price, v.stock, v.compare);
      };

      pickers.forEach((p) => {
        p.addEventListener('click', (e) => {
          const btn = e.target.closest('.opt');
          if (!btn || btn.classList.contains('is-disabled')) return;
          state[p.dataset.attr] = btn.dataset.value;
          render();
        });
      });
      render();
    } else if (variantInput && variantInput.tagName === 'SELECT') {
      // Fallback: free-form variants (e.g. products created manually in /admin).
      const refresh = () => {
        const opt = variantInput.options[variantInput.selectedIndex];
        if (!opt) return;
        paintVariant(Number(opt.dataset.price), Number(opt.dataset.stock), Number(opt.dataset.compare));
      };
      variantInput.addEventListener('change', refresh);
      refresh();
    }

    document.querySelectorAll('.stepper [data-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = Number(btn.dataset.step);
        let v = parseInt(qtyInput.value || '1', 10) + step;
        const max = parseInt(qtyInput.max || '99', 10);
        v = Math.max(1, Math.min(v, max));
        qtyInput.value = String(v);
      });
    });

    addBtn.addEventListener('click', async () => {
      if (!canBuy) return;
      addBtn.disabled = true;
      try {
        const data = await api('/api/cart', {
          action: 'add',
          variant_id: Number(variantInput.value),
          quantity: Number(qtyInput.value || 1),
        });
        if (data.ok) {
          updateCartCount(data.cart.count);
          toast('Produto adicionado à sacola! 🛍️');
        } else {
          toast(data.error || 'Não foi possível adicionar à sacola.');
        }
      } catch {
        toast('Erro de conexão. Tente novamente.');
      } finally {
        addBtn.disabled = !canBuy;
      }
    });
  }

  // ---- Cart page ----------------------------------------------------------
  async function setQty(variantId, quantity) {
    const data = await api('/api/cart', { action: 'set', variant_id: variantId, quantity });
    if (data.ok) {
      updateCartCount(data.cart.count);
      location.reload();
    } else {
      toast(data.error || 'Não foi possível atualizar a quantidade.');
    }
  }

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
      toast('Item removido da sacola.');
    });
  });

  // ---- Checkout -----------------------------------------------------------
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('pay-btn');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Redirecionando…';
      const form = new FormData(checkoutForm);
      try {
        const data = await api('/api/checkout', Object.fromEntries(form.entries()));
        if (data.ok && data.url) {
          window.location.href = data.url;
        } else {
          toast(data.error || 'Não foi possível concluir o pedido.');
          btn.disabled = false;
          btn.textContent = original;
        }
      } catch {
        toast('Erro de conexão. Tente novamente.');
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  // ---- Mock payment screen ------------------------------------------------
  const mockSuccess = document.getElementById('mock-pay-success');
  if (mockSuccess) {
    mockSuccess.addEventListener('click', async () => {
      mockSuccess.disabled = true;
      const data = await api('/api/mock-pay', { order: mockSuccess.dataset.order, outcome: 'success' });
      if (data.ok) window.location.href = data.redirect;
      else {
        toast(data.error || 'Falha no pagamento.');
        mockSuccess.disabled = false;
      }
    });
    const mockFail = document.getElementById('mock-pay-fail');
    if (mockFail) {
      mockFail.addEventListener('click', async () => {
        const data = await api('/api/mock-pay', { order: mockFail.dataset.order, outcome: 'fail' });
        if (data.ok) window.location.href = data.redirect;
      });
    }
  }
})();
