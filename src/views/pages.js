import { layout } from './layout.js';
import { escapeHtml, formatMoney } from '../lib/util.js';
import { config } from '../config.js';

function productCard(p) {
  const minPrice = Math.min(...p.variants.map((v) => v.price_cents));
  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
  const soldOut = totalStock <= 0;
  const sale =
    p.compare_at_cents && p.compare_at_cents > minPrice
      ? `<span class="price-compare">${formatMoney(p.compare_at_cents)}</span>`
      : '';
  return `<article class="product-card">
    <a href="/product/${p.slug}" class="product-media">
      <img src="/img/${encodeURIComponent(p.slug)}.svg" alt="${escapeHtml(p.name)}" loading="lazy">
      ${soldOut ? '<span class="badge badge-soldout">Sold out</span>' : p.featured ? '<span class="badge">Bestseller</span>' : ''}
    </a>
    <div class="product-info">
      <span class="product-cat">${escapeHtml(p.category)}</span>
      <h3><a href="/product/${p.slug}">${escapeHtml(p.name)}</a></h3>
      <p class="product-sub">${escapeHtml(p.subtitle)}</p>
      <div class="price"><span class="price-now">${formatMoney(minPrice)}</span> ${sale}</div>
    </div>
  </article>`;
}

export function homePage({ featured, categories, cartCount }) {
  const catTiles = categories
    .filter((c) => c.category !== 'Accessories')
    .map(
      (c) => `<a class="cat-tile" href="/shop?category=${encodeURIComponent(c.category)}">
        <img src="/img/${encodeURIComponent('cat-' + c.category)}.svg" alt="${escapeHtml(c.category)}" loading="lazy">
        <span>${escapeHtml(c.category)} <em>${c.count}</em></span>
      </a>`
    )
    .join('');

  const body = `
  <section class="hero">
    <div class="container hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">100% Remy Human Hair</p>
        <h1>Hair that moves<br>like it's yours.</h1>
        <p class="lede">Premium, ethically sourced extensions engineered for an invisible, natural finish. Salon quality, straight to your door.</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="/shop">Shop the collection</a>
          <a class="btn btn-ghost" href="/shop?category=Clip-In">Best sellers</a>
        </div>
        <ul class="hero-points">
          <li>Free shipping over $150</li>
          <li>30-day returns</li>
          <li>Ships worldwide</li>
        </ul>
      </div>
      <div class="hero-art">
        <img src="/img/hero-aurelle.svg" alt="AURELLE extensions">
      </div>
    </div>
  </section>

  <section class="container section">
    <div class="section-head">
      <h2>Shop by category</h2>
      <a href="/shop" class="link-arrow">View all →</a>
    </div>
    <div class="cat-grid">${catTiles}</div>
  </section>

  <section class="container section">
    <div class="section-head">
      <h2>Bestsellers</h2>
      <a href="/shop?sort=featured" class="link-arrow">View all →</a>
    </div>
    <div class="product-grid">${featured.map(productCard).join('')}</div>
  </section>

  <section class="promo">
    <div class="container promo-inner">
      <div>
        <h2>Not sure which length?</h2>
        <p>Take the 30-second match quiz and get a personalised recommendation, plus 10% off your first order.</p>
      </div>
      <a class="btn btn-primary" href="/shop">Find my match</a>
    </div>
  </section>

  <section class="container section value-grid">
    <div class="value"><h3>Ethically sourced</h3><p class="muted">Every bundle is traceable and fairly traded.</p></div>
    <div class="value"><h3>Salon quality</h3><p class="muted">Double-drawn, tangle-free, colour-safe hair.</p></div>
    <div class="value"><h3>Loved by 50k+</h3><p class="muted">Rated 4.9/5 from over 50,000 customers.</p></div>
    <div class="value"><h3>Free returns</h3><p class="muted">Changed your mind? 30 days to send it back.</p></div>
  </section>
  `;
  return layout({ title: 'Home', body, cartCount });
}

export function shopPage({ products, categories, activeCategory, sort, search, cartCount }) {
  const chips = [{ category: '', label: 'All' }, ...categories]
    .map((c) => {
      const val = c.category;
      const isActive = (activeCategory || '') === val;
      const href = val ? `/shop?category=${encodeURIComponent(val)}` : '/shop';
      return `<a class="chip${isActive ? ' is-active' : ''}" href="${href}">${escapeHtml(c.label || val)}</a>`;
    })
    .join('');

  const sortOptions = [
    ['featured', 'Featured'],
    ['newest', 'Newest'],
    ['price-asc', 'Price: Low to High'],
    ['price-desc', 'Price: High to Low'],
    ['name', 'Alphabetical'],
  ]
    .map(([v, l]) => `<option value="${v}"${sort === v ? ' selected' : ''}>${l}</option>`)
    .join('');

  const grid = products.length
    ? `<div class="product-grid">${products.map(productCard).join('')}</div>`
    : `<p class="empty">No products found${search ? ` for “${escapeHtml(search)}”` : ''}.</p>`;

  const body = `
  <div class="container shop-head">
    <h1>${escapeHtml(activeCategory || 'All products')}</h1>
    <p class="muted">${products.length} product${products.length === 1 ? '' : 's'}</p>
  </div>
  <div class="container shop-toolbar">
    <div class="chips">${chips}</div>
    <div class="toolbar-right">
      <form method="get" action="/shop" class="search-form">
        ${activeCategory ? `<input type="hidden" name="category" value="${escapeHtml(activeCategory)}">` : ''}
        <input type="search" name="search" value="${escapeHtml(search || '')}" placeholder="Search…" aria-label="Search">
      </form>
      <form method="get" action="/shop" class="sort-form">
        ${activeCategory ? `<input type="hidden" name="category" value="${escapeHtml(activeCategory)}">` : ''}
        ${search ? `<input type="hidden" name="search" value="${escapeHtml(search)}">` : ''}
        <select name="sort" onchange="this.form.submit()" aria-label="Sort">${sortOptions}</select>
      </form>
    </div>
  </div>
  <section class="container section">${grid}</section>
  `;
  return layout({ title: activeCategory || 'Shop', body, cartCount, active: activeCategory || 'Shop' });
}

export function productPage({ product, related, cartCount }) {
  const variants = product.variants;
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const variantOptions = variants
    .map(
      (v, i) =>
        `<option value="${v.id}" data-price="${formatMoney(v.price_cents)}" data-stock="${v.stock}"${i === 0 ? ' selected' : ''}${v.stock <= 0 ? ' disabled' : ''}>${escapeHtml(v.name)}${v.stock <= 0 ? ' — sold out' : ''}</option>`
    )
    .join('');

  const detailList = product.details
    .split('·')
    .map((d) => `<li>${escapeHtml(d.trim())}</li>`)
    .join('');

  const body = `
  <div class="container">
    <nav class="breadcrumb"><a href="/shop">Shop</a> / <a href="/shop?category=${encodeURIComponent(product.category)}">${escapeHtml(product.category)}</a> / <span>${escapeHtml(product.name)}</span></nav>
  </div>
  <section class="container product-detail">
    <div class="gallery">
      <img src="/img/${encodeURIComponent(product.slug)}.svg" alt="${escapeHtml(product.name)}">
      <div class="thumbs">
        <img src="/img/${encodeURIComponent(product.slug + '-2')}.svg" alt="">
        <img src="/img/${encodeURIComponent(product.slug + '-3')}.svg" alt="">
      </div>
    </div>
    <div class="pdp">
      <span class="product-cat">${escapeHtml(product.category)}</span>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="pdp-sub">${escapeHtml(product.subtitle)}</p>
      <div class="pdp-rating">★★★★★ <span class="muted">4.9 (312 reviews)</span></div>
      <div class="pdp-price" id="pdp-price">${formatMoney(variants[0]?.price_cents ?? product.price_cents)}</div>

      <div class="pdp-field">
        <label for="variant">Length &amp; colour</label>
        <select id="variant" name="variant">${variantOptions}</select>
      </div>
      <div class="pdp-field qty-field">
        <label for="qty">Quantity</label>
        <div class="stepper">
          <button type="button" data-step="-1">−</button>
          <input id="qty" type="number" value="1" min="1" max="${Math.max(totalStock, 1)}">
          <button type="button" data-step="1">+</button>
        </div>
        <p class="stock-line" id="stock-line">${totalStock > 0 ? `In stock` : 'Sold out'}</p>
      </div>

      <button class="btn btn-primary btn-block" id="add-to-cart" data-slug="${product.slug}" ${totalStock <= 0 ? 'disabled' : ''}>
        ${totalStock > 0 ? 'Add to bag' : 'Sold out'}
      </button>
      <p class="pdp-note">Free shipping over $150 · 30-day returns · Ships in 24h</p>

      <div class="accordion">
        <details open><summary>Description</summary><p>${escapeHtml(product.description)}</p></details>
        <details><summary>Details &amp; care</summary><ul>${detailList}</ul></details>
        <details><summary>Shipping &amp; returns</summary><p>Dispatched within 24 hours. Free standard shipping on orders over $150. 30-day returns on unworn, unopened hair.</p></details>
      </div>
    </div>
  </section>

  ${
    related.length
      ? `<section class="container section">
      <div class="section-head"><h2>You may also like</h2></div>
      <div class="product-grid">${related.map(productCard).join('')}</div>
    </section>`
      : ''
  }
  `;
  return layout({ title: product.name, body, cartCount });
}

function cartLine(it) {
  return `<div class="cart-line" data-variant="${it.variant_id}">
    <img class="cart-thumb" src="/img/${encodeURIComponent(it.product_slug)}.svg" alt="">
    <div class="cart-line-info">
      <a class="cart-line-name" href="/product/${it.product_slug}">${escapeHtml(it.product_name)}</a>
      <span class="muted">${escapeHtml(it.variant_name)}</span>
      <span class="cart-line-sku muted">SKU ${escapeHtml(it.sku)}</span>
      ${!it.available ? `<span class="warn">Only ${it.stock} left in stock</span>` : ''}
    </div>
    <div class="cart-line-qty">
      <div class="stepper small">
        <button type="button" data-cart-step="-1" data-variant="${it.variant_id}">−</button>
        <input type="number" value="${it.quantity}" min="1" max="${it.stock}" data-cart-qty data-variant="${it.variant_id}">
        <button type="button" data-cart-step="1" data-variant="${it.variant_id}">+</button>
      </div>
      <button class="link-remove" data-cart-remove data-variant="${it.variant_id}">Remove</button>
    </div>
    <div class="cart-line-total">${formatMoney(it.line_total_cents)}</div>
  </div>`;
}

export function cartPage({ cart, cartCount }) {
  const shipping = config.freeShippingThresholdCents > 0 && cart.subtotal_cents >= config.freeShippingThresholdCents ? 0 : config.shippingFlatCents;
  const total = cart.subtotal_cents + shipping;

  const inner = cart.items.length
    ? `<div class="cart-layout">
        <div class="cart-main">
          <h1>Your bag <span class="muted">(${cart.count})</span></h1>
          <div class="cart-lines">${cart.items.map(cartLine).join('')}</div>
          <a class="link-arrow" href="/shop">← Continue shopping</a>
        </div>
        <aside class="cart-summary">
          <h2>Order summary</h2>
          <div class="summary-row"><span>Subtotal</span><span>${formatMoney(cart.subtotal_cents)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatMoney(shipping)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${formatMoney(total)}</span></div>
          <a class="btn btn-primary btn-block" href="/checkout">Checkout</a>
          <p class="muted small">Taxes calculated at checkout. Secure payment via Stripe.</p>
        </aside>
      </div>`
    : `<div class="empty-cart">
        <h1>Your bag is empty</h1>
        <p class="muted">Add your favourites and they'll appear here.</p>
        <a class="btn btn-primary" href="/shop">Shop now</a>
      </div>`;

  const body = `<section class="container section">${inner}</section>`;
  return layout({ title: 'Your bag', body, cartCount });
}

export function checkoutPage({ cart, cartCount, message }) {
  if (!cart.items.length) {
    return layout({
      title: 'Checkout',
      cartCount,
      body: `<section class="container section empty-cart"><h1>Your bag is empty</h1><a class="btn btn-primary" href="/shop">Shop now</a></section>`,
    });
  }
  const shipping =
    config.freeShippingThresholdCents > 0 && cart.subtotal_cents >= config.freeShippingThresholdCents
      ? 0
      : config.shippingFlatCents;
  const total = cart.subtotal_cents + shipping;

  const body = `
  <section class="container section checkout-layout">
    <div class="checkout-form">
      <h1>Checkout</h1>
      ${message ? `<div class="alert">${escapeHtml(message)}</div>` : ''}
      <form id="checkout-form">
        <fieldset>
          <legend>Contact</legend>
          <label>Email<input type="email" name="email" required placeholder="you@email.com"></label>
        </fieldset>
        <fieldset>
          <legend>Shipping address</legend>
          <label>Full name<input type="text" name="full_name" required placeholder="Jane Doe" autocomplete="name"></label>
          <label>Address<input type="text" name="address" required placeholder="123 Main St" autocomplete="street-address"></label>
          <div class="two-col">
            <label>City<input type="text" name="city" required placeholder="New York" autocomplete="address-level2"></label>
            <label>ZIP / Postcode<input type="text" name="zip" required placeholder="10001" autocomplete="postal-code"></label>
          </div>
          <label>Country<input type="text" name="country" required placeholder="United States" autocomplete="country-name"></label>
        </fieldset>
        <fieldset>
          <legend>Payment</legend>
          <div class="payment-box">
            <span class="pay-badge">Stripe</span>
            <p class="muted small">You'll be securely redirected to complete payment. ${
              config.stripeEnabled ? 'Cards, Apple Pay &amp; Google Pay accepted.' : 'Local test mode is active — no real charge will be made.'
            }</p>
          </div>
        </fieldset>
        <button class="btn btn-primary btn-block" type="submit" id="pay-btn">
          Pay ${formatMoney(total)} ${config.stripeEnabled ? '' : '(test mode)'}
        </button>
        <p class="muted small center">By placing this order you agree to our Terms &amp; Privacy Policy.</p>
      </form>
    </div>
    <aside class="cart-summary">
      <h2>Order summary</h2>
      ${cart.items
        .map(
          (it) => `<div class="summary-line"><span>${escapeHtml(it.product_name)} × ${it.quantity}<br><span class="muted small">${escapeHtml(it.variant_name)}</span></span><span>${formatMoney(it.line_total_cents)}</span></div>`
        )
        .join('')}
      <div class="summary-row"><span>Subtotal</span><span>${formatMoney(cart.subtotal_cents)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatMoney(shipping)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatMoney(total)}</span></div>
    </aside>
  </section>`;
  return layout({ title: 'Checkout', body, cartCount });
}

export function mockPayPage({ order, cartCount }) {
  const body = `
  <section class="container section narrow">
    <div class="mock-pay">
      <p class="eyebrow">Test mode</p>
      <h1>Simulated payment</h1>
      <p class="muted">This is a local Stripe test screen. No real money moves. Order <strong>${escapeHtml(order.number)}</strong> for <strong>${formatMoney(order.total_cents)}</strong>.</p>
      <div class="mock-card">
        <label>Card number<input value="4242 4242 4242 4242" disabled></label>
        <label>Expiry<input value="12 / 34" disabled></label>
        <label>CVC<input value="123" disabled></label>
      </div>
      <div class="mock-actions">
        <button class="btn btn-primary" id="mock-pay-success" data-order="${order.number}">Pay ${formatMoney(order.total_cents)}</button>
        <button class="btn btn-ghost" id="mock-pay-fail" data-order="${order.number}">Simulate decline</button>
      </div>
      <p class="muted small">To use real Stripe: set STRIPE_SECRET_KEY and MOCK_PAYMENTS=false in .env.</p>
    </div>
  </section>`;
  return layout({ title: 'Test payment', body, cartCount });
}

export function successPage({ order, cartCount }) {
  const body = `
  <section class="container section narrow center">
    <div class="success-mark">✓</div>
    <h1>Thank you${order.full_name ? `, ${escapeHtml(order.full_name.split(' ')[0])}` : ''}!</h1>
    <p class="muted">Your order <strong>${escapeHtml(order.number)}</strong> is confirmed. A receipt has been sent to ${escapeHtml(order.email || 'your email')}.</p>
    <div class="order-card">
      ${order.items
        .map(
          (it) => `<div class="summary-line"><span>${escapeHtml(it.product_name)} × ${it.quantity}<br><span class="muted small">${escapeHtml(it.variant_name)}</span></span><span>${formatMoney(it.unit_price_cents * it.quantity)}</span></div>`
        )
        .join('')}
      <div class="summary-row"><span>Subtotal</span><span>${formatMoney(order.subtotal_cents)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${order.shipping_cents === 0 ? 'Free' : formatMoney(order.shipping_cents)}</span></div>
      <div class="summary-row total"><span>Total paid</span><span>${formatMoney(order.total_cents)}</span></div>
    </div>
    <a class="btn btn-primary" href="/shop">Continue shopping</a>
  </section>`;
  return layout({ title: 'Order confirmed', body, cartCount });
}

export function notFoundPage({ cartCount }) {
  const body = `<section class="container section narrow center">
    <h1>Page not found</h1>
    <p class="muted">The page you're looking for doesn't exist.</p>
    <a class="btn btn-primary" href="/">Back to home</a>
  </section>`;
  return layout({ title: 'Not found', body, cartCount });
}
