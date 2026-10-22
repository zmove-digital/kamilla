// Servidor que imita o Supabase (Auth + REST/RPC) para testar o frontend
// sem depender de um projeto real. SOMENTE DESENVOLVIMENTO.
//
//   node scripts/mock-supabase.js
//   → http://localhost:54321
//
// Credenciais do admin fake:
//   e-mail: zmove.digital@gmail.com
//   senha:  admin123
//
// Depois aponte public/store/config.js para http://localhost:54321 com a
// chave "mock-anon-key" (ou use um arquivo de configuração temporário).
import { createServer } from 'node:http';
import { DEMO_PRODUCTS } from '../public/store/demo-data.js';

const PORT = Number(process.env.MOCK_PORT) || 54321;
const ADMIN_EMAIL = 'zmove.digital@gmail.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_TOKEN = 'mock-admin-token';
const CUSTOMER_EMAIL = 'cliente@teste.com';
const CUSTOMER_PASSWORD = 'cliente123';
const CUSTOMER_TOKEN = 'mock-customer-token';

const clone = (value) => JSON.parse(JSON.stringify(value));
const products = clone(DEMO_PRODUCTS).map((product) => ({
  ...product,
  variants: (product.variants || []).map((variant) => ({ ...variant })),
}));
const orders = [];
let nextProductId = Math.max(0, ...products.map((product) => product.id)) + 1;
let nextVariantId =
  Math.max(0, ...products.flatMap((product) => product.variants.map((variant) => variant.id))) + 1;
let nextOrderId = 1;

const now = () => new Date().toISOString();
const orderNumber = () =>
  `KM-${Math.random().toString(16).slice(2, 10).toUpperCase()}${Date.now().toString(16).slice(-4).toUpperCase()}`;

function send(res, status, body) {
  const text = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization,apikey,content-type,prefer',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

const fail = (res, status, message) => send(res, status, { message });

async function body(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const isAdmin = (req) => req.headers.authorization === `Bearer ${ADMIN_TOKEN}`;

function publicProduct(product) {
  return {
    ...product,
    variants: product.variants.map((variant) => ({ ...variant })),
  };
}

function minimalProduct(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    image_url: product.image_url,
    active: product.active,
  };
}

function authResponse(user) {
  return {
    access_token: user === ADMIN_EMAIL ? ADMIN_TOKEN : CUSTOMER_TOKEN,
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token',
    user: {
      id: user === ADMIN_EMAIL ? 'mock-admin-id' : 'mock-customer-id',
      email: user,
      aud: 'authenticated',
      role: 'authenticated',
    },
  };
}

function createOrder(input) {
  const items = input.p_items;
  if (!Array.isArray(items) || !items.length) throw new Error('Sua sacola está vazia.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(input.p_email || ''))) {
    throw new Error('Informe um e-mail válido.');
  }
  if (String(input.p_full_name || '').trim().length < 2) throw new Error('Informe seu nome completo.');
  if (String(input.p_address || '').trim().length < 8) throw new Error('Informe o endereço de entrega.');

  const grouped = new Map();
  for (const item of items) {
    const id = Number(item.variant_id);
    grouped.set(id, (grouped.get(id) || 0) + Number(item.quantity));
  }

  const lines = [];
  for (const [variantId, quantity] of grouped) {
    const product = products.find((entry) =>
      entry.variants.some((variant) => Number(variant.id) === variantId)
    );
    const variant = product?.variants.find((entry) => Number(entry.id) === variantId);
    if (!product || !variant || !product.active || quantity < 1 || variant.stock < quantity) {
      throw new Error('Um dos produtos está indisponível ou sem estoque suficiente. Atualize sua sacola.');
    }
    lines.push({ product, variant, quantity });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.variant.price_cents * line.quantity, 0);
  const shipping = subtotal >= 29900 ? 0 : 2990;
  const order = {
    id: nextOrderId++,
    number: orderNumber(),
    email: String(input.p_email).trim(),
    full_name: String(input.p_full_name).trim(),
    address: String(input.p_address).trim(),
    subtotal_cents: subtotal,
    shipping_cents: shipping,
    total_cents: subtotal + shipping,
    currency: 'brl',
    status: 'pending',
    payment_provider: 'mock',
    payment_ref: null,
    created_at: now(),
    paid_at: null,
    order_items: lines.map((line, index) => ({
      id: index + 1,
      order_id: 0,
      variant_id: line.variant.id,
      product_name: line.product.name,
      variant_name: line.variant.name,
      sku: line.variant.sku,
      unit_price_cents: line.variant.price_cents,
      quantity: line.quantity,
    })),
  };
  order.order_items.forEach((item) => {
    item.order_id = order.id;
  });
  orders.unshift(order);
  return {
    id: order.id,
    number: order.number,
    subtotal_cents: order.subtotal_cents,
    shipping_cents: order.shipping_cents,
    total_cents: order.total_cents,
    currency: 'brl',
    status: order.status,
    created_at: order.created_at,
  };
}

function payOrder(input) {
  const order = orders.find((entry) => entry.number === input.p_number);
  if (!order) throw new Error('Pedido não encontrado.');
  if (order.status === 'paid') return { ok: true, status: 'paid', number: order.number };
  if (order.status !== 'pending') throw new Error('Este pedido não está aguardando pagamento.');
  if (input.p_outcome === 'fail') {
    order.status = 'failed';
    return { ok: true, status: 'failed', number: order.number };
  }
  for (const item of order.order_items) {
    const product = products.find((entry) =>
      entry.variants.some((variant) => Number(variant.id) === Number(item.variant_id))
    );
    const variant = product?.variants.find((entry) => Number(entry.id) === Number(item.variant_id));
    if (!variant || variant.stock < item.quantity) {
      throw new Error(`Estoque insuficiente para o item ${item.sku}.`);
    }
  }
  for (const item of order.order_items) {
    const product = products.find((entry) =>
      entry.variants.some((variant) => Number(variant.id) === Number(item.variant_id))
    );
    const variant = product.variants.find((entry) => Number(entry.id) === Number(item.variant_id));
    variant.stock -= item.quantity;
  }
  order.status = 'paid';
  order.paid_at = now();
  return {
    ok: true,
    status: 'paid',
    number: order.number,
    total_cents: order.total_cents,
    paid_at: order.paid_at,
  };
}

function setOrderStatus(input) {
  const order = orders.find((entry) => entry.number === input.p_number);
  if (!order) throw new Error('Pedido não encontrado.');
  const allowed = ['pending', 'paid', 'shipped', 'cancelled', 'failed'];
  if (!allowed.includes(input.p_status)) throw new Error('Status inválido.');
  if (order.status === input.p_status) return { ok: true, status: input.p_status, number: order.number };

  if (input.p_status === 'cancelled' && ['paid', 'shipped'].includes(order.status)) {
    for (const item of order.order_items) {
      for (const product of products) {
        const variant = product.variants.find((entry) => Number(entry.id) === Number(item.variant_id));
        if (variant) variant.stock += item.quantity;
      }
    }
  }
  if (input.p_status === 'paid' && ['pending', 'failed'].includes(order.status)) {
    for (const item of order.order_items) {
      for (const product of products) {
        const variant = product.variants.find((entry) => Number(entry.id) === Number(item.variant_id));
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para o item ${item.sku}.`);
        }
        variant.stock -= item.quantity;
      }
    }
    order.paid_at = now();
  }
  order.status = input.p_status;
  return { ok: true, status: order.status, number: order.number };
}

function orderStatus(numberValue) {
  const order = orders.find((entry) => entry.number === numberValue);
  if (!order) return null;
  return {
    number: order.number,
    status: order.status,
    total_cents: order.total_cents,
    shipping_cents: order.shipping_cents,
    currency: order.currency,
    created_at: order.created_at,
    paid_at: order.paid_at,
  };
}

function parseIn(value) {
  const match = String(value || '').match(/^in\.\((.*)\)$/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(Boolean);
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization,apikey,content-type,prefer',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  try {
    if (path === '/') {
      return send(res, 200, { ok: true, service: 'mock-supabase', products: products.length, orders: orders.length });
    }

    if (path.startsWith('/auth/v1/token')) {
      const input = await body(req);
      if (url.searchParams.get('grant_type') === 'refresh_token') {
        return send(res, 200, authResponse(ADMIN_EMAIL));
      }
      if (input.email === ADMIN_EMAIL && input.password === ADMIN_PASSWORD) {
        return send(res, 200, authResponse(ADMIN_EMAIL));
      }
      if (input.email === CUSTOMER_EMAIL && input.password === CUSTOMER_PASSWORD) {
        return send(res, 200, authResponse(CUSTOMER_EMAIL));
      }
      return send(res, 400, {
        error: 'invalid_grant',
        error_description: 'Invalid login credentials',
      });
    }

    if (path === '/auth/v1/logout') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
      res.end();
      return;
    }

    if (path === '/rest/v1/rpc/is_admin') {
      return send(res, 200, isAdmin(req));
    }

    if (path === '/rest/v1/rpc/create_order') {
      const input = await body(req);
      try {
        return send(res, 200, createOrder(input));
      } catch (error) {
        return fail(res, 400, error.message);
      }
    }

    if (path === '/rest/v1/rpc/pay_order') {
      const input = await body(req);
      try {
        return send(res, 200, payOrder(input));
      } catch (error) {
        return fail(res, 400, error.message);
      }
    }

    if (path === '/rest/v1/rpc/order_status') {
      const input = await body(req);
      return send(res, 200, orderStatus(input.p_number));
    }

    if (path === '/rest/v1/rpc/set_order_status') {
      if (!isAdmin(req)) return fail(res, 401, 'Acesso negado.');
      const input = await body(req);
      try {
        return send(res, 200, setOrderStatus(input));
      } catch (error) {
        return fail(res, 400, error.message);
      }
    }

    if (path === '/rest/v1/products') {
      const admin = isAdmin(req);
      const idFilter = url.searchParams.get('id');
      const slugFilter = url.searchParams.get('slug');

      if (req.method === 'GET') {
        let list = admin ? products : products.filter((product) => product.active);
        if (idFilter?.startsWith('eq.')) list = list.filter((p) => String(p.id) === idFilter.slice(3));
        if (slugFilter?.startsWith('eq.')) list = list.filter((p) => p.slug === slugFilter.slice(3));
        if (url.searchParams.get('limit') === '1') list = list.slice(0, 1);
        return send(res, 200, list.map(publicProduct));
      }

      if (!admin) return fail(res, 401, 'Acesso negado.');

      if (req.method === 'POST') {
        const input = await body(req);
        if (products.some((product) => product.slug === input.slug)) {
          return fail(res, 409, 'duplicate key value violates unique constraint "products_slug_key"');
        }
        const product = {
          id: nextProductId++,
          slug: input.slug,
          name: input.name,
          category: input.category,
          subtitle: input.subtitle || '',
          description: input.description || '',
          details: input.details || '',
          price_cents: Number(input.price_cents) || 0,
          compare_at_cents: input.compare_at_cents ?? null,
          image_url: input.image_url || '',
          featured: Boolean(input.featured),
          active: input.active !== false,
          created_at: now(),
          variants: [],
        };
        products.push(product);
        return send(res, 201, [publicProduct(product)]);
      }

      if (req.method === 'PATCH') {
        const input = await body(req);
        const id = Number(String(idFilter || '').replace('eq.', ''));
        const product = products.find((entry) => entry.id === id);
        if (!product) return fail(res, 404, 'Produto não encontrado.');
        Object.assign(product, input);
        return send(res, 200, [publicProduct(product)]);
      }

      if (req.method === 'DELETE') {
        const id = Number(String(idFilter || '').replace('eq.', ''));
        const index = products.findIndex((entry) => entry.id === id);
        if (index >= 0) products.splice(index, 1);
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
        res.end();
        return;
      }
    }

    if (path === '/rest/v1/variants') {
      const admin = isAdmin(req);
      if (req.method === 'GET') {
        const ids = parseIn(url.searchParams.get('id'));
        const rows = [];
        for (const product of products) {
          if (!admin && !product.active) continue;
          for (const variant of product.variants) {
            if (!ids.length || ids.includes(Number(variant.id))) {
              rows.push({ ...variant, products: minimalProduct(product) });
            }
          }
        }
        return send(res, 200, rows);
      }

      if (!admin) return fail(res, 401, 'Acesso negado.');

      if (req.method === 'POST') {
        const input = await body(req);
        const product = products.find((entry) => Number(entry.id) === Number(input.product_id));
        if (!product) return fail(res, 404, 'Produto não encontrado.');
        if (products.some((entry) => entry.variants.some((variant) => variant.sku === input.sku))) {
          return fail(res, 409, 'duplicate key value violates unique constraint "variants_sku_key"');
        }
        const variant = {
          id: nextVariantId++,
          product_id: Number(input.product_id),
          name: input.name,
          sku: input.sku,
          price_cents: Number(input.price_cents) || 0,
          stock: Number(input.stock) || 0,
          position: Number(input.position) || 0,
          created_at: now(),
        };
        product.variants.push(variant);
        return send(res, 201, [variant]);
      }

      if (req.method === 'PATCH') {
        const input = await body(req);
        const id = Number(String(url.searchParams.get('id') || '').replace('eq.', ''));
        let found = null;
        for (const product of products) {
          const variant = product.variants.find((entry) => Number(entry.id) === id);
          if (variant) {
            Object.assign(variant, input);
            found = variant;
          }
        }
        if (!found) return fail(res, 404, 'Variação não encontrada.');
        return send(res, 200, [found]);
      }

      if (req.method === 'DELETE') {
        const productId = Number(String(url.searchParams.get('product_id') || '').replace('eq.', ''));
        const keepRaw = url.searchParams.get('id');
        const keep = keepRaw?.startsWith('not.in.') ? parseIn(keepRaw.slice(7)) : [];
        const product = products.find((entry) => entry.id === productId);
        if (product) {
          product.variants = product.variants.filter((variant) => keep.includes(Number(variant.id)));
        }
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
        res.end();
        return;
      }
    }

    if (path === '/rest/v1/orders') {
      if (!isAdmin(req)) return fail(res, 401, 'Acesso negado.');
      return send(res, 200, orders.map((order) => clone(order)));
    }

    return fail(res, 404, `Rota mock não implementada: ${req.method} ${path}`);
  } catch (error) {
    console.error(error);
    return fail(res, 500, error.message);
  }
}).listen(PORT, () => {
  console.log(`Mock Supabase em http://localhost:${PORT}`);
  console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('Use a anon key "mock-anon-key" (qualquer valor funciona).');
});
