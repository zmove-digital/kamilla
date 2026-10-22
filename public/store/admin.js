// ============================================================================
// KAMILLA · painel administrativo (Supabase Auth + RLS)
// ============================================================================

import { STORE, isDemo } from './config.js';
import {
  createProduct,
  createVariant,
  deleteProduct,
  deleteVariantsExcept,
  getAdminOrders,
  isAdminUser,
  setOrderStatus,
  signIn,
  signOut,
  updateProduct,
  updateVariant,
} from './api.js';
import {
  escapeHtml,
  formatDate,
  imageFallback,
  installments,
  money,
  moneyInput,
  parseMoney,
  productImageUrl,
  productMinPrice,
  productTotalStock,
  setBusy,
  statusPill,
  toast,
} from './ui.js';

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function makeSku(slug, variantName, index) {
  const base = slugify(slug || 'produto')
    .replace(/-/g, '')
    .slice(0, 6)
    .toUpperCase();
  const suffix = String(variantName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter(Boolean)
    .pop()
    ?.slice(0, 3)
    .toUpperCase();
  return `${base || 'KAM'}-${String(index + 1).padStart(2, '0')}-${suffix || String(Date.now()).slice(-4)}`;
}

const LOGO = `<img src="./public/logo.svg" alt="KAMILLA" width="48" height="48" style="border-radius:12px">`;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export function adminLoginPage() {
  return `<div class="login-wrap">
    <div class="login-card">
      <div style="display:flex;justify-content:center">${LOGO}</div>
      <h1 style="text-align:center">Acesso administrativo</h1>
      <p class="muted center small">Entre com a conta de administrador da KAMILLA para gerenciar produtos e pedidos.</p>

      ${
        isDemo
          ? `<div class="alert" style="margin-top:16px">🧪 <strong>Modo demonstração.</strong> Configure o Supabase em <code>public/store/config.js</code> para habilitar o login.</div>`
          : ''
      }

      <form id="login-form">
        <label>E-mail
          <input type="email" name="email" autocomplete="username" placeholder="voce@email.com" required>
        </label>
        <label>Senha
          <input type="password" name="password" autocomplete="current-password" placeholder="Sua senha" required>
        </label>
        <button class="btn btn-primary btn-block" type="submit" ${isDemo ? 'disabled' : ''}>Entrar no painel →</button>
      </form>

      <p class="small muted center" style="margin-top:18px">Esqueceu a senha? Redefina em <strong>Authentication → Users</strong> no Supabase.</p>
      <p class="center"><a class="link-arrow" href="#/">← Voltar para a loja</a></p>
    </div>
  </div>`;
}

export function bindAdminLogin({ reload }) {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const button = form.querySelector('button[type="submit"]');

    setBusy(button, true, 'Entrando…');
    try {
      await signIn(email, password);
      if (!isAdminUser()) {
        await signOut();
        throw new Error('Esta conta não está na lista de administradores da KAMILLA.');
      }
      toast('Bem-vindo(a) de volta! 💜');
      reload();
    } catch (error) {
      toast(error.message || 'Não foi possível entrar.');
      setBusy(button, false);
    }
  });
}

export function adminDeniedPage() {
  return `<div class="login-wrap">
    <div class="login-card center">
      ${LOGO}
      <h1>Acesso restrito</h1>
      <p class="muted">A conta logada não está na lista de administradores. Peça para adicionar o e-mail em <strong>supabase/schema.sql</strong> (tabela <code>admins</code>).</p>
      <button class="btn btn-primary" data-admin-logout>Sair e tentar outra conta</button>
      <p style="margin-top:16px"><a class="link-arrow" href="#/">← Voltar para a loja</a></p>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

function adminShell({ title, active, content, user }) {
  const nav = [
    ['#/admin', 'Visão geral', 'dashboard'],
    ['#/admin/produtos', 'Produtos', 'products'],
    ['#/admin/pedidos', 'Pedidos', 'orders'],
  ]
    .map(
      ([href, label, key]) =>
        `<a class="admin-nav-link${active === key ? ' is-active' : ''}" href="${href}">${label}</a>`
    )
    .join('');

  return `<div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">KAMILLA<span>painel</span></div>
      <nav class="admin-nav">${nav}</nav>
      <div class="admin-logout">
        <a class="admin-store-link" href="#/">← Ver loja</a>
        <button type="button" data-admin-logout>Sair</button>
      </div>
    </aside>
    <main class="admin-main">
      <div class="admin-topbar">
        <h1>${escapeHtml(title)}</h1>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span class="small muted">${escapeHtml(user?.email || '')}</span>
          <span class="admin-mode is-live">Supabase conectado</span>
        </div>
      </div>
      ${content}
    </main>
  </div>`;
}

function orderItemsText(order) {
  return (order.order_items || [])
    .map((item) => `${item.product_name} (${item.variant_name}) × ${item.quantity}`)
    .join('<br>');
}

// ---------------------------------------------------------------------------
// Visão geral
// ---------------------------------------------------------------------------

export function adminDashboardPage({ products, orders, user }) {
  const paidOrders = orders.filter((order) => order.status === 'paid' || order.status === 'shipped');
  const revenue = paidOrders.reduce((sum, order) => sum + order.total_cents, 0);
  const pending = orders.filter((order) => order.status === 'pending').length;
  const lowStock = [];
  for (const product of products) {
    for (const variant of product.variants) {
      if (variant.stock <= 5) {
        lowStock.push({ product, variant });
      }
    }
  }
  lowStock.sort((a, b) => a.variant.stock - b.variant.stock);

  const stats = `<div class="stats-grid">
    <div class="stat-card"><span class="stat-label">Produtos</span><span class="stat-value">${products.length}</span><span class="stat-sub">${products.filter((p) => p.active).length} ativos na loja</span></div>
    <div class="stat-card"><span class="stat-label">Faturamento pago</span><span class="stat-value">${money(revenue)}</span><span class="stat-sub">${paidOrders.length} pedido(s) pago(s)</span></div>
    <div class="stat-card"><span class="stat-label">Aguardando pagamento</span><span class="stat-value">${pending}</span><span class="stat-sub">de ${orders.length} pedido(s) no total</span></div>
    <div class="stat-card"><span class="stat-label">Estoque baixo</span><span class="stat-value">${lowStock.length}</span><span class="stat-sub">variações com 5 unidades ou menos</span></div>
  </div>`;

  const recent = orders.slice(0, 6);
  const recentTable = recent.length
    ? `<table class="admin-table">
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr></thead>
        <tbody>${recent
          .map(
            (order) => `<tr>
              <td><a href="#/admin/pedidos" style="font-weight:800;color:var(--primary)">${escapeHtml(order.number)}</a></td>
              <td>${escapeHtml(order.full_name)}<br><small class="muted">${escapeHtml(order.email)}</small></td>
              <td><strong>${money(order.total_cents)}</strong></td>
              <td>${statusPill(order.status)}</td>
              <td class="muted small">${formatDate(order.created_at)}</td>
            </tr>`
          )
          .join('')}</tbody>
      </table>`
    : `<p class="muted">Nenhum pedido ainda. Quando alguém finalizar uma compra, ela aparece aqui.</p>`;

  const lowTable = lowStock.length
    ? `<table class="admin-table">
        <thead><tr><th>Produto</th><th>Variação</th><th>SKU</th><th>Estoque</th></tr></thead>
        <tbody>${lowStock
          .slice(0, 10)
          .map(
            ({ product, variant }) => `<tr>
              <td>${escapeHtml(product.name)}</td>
              <td>${escapeHtml(variant.name)}</td>
              <td class="muted small">${escapeHtml(variant.sku)}</td>
              <td><span class="pill ${variant.stock === 0 ? 'pill-red' : 'pill-amber'}">${variant.stock} un.</span></td>
            </tr>`
          )
          .join('')}</tbody>
      </table>`
    : `<p class="muted">Tudo certo com o estoque. Nenhuma variação com 5 unidades ou menos.</p>`;

  return adminShell({
    title: 'Visão geral',
    active: 'dashboard',
    user,
    content: `${stats}
      <div class="admin-panel">
        <div class="panel-head"><h2>Pedidos recentes</h2><a class="link-arrow" href="#/admin/pedidos">Ver todos →</a></div>
        ${recentTable}
      </div>
      <div class="admin-panel">
        <div class="panel-head"><h2>Alerta de estoque</h2><a class="link-arrow" href="#/admin/produtos">Gerenciar produtos →</a></div>
        ${lowTable}
      </div>`,
  });
}

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

export function adminProductsPage({ products, user }) {
  const rows = products
    .map((product) => {
      const min = productMinPrice(product);
      const max = product.variants.length
        ? Math.max(...product.variants.map((variant) => variant.price_cents))
        : product.price_cents;
      const price = min === max ? money(min) : `${money(min)} – ${money(max)}`;
      const stock = productTotalStock(product);
      return `<tr>
        <td>
          <div class="cell-product">
            <img src="${escapeHtml(productImageUrl(product))}" alt="" ${imageFallback()}>
            <div><strong>${escapeHtml(product.name)}</strong><br><span class="muted small">${escapeHtml(
        product.category
      )} · ${product.variants.length} variação(ões)</span></div>
          </div>
        </td>
        <td>${price}</td>
        <td><span class="pill ${stock === 0 ? 'pill-red' : stock <= 5 ? 'pill-amber' : 'pill-green'}">${stock} un.</span></td>
        <td>${product.featured ? '<span class="pill pill-amber">Destaque</span>' : ''} ${
        product.active ? '<span class="pill pill-green">Ativo</span>' : '<span class="pill pill-grey">Inativo</span>'
      }</td>
        <td>
          <div class="cell-actions">
            <a class="btn-mini" href="#/admin/produto/${product.id}">Editar</a>
            <button class="btn-mini btn-danger" type="button" data-delete-product="${product.id}" data-name="${escapeHtml(
        product.name
      )}">Excluir</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');

  const content = `<div class="admin-panel">
    <div class="panel-head">
      <h2>Catálogo</h2>
      <a class="btn btn-primary" href="#/admin/produto/novo">+ Novo produto</a>
    </div>
    ${
      products.length
        ? `<table class="admin-table">
        <thead><tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`
        : `<div class="empty-state" style="padding:40px"><span class="empty-icon">📱</span><h3>Nenhum produto cadastrado</h3><p class="muted">Crie o primeiro celular do catálogo.</p><a class="btn btn-primary" href="#/admin/produto/novo">Cadastrar produto</a></div>`
    }
  </div>`;

  return adminShell({ title: 'Produtos', active: 'products', content, user });
}

export function bindAdminProductsPage({ reload }) {
  document.querySelectorAll('[data-delete-product]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.deleteProduct;
      const name = button.dataset.name || 'este produto';
      if (!window.confirm(`Excluir “${name}”? Essa ação também remove as variações e não pode ser desfeita.`)) {
        return;
      }
      setBusy(button, true, 'Excluindo…');
      try {
        await deleteProduct(id);
        toast('Produto excluído.');
        reload();
      } catch (error) {
        toast(error.message || 'Não foi possível excluir o produto.');
        setBusy(button, false);
      }
    });
  });
}

function variantRow(variant = {}, index = 0, productSlug = '') {
  return `<tr data-variant-row data-variant-id="${variant.id || ''}">
    <td><input type="text" data-variant-name name="variant_name" placeholder="128GB · 8GB · Preto" value="${escapeHtml(
      variant.name || ''
    )}" required></td>
    <td><input type="text" data-variant-sku name="variant_sku" placeholder="${makeSku(
      productSlug,
      variant.name || '',
      index
    )}" value="${escapeHtml(variant.sku || '')}"></td>
    <td><input type="text" data-variant-price name="variant_price" placeholder="0,00" value="${
      variant.price_cents ? moneyInput(variant.price_cents) : ''
    }"></td>
    <td><input type="number" data-variant-stock name="variant_stock" min="0" step="1" value="${Number(
      variant.stock || 0
    )}"></td>
    <td><button type="button" class="btn-mini btn-danger" data-remove-variant>Remover</button></td>
  </tr>`;
}

export function adminProductFormPage({ product, user }) {
  const editing = Boolean(product?.id);
  const variants = product?.variants?.length ? product.variants : [{}];
  const slug = product?.slug || '';

  const rows = variants
    .map((variant, index) => variantRow(variant, index, slug))
    .join('');

  const content = `<div class="admin-form">
    <p style="margin-top:-10px"><a class="link-arrow" href="#/admin/produtos">← Voltar para produtos</a></p>

    <form id="product-form">
      <div class="admin-panel">
        <div class="panel-head"><h2>${editing ? 'Editar produto' : 'Novo produto'}</h2><span class="muted small">${editing ? `ID ${product.id}` : 'O produto aparecerá na loja imediatamente após salvar'}</span></div>
        <div class="form-grid">
          <label>Nome do produto
            <input type="text" name="name" value="${escapeHtml(product?.name || '')}" placeholder="iPhone 16" required>
          </label>
          <label>Slug (URL)
            <input type="text" name="slug" value="${escapeHtml(slug)}" placeholder="iphone-16">
          </label>
          <label>Categoria
            <input type="text" name="category" value="${escapeHtml(product?.category || '')}" placeholder="Apple" required>
          </label>
          <label>Subtítulo
            <input type="text" name="subtitle" value="${escapeHtml(
              product?.subtitle || ''
            )}" placeholder="Tela 6,1&quot; · Chip A18 · Câmera 48MP">
          </label>
          <label>Preço (R$)
            <input type="text" name="price" value="${
              product?.price_cents ? moneyInput(product.price_cents) : ''
            }" placeholder="5.499,00" required>
          </label>
          <label>Preço &quot;de&quot; (R$)
            <input type="text" name="compare" value="${
              product?.compare_at_cents ? moneyInput(product.compare_at_cents) : ''
            }" placeholder="6.199,00">
          </label>
          <label>URL da imagem
            <input type="text" name="image_url" value="${escapeHtml(
              product?.image_url || ''
            )}" placeholder="public/images/iphone-16.svg ou https://…">
          </label>
          <label>Ficha técnica (separe por ·)
            <input type="text" name="details" value="${escapeHtml(
              product?.details || ''
            )}" placeholder="Tela 6,1&quot; · Chip A18 · 5G · Face ID">
          </label>
        </div>
        <label>Descrição
          <textarea name="description" rows="4" placeholder="Conte os diferenciais do aparelho…">${escapeHtml(
            product?.description || ''
          )}</textarea>
        </label>
        <div style="display:flex;gap:26px;flex-wrap:wrap">
          <label class="checkbox" style="margin-top:0!important"><input type="checkbox" name="featured" ${
            product?.featured ? 'checked' : ''
          }> Mostrar como destaque na home</label>
          <label class="checkbox" style="margin-top:0!important"><input type="checkbox" name="active" ${
            product?.active !== false ? 'checked' : ''
          }> Produto ativo na loja</label>
        </div>
      </div>

      <div class="admin-panel">
        <div class="panel-head">
          <h2>Variações</h2>
          <button type="button" class="btn-mini" data-add-variant>+ Adicionar variação</button>
        </div>
        <p class="muted small">Use o padrão <strong>Armazenamento · RAM · Cor</strong> (ex.: <code>128GB · 8GB · Preto</code>) para habilitar os seletores bonitos na página do produto. Outros formatos viram um seletor simples.</p>
        <table class="admin-table variants-table">
          <thead><tr><th>Nome / combinação</th><th>SKU</th><th>Preço (R$)</th><th>Estoque</th><th></th></tr></thead>
          <tbody data-variant-rows>${rows}</tbody>
        </table>
        <p class="muted small" style="margin-top:12px">Preço vazio = usa o preço do produto. SKU vazio = gerado automaticamente.</p>
      </div>

      <div class="admin-form-actions">
        <button class="btn btn-primary" type="submit">${editing ? 'Salvar alterações' : 'Criar produto'}</button>
        <a class="btn btn-ghost" href="#/admin/produtos">Cancelar</a>
      </div>
    </form>
  </div>`;

  return adminShell({
    title: editing ? 'Editar produto' : 'Novo produto',
    active: 'products',
    content,
    user,
  });
}

export function bindAdminProductForm({ product, reload, navigate }) {
  const form = document.getElementById('product-form');
  if (!form) return;

  const rows = form.querySelector('[data-variant-rows]');
  const nameInput = form.querySelector('[name="name"]');
  const slugInput = form.querySelector('[name="slug"]');

  nameInput?.addEventListener('blur', () => {
    if (!slugInput.value.trim()) slugInput.value = slugify(nameInput.value);
  });

  form.querySelector('[data-add-variant]')?.addEventListener('click', () => {
    const index = rows.querySelectorAll('[data-variant-row]').length;
    rows.insertAdjacentHTML('beforeend', variantRow({}, index, slugInput.value || slugify(nameInput.value)));
  });

  rows.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove-variant]');
    if (!remove) return;
    const row = remove.closest('[data-variant-row]');
    if (rows.querySelectorAll('[data-variant-row]').length <= 1) {
      toast('Mantenha pelo menos uma variação.');
      return;
    }
    row.remove();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const slug = slugify(String(data.get('slug') || '') || name);
    const category = String(data.get('category') || '').trim();
    const price = parseMoney(data.get('price'));
    const compare = parseMoney(data.get('compare'));
    const details = String(data.get('details') || '').trim();
    const description = String(data.get('description') || '').trim();
    const subtitle = String(data.get('subtitle') || '').trim();
    const imageUrl = String(data.get('image_url') || '').trim();

    if (!name) return toast('Informe o nome do produto.');
    if (!slug) return toast('Informe o slug (URL) do produto.');
    if (!category) return toast('Informe a categoria.');
    if (price <= 0) return toast('Informe um preço válido.');

    const variantRows = [...rows.querySelectorAll('[data-variant-row]')];
    const variants = variantRows.map((row, index) => {
      const variantName = row.querySelector('[data-variant-name]').value.trim();
      const sku = row.querySelector('[data-variant-sku]').value.trim() || makeSku(slug, variantName, index);
      const variantPrice = parseMoney(row.querySelector('[data-variant-price]').value) || price;
      const stock = Math.max(0, parseInt(row.querySelector('[data-variant-stock]').value || '0', 10) || 0);
      return {
        id: row.dataset.variantId ? Number(row.dataset.variantId) : null,
        name: variantName,
        sku,
        price_cents: variantPrice,
        stock,
        position: index,
      };
    });

    if (variants.some((variant) => !variant.name)) {
      return toast('Toda variação precisa de um nome.');
    }

    const productRow = {
      slug,
      name,
      category,
      subtitle,
      description,
      details,
      price_cents: price,
      compare_at_cents: compare > 0 ? compare : null,
      image_url: imageUrl,
      featured: data.get('featured') === 'on',
      active: data.get('active') === 'on',
    };

    const submit = form.querySelector('button[type="submit"]');
    setBusy(submit, true, 'Salvando…');
    try {
      let saved = product;
      if (product?.id) {
        saved = await updateProduct(product.id, productRow);
      } else {
        saved = await createProduct(productRow);
      }
      if (!saved?.id) throw new Error('Não foi possível salvar o produto.');

      const keepIds = [];
      for (const variant of variants) {
        if (variant.id) {
          await updateVariant(variant.id, {
            name: variant.name,
            sku: variant.sku,
            price_cents: variant.price_cents,
            stock: variant.stock,
            position: variant.position,
          });
          keepIds.push(variant.id);
        } else {
          const created = await createVariant({
            product_id: saved.id,
            name: variant.name,
            sku: variant.sku,
            price_cents: variant.price_cents,
            stock: variant.stock,
            position: variant.position,
          });
          if (created?.id) keepIds.push(created.id);
        }
      }
      if (product?.id) await deleteVariantsExcept(saved.id, keepIds);

      toast(product?.id ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso. 🎉');
      navigate('#/admin/produtos');
    } catch (error) {
      toast(error.message || 'Não foi possível salvar o produto.');
      setBusy(submit, false);
    }
  });
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export function adminOrdersPage({ orders, user }) {
  const rows = orders
    .map(
      (order) => `<tr>
        <td><strong>${escapeHtml(order.number)}</strong><br><span class="muted small">${formatDate(
        order.created_at
      )}</span></td>
        <td>${escapeHtml(order.full_name)}<br><small class="muted">${escapeHtml(order.email)}</small></td>
        <td class="cell-items">${orderItemsText(order)}</td>
        <td><strong>${money(order.total_cents)}</strong><br><span class="muted small">${installments(
        order.total_cents
      )}</span></td>
        <td>${statusPill(order.status)}</td>
        <td>
          <select data-order-status data-number="${escapeHtml(order.number)}" aria-label="Alterar status do pedido">
            ${['pending', 'paid', 'shipped', 'cancelled', 'failed']
              .map(
                (status) =>
                  `<option value="${status}"${order.status === status ? ' selected' : ''}>${
                    {
                      pending: 'Aguardando pagamento',
                      paid: 'Pago',
                      shipped: 'Enviado',
                      cancelled: 'Cancelado',
                      failed: 'Falhou',
                    }[status]
                  }</option>`
              )
              .join('')}
          </select>
        </td>
      </tr>`
    )
    .join('');

  const content = `<div class="admin-panel">
    <div class="panel-head"><h2>Pedidos</h2><span class="muted small">${orders.length} pedido(s)</span></div>
    ${
      orders.length
        ? `<table class="admin-table">
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th><th>Alterar</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`
        : `<div class="empty-state" style="padding:40px"><span class="empty-icon">🧾</span><h3>Nenhum pedido ainda</h3><p class="muted">Os pedidos criados no checkout aparecem aqui em tempo real.</p><a class="btn btn-primary" href="#/loja">Abrir a loja</a></div>`
    }
  </div>`;

  return adminShell({ title: 'Pedidos', active: 'orders', content, user });
}

export function bindAdminOrdersPage({ reload }) {
  document.querySelectorAll('[data-order-status]').forEach((select) => {
    select.addEventListener('change', async () => {
      const numberValue = select.dataset.number;
      const status = select.value;
      const previous = select.dataset.previous || '';
      select.disabled = true;
      try {
        await setOrderStatus(numberValue, status);
        toast('Status atualizado.');
        reload();
      } catch (error) {
        toast(error.message || 'Não foi possível atualizar o status.');
        select.value = previous;
        select.disabled = false;
      }
    });
    select.dataset.previous = select.value;
  });
}

export { signOut };
