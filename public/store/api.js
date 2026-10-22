// ============================================================================
// KAMILLA · camada de dados
// Fala com o Supabase via REST/Auth (fetch puro, sem dependências).
// Em modo demonstração (sem URL/key) lê o catálogo local, somente leitura.
// ============================================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY, STORE, isDemo } from './config.js';
import { DEMO_PRODUCTS } from './demo-data.js';

const SESSION_KEY = 'kamilla_session_v1';

export class ApiError extends Error {
  constructor(message, { status = 0, code = '', details = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export { isDemo };

const base = () => SUPABASE_URL.replace(/\/+$/, '');

let session = readSession();

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(value) {
  session = value;
  try {
    if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* modo privado do navegador */
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function translateAuth(message) {
  const text = String(message || '').trim();
  const map = {
    'Invalid login credentials': 'E-mail ou senha inválidos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'User not found': 'Usuário não encontrado.',
    'Invalid API key': 'Chave pública do Supabase inválida. Confira public/store/config.js.',
    'Failed to fetch': 'Não foi possível conectar ao Supabase. Verifique sua internet.',
    'Network request failed': 'Não foi possível conectar ao Supabase. Verifique sua internet.',
  };
  return map[text] || text || 'Não foi possível concluir a operação.';
}

async function authRequest(path, body, token) {
  let res;
  try {
    res = await fetch(`${base()}/auth/v1/${path}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body || {}),
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao Supabase. Verifique sua internet.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(translateAuth(data.error_description || data.msg || data.message), {
      status: res.status,
      code: data.error || data.error_code || '',
    });
  }
  return data;
}

async function refreshSession() {
  if (!session?.refresh_token) {
    saveSession(null);
    return null;
  }
  try {
    const data = await authRequest('token?grant_type=refresh_token', {
      refresh_token: session.refresh_token,
    });
    saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
      user: data.user || session.user,
      admin: Boolean(session.admin),
    });
    return session;
  } catch {
    saveSession(null);
    return null;
  }
}

export async function getSession() {
  if (isDemo) return null;
  if (!session) return null;
  if (session.expires_at && session.expires_at - 60000 < Date.now()) {
    return refreshSession();
  }
  return session;
}

export async function signIn(email, password) {
  if (isDemo) {
    throw new ApiError('Modo demonstração: configure o Supabase para acessar o admin.');
  }
  const data = await authRequest('token?grant_type=password', {
    email: String(email || '').trim(),
    password: String(password || ''),
  });
  saveSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    user: data.user,
    admin: false,
  });

  // A permissão real é verificada no banco (public.admins + RLS).
  let admin = false;
  try {
    admin = await checkAdmin();
  } catch (error) {
    await signOut();
    throw error;
  }
  if (!admin) {
    await signOut();
    throw new ApiError('Esta conta não tem permissão de administrador.');
  }
  session.admin = true;
  saveSession(session);
  return session;
}

async function checkAdmin() {
  if (!session?.access_token) return false;
  const result = await request('rpc/is_admin', { method: 'POST', auth: true, body: {} });
  return result === true;
}

export async function signOut() {
  const token = session?.access_token;
  if (!isDemo && token) {
    try {
      await authRequest('logout', {}, token);
    } catch {
      /* sessão local será limpa de qualquer forma */
    }
  }
  saveSession(null);
}

export function currentUser() {
  return session?.user || null;
}

export function isAdminUser() {
  if (session?.admin === true) return true;
  const email = session?.user?.email;
  return Boolean(email && email.toLowerCase() === STORE.adminEmail.toLowerCase());
}

async function parseError(res) {
  const data = await res.json().catch(() => ({}));
  let message = data.message || data.error_description || data.error || 'Não foi possível concluir a operação.';
  if (/invalid api key/i.test(message)) {
    message = 'Chave pública do Supabase inválida. Confira public/store/config.js.';
  }
  if (/jwt expired/i.test(message)) {
    message = 'Sua sessão expirou. Entre novamente.';
    saveSession(null);
  }
  if (res.status === 401 && /permission|policy|row-level/i.test(String(data.message || ''))) {
    message = 'Acesso negado. Entre com a conta de administrador.';
  }
  return new ApiError(message, {
    status: res.status,
    code: data.code || '',
    details: data.details || data.hint || '',
  });
}

async function request(path, { method = 'GET', body, auth = false, prefer = '' } = {}) {
  let token = SUPABASE_ANON_KEY;
  if (auth) {
    const active = await getSession();
    if (active?.access_token) token = active.access_token;
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;

  let res;
  try {
    res = await fetch(`${base()}/rest/v1/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao Supabase. Verifique sua internet.');
  }

  if (!res.ok) throw await parseError(res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function normalizeVariant(v) {
  return {
    ...v,
    price_cents: Number(v.price_cents) || 0,
    stock: Number(v.stock) || 0,
    position: Number(v.position) || 0,
  };
}

function normalizeProduct(p) {
  return {
    ...p,
    price_cents: Number(p.price_cents) || 0,
    compare_at_cents: p.compare_at_cents === null ? null : Number(p.compare_at_cents) || 0,
    featured: Boolean(p.featured),
    active: Boolean(p.active),
    image_url: p.image_url || `public/images/${p.slug}.svg`,
    variants: (p.variants || [])
      .map(normalizeVariant)
      .sort((a, b) => a.position - b.position || a.id - b.id),
  };
}

function demoCatalog() {
  return DEMO_PRODUCTS.map((p) => normalizeProduct(p));
}

function matches(p, { category = '', search = '' } = {}) {
  if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
  if (search) {
    const needle = search.toLowerCase();
    const haystack = `${p.name} ${p.category} ${p.subtitle} ${p.description}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export async function listProducts({ includeInactive = false, category = '', search = '' } = {}) {
  let products;
  if (isDemo) {
    products = demoCatalog();
  } else {
    const rows = await request('products?select=*,variants(*)&order=id.asc', {
      auth: includeInactive,
    });
    products = (rows || []).map(normalizeProduct);
  }

  return products
    .filter((p) => includeInactive || p.active)
    .filter((p) => matches(p, { category, search }))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.id - b.id);
}

export async function getProduct(slug, { includeInactive = false } = {}) {
  if (isDemo) {
    const product = demoCatalog().find((p) => p.slug === slug);
    return product && (includeInactive || product.active) ? product : null;
  }
  const rows = await request(
    `products?select=*,variants(*)&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    { auth: includeInactive }
  );
  const product = rows?.[0] ? normalizeProduct(rows[0]) : null;
  if (!product) return null;
  if (!includeInactive && !product.active) return null;
  return product;
}

export async function getProductById(id) {
  if (isDemo) return demoCatalog().find((p) => String(p.id) === String(id)) || null;
  const rows = await request(`products?select=*,variants(*)&id=eq.${encodeURIComponent(id)}&limit=1`, {
    auth: true,
  });
  return rows?.[0] ? normalizeProduct(rows[0]) : null;
}

export async function getVariantsByIds(ids) {
  const wanted = [...new Set((ids || []).map(Number).filter(Boolean))];
  if (!wanted.length) return [];

  if (isDemo) {
    const all = demoCatalog();
    const found = [];
    for (const product of all) {
      for (const variant of product.variants) {
        if (wanted.includes(Number(variant.id))) {
          found.push({ ...variant, product });
        }
      }
    }
    return found;
  }

  const rows = await request(
    `variants?select=*,products(id,slug,name,category,image_url,active)&id=in.(${wanted.join(',')})`
  );
  return (rows || [])
    .map((row) => {
      const { products, ...variant } = row;
      return { ...normalizeVariant(variant), product: normalizeProduct({ ...products, variants: [] }) };
    })
    .filter((row) => row.product?.active);
}

// ---------------------------------------------------------------------------
// Checkout / pedidos
// ---------------------------------------------------------------------------

export async function createOrder({ email, fullName, address, items }) {
  if (isDemo) {
    throw new ApiError(
      'Esta é uma prévia local. Configure o Supabase para finalizar pedidos de verdade.'
    );
  }
  return request('rpc/create_order', {
    method: 'POST',
    body: {
      p_email: email,
      p_full_name: fullName,
      p_address: address,
      p_items: (items || []).map((item) => ({
        variant_id: Number(item.variant_id),
        quantity: Number(item.quantity),
      })),
    },
  });
}

export async function payOrder(numberValue, outcome = 'success') {
  if (isDemo) {
    throw new ApiError('Modo demonstração: pagamento indisponível.');
  }
  return request('rpc/pay_order', {
    method: 'POST',
    body: { p_number: numberValue, p_outcome: outcome },
  });
}

export async function getOrderStatus(numberValue) {
  if (isDemo) return null;
  return request('rpc/order_status', {
    method: 'POST',
    body: { p_number: numberValue },
  });
}

export async function getAdminOrders() {
  if (isDemo) return [];
  const rows = await request(
    'orders?select=*,order_items(*)&order=created_at.desc&limit=300',
    { auth: true }
  );
  return (rows || []).map((order) => ({
    ...order,
    subtotal_cents: Number(order.subtotal_cents) || 0,
    shipping_cents: Number(order.shipping_cents) || 0,
    total_cents: Number(order.total_cents) || 0,
    order_items: (order.order_items || []).sort((a, b) => a.id - b.id),
  }));
}

export async function setOrderStatus(numberValue, status) {
  if (isDemo) throw new ApiError('Modo demonstração: admin indisponível.');
  return request('rpc/set_order_status', {
    method: 'POST',
    auth: true,
    body: { p_number: numberValue, p_status: status },
  });
}

// ---------------------------------------------------------------------------
// Admin · produtos e variações
// ---------------------------------------------------------------------------

export async function createProduct(row) {
  if (isDemo) throw new ApiError('Modo demonstração: admin indisponível.');
  const data = await request('products', {
    method: 'POST',
    auth: true,
    body: row,
    prefer: 'return=representation',
  });
  return data?.[0] ? normalizeProduct(data[0]) : null;
}

export async function updateProduct(id, patch) {
  if (isDemo) throw new ApiError('Modo demonstração: admin indisponível.');
  const data = await request(`products?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    auth: true,
    body: patch,
    prefer: 'return=representation',
  });
  return data?.[0] ? normalizeProduct(data[0]) : null;
}

export async function deleteProduct(id) {
  if (isDemo) throw new ApiError('Modo demonstração: admin indisponível.');
  await request(`products?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
}

export async function createVariant(row) {
  if (isDemo) throw new ApiError('Modo demonstração: admin indisponível.');
  const data = await request('variants', {
    method: 'POST',
    auth: true,
    body: row,
    prefer: 'return=representation',
  });
  return data?.[0] ? normalizeVariant(data[0]) : null;
}

export async function updateVariant(id, patch) {
  if (isDemo) throw new ApiError('Modo demonstração: admin indisponível.');
  const data = await request(`variants?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    auth: true,
    body: patch,
    prefer: 'return=representation',
  });
  return data?.[0] ? normalizeVariant(data[0]) : null;
}

export async function deleteVariant(id) {
  if (isDemo) throw new ApiError('Modo demonstração: admin indisponível.');
  await request(`variants?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
}

export async function deleteVariantsExcept(productId, keepIds) {
  if (isDemo) throw new ApiError('Modo demonstração: admin indisponível.');
  const ids = (keepIds || []).map(Number).filter(Boolean);
  const filter = ids.length
    ? `product_id=eq.${encodeURIComponent(productId)}&id=not.in.(${ids.join(',')})`
    : `product_id=eq.${encodeURIComponent(productId)}`;
  await request(`variants?${filter}`, { method: 'DELETE', auth: true });
}

// Pequena espera usada pelos testes manuais do modo demo.
export { sleep };
