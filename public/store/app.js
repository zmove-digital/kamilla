// ============================================================================
// KAMILLA · aplicação estática (GitHub Pages + Supabase)
// Roteador por hash: #/ , #/loja , #/produto/:slug , #/carrinho , #/checkout ,
// #/pagamento/:numero , #/pedido/:numero , #/admin...
// ============================================================================

import {
  getAdminOrders,
  getOrderStatus,
  getProductById,
  getSession,
  isAdminUser,
  isDemo,
  listProducts,
  signOut,
} from './api.js';
import { cartTotals, loadCartDetails, updateBadge } from './cart.js';
import { STORE } from './config.js';
import {
  adminDashboardPage,
  adminDeniedPage,
  adminLoginPage,
  adminOrdersPage,
  adminProductFormPage,
  adminProductsPage,
  bindAdminLogin,
  bindAdminOrdersPage,
  bindAdminProductForm,
  bindAdminProductsPage,
} from './admin.js';
import {
  bindCartPage,
  bindCheckoutPage,
  bindPaymentPage,
  bindProductPage,
  bindShopPage,
  cartPage,
  checkoutPage,
  homePage,
  notFoundPage,
  orderPage,
  paymentPage,
  productPage,
  recallOrder,
  shopPage,
} from './pages.js';
import {
  errorView,
  escapeHtml,
  initCountdown,
  initGlobalUI,
  initReveals,
  pageLoading,
  toast,
} from './ui.js';

const app = document.getElementById('app');
let renderId = 0;

function parseRoute() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const segments = decodeURI(pathPart)
    .split('/')
    .filter(Boolean);
  return { segments, params: new URLSearchParams(queryPart) };
}

function navigate(hash, force = false) {
  const next = hash.startsWith('#') ? hash : `#${hash}`;
  if (location.hash === next) {
    if (force) renderRoute();
    return;
  }
  location.hash = next;
}

function setActiveNav(segments) {
  const section = segments[0] || 'home';
  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.nav === section);
  });
}

function mount(html, title) {
  app.innerHTML = html;
  document.title = `${title} · ${STORE.name}`;
  updateBadge();
  initReveals();
  initCountdown();
}

function finish() {
  window.KAMILLA_READY = true;
}

function relatedProducts(product, all) {
  const same = all.filter((item) => item.slug !== product.slug && item.category === product.category);
  const others = all.filter((item) => item.slug !== product.slug && item.category !== product.category);
  return [...same, ...others].slice(0, 4);
}

async function routeHome() {
  const products = await listProducts();
  mount(homePage({ products }), 'Celulares com até 12x sem juros');
}

async function routeShop(params) {
  const category = params.get('categoria') || '';
  const search = params.get('q') || '';
  const sort = params.get('ordem') || '';
  const products = await listProducts();
  mount(shopPage({ products, category, search, sort }), category ? `Celulares ${category}` : 'Todos os celulares');
  bindShopPage({ category, search, sort });
}

async function routeProduct(slug) {
  const products = await listProducts();
  const product = products.find((item) => item.slug === slug);
  if (!product) {
    mount(notFoundPage(), 'Produto não encontrado');
    return;
  }
  mount(productPage({ product, related: relatedProducts(product, products) }), product.name);
  bindProductPage({ product });
}

async function cartData() {
  const { lines, removed, adjusted } = await loadCartDetails();
  if (removed) toast(`${removed} item(ns) removido(s) por falta de estoque.`);
  if (adjusted) toast('Ajustamos a quantidade de um item ao estoque disponível.');
  return { lines, totals: cartTotals(lines) };
}

async function routeCart() {
  const { lines, totals } = await cartData();
  mount(cartPage({ lines, totals }), 'Sua sacola');
  bindCartPage({ lines, reload: renderRoute });
}

async function routeCheckout() {
  const { lines, totals } = await cartData();
  mount(checkoutPage({ lines, totals }), 'Checkout');
  bindCheckoutPage({ lines, navigate });
}

async function routePayment(numberValue) {
  if (!numberValue) {
    mount(notFoundPage(), 'Pedido não encontrado');
    return;
  }
  let order = recallOrder(numberValue);
  if (!order) {
    const remote = await getOrderStatus(numberValue);
    if (remote) {
      order = {
        ...remote,
        subtotal_cents: remote.total_cents - remote.shipping_cents,
        items: [],
      };
    }
  }
  if (!order) {
    mount(notFoundPage(), 'Pedido não encontrado');
    return;
  }
  if (order.status !== 'pending') {
    navigate(`#/pedido/${encodeURIComponent(numberValue)}`);
    return;
  }
  mount(paymentPage({ order }), 'Pagamento');
  bindPaymentPage({ order, navigate });
}

async function routeOrder(numberValue) {
  if (!numberValue) {
    mount(notFoundPage(), 'Pedido não encontrado');
    return;
  }
  let order = recallOrder(numberValue);
  if (!order) {
    const remote = await getOrderStatus(numberValue);
    if (remote) {
      order = {
        ...remote,
        subtotal_cents: remote.total_cents - remote.shipping_cents,
        items: [],
      };
    }
  }
  if (!order) {
    mount(notFoundPage(), 'Pedido não encontrado');
    return;
  }
  mount(orderPage({ order }), 'Pedido');
}

async function adminLogin() {
  mount(adminLoginPage(), 'Admin');
  bindAdminLogin({ reload: renderRoute });
}

async function routeAdmin(segments, session) {
  if (!session) return adminLogin();
  if (!isAdminUser()) {
    mount(adminDeniedPage(), 'Acesso restrito');
    return;
  }
  const user = session.user;

  if (segments.length === 1) {
    const [products, orders] = await Promise.all([
      listProducts({ includeInactive: true }),
      getAdminOrders(),
    ]);
    mount(adminDashboardPage({ products, orders, user }), 'Painel');
    return;
  }

  if (segments[1] === 'produtos') {
    const products = await listProducts({ includeInactive: true });
    mount(adminProductsPage({ products, user }), 'Produtos');
    bindAdminProductsPage({ reload: renderRoute });
    return;
  }

  if (segments[1] === 'pedidos') {
    const orders = await getAdminOrders();
    mount(adminOrdersPage({ orders, user }), 'Pedidos');
    bindAdminOrdersPage({ reload: renderRoute });
    return;
  }

  if (segments[1] === 'produto') {
    if (segments[2] === 'novo') {
      mount(adminProductFormPage({ product: null, user }), 'Novo produto');
      bindAdminProductForm({ product: null, reload: renderRoute, navigate });
      return;
    }
    const product = await getProductById(segments[2]);
    if (!product) {
      mount(notFoundPage(), 'Produto não encontrado');
      return;
    }
    mount(adminProductFormPage({ product, user }), 'Editar produto');
    bindAdminProductForm({ product, reload: renderRoute, navigate });
    return;
  }

  mount(notFoundPage(), 'Página não encontrada');
}

async function renderRoute() {
  const id = ++renderId;
  const { segments, params } = parseRoute();
  const section = segments[0] || 'home';

  document.body.classList.toggle('admin-route', section === 'admin');
  setActiveNav(segments);
  document.querySelector('.main-nav')?.classList.remove('is-open');

  app.innerHTML = pageLoading();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  try {
    if (!segments.length) {
      await routeHome();
    } else if (segments[0] === 'loja') {
      await routeShop(params);
    } else if (segments[0] === 'produto') {
      await routeProduct(segments[1]);
    } else if (segments[0] === 'carrinho') {
      await routeCart();
    } else if (segments[0] === 'checkout') {
      await routeCheckout();
    } else if (segments[0] === 'pagamento') {
      await routePayment(segments[1]);
    } else if (segments[0] === 'pedido') {
      await routeOrder(segments[1]);
    } else if (segments[0] === 'admin') {
      const session = await getSession();
      if (id !== renderId) return;
      await routeAdmin(segments, session);
    } else {
      mount(notFoundPage(), 'Página não encontrada');
    }
    if (id !== renderId) return;
    finish();
  } catch (error) {
    if (id !== renderId) return;
    console.error(error);
    const message = error?.message || 'Não foi possível carregar a página.';
    if (
      section === 'admin' &&
      /sess[ãa]o|acesso negado|jwt|permission|row-level/i.test(message)
    ) {
      await signOut();
      return adminLogin();
    }
    mount(errorView(message, location.hash || '#/'), 'Erro');
    finish();
  }
}

window.addEventListener('hashchange', renderRoute);

document.addEventListener('click', async (event) => {
  const logout = event.target.closest('[data-admin-logout]');
  if (!logout) return;
  await signOut();
  toast('Sessão encerrada.');
  navigate('#/admin', true);
});

initGlobalUI();
updateBadge();

const demoBanner = document.getElementById('demo-banner');
if (demoBanner) demoBanner.hidden = !isDemo;

if (!location.hash) {
  // Deixa a URL limpa no primeiro acesso; o roteador trata a ausência de hash.
  history.replaceState(null, '', `${location.pathname}${location.search}#/`);
}

renderRoute();

// Exposto apenas para depuração manual no console.
window.KAMILLA_APP = { navigate, refresh: renderRoute, demo: isDemo };
