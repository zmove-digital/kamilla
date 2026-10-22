import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

// Ensure the data directory exists before opening the database file.
mkdirSync(dirname(config.databasePath), { recursive: true });

export const db = new DatabaseSync(config.databasePath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  subtitle        TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  details         TEXT NOT NULL DEFAULT '',
  price_cents     INTEGER NOT NULL,
  compare_at_cents INTEGER,
  active          INTEGER NOT NULL DEFAULT 1,
  featured        INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS variants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sku         TEXT UNIQUE NOT NULL,
  price_cents INTEGER NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0,
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS carts (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  cart_id    TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL,
  PRIMARY KEY (cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  number         TEXT UNIQUE NOT NULL,
  email          TEXT,
  full_name      TEXT,
  address        TEXT,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  total_cents    INTEGER NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'brl',
  status         TEXT NOT NULL DEFAULT 'pending',
  payment_provider TEXT NOT NULL DEFAULT 'mock',
  payment_ref    TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at        TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id       INTEGER,
  product_name     TEXT NOT NULL,
  variant_name     TEXT NOT NULL,
  sku              TEXT,
  unit_price_cents INTEGER NOT NULL,
  quantity         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
`;

export function migrate() {
  db.exec(SCHEMA);
}

// ---------------------------------------------------------------------------
// Products & variants
// ---------------------------------------------------------------------------

export function listProducts({ category = '', sort = 'featured', search = '', includeInactive = false } = {}) {
  const where = [];
  const params = [];
  if (!includeInactive) where.push('p.active = 1');
  if (category) {
    where.push('p.category = ?');
    params.push(category);
  }
  if (search) {
    where.push('(p.name LIKE ? OR p.subtitle LIKE ? OR p.description LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const orderMap = {
    featured: 'p.featured DESC, p.created_at DESC',
    'price-asc': 'p.price_cents ASC',
    'price-desc': 'p.price_cents DESC',
    newest: 'p.created_at DESC',
    name: 'p.name ASC',
  };
  const orderSql = orderMap[sort] || orderMap.featured;

  const products = db
    .prepare(`SELECT * FROM products p ${whereSql} ORDER BY ${orderSql}`)
    .all(...params);

  return products.map((p) => ({ ...p, variants: listVariants(p.id) }));
}

export function getProductBySlug(slug, { includeInactive = false } = {}) {
  const p = db
    .prepare(`SELECT * FROM products WHERE slug = ? ${includeInactive ? '' : 'AND active = 1'}`)
    .get(slug);
  if (!p) return null;
  return { ...p, variants: listVariants(p.id) };
}

export function getProductById(id) {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!p) return null;
  return { ...p, variants: listVariants(p.id) };
}

export function listVariants(productId) {
  return db
    .prepare('SELECT * FROM variants WHERE product_id = ? ORDER BY position ASC, id ASC')
    .all(productId);
}

export function getVariant(id) {
  return db
    .prepare(
      `SELECT v.*, p.name AS product_name, p.slug AS product_slug, p.category
       FROM variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = ?`
    )
    .get(id);
}

export function categories() {
  return db
    .prepare('SELECT category, COUNT(*) AS count FROM products WHERE active = 1 GROUP BY category ORDER BY category')
    .all();
}

export function createProduct(data) {
  const info = db
    .prepare(
      `INSERT INTO products (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, active, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.slug,
      data.name,
      data.category,
      data.subtitle ?? '',
      data.description ?? '',
      data.details ?? '',
      data.price_cents,
      data.compare_at_cents ?? null,
      data.active ? 1 : 0,
      data.featured ? 1 : 0
    );
  return Number(info.lastInsertRowid);
}

export function updateProduct(id, data) {
  db.prepare(
    `UPDATE products SET slug=?, name=?, category=?, subtitle=?, description=?, details=?,
       price_cents=?, compare_at_cents=?, active=?, featured=? WHERE id=?`
  ).run(
    data.slug,
    data.name,
    data.category,
    data.subtitle ?? '',
    data.description ?? '',
    data.details ?? '',
    data.price_cents,
    data.compare_at_cents ?? null,
    data.active ? 1 : 0,
    data.featured ? 1 : 0,
    id
  );
}

export function deleteProduct(id) {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

export function upsertVariant(productId, { id, name, sku, price_cents, stock, position = 0 }) {
  if (id) {
    db.prepare(
      'UPDATE variants SET name=?, sku=?, price_cents=?, stock=?, position=? WHERE id=? AND product_id=?'
    ).run(name, sku, price_cents, stock, position, id, productId);
    return Number(id);
  }
  const info = db
    .prepare('INSERT INTO variants (product_id, name, sku, price_cents, stock, position) VALUES (?,?,?,?,?,?)')
    .run(productId, name, sku, price_cents, stock, position);
  return Number(info.lastInsertRowid);
}

export function deleteVariant(id) {
  db.prepare('DELETE FROM variants WHERE id = ?').run(id);
}

export function setVariantStock(id, stock) {
  db.prepare('UPDATE variants SET stock = ? WHERE id = ?').run(stock, id);
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export function ensureCart(cartId) {
  db.prepare('INSERT OR IGNORE INTO carts (id) VALUES (?)').run(cartId);
}

export function getCart(cartId) {
  if (!cartId) return { id: null, items: [], subtotal_cents: 0, count: 0 };
  const items = db
    .prepare(
      `SELECT ci.variant_id, ci.quantity,
              v.name AS variant_name, v.price_cents, v.stock, v.sku,
              p.name AS product_name, p.slug AS product_slug, p.id AS product_id
       FROM cart_items ci
       JOIN variants v ON v.id = ci.variant_id
       JOIN products p ON p.id = v.product_id
       WHERE ci.cart_id = ?
       ORDER BY ci.rowid ASC`
    )
    .all(cartId);
  const decorated = items.map((it) => ({
    ...it,
    line_total_cents: it.price_cents * it.quantity,
    available: it.stock >= it.quantity,
  }));
  const subtotal = decorated.reduce((sum, it) => sum + it.line_total_cents, 0);
  const count = decorated.reduce((sum, it) => sum + it.quantity, 0);
  return { id: cartId, items: decorated, subtotal_cents: subtotal, count };
}

export function addToCart(cartId, variantId, quantity = 1) {
  ensureCart(cartId);
  const variant = getVariant(variantId);
  if (!variant) throw new Error('Variant not found');
  const existing = db
    .prepare('SELECT quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?')
    .get(cartId, variantId);
  const desired = (existing?.quantity || 0) + quantity;
  if (quantity < 0) throw new Error('Invalid quantity');
  if (desired > variant.stock) {
    const err = new Error('Not enough stock');
    err.code = 'INSUFFICIENT_STOCK';
    err.available = variant.stock;
    throw err;
  }
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND variant_id = ?').run(
      desired,
      cartId,
      variantId
    );
  } else {
    db.prepare('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?,?,?)').run(
      cartId,
      variantId,
      quantity
    );
  }
  return getCart(cartId);
}

export function setCartItem(cartId, variantId, quantity) {
  const variant = getVariant(variantId);
  if (!variant) throw new Error('Variant not found');
  if (quantity <= 0) {
    db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND variant_id = ?').run(cartId, variantId);
    return getCart(cartId);
  }
  if (quantity > variant.stock) {
    const err = new Error('Not enough stock');
    err.code = 'INSUFFICIENT_STOCK';
    err.available = variant.stock;
    throw err;
  }
  db.prepare('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND variant_id = ?').run(
    quantity,
    cartId,
    variantId
  );
  return getCart(cartId);
}

export function removeFromCart(cartId, variantId) {
  db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND variant_id = ?').run(cartId, variantId);
  return getCart(cartId);
}

export function clearCart(cartId) {
  db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cartId);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KM-${ts}-${rnd}`;
}

export function shippingForSubtotal(subtotalCents) {
  if (config.freeShippingThresholdCents > 0 && subtotalCents >= config.freeShippingThresholdCents) {
    return 0;
  }
  return config.shippingFlatCents;
}

// Creates a PENDING order from the cart. Does NOT touch stock yet - stock is
// only decremented when payment is confirmed (fulfilOrder).
export function createPendingOrder(cart, { email, fullName, address, paymentProvider }) {
  if (!cart.items.length) throw new Error('Cart is empty');
  const shipping = shippingForSubtotal(cart.subtotal_cents);
  const total = cart.subtotal_cents + shipping;
  const number = generateOrderNumber();

  db.exec('BEGIN IMMEDIATE');
  try {
    const info = db
      .prepare(
        `INSERT INTO orders (number, email, full_name, address, subtotal_cents, shipping_cents, total_cents, currency, status, payment_provider)
         VALUES (?,?,?,?,?,?,?,?, 'pending', ?)`
      )
      .run(number, email, fullName, address, cart.subtotal_cents, shipping, total, config.currency, paymentProvider);
    const orderId = Number(info.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, variant_id, product_name, variant_name, sku, unit_price_cents, quantity)
       VALUES (?,?,?,?,?,?,?)`
    );
    for (const it of cart.items) {
      insertItem.run(orderId, it.variant_id, it.product_name, it.variant_name, it.sku, it.price_cents, it.quantity);
    }
    db.exec('COMMIT');
    return getOrder(orderId);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getOrder(idOrNumber) {
  const order =
    typeof idOrNumber === 'number'
      ? db.prepare('SELECT * FROM orders WHERE id = ?').get(idOrNumber)
      : db.prepare('SELECT * FROM orders WHERE number = ?').get(idOrNumber);
  if (!order) return null;
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  return order;
}

export function setOrderPaymentRef(orderId, ref) {
  db.prepare('UPDATE orders SET payment_ref = ? WHERE id = ?').run(ref, orderId);
}

export function markOrderFailed(orderId, reason) {
  db.prepare("UPDATE orders SET status = 'failed', payment_ref = COALESCE(?, payment_ref) WHERE id = ?").run(
    reason || null,
    orderId
  );
}

// Atomically confirms payment and decrements stock. Safe against overselling:
// the stock check + decrement runs inside a single IMMEDIATE transaction.
export function fulfilOrder(orderId) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'paid') {
      db.exec('COMMIT');
      return getOrder(orderId); // idempotent
    }
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    for (const item of items) {
      if (item.variant_id == null) continue;
      const v = db.prepare('SELECT stock, name FROM variants WHERE id = ?').get(item.variant_id);
      if (!v) {
        throw new Error(`Variant ${item.variant_id} no longer exists`);
      }
      if (v.stock < item.quantity) {
        const err = new Error(`Insufficient stock for ${item.product_name} (${item.variant_name})`);
        err.code = 'INSUFFICIENT_STOCK';
        throw err;
      }
    }
    // All good -> decrement.
    for (const item of items) {
      if (item.variant_id == null) continue;
      db.prepare('UPDATE variants SET stock = stock - ? WHERE id = ?').run(item.quantity, item.variant_id);
    }
    db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(orderId);
    db.exec('COMMIT');
    return getOrder(orderId);
  } catch (err) {
    db.exec('ROLLBACK');
    markOrderFailed(orderId, err.code || 'error');
    throw err;
  }
}

export function updateOrderStatus(orderId, status) {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
}

export function listOrders({ limit = 100 } = {}) {
  const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT ?').all(limit);
  return orders.map((o) => ({ ...o, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id) }));
}

export function adminStats() {
  const paid = db
    .prepare("SELECT COUNT(*) AS count, COALESCE(SUM(total_cents),0) AS revenue FROM orders WHERE status = 'paid'")
    .get();
  const pending = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'").get();
  const products = db.prepare('SELECT COUNT(*) AS count FROM products').get();
  const lowStock = db
    .prepare('SELECT v.id, v.name, v.sku, v.stock, p.name AS product_name FROM variants v JOIN products p ON p.id=v.product_id WHERE v.stock <= 3 ORDER BY v.stock ASC LIMIT 20')
    .all();
  return {
    paidOrders: paid.count,
    revenue_cents: paid.revenue,
    pendingOrders: pending.count,
    productCount: products.count,
    lowStock,
  };
}

// ---------------------------------------------------------------------------
// Admin sessions
// ---------------------------------------------------------------------------

export function createAdminSession(id) {
  db.prepare('INSERT OR REPLACE INTO admin_sessions (id) VALUES (?)').run(id);
}

export function adminSessionValid(id) {
  if (!id) return false;
  return Boolean(db.prepare('SELECT 1 FROM admin_sessions WHERE id = ?').get(id));
}

export function destroyAdminSession(id) {
  db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(id);
}
