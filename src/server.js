import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { config, ROOT } from './config.js';
import { migrate } from './db.js';
import { seedIfEmpty } from './seed.js';
import * as store from './db.js';
import { productImageSvg } from './lib/images.js';
import {
  uuid,
  parseCookies,
  serializeCookie,
  sendJson,
  sendHtml,
  sendRedirect,
  readJson,
  readForm,
  escapeHtml,
  slugify,
  parseCents,
  formatMoney,
} from './lib/util.js';
import { layout } from './views/layout.js';
import {
  homePage,
  shopPage,
  productPage,
  cartPage,
  checkoutPage,
  successPage,
  mockPayPage,
  notFoundPage,
} from './views/pages.js';
import {
  adminLoginPage,
  adminDashboard,
  adminProductsPage,
  adminProductFormPage,
  adminOrdersPage,
} from './views/admin.js';
import { createCheckoutSession, verifyWebhook, stripeRequest } from './lib/stripe.js';

const CART_COOKIE = 'kamilla_cart';
const ADMIN_COOKIE = 'kamilla_admin';

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

function getCartId(req) {
  return parseCookies(req)[CART_COOKIE] || null;
}

function ensureCartId(req, res) {
  let id = getCartId(req);
  if (id) return id;
  id = uuid();
  res.setHeader('Set-Cookie', serializeCookie(CART_COOKIE, id, { maxAge: 60 * 60 * 24 * 120, httpOnly: true }));
  return id;
}

function cartCount(req) {
  const id = getCartId(req);
  if (!id) return 0;
  return store.getCart(id).count;
}

function isAdmin(req) {
  const id = parseCookies(req)[ADMIN_COOKIE];
  return store.adminSessionValid(id);
}

function requireAdmin(res) {
  sendRedirect(res, '/admin');
}

// ---------------------------------------------------------------------------
// Route table
// ---------------------------------------------------------------------------

const routes = [];
function route(method, path, handler) {
  // path may contain :params
  const keys = [];
  const pattern = new RegExp(
    '^' +
      path
        .split('/')
        .map((seg) => {
          if (seg.startsWith(':')) {
            keys.push(seg.slice(1));
            return '([^/]+)';
          }
          return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        })
        .join('/') +
      '/?$'
  );
  routes.push({ method, pattern, keys, handler });
}

function matchRoute(method, pathname) {
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.pattern.exec(pathname);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { handler: r.handler, params };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Storefront routes
// ---------------------------------------------------------------------------

route('GET', '/', (ctx) => {
  const featured = store.listProducts({ sort: 'featured' }).filter((p) => p.featured).slice(0, 4);
  const all = store.listProducts({ sort: 'featured' });
  const featuredFallback = featured.length ? featured : all.slice(0, 4);
  sendHtml(
    ctx.res,
    200,
    homePage({ featured: featuredFallback, categories: store.categories(), cartCount: cartCount(ctx.req) })
  );
});

route('GET', '/shop', (ctx) => {
  const category = ctx.query.get('category') || '';
  const sort = ctx.query.get('sort') || 'featured';
  const search = ctx.query.get('search') || '';
  const products = store.listProducts({ category, sort, search });
  sendHtml(
    ctx.res,
    200,
    shopPage({
      products,
      categories: store.categories(),
      activeCategory: category,
      sort,
      search,
      cartCount: cartCount(ctx.req),
    })
  );
});

route('GET', '/product/:slug', (ctx) => {
  const product = store.getProductBySlug(ctx.params.slug);
  if (!product) return sendHtml(ctx.res, 404, notFoundPage({ cartCount: cartCount(ctx.req) }));
  const related = store
    .listProducts({ category: product.category })
    .filter((p) => p.id !== product.id)
    .slice(0, 4);
  sendHtml(ctx.res, 200, productPage({ product, related, cartCount: cartCount(ctx.req) }));
});

route('GET', '/cart', (ctx) => {
  const id = getCartId(ctx.req);
  const cart = id ? store.getCart(id) : { items: [], subtotal_cents: 0, count: 0 };
  sendHtml(ctx.res, 200, cartPage({ cart, cartCount: cart.count }));
});

route('GET', '/checkout', (ctx) => {
  const id = getCartId(ctx.req);
  const cart = id ? store.getCart(id) : { items: [], subtotal_cents: 0, count: 0 };
  const message = ctx.query.get('cancelled') ? 'Your payment was cancelled. Your bag is still saved.' : '';
  sendHtml(ctx.res, 200, checkoutPage({ cart, cartCount: cart.count, message }));
});

route('GET', '/mock-pay', (ctx) => {
  const order = store.getOrder(ctx.query.get('order'));
  if (!order) return sendRedirect(ctx.res, '/cart');
  sendHtml(ctx.res, 200, mockPayPage({ order, cartCount: cartCount(ctx.req) }));
});

route('GET', '/order/success', async (ctx) => {
  let order = store.getOrder(ctx.query.get('order'));
  if (!order) return sendRedirect(ctx.res, '/');

  // Fallback confirmation in case the webhook hasn't fired yet (Stripe live mode).
  const sessionId = ctx.query.get('session_id');
  if (order.status === 'pending' && config.stripeEnabled && sessionId) {
    try {
      const session = await stripeRequest(`/v1/checkout/sessions/${sessionId}`, {});
      if (session.payment_status === 'paid') {
        try {
          order = store.fulfilOrder(order.id);
        } catch (e) {
          /* leave as is */
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (order.status === 'paid') {
    const id = getCartId(ctx.req);
    if (id) store.clearCart(id);
  }
  sendHtml(ctx.res, 200, successPage({ order, cartCount: cartCount(ctx.req) }));
});

// ---------------------------------------------------------------------------
// Cart API
// ---------------------------------------------------------------------------

route('GET', '/api/cart', (ctx) => {
  const id = getCartId(ctx.req);
  const cart = id ? store.getCart(id) : { items: [], subtotal_cents: 0, count: 0 };
  sendJson(ctx.res, 200, { ok: true, cart });
});

route('POST', '/api/cart', async (ctx) => {
  const body = await readJson(ctx.req);
  const id = ensureCartId(ctx.req, ctx.res);
  try {
    let cart;
    if (body.action === 'add') {
      cart = store.addToCart(id, Number(body.variant_id), Math.max(1, Number(body.quantity || 1)));
    } else if (body.action === 'set') {
      cart = store.setCartItem(id, Number(body.variant_id), Number(body.quantity));
    } else if (body.action === 'remove') {
      cart = store.removeFromCart(id, Number(body.variant_id));
    } else {
      cart = store.getCart(id);
    }
    sendJson(ctx.res, 200, { ok: true, cart, message: 'Bag updated' });
  } catch (err) {
    const status = err.code === 'INSUFFICIENT_STOCK' ? 409 : 400;
    sendJson(ctx.res, status, { ok: false, error: err.message, code: err.code, available: err.available });
  }
});

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

route('POST', '/api/checkout', async (ctx) => {
  const id = getCartId(ctx.req);
  const cart = id ? store.getCart(id) : { items: [] };
  if (!cart.items.length) return sendJson(ctx.res, 400, { ok: false, error: 'Your bag is empty.' });

  const body = await readJson(ctx.req);
  const email = String(body.email || '').trim();
  const fullName = String(body.full_name || '').trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return sendJson(ctx.res, 400, { ok: false, error: 'Please enter a valid email address.' });
  }
  if (!fullName) return sendJson(ctx.res, 400, { ok: false, error: 'Please enter your full name.' });

  const address = [body.address, body.city, body.zip, body.country].filter(Boolean).join(', ');

  // Validate stock before creating the order.
  for (const it of cart.items) {
    if (!it.available) {
      return sendJson(ctx.res, 409, { ok: false, error: `Not enough stock for ${it.product_name} (${it.variant_name}).` });
    }
  }

  const paymentProvider = config.stripeEnabled ? 'stripe' : 'mock';

  let order;
  try {
    order = store.createPendingOrder(cart, { email, fullName, address, paymentProvider });
  } catch (err) {
    return sendJson(ctx.res, 400, { ok: false, error: err.message });
  }

  if (config.stripeEnabled) {
    try {
      const session = await createCheckoutSession(order);
      store.setOrderPaymentRef(order.id, session.id);
      return sendJson(ctx.res, 200, { ok: true, url: session.url, order: order.number });
    } catch (err) {
      store.markOrderFailed(order.id, 'stripe_session_error');
      return sendJson(ctx.res, 502, { ok: false, error: `Payment provider error: ${err.message}` });
    }
  }

  // Local mock mode.
  store.setOrderPaymentRef(order.id, 'mock_' + order.number);
  return sendJson(ctx.res, 200, { ok: true, url: `/mock-pay?order=${encodeURIComponent(order.number)}`, mock: true, order: order.number });
});

route('POST', '/api/mock-pay', async (ctx) => {
  const body = await readJson(ctx.req);
  const order = store.getOrder(body.order);
  if (!order) return sendJson(ctx.res, 404, { ok: false, error: 'Order not found' });
  if (config.stripeEnabled) return sendJson(ctx.res, 400, { ok: false, error: 'Mock pay disabled in live mode' });

  const cartId = getCartId(ctx.req);

  if (body.outcome === 'fail') {
    store.markOrderFailed(order.id, 'mock_declined');
    return sendJson(ctx.res, 200, { ok: true, redirect: `/checkout?cancelled=1&order=${encodeURIComponent(order.number)}` });
  }

  try {
    store.fulfilOrder(order.id);
    if (cartId) store.clearCart(cartId);
    return sendJson(ctx.res, 200, { ok: true, redirect: `/order/success?order=${encodeURIComponent(order.number)}` });
  } catch (err) {
    return sendJson(ctx.res, 409, { ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Stripe webhook
// ---------------------------------------------------------------------------

route('POST', '/webhook/stripe', async (ctx) => {
  const raw = await ctx.rawBody();
  const sig = ctx.req.headers['stripe-signature'];
  const rawStr = raw.toString('utf8');

  // Only enforce signature when a webhook secret is explicitly configured.
  if (config.stripeWebhookSecret) {
    if (!sig || !verifyWebhook(rawStr, sig)) {
      return sendJson(ctx.res, 400, { ok: false, error: 'Invalid signature' });
    }
  }

  let event;
  try {
    event = JSON.parse(rawStr);
  } catch {
    return sendJson(ctx.res, 400, { ok: false, error: 'Invalid payload' });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data?.object || {};
    const orderNumber = session.metadata?.order_number || session.client_reference_id;
    const order = orderNumber ? store.getOrder(orderNumber) : null;
    if (order && session.payment_status === 'paid') {
      try {
        store.fulfilOrder(order.id);
      } catch (err) {
        console.error('[webhook] fulfil failed:', err.message);
      }
    }
  }

  sendJson(ctx.res, 200, { received: true });
});

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------

route('GET', '/admin', (ctx) => {
  if (isAdmin(ctx.req)) return sendRedirect(ctx.res, '/admin/dashboard');
  const error = ctx.query.get('error') === '1' ? 'Incorrect password.' : '';
  sendHtml(ctx.res, 200, adminLoginPage({ error }));
});

route('POST', '/admin/login', async (ctx) => {
  const form = await readForm(ctx.req);
  if ((form.password || '') !== config.adminPassword) {
    return sendRedirect(ctx.res, '/admin?error=1');
  }
  const sid = uuid();
  store.createAdminSession(sid);
  sendRedirect(ctx.res, '/admin/dashboard', {
    'Set-Cookie': serializeCookie(ADMIN_COOKIE, sid, { maxAge: 60 * 60 * 12, httpOnly: true }),
  });
});

route('POST', '/admin/logout', (ctx) => {
  const sid = parseCookies(ctx.req)[ADMIN_COOKIE];
  if (sid) store.destroyAdminSession(sid);
  sendRedirect(ctx.res, '/admin', {
    'Set-Cookie': serializeCookie(ADMIN_COOKIE, '', { maxAge: 0 }),
  });
});

route('GET', '/admin/dashboard', (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  const stats = store.adminStats();
  const recentOrders = store.listOrders({ limit: 8 });
  sendHtml(ctx.res, 200, adminDashboard({ stats, recentOrders }));
});

route('GET', '/admin/products', (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  const products = store.listProducts({ includeInactive: true });
  sendHtml(ctx.res, 200, adminProductsPage({ products }));
});

route('GET', '/admin/products/new', (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  sendHtml(ctx.res, 200, adminProductFormPage({ product: null, error: '' }));
});

route('GET', '/admin/products/:id/edit', (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  const product = store.getProductById(Number(ctx.params.id));
  if (!product) return sendRedirect(ctx.res, '/admin/products');
  sendHtml(ctx.res, 200, adminProductFormPage({ product, error: '' }));
});

function readProductForm(form) {
  const name = String(form.name || '').trim();
  return {
    name,
    slug: slugify(name),
    category: String(form.category || '').trim() || 'Uncategorised',
    subtitle: String(form.subtitle || '').trim(),
    description: String(form.description || '').trim(),
    details: String(form.details || '').trim(),
    price_cents: parseCents(form.price),
    compare_at_cents: form.compare_at ? parseCents(form.compare_at) : null,
    featured: form.featured ? 1 : 0,
    active: form.active ? 1 : 0,
  };
}

function readVariants(form) {
  const ids = [].concat(form.variant_id || []);
  const names = [].concat(form.variant_name || []);
  const skus = [].concat(form.variant_sku || []);
  const prices = [].concat(form.variant_price || []);
  const stocks = [].concat(form.variant_stock || []);
  const out = [];
  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !skus[i]) continue;
    out.push({
      id: ids[i] ? Number(ids[i]) : null,
      name: String(names[i]).trim(),
      sku: String(skus[i]).trim(),
      price_cents: parseCents(prices[i]),
      stock: Math.max(0, parseInt(stocks[i] || '0', 10) || 0),
      position: i,
    });
  }
  return out;
}

route('POST', '/admin/products', async (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  const form = await readForm(ctx.req);
  const data = readProductForm(form);
  const variants = readVariants(form);
  if (!data.name || !variants.length) {
    return sendHtml(ctx.res, 400, adminProductFormPage({ product: null, error: 'Name and at least one variant are required.' }));
  }
  try {
    const id = store.createProduct(data);
    variants.forEach((v) => store.upsertVariant(id, v));
    sendRedirect(ctx.res, '/admin/products');
  } catch (err) {
    sendHtml(ctx.res, 400, adminProductFormPage({ product: null, error: err.message }));
  }
});

route('POST', '/admin/products/:id', async (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  const id = Number(ctx.params.id);
  const form = await readForm(ctx.req);
  const data = readProductForm(form);
  const variants = readVariants(form);
  const existing = store.getProductById(id);
  if (!existing) return sendRedirect(ctx.res, '/admin/products');
  try {
    store.updateProduct(id, data);
    const keepIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
    existing.variants.forEach((v) => {
      if (!keepIds.has(v.id)) store.deleteVariant(v.id);
    });
    variants.forEach((v) => store.upsertVariant(id, v));
    sendRedirect(ctx.res, '/admin/products');
  } catch (err) {
    const product = store.getProductById(id);
    sendHtml(ctx.res, 400, adminProductFormPage({ product, error: err.message }));
  }
});

route('POST', '/admin/products/:id/delete', (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  store.deleteProduct(Number(ctx.params.id));
  sendRedirect(ctx.res, '/admin/products');
});

route('POST', '/admin/variants/:id/stock', async (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  const form = await readForm(ctx.req);
  store.setVariantStock(Number(ctx.params.id), Math.max(0, parseInt(form.stock || '0', 10) || 0));
  sendJson(ctx.res, 200, { ok: true });
});

route('GET', '/admin/orders', (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  sendHtml(ctx.res, 200, adminOrdersPage({ orders: store.listOrders({ limit: 200 }) }));
});

route('POST', '/admin/orders/:id/status', async (ctx) => {
  if (!isAdmin(ctx.req)) return requireAdmin(ctx.res);
  const form = await readForm(ctx.req);
  const allowed = ['pending', 'paid', 'fulfilled', 'cancelled', 'failed'];
  if (allowed.includes(form.status)) store.updateOrderStatus(Number(ctx.params.id), form.status);
  sendRedirect(ctx.res, '/admin/orders');
});

// ---------------------------------------------------------------------------
// Images + static
// ---------------------------------------------------------------------------

// Extensions recognised for real (user-supplied) product photos.
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const IMAGES_DIR = join(ROOT, 'public', 'images');

// Serves a real photo from public/images/<name>.<ext> when it exists, otherwise
// falls back to the generated SVG placeholder. To replace any demo image, just
// drop a file in public/images/ named after the product slug (or hero-kamilla,
// cat-<Category>, <slug>-2, <slug>-3 for thumbnails) - no code changes needed.
async function imageRoute(ctx, name) {
  const raw = String(name).replace(/\.svg$/i, '');
  const base = raw.replace(/[^a-zA-Z0-9._-]/g, ''); // sanitise: strip path separators

  for (const ext of IMAGE_EXTENSIONS) {
    const filePath = join(IMAGES_DIR, base + ext);
    if (!filePath.startsWith(IMAGES_DIR)) continue;
    if (existsSync(filePath)) {
      const data = await readFile(filePath);
      ctx.res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      });
      ctx.res.end(data);
      return;
    }
  }

  // Fallback: generated SVG placeholder.
  const labelName = base.replace(/-\d+$/, '');
  const label = labelName.replace(/-/g, ' ');
  const svg = productImageSvg(labelName, label);
  ctx.res.writeHead(200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=86400',
  });
  ctx.res.end(svg);
}

route('GET', '/favicon.svg', (ctx) => {
  ctx.res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
  ctx.res.end(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="#1a1a1a"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia,serif" font-size="34" fill="#c9a27e">K</text></svg>`
  );
});

async function serveStatic(ctx, pathname) {
  const safe = pathname.replace(/\.\./g, '');
  const filePath = join(ROOT, 'public', safe);
  if (!filePath.startsWith(join(ROOT, 'public')) || !existsSync(filePath)) return false;
  const data = await readFile(filePath);
  ctx.res.writeHead(200, {
    'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=3600',
  });
  ctx.res.end(data);
  return true;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function createApp() {
  migrate();
  if (config.seedOnBoot) seedIfEmpty();

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, config.baseUrl);
      const pathname = decodeURIComponent(url.pathname);

      // SVG placeholder images
      if (req.method === 'GET' && pathname.startsWith('/img/')) {
        return imageRoute({ req, res }, pathname.slice(5));
      }

      // Static assets
      if (req.method === 'GET' && (pathname.startsWith('/styles.css') || pathname.startsWith('/app.js') || pathname.startsWith('/images/'))) {
        const ok = await serveStatic({ req, res }, pathname);
        if (ok) return;
      }

      const matched = matchRoute(req.method, pathname);
      if (!matched) {
        return sendHtml(res, 404, notFoundPage({ cartCount: cartCount(req) }));
      }

      const ctx = {
        req,
        res,
        url,
        query: url.searchParams,
        params: matched.params,
        rawBody: async () => {
          if (ctx._raw) return ctx._raw;
          const chunks = [];
          for await (const c of req) chunks.push(c);
          ctx._raw = Buffer.concat(chunks);
          return ctx._raw;
        },
      };
      await matched.handler(ctx);
    } catch (err) {
      console.error('[error]', err);
      if (!res.headersSent) sendJson(res, 500, { ok: false, error: 'Internal server error' });
    }
  });

  return server;
}

// Start when run directly.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain || process.env.START_SERVER === '1') {
  const server = createApp();
  server.listen(config.port, () => {
    console.log(`\n  ${config.storeName} store running`);
    console.log(`  → http://localhost:${config.port}`);
    console.log(`  → Admin: http://localhost:${config.port}/admin`);
    console.log(`  → Stripe: ${config.stripeEnabled ? 'LIVE keys configured' : 'local TEST mode (no real charges)'}\n`);
  });
}
