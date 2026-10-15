import { spawn } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = 3300 + randomInt(0, 400);
const BASE = `http://localhost:${PORT}`;
const DB_PATH = join(ROOT, 'data', `test-${Date.now()}.db`);
const ADMIN_PASS = 'test-secret-123';

// Clean up any stray test DB files.
for (const suffix of ['', '-wal', '-shm']) {
  const f = DB_PATH + suffix;
  if (existsSync(f)) rmSync(f);
}

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  \u2713 ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? ' — ' + detail : ''}`);
    console.log(`  \u2717 ${name}${detail ? ' — ' + detail : ''}`);
  }
}

// Simple cookie-jar HTTP client.
function makeClient() {
  const jar = new Map();
  return {
    jar,
    cookieHeader() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    },
    storeCookies(headers) {
      const setCookies = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
      for (const c of setCookies) {
        const [pair] = c.split(';');
        const idx = pair.indexOf('=');
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        if (v === '' ) jar.delete(k);
        else jar.set(k, v);
      }
    },
    async request(method, path, body) {
      const headers = {};
      if (this.cookieHeader()) headers.Cookie = this.cookieHeader();
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const res = await fetch(BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        redirect: 'manual',
      });
      this.storeCookies(res.headers);
      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}
      return { status: res.status, headers: res.headers, text, json };
    },
    get(path) {
      return this.request('GET', path);
    },
    post(path, body) {
      return this.request('POST', path, body);
    },
    async form(path, fields) {
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      if (this.cookieHeader()) headers.Cookie = this.cookieHeader();
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(fields)) {
        // Repeat the key for array values (mirrors native form submission).
        if (Array.isArray(v)) v.forEach((item) => params.append(k, item));
        else params.append(k, v);
      }
      const res = await fetch(BASE + path, {
        method: 'POST',
        headers,
        body: params.toString(),
        redirect: 'manual',
      });
      this.storeCookies(res.headers);
      return { status: res.status, headers: res.headers, text: await res.text() };
    },
  };
}

function readStock(variantId) {
  const db = new DatabaseSync(DB_PATH);
  const row = db.prepare('SELECT stock FROM variants WHERE id = ?').get(variantId);
  db.close();
  return row?.stock;
}

function variantIdBySku(sku) {
  const db = new DatabaseSync(DB_PATH);
  const row = db.prepare('SELECT id FROM variants WHERE sku = ?').get(sku);
  db.close();
  return row?.id;
}

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(BASE + '/');
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function unitTests() {
  console.log('Unit: Stripe helpers');
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  const { formEncode, verifyWebhook } = await import('../src/lib/stripe.js');
  const { createHmac } = await import('node:crypto');

  const encoded = formEncode({
    mode: 'payment',
    metadata: { order_number: 'AR-1' },
    line_items: [{ quantity: 2, price_data: { currency: 'usd', unit_amount: 19900 } }],
  });
  const str = new URLSearchParams(encoded).toString();
  check('formEncode flattens nested objects', str.includes('metadata%5Border_number%5D=AR-1'));
  check('formEncode handles arrays with indices', str.includes('line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=19900'));

  const body = JSON.stringify({ type: 'checkout.session.completed' });
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', 'whsec_test_secret').update(`${t}.${body}`).digest('hex');
  check('verifyWebhook accepts a valid signature', verifyWebhook(body, `t=${t},v1=${sig}`) === true);
  check('verifyWebhook rejects a bad signature', verifyWebhook(body, `t=${t},v1=deadbeef`) === false);
  check('verifyWebhook rejects a missing header', verifyWebhook(body, '') === false);
  delete process.env.STRIPE_WEBHOOK_SECRET;
  console.log('');
}

async function main() {
  console.log(`\nAURELLE integration test  (port ${PORT}, db ${DB_PATH})\n`);
  await unitTests();

  const child = spawn(process.execPath, [join(ROOT, 'src', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      BASE_URL: BASE,
      DATABASE_PATH: DB_PATH,
      SEED_ON_BOOT: 'true',
      MOCK_PAYMENTS: 'true',
      ADMIN_PASSWORD: ADMIN_PASS,
      STRIPE_SECRET_KEY: '',
      STRIPE_WEBHOOK_SECRET: '',
      SHIPPING_FLAT_CENTS: '0',
      FREE_SHIPPING_THRESHOLD_CENTS: '15000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  child.stdout.on('data', (d) => (serverLog += d));
  child.stderr.on('data', (d) => (serverLog += d));

  const ready = await waitForServer();
  if (!ready) {
    console.error('Server did not start. Log:\n', serverLog);
    child.kill();
    process.exit(1);
  }

  try {
    // ---- Storefront ----------------------------------------------------
    console.log('Storefront');
    const shop = makeClient();

    let res = await shop.get('/');
    check('GET / returns 200', res.status === 200);
    check('Home page shows brand', res.text.includes('AURELLE'));
    check('Home page lists products', /Seamless Clip-In/.test(res.text));

    res = await shop.get('/shop');
    check('GET /shop returns 200', res.status === 200);
    const productCount = (res.text.match(/class="product-card"/g) || []).length;
    check('Shop lists all 8 seeded products', productCount === 8, `found ${productCount}`);

    res = await shop.get('/shop?category=Clip-In');
    check('Category filter works', res.status === 200 && /Clip-In/.test(res.text));

    res = await shop.get('/shop?search=tape');
    check('Search works', res.status === 200 && /Tape-In/.test(res.text));

    res = await shop.get('/product/seamless-clip-in-extensions');
    check('Product page 200', res.status === 200);
    check('Product page has add-to-bag', /id="add-to-cart"/.test(res.text));

    res = await shop.get('/product/does-not-exist');
    check('Unknown product returns 404', res.status === 404);

    res = await shop.get('/img/seamless-clip-in-extensions.svg');
    check('Placeholder image served as SVG', res.status === 200 && res.text.includes('<svg'));

    // ---- Cart ----------------------------------------------------------
    console.log('\nCart');
    res = await shop.get('/api/cart');
    check('Empty cart has 0 items', res.json?.cart?.count === 0);

    const skuVariant = variantIdBySku('CI-SEAM-20-NB');
    const stockBefore = readStock(skuVariant);

    res = await shop.post('/api/cart', { action: 'add', variant_id: skuVariant, quantity: 1 });
    check('Add to cart succeeds', res.status === 200 && res.json.cart.count === 1);
    check('Cart sets cookie', shop.jar.has('aurelle_cart'));

    res = await shop.post('/api/cart', { action: 'add', variant_id: skuVariant, quantity: 2 });
    check('Adding again increments quantity', res.json.cart.count === 3);

    res = await shop.post('/api/cart', { action: 'set', variant_id: skuVariant, quantity: 1 });
    check('Set quantity works', res.json.cart.count === 1);

    // Overselling guard
    const lowStockVariant = variantIdBySku('CI-SEAM-24-HB'); // stock 3
    const over = await shop.post('/api/cart', { action: 'add', variant_id: lowStockVariant, quantity: 99 });
    check('Overselling is blocked (409)', over.status === 409 && over.json.code === 'INSUFFICIENT_STOCK');
    res = await shop.post('/api/cart', { action: 'add', variant_id: lowStockVariant, quantity: 2 });
    check('Valid quantity accepted', res.status === 200);

    res = await shop.get('/cart');
    check('Cart page renders', res.status === 200 && res.text.includes('Your bag'));

    // ---- Checkout (mock payment) --------------------------------------
    console.log('\nCheckout & inventory');
    res = await shop.post('/api/checkout', { email: 'bad-email' });
    check('Invalid email rejected', res.status === 400);

    res = await shop.post('/api/checkout', {
      email: 'jane@example.com',
      full_name: 'Jane Doe',
      address: '123 Main St',
      city: 'New York',
      zip: '10001',
      country: 'United States',
    });
    check('Checkout creates order + redirect URL', res.status === 200 && res.json.url.includes('/mock-pay'));
    const orderNumber = res.json.order;

    const stockMid = readStock(skuVariant);
    check('Stock NOT decremented before payment', stockMid === stockBefore);

    res = await shop.get(`/mock-pay?order=${orderNumber}`);
    check('Mock pay page renders', res.status === 200 && res.text.includes('Simulated payment'));

    res = await shop.post('/api/mock-pay', { order: orderNumber, outcome: 'success' });
    check('Mock payment succeeds', res.status === 200 && res.json.redirect.includes('/order/success'));

    const stockAfter = readStock(skuVariant);
    check('Stock decremented after payment', stockAfter === stockBefore - 1, `was ${stockBefore}, now ${stockAfter}`);

    res = await shop.get('/api/cart');
    check('Cart cleared after payment', res.json.cart.count === 0);

    res = await shop.get(`/order/success?order=${orderNumber}`);
    check('Success page renders order', res.status === 200 && res.text.includes(orderNumber));

    // Double-fulfil idempotency (webhook retries must not double-charge stock)
    const payAgain = await shop.post('/api/mock-pay', { order: orderNumber, outcome: 'success' });
    check('Repayment is idempotent (safe)', payAgain.status === 200);
    check('Stock not double-decremented', readStock(skuVariant) === stockAfter);

    // Decline path
    const shop2 = makeClient();
    const v2 = variantIdBySku('CI-SEAM-16-CB');
    await shop2.post('/api/cart', { action: 'add', variant_id: v2, quantity: 1 });
    const res2 = await shop2.post('/api/checkout', { email: 'decline@example.com', full_name: 'Decline Test', address: 'x', city: 'y', zip: '1', country: 'US' });
    const declined = await shop2.post('/api/mock-pay', { order: res2.json.order, outcome: 'fail' });
    check('Declined payment redirects to checkout', declined.json.redirect.includes('cancelled'));

    // ---- Admin ---------------------------------------------------------
    console.log('\nAdmin panel');
    const admin = makeClient();

    res = await admin.get('/admin');
    check('Admin login page renders', res.status === 200 && /Sign in/.test(res.text));

    res = await admin.get('/admin/dashboard');
    check('Dashboard blocked without auth', res.status === 302);

    res = await admin.form('/admin/login', { password: 'wrong-password' });
    check('Wrong password rejected', res.status === 302 && res.headers.get('location').includes('error=1'));

    res = await admin.form('/admin/login', { password: ADMIN_PASS });
    check('Correct password logs in', res.status === 302 && admin.jar.has('aurelle_admin'));

    res = await admin.get('/admin/dashboard');
    check('Dashboard loads after login', res.status === 200 && res.text.includes('Revenue'));

    res = await admin.get('/admin/products');
    check('Products admin lists items', res.status === 200 && /Seamless Clip-In/.test(res.text));

    res = await admin.get('/admin/orders');
    check('Orders admin shows the order', res.status === 200 && res.text.includes(orderNumber));

    // Create product
    res = await admin.form('/admin/products', {
      name: 'Test Wig Unit',
      category: 'Bundles',
      subtitle: 'Test subtitle',
      price: '99.90',
      description: 'A test product',
      details: 'one · two',
      active: 'on',
      variant_name: ['18" · Black', '20" · Black'],
      variant_sku: ['TEST-WIG-18', 'TEST-WIG-20'],
      variant_price: ['99.90', '119.90'],
      variant_stock: ['5', '4'],
    });
    check('Create product redirects', res.status === 302);
    res = await admin.get('/admin/products');
    check('New product appears', /Test Wig Unit/.test(res.text));

    const newVariant = variantIdBySku('TEST-WIG-18');
    check('New product variant created with stock', readStock(newVariant) === 5);

    // Edit stock via admin
    const newProductId = new DatabaseSync(DB_PATH).prepare("SELECT id FROM products WHERE slug='test-wig-unit'").get().id;
    res = await admin.get(`/admin/products/${newProductId}/edit`);
    check('Edit product form loads', res.status === 200 && /Test Wig Unit/.test(res.text));

    res = await admin.form(`/admin/products/${newProductId}`, {
      name: 'Test Wig Unit',
      category: 'Bundles',
      subtitle: 'Updated subtitle',
      price: '109.90',
      description: 'Updated',
      details: 'one',
      active: 'on',
      variant_id: [String(newVariant)],
      variant_name: ['18" · Black'],
      variant_sku: ['TEST-WIG-18'],
      variant_price: ['109.90'],
      variant_stock: ['42'],
    });
    check('Update product redirects', res.status === 302);
    check('Stock updated to 42', readStock(newVariant) === 42);

    // Status update
    const orderId = new DatabaseSync(DB_PATH).prepare('SELECT id FROM orders WHERE number=?').get(orderNumber).id;
    res = await admin.form(`/admin/orders/${orderId}/status`, { status: 'fulfilled' });
    check('Order status update works', res.status === 302);

    // Logout
    res = await admin.form('/admin/logout', {});
    res = await admin.get('/admin/dashboard');
    check('Logout blocks dashboard', res.status === 302);

    // ---- Security-ish --------------------------------------------------
    console.log('\nRobustness');
    res = await makeClient().get('/webhook/stripe');
    check('GET on webhook is 404 (method guarded)', res.status === 404);
    res = await makeClient().post('/webhook/stripe', { type: 'checkout.session.completed' });
    check('Webhook accepts JSON without signature (no secret set)', res.status === 200 && res.json?.received === true, JSON.stringify(res.json));
  } finally {
    child.kill();
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log('  - ' + f));
  }
  console.log('');

  // Cleanup test db
  for (const suffix of ['', '-wal', '-shm']) {
    const f = DB_PATH + suffix;
    if (existsSync(f)) {
      try {
        rmSync(f);
      } catch {}
    }
  }

  process.exit(failed ? 1 : 0);
}

main();
