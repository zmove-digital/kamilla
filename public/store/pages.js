// ============================================================================
// KAMILLA · páginas da loja
// ============================================================================

import { STORE, isDemo } from './config.js';
import { createOrder, payOrder } from './api.js';
import { addToCart, clearCart, freeShippingBar, setQuantity, removeFromCart, checkoutItems } from './cart.js';
import {
  ATTR_KEYS,
  categoryTiles,
  compareFor,
  discountPercent,
  emptyView,
  escapeHtml,
  formatDate,
  imageFallback,
  installments,
  money,
  moneyInput,
  productCard,
  productImageUrl,
  productMinPrice,
  productTotalStock,
  setBusy,
  stockLabel,
  toast,
  variantPicker,
  variantSelect,
} from './ui.js';

const ORDER_KEY = 'kamilla_orders_v1';

export function rememberOrder(order) {
  try {
    const list = JSON.parse(sessionStorage.getItem(ORDER_KEY) || '[]');
    const next = [order, ...list.filter((item) => item.number !== order.number)].slice(0, 20);
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(next));
  } catch {
    /* sessionStorage indisponível */
  }
}

export function recallOrder(number) {
  try {
    const list = JSON.parse(sessionStorage.getItem(ORDER_KEY) || '[]');
    return list.find((item) => item.number === number) || null;
  } catch {
    return null;
  }
}

function updateRememberedOrder(order) {
  try {
    const list = JSON.parse(sessionStorage.getItem(ORDER_KEY) || '[]');
    const next = list.map((item) => (item.number === order.number ? { ...item, ...order } : item));
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(next));
  } catch {
    /* ignora */
  }
}

// ---------------------------------------------------------------------------
// Início
// ---------------------------------------------------------------------------

export function homePage({ products }) {
  const featured = products.filter((p) => p.featured);
  const showcase = (featured.length ? featured : products).slice(0, 8);
  const bestSeller = showcase[0];

  const heroPhone = bestSeller
    ? `<div class="phone-stage">
        <div class="float-card fc-1">🚚 Frete grátis</div>
        <div class="float-card fc-2">💳 12x sem juros</div>
        <div class="float-card fc-3">⚡ Envio em 24h</div>
        <div class="float-card fc-4">🛡️ 12 meses de garantia</div>
        <a class="phone-frame" href="#/produto/${encodeURIComponent(bestSeller.slug)}" aria-label="${escapeHtml(
        bestSeller.name
      )}">
          <div class="phone-screen">
            <span class="phone-island"></span>
            <div class="phone-widget">
              <small>Destaque KAMILLA</small>
              <strong>${escapeHtml(bestSeller.name)}</strong>
              <span>a partir de</span>
              <b>${money(productMinPrice(bestSeller))}</b>
              <em>${installments(productMinPrice(bestSeller))}</em>
            </div>
            <div class="phone-dock"><i></i><i></i><i></i></div>
          </div>
        </a>
      </div>`
    : `<div class="phone-stage"><div class="phone-frame"><div class="phone-screen"><div class="phone-widget"><strong>KAMILLA</strong><span>Smartphones & Tecnologia</span></div></div></div></div>`;

  const trust = [
    ['🚚', 'Frete grátis', 'Acima de R$ 299 para todo o Brasil'],
    ['💳', '12x sem juros', 'No cartão, com parcelas que cabem no bolso'],
    ['🛡️', '12 meses de garantia', 'Produto novo, lacrado e com nota fiscal'],
    ['↩️', 'Troca em 7 dias', 'Comprou e não era pra você? A gente resolve'],
  ]
    .map(
      ([icon, title, text]) => `<div class="trust reveal">
        <span class="trust-icon">${icon}</span>
        <div><strong>${title}</strong><small>${text}</small></div>
      </div>`
    )
    .join('');

  const values = [
    ['🔒', 'Compra 100% segura', 'Seus dados protegidos do início ao fim. Pagamento processado com criptografia.'],
    ['⚡', 'Envio em até 24h', 'Pedido confirmado, celular a caminho. Acompanhe tudo pelo e-mail.'],
    ['💬', 'Atendimento humano', 'Nada de robô sem saída. Fale com gente de verdade de segunda a sexta.'],
    ['✅', 'Só produto original', 'Aparelhos novos, lacrados, com garantia oficial e nota fiscal.'],
  ]
    .map(
      ([icon, title, text]) => `<div class="value reveal">
        <span class="value-icon">${icon}</span>
        <h3>${title}</h3><p>${text}</p>
      </div>`
    )
    .join('');

  const reviews = [
    ['Mariana S.', 'São Paulo, SP', 'Comprei o iPhone 16 e chegou em 1 dia. Lacrado, com nota e ainda ganhei frete grátis. Atendimento impecável!'],
    ['Rafael M.', 'Belo Horizonte, MG', 'Estava em dúvida entre dois modelos e me ajudaram de verdade pelo WhatsApp. O Galaxy S24 Ultra é surreal.'],
    ['Camila R.', 'Curitiba, PR', 'Parcelamento sem juros e o Pix com desconto fez diferença. Já é a segunda compra na KAMILLA.'],
  ]
    .map(
      ([name, city, text], index) => `<article class="review reveal">
        <span class="stars">★★★★★</span>
        <p>“${text}”</p>
        <footer><span class="avatar-mini">${name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)}</span><div><strong>${name}</strong><small>${city}</small></div><span class="verified">Compra verificada</span></footer>
      </article>`
    )
    .join('');

  const faq = [
    ['Os celulares são novos e originais?', 'Sim. Todos os aparelhos são novos, lacrados, com nota fiscal e garantia oficial de 12 meses.'],
    ['Em quanto tempo meu pedido chega?', 'Enviamos em até 24h úteis após a confirmação do pagamento. O prazo de transporte varia de 2 a 7 dias úteis, conforme a sua região.'],
    ['Posso parcelar sem juros?', 'Sim, em até 12x sem juros no cartão de crédito. No Pix você ainda garante 5% de desconto.'],
    ['E se eu precisar trocar?', 'Você tem 7 dias corridos após o recebimento para solicitar troca ou devolução, com o produto na embalagem original.'],
    ['O frete é grátis?', 'Para compras acima de R$ 299, o frete é grátis para todo o Brasil. Abaixo disso, cobramos R$ 29,90.'],
  ]
    .map(
      ([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`
    )
    .join('');

  return `
  <section class="hero">
    <div class="hero-blob blob-1"></div>
    <div class="hero-blob blob-2"></div>
    <div class="hero-blob blob-3"></div>
    <div class="container hero-inner">
      <div class="hero-copy">
        <span class="eyebrow"><span class="dot"></span> Oferta relâmpago · termina hoje</span>
        <h1>O celular dos seus sonhos <span class="grad">com preço de hoje.</span></h1>
        <p class="lede">iPhone, Galaxy, Motorola, Xiaomi e mais — <strong>novos, lacrados e com garantia</strong>. Parcele em <strong>12x sem juros</strong>, pague no Pix com <strong>5% OFF</strong> e receba em até 24h.</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="#/loja">Quero meu celular agora →</a>
          <a class="btn btn-light" href="#/loja?categoria=Apple">Ver iPhones</a>
        </div>
        <div class="hero-social">
          <div class="avatars"><span>MS</span><span>RM</span><span>CR</span><span>+12k</span></div>
          <div class="social-text"><strong>+12.400 clientes felizes</strong><small><span class="stars">★★★★★</span> 4,9/5 em avaliações reais</small></div>
        </div>
        <ul class="hero-points">
          <li>Frete grátis acima de R$ 299</li>
          <li>Envio em até 24h</li>
          <li>Garantia de 12 meses</li>
        </ul>
      </div>
      <div class="hero-art">${heroPhone}</div>
    </div>
  </section>

  <section class="trust-strip"><div class="container trust-grid">${trust}</div></section>

  <section class="container section">
    <div class="section-head reveal">
      <div><span class="kicker">Os mais desejados</span><h2>Celulares que todo mundo quer</h2><p class="muted">Seleção de best-sellers com o melhor custo-benefício do Brasil.</p></div>
      <a class="link-arrow" href="#/loja">Ver todos os celulares →</a>
    </div>
    ${
      showcase.length
        ? `<div class="product-grid">${showcase.map(productCard).join('')}</div>`
        : emptyView({ icon: '📱', title: 'Catálogo em preparação', text: 'Os celulares aparecerão aqui assim que forem cadastrados.' })
    }
  </section>

  ${
    products.length
      ? `<section class="container section">
      <div class="section-head reveal"><div><span class="kicker">Escolha pela marca</span><h2>Qual é a sua vibe?</h2></div></div>
      <div class="cat-grid">${categoryTiles(products)}</div>
    </section>`
      : ''
  }

  <section class="promo-flash">
    <div class="container promo-flash-inner">
      <div class="promo-copy reveal">
        <span class="pill-hot">⚡ Só hoje</span>
        <h2>Leve o celular novo pagando menos.</h2>
        <p>Use o cupom <strong>KAMILLA5</strong> e ganhe <strong>5% OFF no Pix</strong>. Estoque limitado — quando acaba, acabou.</p>
      </div>
      <div class="reveal">
        <p class="small" style="color:rgba(226,232,240,.65);margin-bottom:10px">A oferta termina em:</p>
        <div class="countdown" data-countdown>
          <div><span data-cd="hours">00</span><small>horas</small></div>
          <div><span data-cd="minutes">00</span><small>min</small></div>
          <div><span data-cd="seconds">00</span><small>seg</small></div>
        </div>
      </div>
    </div>
  </section>

  <section class="container section">
    <div class="section-head reveal"><div><span class="kicker">Por que KAMILLA</span><h2>Comprar aqui é diferente</h2></div></div>
    <div class="value-grid">${values}</div>
  </section>

  <section class="testimonials section">
    <div class="container">
      <div class="section-head center-head reveal"><span class="kicker">Quem comprou, recomenda</span><h2>Histórias que dão vontade de trocar de celular</h2><p class="muted">Mais de 12 mil clientes já receberam em casa. Veja o que eles dizem.</p></div>
      <div class="review-grid">${reviews}</div>
    </div>
  </section>

  <section class="container section">
    <div class="section-head center-head reveal"><span class="kicker">Dúvidas frequentes</span><h2>Tudo o que você precisa saber</h2></div>
    <div class="accordion faq-accordion reveal">${faq}</div>
  </section>`;
}

// ---------------------------------------------------------------------------
// Loja
// ---------------------------------------------------------------------------

export function shopPage({ products, category = '', search = '', sort = '' }) {
  const needle = search.trim().toLowerCase();
  const filtered = products.filter((product) => {
    if (category && product.category.toLowerCase() !== category.toLowerCase()) return false;
    if (needle) {
      const haystack = `${product.name} ${product.category} ${product.subtitle} ${product.description}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  const list = [...filtered];
  if (sort === 'preco-asc') list.sort((a, b) => productMinPrice(a) - productMinPrice(b));
  else if (sort === 'preco-desc') list.sort((a, b) => productMinPrice(b) - productMinPrice(a));
  else if (sort === 'nome') list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const categories = [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const chips = [
    `<a class="chip${!category ? ' is-active' : ''}" href="#/loja">Todos</a>`,
    ...categories.map(
      (cat) =>
        `<a class="chip${category === cat ? ' is-active' : ''}" href="#/loja?categoria=${encodeURIComponent(
          cat
        )}">${escapeHtml(cat)}</a>`
    ),
  ].join('');

  return `
  <section class="shop-hero">
    <div class="container">
      <nav class="breadcrumb"><a href="#/">Início</a> <span>/</span> <span>Celulares</span></nav>
      <h1>${category ? `Celulares ${escapeHtml(category)}` : 'Todos os celulares'}</h1>
      <p class="muted">${list.length} ${list.length === 1 ? 'modelo encontrado' : 'modelos encontrados'}${
    search ? ` para “${escapeHtml(search)}”` : ''
  } · novos, lacrados e com garantia de 12 meses.</p>
    </div>
  </section>

  <section class="container section">
    <div class="shop-toolbar">
      <div class="chips">${chips}</div>
      <div class="toolbar-right">
        <form class="search-form" data-shop-search>
          <input type="search" name="q" placeholder="Buscar celular…" value="${escapeHtml(search)}" aria-label="Buscar celular">
        </form>
        <form class="sort-form">
          <select data-shop-sort aria-label="Ordenar por">
            <option value=""${sort === '' ? ' selected' : ''}>Mais relevantes</option>
            <option value="preco-asc"${sort === 'preco-asc' ? ' selected' : ''}>Menor preço</option>
            <option value="preco-desc"${sort === 'preco-desc' ? ' selected' : ''}>Maior preço</option>
            <option value="nome"${sort === 'nome' ? ' selected' : ''}>Nome A–Z</option>
          </select>
        </form>
      </div>
    </div>

    ${
      list.length
        ? `<div class="product-grid">${list.map(productCard).join('')}</div>`
        : emptyView({
            icon: '🔍',
            title: 'Nenhum celular encontrado',
            text: search
              ? 'Tente outro termo ou veja todas as categorias.'
              : 'Ainda não há produtos nesta categoria.',
            ctaHref: '#/loja',
            ctaLabel: 'Ver todos os celulares',
          })
    }
  </section>`;
}

export function bindShopPage({ category = '', search = '', sort = '' }) {
  const form = document.querySelector('[data-shop-search]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = new FormData(form).get('q')?.toString().trim() || '';
    const params = new URLSearchParams();
    if (category) params.set('categoria', category);
    if (value) params.set('q', value);
    if (sort) params.set('ordem', sort);
    location.hash = `#/loja${params.toString() ? `?${params}` : ''}`;
  });

  document.querySelector('[data-shop-sort]')?.addEventListener('change', (event) => {
    const params = new URLSearchParams();
    if (category) params.set('categoria', category);
    if (search) params.set('q', search);
    if (event.target.value) params.set('ordem', event.target.value);
    location.hash = `#/loja${params.toString() ? `?${params}` : ''}`;
  });
}

// ---------------------------------------------------------------------------
// Produto
// ---------------------------------------------------------------------------

export function productPage({ product, related = [] }) {
  const variants = product.variants || [];
  const totalStock = productTotalStock(product);
  const picker = variantPicker(product);
  const initial = picker ? picker.initial : variants.find((v) => v.stock > 0) || variants[0];
  const initialPrice = initial?.price_cents ?? product.price_cents;
  const initialStock = initial?.stock ?? totalStock;
  const initialCompare = compareFor(product, initialPrice);
  const off = discountPercent(initialPrice, initialCompare);
  const pixPrice = Math.round(initialPrice * (1 - STORE.pixDiscount));

  const detailList = String(product.details || '')
    .split('·')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  return `
  <div class="container">
    <nav class="breadcrumb"><a href="#/">Início</a> <span>/</span> <a href="#/loja?categoria=${encodeURIComponent(
      product.category
    )}">${escapeHtml(product.category)}</a> <span>/</span> <span>${escapeHtml(product.name)}</span></nav>
  </div>

  <section class="container product-detail">
    <div class="gallery reveal">
      <div class="gallery-main">
        <img src="${escapeHtml(productImageUrl(product))}" alt="${escapeHtml(product.name)}" ${imageFallback()}>
        ${off > 0 ? `<span class="gallery-off">-${off}%</span>` : ''}
      </div>
      <div class="gallery-trust"><span>🔒 Compra segura</span><span>🛡️ 12 meses de garantia</span><span>🚚 Envio em 24h</span></div>
      <ul class="pdp-benefits" style="margin-top:20px">
        <li><span>✅</span> Produto novo, lacrado e com nota fiscal</li>
        <li><span>🛡️</span> Garantia oficial de 12 meses</li>
        <li><span>⚡</span> Envio em até 24h úteis após o pagamento</li>
        <li><span>↩️</span> Troca ou devolução em até 7 dias</li>
      </ul>
    </div>

    <div class="pdp reveal">
      <span class="product-cat">${escapeHtml(product.category)}</span>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="pdp-sub">${escapeHtml(product.subtitle || '')}</p>
      <div class="pdp-rating"><span class="stars">★★★★★</span> <strong>4,9</strong> <span class="muted">(312 avaliações)</span></div>

      <div class="pdp-price-block">
        <div class="pdp-price" id="pdp-price" data-cents="${initialPrice}">${money(initialPrice)}</div>
        <div class="pdp-compare" id="pdp-compare">${
          off > 0 ? `${money(initialCompare)} <span class="off-tag">-${off}%</span>` : ''
        }</div>
        <p class="installments" id="pdp-installments">${installments(initialPrice)}</p>
        <p class="pix-line">💠 <strong>${money(pixPrice)} no Pix</strong> · 5% OFF · ou 12x sem juros</p>
      </div>

      ${picker ? picker.html : variantSelect(product)}

      <div class="pdp-field qty-field">
        <label for="qty">Quantidade</label>
        <div class="stepper">
          <button type="button" data-step="-1" aria-label="Diminuir">−</button>
          <input id="qty" type="number" value="1" min="1" max="${Math.max(initialStock, 1)}">
          <button type="button" data-step="1" aria-label="Aumentar">+</button>
        </div>
        <p class="stock-line ${initialStock <= 0 ? 'is-out' : initialStock <= 5 ? 'is-low' : ''}" id="stock-line">${stockLabel(
          initialStock
        )}</p>
      </div>

      <button class="btn btn-primary btn-block btn-buy" id="add-to-cart" data-product="${escapeHtml(
        product.slug
      )}" ${initialStock <= 0 ? 'disabled' : ''}>${
        initialStock > 0 ? 'Adicionar à sacola 🛍️' : 'Produto esgotado'
      }</button>
      <p class="pdp-note">🚚 Frete grátis acima de R$ 299 · 💳 12x sem juros · ↩️ Troca em 7 dias</p>

      <div class="accordion" style="margin-top:24px">
        <details open><summary>Descrição</summary><p>${escapeHtml(product.description || '')}</p></details>
        ${detailList ? `<details><summary>Ficha técnica</summary><ul>${detailList}</ul></details>` : ''}
        <details><summary>Envio e devolução</summary><p>Enviamos em até 24h úteis após a confirmação do pagamento. Frete grátis para compras acima de R$ 299. Você tem 7 dias corridos para troca ou devolução, com o produto na embalagem original.</p></details>
        <details><summary>Formas de pagamento</summary><p>Cartão de crédito em até 12x sem juros, Pix com 5% de desconto ou boleto bancário. O pagamento é processado com segurança.</p></details>
      </div>
    </div>
  </section>

  ${
    related.length
      ? `<section class="container section">
      <div class="section-head reveal"><div><span class="kicker">Compare</span><h2>Você também vai gostar</h2></div></div>
      <div class="product-grid">${related.map(productCard).join('')}</div>
    </section>`
      : ''
  }`;
}

export function bindProductPage({ product }) {
  const addBtn = document.getElementById('add-to-cart');
  if (!addBtn) return;

  const priceEl = document.getElementById('pdp-price');
  const instEl = document.getElementById('pdp-installments');
  const qtyInput = document.getElementById('qty');
  const stockLine = document.getElementById('stock-line');
  const variantInput = document.getElementById('variant');
  const compareEl = document.getElementById('pdp-compare');
  const pixEl = document.querySelector('.pix-line');
  const variants = product.variants || [];
  let selected = variants.find((v) => v.id === Number(variantInput?.value)) || variants[0];
  let canBuy = false;

  function paintStock(stock) {
    if (!stockLine) return;
    stockLine.textContent = stockLabel(stock);
    stockLine.classList.toggle('is-out', stock <= 0);
    stockLine.classList.toggle('is-low', stock > 0 && stock <= 5);
  }

  function paintVariant(cents, stock, compare = 0) {
    canBuy = stock > 0;
    if (priceEl) {
      priceEl.textContent = money(cents);
      priceEl.dataset.cents = String(cents);
    }
    if (instEl) instEl.textContent = installments(cents);
    if (pixEl) {
      const pix = Math.round(cents * (1 - STORE.pixDiscount));
      pixEl.innerHTML = `💠 <strong>${money(pix)} no Pix</strong> · 5% OFF · ou 12x sem juros`;
    }
    if (compareEl) {
      if (compare > cents) {
        const off = discountPercent(cents, compare);
        compareEl.innerHTML = `${money(compare)} <span class="off-tag">-${off}%</span>`;
      } else {
        compareEl.textContent = '';
      }
    }
    paintStock(stock);
    if (qtyInput) {
      qtyInput.max = String(Math.max(stock, 1));
      if (Number(qtyInput.value) > stock) qtyInput.value = String(Math.max(stock, 1));
    }
    addBtn.disabled = !canBuy;
    addBtn.textContent = canBuy ? 'Adicionar à sacola 🛍️' : 'Produto esgotado';
  }

  const dataEl = document.getElementById('variant-data');
  if (dataEl && variantInput) {
    let list = [];
    try {
      list = JSON.parse(dataEl.textContent);
    } catch {
      list = [];
    }
    const pickers = [...document.querySelectorAll('.picker')];
    const state = {};
    pickers.forEach((picker) => {
      const active = picker.querySelector('.opt.is-active');
      if (active) state[picker.dataset.attr] = active.dataset.value;
    });
    const currentColor = document.querySelector('[data-current="color"]');

    const matches = (variant, selection) =>
      Object.keys(selection).every((key) => variant[key] === selection[key]);
    const exact = () => list.find((variant) => matches(variant, state));
    const available = (attr, value) => {
      const test = { ...state, [attr]: value };
      return list.some((variant) => variant.stock > 0 && matches(variant, test));
    };

    const render = () => {
      pickers.forEach((picker) => {
        const attr = picker.dataset.attr;
        picker.querySelectorAll('.opt').forEach((button) => {
          const ok = available(attr, button.dataset.value);
          button.classList.toggle('is-active', state[attr] === button.dataset.value);
          button.classList.toggle('is-disabled', !ok);
          button.setAttribute('aria-disabled', ok ? 'false' : 'true');
          button.title = ok ? '' : 'Indisponível nesta combinação';
        });
      });
      if (currentColor) currentColor.textContent = state.color || '';
      const variant = exact();
      if (!variant) return;
      selected = variants.find((v) => Number(v.id) === Number(variant.id)) || selected;
      variantInput.value = String(variant.id);
      paintVariant(variant.price, variant.stock, variant.compare);
    };

    pickers.forEach((picker) => {
      picker.addEventListener('click', (event) => {
        const button = event.target.closest('.opt');
        if (!button || button.classList.contains('is-disabled')) return;
        const attr = picker.dataset.attr;
        state[attr] = button.dataset.value;
        // Se a combinação exata estiver esgotada, escolhe a primeira
        // combinação disponível com o valor clicado (ajustando os outros).
        if (!exact()) {
          const fallback = list.find((variant) => variant.stock > 0 && variant[attr] === button.dataset.value);
          if (fallback) {
            state.storage = fallback.storage;
            state.ram = fallback.ram;
            state.color = fallback.color;
          }
        }
        render();
      });
    });
    render();
  } else if (variantInput && variantInput.tagName === 'SELECT') {
    const refresh = () => {
      const option = variantInput.options[variantInput.selectedIndex];
      if (!option) return;
      selected = variants.find((v) => Number(v.id) === Number(option.value)) || selected;
      paintVariant(Number(option.dataset.price), Number(option.dataset.stock), Number(option.dataset.compare));
    };
    variantInput.addEventListener('change', refresh);
    refresh();
  }

  document.querySelectorAll('.stepper [data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!qtyInput) return;
      const max = Math.max(Number(qtyInput.max) || 1, 1);
      const next = Math.min(max, Math.max(1, Number(qtyInput.value || 1) + Number(button.dataset.step)));
      qtyInput.value = String(next);
    });
  });

  qtyInput?.addEventListener('change', () => {
    const max = Math.max(Number(qtyInput.max) || 1, 1);
    qtyInput.value = String(Math.min(max, Math.max(1, Number(qtyInput.value) || 1)));
  });

  addBtn.addEventListener('click', () => {
    const variant = variants.find((v) => Number(v.id) === Number(variantInput?.value)) || selected;
    if (!variant) return;
    const quantity = Math.max(1, Number(qtyInput?.value) || 1);
    addToCart(variant, quantity);
  });
}

// ---------------------------------------------------------------------------
// Sacola
// ---------------------------------------------------------------------------

export function cartPage({ lines, totals }) {
  if (!lines.length) {
    return `<div class="container section">${emptyView({
      icon: '🛍️',
      title: 'Sua sacola está vazia',
      text: 'Escolha seu próximo celular e volte aqui para finalizar a compra.',
      ctaHref: '#/loja',
      ctaLabel: 'Ver celulares',
    })}</div>`;
  }

  const rows = lines
    .map((line) => {
      const { variant, product, quantity, line_total_cents } = line;
      return `<div class="cart-line" data-line="${line.variant_id}">
        <a href="#/produto/${encodeURIComponent(product.slug)}"><img class="cart-thumb" src="${escapeHtml(
        productImageUrl(product)
      )}" alt="${escapeHtml(product.name)}" ${imageFallback()}></a>
        <div class="cart-line-info">
          <a class="cart-line-name" href="#/produto/${encodeURIComponent(product.slug)}">${escapeHtml(
        product.name
      )}</a>
          <span class="muted small">${escapeHtml(variant.name)}</span>
          <span class="muted cart-line-sku">SKU ${escapeHtml(variant.sku)}</span>
          <span class="installments">${installments(line_total_cents)}</span>
          ${
            quantity >= variant.stock
              ? `<span class="warn">Máximo em estoque: ${variant.stock}</span>`
              : ''
          }
        </div>
        <div class="cart-line-qty">
          <div class="stepper small">
            <button type="button" data-cart-step="-1" aria-label="Diminuir">−</button>
            <input type="number" value="${quantity}" min="1" max="${variant.stock}" data-cart-qty aria-label="Quantidade">
            <button type="button" data-cart-step="1" aria-label="Aumentar">+</button>
          </div>
          <button type="button" class="link-remove" data-cart-remove>Remover</button>
        </div>
        <div class="cart-line-total">${money(line_total_cents)}</div>
      </div>`;
    })
    .join('');

  return `<div class="container section">
    <nav class="breadcrumb"><a href="#/">Início</a> <span>/</span> <span>Sacola</span></nav>
    <div class="cart-layout">
      <div class="cart-main">
        <h1>Sua sacola</h1>
        <p class="muted">${totals.count} ${totals.count === 1 ? 'item' : 'itens'} · revise antes de finalizar.</p>
        ${freeShippingBar(totals)}
        <div class="cart-lines">${rows}</div>
        <p style="margin-top:20px"><a class="btn btn-ghost" href="#/loja">← Continuar comprando</a></p>
      </div>
      <aside class="cart-summary">
        <h2>Resumo do pedido</h2>
        <div class="summary-row"><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>
        <div class="summary-row"><span>Frete</span><span>${
          totals.freeShipping ? '<span class="free-tag">Grátis</span>' : money(totals.shipping)
        }</span></div>
        <div class="summary-row total"><span>Total</span><span>${money(totals.total)}</span></div>
        <p class="summary-installments">${installments(totals.total)}</p>
        <a class="btn btn-primary btn-block" href="#/checkout">Finalizar compra →</a>
        <div class="summary-trust">
          <span>💠 5% OFF pagando com Pix</span>
          <span>🔒 Ambiente 100% seguro</span>
          <span>🚚 Envio em até 24h úteis</span>
          <span>↩️ Troca em 7 dias</span>
        </div>
      </aside>
    </div>
  </div>`;
}

export function bindCartPage({ lines, reload }) {
  const root = document.querySelector('.cart-lines');
  if (!root) return;

  root.addEventListener('click', (event) => {
    const line = event.target.closest('[data-line]');
    if (!line) return;
    const id = Number(line.dataset.line);
    const item = lines.find((entry) => entry.variant_id === id);
    if (!item) return;

    if (event.target.closest('[data-cart-remove]')) {
      removeFromCart(id);
      reload();
      return;
    }

    const step = event.target.closest('[data-cart-step]');
    if (step) {
      const next = item.quantity + Number(step.dataset.cartStep);
      setQuantity(id, next, item.variant.stock);
      reload();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-cart-qty]');
    if (!input) return;
    const line = input.closest('[data-line]');
    const item = lines.find((entry) => entry.variant_id === Number(line.dataset.line));
    if (!item) return;
    setQuantity(item.variant_id, Number(input.value) || 1, item.variant.stock);
    reload();
  });
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export function checkoutPage({ lines, totals }) {
  if (!lines.length) {
    return `<div class="container section">${emptyView({
      icon: '🛍️',
      title: 'Sua sacola está vazia',
      text: 'Adicione um celular para finalizar a compra.',
    })}</div>`;
  }

  const summary = lines
    .map(
      (line) => `<div class="summary-line">
        <span>${escapeHtml(line.product.name)}<br><small class="muted">${escapeHtml(
        line.variant.name
      )} × ${line.quantity}</small></span>
        <strong>${money(line.line_total_cents)}</strong>
      </div>`
    )
    .join('');

  return `<div class="container section">
    <nav class="breadcrumb"><a href="#/">Início</a> <span>/</span> <a href="#/carrinho">Sacola</a> <span>/</span> <span>Checkout</span></nav>
    <div class="checkout-layout">
      <div class="checkout-form">
        <h1>Finalizar compra</h1>
        <p class="muted">Preencha seus dados. O pagamento é simulado nesta versão de testes.</p>

        ${
          isDemo
            ? `<div class="alert">🧪 <strong>Modo demonstração.</strong> O Supabase ainda não está configurado, então os pedidos não podem ser finalizados. A loja está em modo demonstração.</div>`
            : ''
        }

        <form id="checkout-form" novalidate>
          <fieldset>
            <legend>Seus dados</legend>
            <label>Nome completo
              <input type="text" name="full_name" autocomplete="name" placeholder="Como no documento" required>
            </label>
            <label>E-mail
              <input type="email" name="email" autocomplete="email" placeholder="voce@email.com" required>
            </label>
          </fieldset>
          <fieldset>
            <legend>Entrega</legend>
            <label>Endereço completo
              <input type="text" name="address" autocomplete="street-address" placeholder="Rua, número, bairro, cidade e CEP" required>
            </label>
            <div class="payment-box">
              <span class="pay-badge">PIX</span>
              <p><strong>Pagamento seguro</strong><br><span class="muted small">Pix com 5% OFF ou cartão em até 12x. Nesta versão, a aprovação é simulada.</span></p>
            </div>
          </fieldset>
          <button class="btn btn-primary btn-block" type="submit" ${isDemo ? 'disabled' : ''}>Criar pedido e pagar →</button>
          <p class="pdp-note">🔒 Seus dados são usados apenas para processar este pedido.</p>
        </form>
      </div>

      <aside class="cart-summary">
        <h2>Seu pedido</h2>
        ${summary}
        <div class="summary-row"><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>
        <div class="summary-row"><span>Frete</span><span>${
          totals.freeShipping ? '<span class="free-tag">Grátis</span>' : money(totals.shipping)
        }</span></div>
        <div class="summary-row total"><span>Total</span><span>${money(totals.total)}</span></div>
        <p class="summary-installments">${installments(totals.total)}</p>
        <div class="summary-trust">
          <span>🔒 Ambiente 100% seguro</span>
          <span>🚚 Envio em até 24h úteis</span>
          <span>🛡️ Garantia de 12 meses</span>
        </div>
      </aside>
    </div>
  </div>`;
}

export function bindCheckoutPage({ lines, navigate }) {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isDemo) {
      toast('Configure o Supabase para finalizar pedidos.');
      return;
    }

    const data = new FormData(form);
    const fullName = String(data.get('full_name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const address = String(data.get('address') || '').trim();

    if (fullName.length < 2) return toast('Informe seu nome completo.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast('Informe um e-mail válido.');
    if (address.length < 8) return toast('Informe o endereço de entrega.');

    const submit = form.querySelector('button[type="submit"]');
    setBusy(submit, true, 'Criando pedido…');
    try {
      const order = await createOrder({ email, fullName, address, items: checkoutItems(lines) });
      rememberOrder({
        ...order,
        email,
        full_name: fullName,
        address,
        items: lines.map((line) => ({
          product_name: line.product.name,
          variant_name: line.variant.name,
          sku: line.variant.sku,
          unit_price_cents: line.unit_price_cents,
          quantity: line.quantity,
        })),
      });
      navigate(`#/pagamento/${encodeURIComponent(order.number)}`);
    } catch (error) {
      toast(error.message || 'Não foi possível criar o pedido.');
      setBusy(submit, false);
    }
  });
}

// ---------------------------------------------------------------------------
// Pagamento simulado
// ---------------------------------------------------------------------------

export function paymentPage({ order }) {
  const items = (order.items || [])
    .map(
      (item) => `<div class="summary-line"><span>${escapeHtml(item.product_name)}<br><small class="muted">${escapeHtml(
        item.variant_name
      )} × ${item.quantity}</small></span><strong>${money(
        item.unit_price_cents * item.quantity
      )}</strong></div>`
    )
    .join('');

  return `<div class="container section">
    <nav class="breadcrumb"><a href="#/">Início</a> <span>/</span> <a href="#/carrinho">Sacola</a> <span>/</span> <span>Pagamento</span></nav>
    <div class="checkout-layout">
      <div class="mock-pay">
        <span class="kicker">Pagamento simulado</span>
        <h1>Escolha como pagar</h1>
        <p class="muted">Pedido <strong>${escapeHtml(order.number)}</strong> criado com sucesso. Nesta versão de testes, você escolhe o resultado do pagamento.</p>

        <div class="alert">🧪 <strong>Modo de teste.</strong> Nenhum valor real será cobrado. A integração com Mercado Pago/Stripe entra na próxima etapa.</div>

        <div class="mock-card">
          <label>Pix (aprovação imediata)
            <input value="Chave Pix: pagamento@kamilla.com.br" readonly>
          </label>
          <label>Cartão de crédito (simulado)
            <input value="4242 4242 4242 4242 · 12/30 · 123" readonly>
          </label>
        </div>

        <div class="mock-actions">
          <button class="btn btn-primary" data-pay="success">✅ Aprovar pagamento</button>
          <button class="btn btn-ghost" data-pay="fail">❌ Simular falha</button>
        </div>
        <p class="pdp-note">Total: <strong>${money(order.total_cents)}</strong> · ${installments(order.total_cents)}</p>
      </div>

      <aside class="cart-summary">
        <h2>Resumo</h2>
        ${items}
        <div class="summary-row"><span>Subtotal</span><span>${money(order.subtotal_cents)}</span></div>
        <div class="summary-row"><span>Frete</span><span>${
          order.shipping_cents ? money(order.shipping_cents) : '<span class="free-tag">Grátis</span>'
        }</span></div>
        <div class="summary-row total"><span>Total</span><span>${money(order.total_cents)}</span></div>
        <p class="summary-installments">${installments(order.total_cents)}</p>
      </aside>
    </div>
  </div>`;
}

export function bindPaymentPage({ order, navigate }) {
  document.querySelectorAll('[data-pay]').forEach((button) => {
    button.addEventListener('click', async () => {
      const outcome = button.dataset.pay;
      setBusy(button, true, outcome === 'fail' ? 'Simulando…' : 'Aprovando…');
      try {
        const result = await payOrder(order.number, outcome);
        if (result.status === 'paid') clearCart();
        const updated = {
          ...order,
          status: result.status,
          total_cents: result.total_cents ?? order.total_cents,
          paid_at: result.paid_at || order.paid_at,
        };
        rememberOrder(updated);
        updateRememberedOrder(updated);
        navigate(`#/pedido/${encodeURIComponent(order.number)}`);
      } catch (error) {
        toast(error.message || 'Não foi possível processar o pagamento.');
        setBusy(button, false);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Sucesso / status do pedido
// ---------------------------------------------------------------------------

export function orderPage({ order }) {
  const paid = order.status === 'paid' || order.status === 'shipped';
  const failed = order.status === 'failed' || order.status === 'cancelled';

  const items = (order.items || [])
    .map(
      (item) => `<div class="summary-line"><span>${escapeHtml(item.product_name)}<br><small class="muted">${escapeHtml(
        item.variant_name
      )} × ${item.quantity}</small></span><strong>${money(
        item.unit_price_cents * item.quantity
      )}</strong></div>`
    )
    .join('');

  return `<div class="container section center">
    ${
      paid
        ? `<div class="success-mark">✓</div><h1>Pagamento confirmado!</h1><p class="muted">Obrigado, ${escapeHtml(
            order.full_name || 'cliente'
          )}. Seu pedido já está sendo preparado com carinho.</p>`
        : failed
        ? `<div class="success-mark" style="background:linear-gradient(135deg,#ef4444,#f97316)">!</div><h1>Pagamento não aprovado</h1><p class="muted">O pedido ${escapeHtml(
            order.number
          )} não foi pago. Você pode tentar novamente escolhendo outro celular.</p>`
        : `<div class="success-mark" style="background:linear-gradient(135deg,#f59e0b,#f97316)">⏳</div><h1>Pedido criado!</h1><p class="muted">Falta pouco: conclua o pagamento para liberar o envio.</p>`
    }

    <div class="order-card">
      <div class="summary-row"><span>Pedido</span><strong>${escapeHtml(order.number)}</strong></div>
      <div class="summary-row"><span>Status</span><span>${
        paid ? '<span class="pill pill-green">Pago</span>' : failed ? '<span class="pill pill-red">Não aprovado</span>' : '<span class="pill pill-amber">Aguardando pagamento</span>'
      }</span></div>
      <div class="summary-row"><span>Data</span><span>${formatDate(order.created_at)}</span></div>
      ${items}
      <div class="summary-row total"><span>Total</span><span>${money(order.total_cents)}</span></div>
      <p class="summary-installments">${installments(order.total_cents)}</p>
    </div>

    <div class="success-actions">
      ${
        !paid && !failed
          ? `<a class="btn btn-primary" href="#/pagamento/${encodeURIComponent(order.number)}">Pagar agora →</a>`
          : ''
      }
      ${failed ? `<a class="btn btn-primary" href="#/loja">Escolher outro celular →</a>` : ''}
      ${paid ? `<a class="btn btn-primary" href="#/loja">Continuar comprando →</a>` : ''}
      <a class="btn btn-ghost" href="#/">Voltar ao início</a>
    </div>

    ${
      paid
        ? `<div class="order-card"><h3>Próximos passos</h3><p class="muted" style="margin:0">Você receberá a confirmação por e-mail. O envio acontece em até 24h úteis. Em caso de dúvida, fale com a gente em <a href="mailto:${STORE.email}" style="color:var(--primary);font-weight:700">${STORE.email}</a>.</p></div>`
        : ''
    }
  </div>`;
}

export function notFoundPage() {
  return `<div class="container section">${emptyView({
    icon: '🔎',
    title: 'Página não encontrada',
    text: 'O link que você tentou abrir não existe ou foi movido.',
    ctaHref: '#/',
    ctaLabel: 'Voltar ao início',
  })}</div>`;
}

export { moneyInput };
