import { layout } from './layout.js';
import { escapeHtml, formatMoney, formatInstallments } from '../lib/util.js';
import { realImageUrl } from '../lib/images.js';
import { config } from '../config.js';

function discountPercent(price, compare) {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

function installmentLine(cents) {
  return `<span class="installments">${formatInstallments(cents)}</span>`;
}

function productCard(p) {
  const minPrice = Math.min(...p.variants.map((v) => v.price_cents));
  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
  const soldOut = totalStock <= 0;
  const off = discountPercent(minPrice, p.compare_at_cents);

  const badges = [];
  if (soldOut) badges.push('<span class="badge badge-soldout">Esgotado</span>');
  else if (p.featured) badges.push('<span class="badge badge-hot">🔥 Mais vendido</span>');
  if (off > 0) badges.push(`<span class="badge badge-off">-${off}%</span>`);

  return `<article class="product-card reveal">
    <a href="/product/${p.slug}" class="product-media">
      <img src="/img/${encodeURIComponent(p.slug)}.svg" alt="${escapeHtml(p.name)}" loading="lazy">
      <span class="badge-stack">${badges.join('')}</span>
      <span class="quick-view">Ver oferta →</span>
    </a>
    <div class="product-info">
      <span class="product-cat">${escapeHtml(p.category)}</span>
      <h3><a href="/product/${p.slug}">${escapeHtml(p.name)}</a></h3>
      <p class="product-sub">${escapeHtml(p.subtitle)}</p>
      <div class="price">
        <span class="price-now">${formatMoney(minPrice)}</span>
        ${off > 0 ? `<span class="price-compare">${formatMoney(p.compare_at_cents)}</span>` : ''}
      </div>
      ${installmentLine(minPrice)}
    </div>
  </article>`;
}

export function homePage({ featured, categories, cartCount }) {
  const catTiles = categories
    .map(
      (c) => `<a class="cat-tile reveal" href="/shop?category=${encodeURIComponent(c.category)}">
        <img src="/img/${encodeURIComponent('cat-' + c.category)}.svg" alt="${escapeHtml(c.category)}" loading="lazy">
        <span>${escapeHtml(c.category)} <em>${c.count} ${c.count === 1 ? 'modelo' : 'modelos'}</em></span>
      </a>`
    )
    .join('');

  const body = `
  <section class="hero">
    <span class="hero-blob blob-1"></span>
    <span class="hero-blob blob-2"></span>
    <span class="hero-blob blob-3"></span>
    <div class="container hero-inner">
      <div class="hero-copy reveal">
        <span class="eyebrow"><i class="dot"></i> Ofertas da semana · até 20% OFF</span>
        <h1>O celular dos seus sonhos, <span class="grad">sem pagar caro.</span></h1>
        <p class="lede">iPhone, Galaxy, Motorola e Xiaomi com <strong>12x sem juros</strong>, frete grátis acima de R$ 299 e garantia de 12 meses. Entrega rápida para todo o Brasil.</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="/shop">Ver ofertas <span>→</span></a>
          <a class="btn btn-ghost" href="/shop?category=Apple">Conhecer os iPhones</a>
        </div>
        <div class="hero-social">
          <div class="avatars"><span>JC</span><span>MA</span><span>RS</span><span>+12k</span></div>
          <div class="social-text"><strong>4,9/5 <span class="stars">★★★★★</span></strong><small>+12.000 clientes satisfeitos</small></div>
        </div>
        <ul class="hero-points">
          <li>Frete grátis</li>
          <li>12x sem juros</li>
          <li>Garantia 12 meses</li>
        </ul>
      </div>
      <div class="hero-art reveal">
        <div class="phone-stage">
          <div class="phone-frame">
            <div class="phone-screen">
              <span class="phone-island"></span>
              <div class="phone-widget">
                <small>KAMILLA · oferta</small>
                <strong>iPhone 16</strong>
                <span>a partir de</span>
                <b>R$ 5.499</b>
                <em>ou 12x de R$ 458,25</em>
              </div>
              <div class="phone-dock"><i></i><i></i><i></i><i></i></div>
            </div>
          </div>
          <div class="float-card fc-1">✅ Frete grátis</div>
          <div class="float-card fc-2">💳 12x sem juros</div>
          <div class="float-card fc-3">🔥 -20% OFF</div>
          <div class="float-card fc-4">🛡️ Garantia 12 meses</div>
        </div>
      </div>
    </div>
  </section>

  <section class="trust-strip">
    <div class="container trust-grid">
      <div class="trust"><span class="trust-icon">🚚</span><div><strong>Frete grátis</strong><small>Acima de R$ 299</small></div></div>
      <div class="trust"><span class="trust-icon">💳</span><div><strong>12x sem juros</strong><small>No cartão de crédito</small></div></div>
      <div class="trust"><span class="trust-icon">🛡️</span><div><strong>Garantia 12 meses</strong><small>Produto novo e original</small></div></div>
      <div class="trust"><span class="trust-icon">↩️</span><div><strong>Troca em 7 dias</strong><small>Sem complicação</small></div></div>
    </div>
  </section>

  <section class="container section">
    <div class="section-head reveal">
      <div><span class="kicker">Navegue por marca</span><h2>Escolha seu próximo celular</h2></div>
      <a href="/shop" class="link-arrow">Ver todos →</a>
    </div>
    <div class="cat-grid">${catTiles}</div>
  </section>

  <section class="container section">
    <div class="section-head reveal">
      <div><span class="kicker">Os favoritos do Brasil</span><h2>Mais vendidos da semana</h2></div>
      <a href="/shop" class="link-arrow">Ver todos →</a>
    </div>
    <div class="product-grid">${featured.map(productCard).join('')}</div>
  </section>

  <section class="promo-flash">
    <div class="container promo-flash-inner reveal">
      <div class="promo-copy">
        <span class="pill-hot">⚡ Oferta relâmpago</span>
        <h2>Até 20% OFF em celulares selecionados</h2>
        <p>Use o cupom <strong>KAMILLA20</strong> e leve seu novo celular pagando menos. Enquanto durar o estoque.</p>
        <a class="btn btn-light" href="/shop">Aproveitar agora <span>→</span></a>
      </div>
      <div class="countdown" id="countdown" aria-label="Tempo restante da oferta">
        <div><span data-cd="hours">00</span><small>horas</small></div>
        <div><span data-cd="minutes">00</span><small>min</small></div>
        <div><span data-cd="seconds">00</span><small>seg</small></div>
      </div>
    </div>
  </section>

  <section class="container section">
    <div class="section-head center-head reveal">
      <span class="kicker">A diferença KAMILLA</span>
      <h2>Por que comprar com a gente?</h2>
      <p class="muted">Tecnologia de verdade, com o atendimento que você merece.</p>
    </div>
    <div class="value-grid">
      <div class="value reveal"><span class="value-icon">⚡</span><h3>Envio em até 24h</h3><p>Seu pedido sai rápido do estoque, com rastreio em tempo real.</p></div>
      <div class="value reveal"><span class="value-icon">🔒</span><h3>Compra segura</h3><p>Pagamento processado pela Stripe, com criptografia de ponta a ponta.</p></div>
      <div class="value reveal"><span class="value-icon">💎</span><h3>Produtos originais</h3><p>Aparelhos novos, lacrados, com nota fiscal e garantia oficial.</p></div>
      <div class="value reveal"><span class="value-icon">🤝</span><h3>Atendimento humano</h3><p>Gente de verdade para te ajudar antes e depois da compra.</p></div>
    </div>
  </section>

  <section class="section testimonials">
    <div class="container">
      <div class="section-head center-head reveal">
        <span class="kicker">Prova social</span>
        <h2>Quem comprou, amou</h2>
        <p class="muted">Nota média de 4,9/5 em mais de 12 mil avaliações.</p>
      </div>
      <div class="review-grid">
        <div class="review reveal">
          <div class="stars">★★★★★</div>
          <p>“Comprei o iPhone 16 e chegou em 2 dias, lacrado e com nota fiscal. Melhor preço que encontrei e o parcelamento sem juros fez toda a diferença.”</p>
          <footer><span class="avatar-mini">JC</span><div><strong>Juliana C.</strong><small>São Paulo · SP</small></div><span class="verified">✓ Compra verificada</span></footer>
        </div>
        <div class="review reveal">
          <div class="stars">★★★★★</div>
          <p>“Atendimento excelente! Tirei dúvidas pelo chat antes de comprar e me ajudaram a escolher a versão certa. O Galaxy S24 Ultra é surreal.”</p>
          <footer><span class="avatar-mini">MA</span><div><strong>Marcos A.</strong><small>Belo Horizonte · MG</small></div><span class="verified">✓ Compra verificada</span></footer>
        </div>
        <div class="review reveal">
          <div class="stars">★★★★★</div>
          <p>“Já é a terceira compra na KAMILLA. Preço justo, entrega rápida e o suporte resolveu uma troca em menos de 24h. Recomendo de olhos fechados.”</p>
          <footer><span class="avatar-mini">RS</span><div><strong>Renata S.</strong><small>Curitiba · PR</small></div><span class="verified">✓ Compra verificada</span></footer>
        </div>
      </div>
    </div>
  </section>

  <section class="container section faq">
    <div class="section-head center-head reveal">
      <span class="kicker">Dúvidas frequentes</span>
      <h2>Tudo o que você precisa saber</h2>
    </div>
    <div class="accordion faq-accordion reveal">
      <details open><summary>Os celulares são novos e originais?</summary><p>Sim. Todos os aparelhos são novos, lacrados, com nota fiscal e garantia oficial de 12 meses.</p></details>
      <details><summary>Em quantas vezes posso parcelar?</summary><p>Em até 12x sem juros no cartão de crédito. Também aceitamos Pix e boleto.</p></details>
      <details><summary>Qual o prazo de entrega?</summary><p>Enviamos em até 24h úteis após a confirmação do pagamento. O prazo de transporte varia de 2 a 7 dias úteis, conforme a região.</p></details>
      <details><summary>Como funciona a troca?</summary><p>Você tem 7 dias corridos após o recebimento para solicitar a troca ou devolução, desde que o produto esteja na embalagem original.</p></details>
      <details><summary>O frete é grátis?</summary><p>Sim, para compras acima de R$ 299. Abaixo desse valor, o frete é calculado no checkout.</p></details>
    </div>
  </section>
  `;
  return layout({ title: 'Celulares com até 12x sem juros', body, cartCount, active: 'Início' });
}

export function shopPage({ products, categories, activeCategory, sort, search, cartCount }) {
  const chips = [{ category: '', label: 'Todos' }, ...categories]
    .map((c) => {
      const val = c.category;
      const isActive = (activeCategory || '') === val;
      const href = val ? `/shop?category=${encodeURIComponent(val)}` : '/shop';
      return `<a class="chip${isActive ? ' is-active' : ''}" href="${href}">${escapeHtml(c.label || val)}</a>`;
    })
    .join('');

  const sortOptions = [
    ['featured', 'Mais vendidos'],
    ['newest', 'Lançamentos'],
    ['price-asc', 'Menor preço'],
    ['price-desc', 'Maior preço'],
    ['name', 'Nome (A-Z)'],
  ]
    .map(([v, l]) => `<option value="${v}"${sort === v ? ' selected' : ''}>${l}</option>`)
    .join('');

  const grid = products.length
    ? `<div class="product-grid">${products.map(productCard).join('')}</div>`
    : `<div class="empty-state"><span class="empty-icon">🔍</span><h3>Nenhum celular encontrado</h3><p class="muted">${
        search ? `Não encontramos resultados para “${escapeHtml(search)}”.` : 'Tente outra categoria ou limpe os filtros.'
      }</p><a class="btn btn-primary" href="/shop">Ver todos os celulares</a></div>`;

  const body = `
  <section class="shop-hero">
    <div class="container">
      <nav class="breadcrumb"><a href="/">Início</a> <span>/</span> <span>${escapeHtml(activeCategory || 'Celulares')}</span></nav>
      <h1>${activeCategory ? `Celulares ${escapeHtml(activeCategory)}` : 'Todos os celulares'}</h1>
      <p class="muted">${products.length} ${products.length === 1 ? 'modelo encontrado' : 'modelos encontrados'}${
        search ? ` para “${escapeHtml(search)}”` : ''
      } · Parcele em até 12x sem juros</p>
    </div>
  </section>
  <div class="container shop-toolbar">
    <div class="chips">${chips}</div>
    <div class="toolbar-right">
      <form method="get" action="/shop" class="search-form">
        ${activeCategory ? `<input type="hidden" name="category" value="${escapeHtml(activeCategory)}">` : ''}
        <input type="search" name="search" value="${escapeHtml(search || '')}" placeholder="Buscar celular…" aria-label="Buscar celular">
      </form>
      <form method="get" action="/shop" class="sort-form">
        ${activeCategory ? `<input type="hidden" name="category" value="${escapeHtml(activeCategory)}">` : ''}
        ${search ? `<input type="hidden" name="search" value="${escapeHtml(search)}">` : ''}
        <select name="sort" onchange="this.form.submit()" aria-label="Ordenar">${sortOptions}</select>
      </form>
    </div>
  </div>
  <section class="container section">${grid}</section>
  `;
  return layout({ title: activeCategory || 'Celulares', body, cartCount, active: activeCategory || 'Celulares' });
}

// ---------------------------------------------------------------------------
// Product detail + structured variant pickers
// ---------------------------------------------------------------------------

const ATTR_KEYS = ['storage', 'ram', 'color'];
const ATTR_LABELS = ['Armazenamento', 'Memória RAM', 'Cor'];

function splitVariant(name) {
  const parts = String(name)
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length === 3 ? parts : null;
}

function variantPicker(variants, compareFor) {
  const parsed = variants.map((v) => ({ v, parts: splitVariant(v.name) }));
  if (!parsed.length || parsed.some((x) => !x.parts)) return null;

  const attrs = ATTR_KEYS.map((key, i) => ({
    key,
    label: ATTR_LABELS[i],
    values: [...new Set(parsed.map((x) => x.parts[i]))],
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
          attr.key === 'color' ? `<em class="picker-current" data-current="color">${escapeHtml(selected.color)}</em>` : ''
        }</span>
        <div class="picker-options">
          ${attr.values
            .map(
              (val) =>
                `<button type="button" class="opt${val === selected[attr.key] ? ' is-active' : ''}" data-attr="${attr.key}" data-value="${escapeHtml(
                  val
                )}">${escapeHtml(val)}</button>`
            )
            .join('')}
        </div>
      </div>`
    )
    .join('');

  const data = parsed.map(({ v, parts }) => ({
    id: v.id,
    storage: parts[0],
    ram: parts[1],
    color: parts[2],
    price: v.price_cents,
    stock: v.stock,
    compare: compareFor(v.price_cents),
  }));

  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return {
    html: `<div class="variant-pickers">${groups}</div>
      <input type="hidden" id="variant" name="variant" value="${initial.id}">
      <script type="application/json" id="variant-data">${json}</script>`,
    initial,
  };
}

function variantSelect(variants, compareFor) {
  const options = variants
    .map(
      (v, i) =>
        `<option value="${v.id}" data-price="${v.price_cents}" data-compare="${compareFor(
          v.price_cents
        )}" data-stock="${v.stock}"${i === 0 ? ' selected' : ''}${
          v.stock <= 0 ? ' disabled' : ''
        }>${escapeHtml(v.name)}${v.stock <= 0 ? ' — esgotado' : ''}</option>`
    )
    .join('');
  return `<div class="pdp-field">
    <label for="variant">Escolha a variação</label>
    <select id="variant" name="variant">${options}</select>
  </div>`;
}

function stockLabel(stock) {
  if (stock <= 0) return 'Esgotado';
  if (stock <= 5) return `Últimas ${stock} unidades`;
  return 'Em estoque, pronto para envio';
}

export function productPage({ product, related, cartCount }) {
  const variants = product.variants;
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const basePrice = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : product.price_cents;
  // The product-level "compare at" price is defined for the cheapest variant, so
  // scale it proportionally for the others to keep the discount rate coherent.
  const compareFor = (price) => {
    const compare = product.compare_at_cents;
    if (!compare || !basePrice || compare <= basePrice) return 0;
    const raw = (price * compare) / basePrice;
    // Round to a clean retail reference price (R$ 10 for expensive items).
    const unit = price >= 100000 ? 10000 : 1000;
    return Math.round(raw / unit) * unit;
  };
  const picker = variantPicker(variants, compareFor);
  const initial = picker ? picker.initial : variants.find((v) => v.stock > 0) || variants[0];
  const initialPrice = initial?.price_cents ?? product.price_cents;
  const initialStock = initial?.stock ?? totalStock;
  const initialCompare = compareFor(initialPrice);
  const off = discountPercent(initialPrice, initialCompare);

  const detailList = product.details
    .split('·')
    .map((d) => `<li>${escapeHtml(d.trim())}</li>`)
    .join('');

  const thumbNames = [product.slug + '-2', product.slug + '-3'];
  const realThumbs = thumbNames.map((n) => realImageUrl(n)).filter(Boolean);
  // Only show the thumbnail strip when there are real extra photos; generated
  // placeholders would all look the same.
  const thumbs = realThumbs;
  const thumbsHtml = thumbs.length
    ? `<div class="thumbs">${thumbs.map((u) => `<img src="${u}" alt="">`).join('')}</div>`
    : '';

  const body = `
  <div class="container">
    <nav class="breadcrumb"><a href="/">Início</a> <span>/</span> <a href="/shop?category=${encodeURIComponent(
      product.category
    )}">${escapeHtml(product.category)}</a> <span>/</span> <span>${escapeHtml(product.name)}</span></nav>
  </div>
  <section class="container product-detail">
    <div class="gallery reveal">
      <div class="gallery-main">
        <img src="/img/${encodeURIComponent(product.slug)}.svg" alt="${escapeHtml(product.name)}">
        ${off > 0 ? `<span class="gallery-off">-${off}%</span>` : ''}
      </div>
      ${thumbsHtml}
      <div class="gallery-trust">
        <span>🔒 Compra segura</span><span>🛡️ 12 meses de garantia</span><span>🚚 Envio em 24h</span>
      </div>
    </div>
    <div class="pdp reveal">
      <span class="product-cat">${escapeHtml(product.category)}</span>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="pdp-sub">${escapeHtml(product.subtitle)}</p>
      <div class="pdp-rating"><span class="stars">★★★★★</span> <strong>4,9</strong> <span class="muted">(312 avaliações)</span></div>

      <div class="pdp-price-block">
        <div class="pdp-price" id="pdp-price" data-cents="${initialPrice}">${formatMoney(initialPrice)}</div>
        <div class="pdp-compare" id="pdp-compare">${
          off > 0 ? `${formatMoney(initialCompare)} <span class="off-tag">-${off}%</span>` : ''
        }</div>
        <p class="installments" id="pdp-installments">${formatInstallments(initialPrice)}</p>
        <p class="pix-line">💠 <strong>5% OFF no Pix</strong> · ou 12x sem juros no cartão</p>
      </div>

      ${picker ? picker.html : variantSelect(variants, compareFor)}

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

      <button class="btn btn-primary btn-block btn-buy" id="add-to-cart" data-slug="${product.slug}" ${
        initialStock <= 0 ? 'disabled' : ''
      }>
        ${initialStock > 0 ? 'Adicionar à sacola 🛍️' : 'Produto esgotado'}
      </button>
      <p class="pdp-note">🚚 Frete grátis acima de R$ 299 · 💳 12x sem juros · ↩️ Troca em 7 dias</p>

      <ul class="pdp-benefits">
        <li><span>✅</span> Produto novo, lacrado e com nota fiscal</li>
        <li><span>🛡️</span> Garantia oficial de 12 meses</li>
        <li><span>⚡</span> Envio em até 24h úteis após o pagamento</li>
        <li><span>💬</span> Atendimento humano de segunda a sexta</li>
      </ul>

      <div class="accordion">
        <details open><summary>Descrição</summary><p>${escapeHtml(product.description)}</p></details>
        <details><summary>Ficha técnica</summary><ul>${detailList}</ul></details>
        <details><summary>Envio e devolução</summary><p>Enviamos em até 24h úteis após a confirmação do pagamento. Frete grátis para compras acima de R$ 299. Você tem 7 dias corridos para troca ou devolução, com o produto na embalagem original.</p></details>
        <details><summary>Formas de pagamento</summary><p>Cartão de crédito em até 12x sem juros, Pix com 5% de desconto ou boleto bancário. Pagamento processado com segurança pela Stripe.</p></details>
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
  }
  `;
  return layout({ title: product.name, body, cartCount, active: product.category });
}

// ---------------------------------------------------------------------------
// Cart / checkout / success
// ---------------------------------------------------------------------------

function cartLine(it) {
  return `<div class="cart-line" data-variant="${it.variant_id}">
    <img class="cart-thumb" src="/img/${encodeURIComponent(it.product_slug)}.svg" alt="">
    <div class="cart-line-info">
      <a class="cart-line-name" href="/product/${it.product_slug}">${escapeHtml(it.product_name)}</a>
      <span class="muted">${escapeHtml(it.variant_name)}</span>
      <span class="cart-line-sku muted">SKU ${escapeHtml(it.sku)}</span>
      ${!it.available ? `<span class="warn">Apenas ${it.stock} em estoque</span>` : ''}
    </div>
    <div class="cart-line-qty">
      <div class="stepper small">
        <button type="button" data-cart-step="-1" data-variant="${it.variant_id}" aria-label="Diminuir">−</button>
        <input type="number" value="${it.quantity}" min="1" max="${it.stock}" data-cart-qty data-variant="${it.variant_id}" aria-label="Quantidade">
        <button type="button" data-cart-step="1" data-variant="${it.variant_id}" aria-label="Aumentar">+</button>
      </div>
      <button class="link-remove" data-cart-remove data-variant="${it.variant_id}">Remover</button>
    </div>
    <div class="cart-line-total">${formatMoney(it.line_total_cents)}</div>
  </div>`;
}

export function cartPage({ cart, cartCount }) {
  const threshold = config.freeShippingThresholdCents;
  const shipping = threshold > 0 && cart.subtotal_cents >= threshold ? 0 : config.shippingFlatCents;
  const total = cart.subtotal_cents + shipping;
  const remaining = Math.max(0, threshold - cart.subtotal_cents);
  const progress = threshold > 0 ? Math.min(100, Math.round((cart.subtotal_cents / threshold) * 100)) : 100;

  const inner = cart.items.length
    ? `<div class="cart-layout">
        <div class="cart-main">
          <h1>Sua sacola <span class="muted">(${cart.count})</span></h1>
          <div class="ship-progress ${remaining === 0 ? 'is-done' : ''}">
            <div class="ship-progress-top">
              <span>${
                remaining > 0
                  ? `Faltam <strong>${formatMoney(remaining)}</strong> para o frete grátis 🚚`
                  : 'Você ganhou <strong>frete grátis</strong>! 🎉'
              }</span>
              <strong>${progress}%</strong>
            </div>
            <div class="ship-bar"><i style="width:${progress}%"></i></div>
          </div>
          <div class="cart-lines">${cart.items.map(cartLine).join('')}</div>
          <a class="link-arrow" href="/shop">← Continuar comprando</a>
        </div>
        <aside class="cart-summary">
          <h2>Resumo do pedido</h2>
          <div class="summary-row"><span>Subtotal</span><span>${formatMoney(cart.subtotal_cents)}</span></div>
          <div class="summary-row"><span>Frete</span><span>${shipping === 0 ? '<span class="free-tag">Grátis</span>' : formatMoney(shipping)}</span></div>
          <div class="coupon-row"><input type="text" placeholder="Cupom de desconto" aria-label="Cupom"><button type="button" class="btn btn-mini">Aplicar</button></div>
          <div class="summary-row total"><span>Total</span><span>${formatMoney(total)}</span></div>
          <p class="summary-installments">${formatInstallments(total)}</p>
          <a class="btn btn-primary btn-block" href="/checkout">Finalizar compra 🔒</a>
          <div class="summary-trust">
            <span>🔒 Ambiente seguro</span>
            <span>💳 Visa · Master · Elo · Pix</span>
          </div>
        </aside>
      </div>`
    : `<div class="empty-cart">
        <span class="empty-icon">🛍️</span>
        <h1>Sua sacola está vazia</h1>
        <p class="muted">Que tal dar uma olhada nas ofertas da semana? Tem celular novo esperando por você.</p>
        <a class="btn btn-primary" href="/shop">Ver ofertas</a>
      </div>`;

  const body = `<section class="container section">${inner}</section>`;
  return layout({ title: 'Sua sacola', body, cartCount });
}

export function checkoutPage({ cart, cartCount, message }) {
  if (!cart.items.length) {
    return layout({
      title: 'Checkout',
      cartCount,
      body: `<section class="container section empty-cart"><span class="empty-icon">🛍️</span><h1>Sua sacola está vazia</h1><p class="muted">Adicione um celular para continuar.</p><a class="btn btn-primary" href="/shop">Ver celulares</a></section>`,
    });
  }
  const threshold = config.freeShippingThresholdCents;
  const shipping = threshold > 0 && cart.subtotal_cents >= threshold ? 0 : config.shippingFlatCents;
  const total = cart.subtotal_cents + shipping;

  const body = `
  <section class="container section checkout-layout">
    <div class="checkout-form">
      <nav class="breadcrumb"><a href="/cart">Sacola</a> <span>/</span> <span>Checkout</span></nav>
      <h1>Finalizar compra</h1>
      <p class="muted">Falta pouco para o seu novo celular chegar. 🔒 Ambiente 100% seguro.</p>
      ${message ? `<div class="alert">${escapeHtml(message)}</div>` : ''}
      <form id="checkout-form">
        <fieldset>
          <legend>1. Contato</legend>
          <label>E-mail<input type="email" name="email" required placeholder="voce@email.com" autocomplete="email"></label>
        </fieldset>
        <fieldset>
          <legend>2. Entrega</legend>
          <label>Nome completo<input type="text" name="full_name" required placeholder="Maria Silva" autocomplete="name"></label>
          <label>Endereço<input type="text" name="address" required placeholder="Rua das Flores, 123, apto 45" autocomplete="street-address"></label>
          <div class="two-col">
            <label>Cidade<input type="text" name="city" required placeholder="São Paulo" autocomplete="address-level2"></label>
            <label>CEP<input type="text" name="zip" required placeholder="01000-000" autocomplete="postal-code"></label>
          </div>
          <label>País<input type="text" name="country" required value="Brasil" autocomplete="country-name"></label>
        </fieldset>
        <fieldset>
          <legend>3. Pagamento</legend>
          <div class="payment-box">
            <span class="pay-badge">Stripe</span>
            <p class="muted small">Você será redirecionado para concluir o pagamento com segurança. ${
              config.stripeEnabled
                ? 'Cartão de crédito, Pix e boleto.'
                : 'Modo de teste local ativo — nenhum valor real será cobrado.'
            }</p>
          </div>
        </fieldset>
        <button class="btn btn-primary btn-block btn-buy" type="submit" id="pay-btn">
          Pagar ${formatMoney(total)} ${config.stripeEnabled ? '' : '(teste)'}
        </button>
        <p class="muted small center">Ao concluir, você concorda com nossos Termos de Uso e Política de Privacidade.</p>
      </form>
    </div>
    <aside class="cart-summary">
      <h2>Resumo do pedido</h2>
      ${cart.items
        .map(
          (it) =>
            `<div class="summary-line"><span>${escapeHtml(it.product_name)} × ${it.quantity}<br><span class="muted small">${escapeHtml(
              it.variant_name
            )}</span></span><span>${formatMoney(it.line_total_cents)}</span></div>`
        )
        .join('')}
      <div class="summary-row"><span>Subtotal</span><span>${formatMoney(cart.subtotal_cents)}</span></div>
      <div class="summary-row"><span>Frete</span><span>${shipping === 0 ? '<span class="free-tag">Grátis</span>' : formatMoney(shipping)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatMoney(total)}</span></div>
      <p class="summary-installments">${formatInstallments(total)}</p>
      <div class="summary-trust">
        <span>🔒 Pagamento criptografado</span>
        <span>🛡️ Garantia de 12 meses</span>
      </div>
    </aside>
  </section>`;
  return layout({ title: 'Checkout', body, cartCount });
}

export function mockPayPage({ order, cartCount }) {
  const body = `
  <section class="container section narrow">
    <div class="mock-pay">
      <span class="pill-hot">Modo de teste</span>
      <h1>Pagamento simulado</h1>
      <p class="muted">Esta é uma tela de teste local da Stripe. Nenhum valor real será cobrado. Pedido <strong>${escapeHtml(
        order.number
      )}</strong> no valor de <strong>${formatMoney(order.total_cents)}</strong>.</p>
      <div class="mock-card">
        <label>Número do cartão<input value="4242 4242 4242 4242" disabled></label>
        <div class="two-col">
          <label>Validade<input value="12 / 34" disabled></label>
          <label>CVC<input value="123" disabled></label>
        </div>
      </div>
      <div class="mock-actions">
        <button class="btn btn-primary" id="mock-pay-success" data-order="${order.number}">Pagar ${formatMoney(order.total_cents)}</button>
        <button class="btn btn-ghost" id="mock-pay-fail" data-order="${order.number}">Simular recusa</button>
      </div>
      <p class="muted small">Para usar a Stripe de verdade: configure STRIPE_SECRET_KEY e MOCK_PAYMENTS=false no arquivo .env.</p>
    </div>
  </section>`;
  return layout({ title: 'Pagamento de teste', body, cartCount });
}

export function successPage({ order, cartCount }) {
  const firstName = order.full_name ? order.full_name.split(' ')[0] : '';
  const body = `
  <section class="container section narrow center">
    <div class="success-mark">✓</div>
    <span class="kicker">Pedido confirmado</span>
    <h1>Obrigado${firstName ? `, ${escapeHtml(firstName)}` : ''}! 🎉</h1>
    <p class="muted">Seu pedido <strong>${escapeHtml(order.number)}</strong> foi confirmado e já está sendo preparado. Enviamos os detalhes para ${
      escapeHtml(order.email || 'seu e-mail')
    }.</p>
    <div class="order-card">
      ${order.items
        .map(
          (it) =>
            `<div class="summary-line"><span>${escapeHtml(it.product_name)} × ${it.quantity}<br><span class="muted small">${escapeHtml(
              it.variant_name
            )}</span></span><span>${formatMoney(it.unit_price_cents * it.quantity)}</span></div>`
        )
        .join('')}
      <div class="summary-row"><span>Subtotal</span><span>${formatMoney(order.subtotal_cents)}</span></div>
      <div class="summary-row"><span>Frete</span><span>${order.shipping_cents === 0 ? '<span class="free-tag">Grátis</span>' : formatMoney(order.shipping_cents)}</span></div>
      <div class="summary-row total"><span>Total pago</span><span>${formatMoney(order.total_cents)}</span></div>
    </div>
    <div class="success-actions">
      <a class="btn btn-primary" href="/shop">Continuar comprando</a>
      <a class="btn btn-ghost" href="/">Voltar ao início</a>
    </div>
  </section>`;
  return layout({ title: 'Pedido confirmado', body, cartCount });
}

export function notFoundPage({ cartCount }) {
  const body = `<section class="container section narrow center">
    <span class="empty-icon">🛰️</span>
    <h1>Página não encontrada</h1>
    <p class="muted">O link que você acessou não existe ou foi movido.</p>
    <a class="btn btn-primary" href="/">Voltar ao início</a>
  </section>`;
  return layout({ title: 'Página não encontrada', body, cartCount });
}
