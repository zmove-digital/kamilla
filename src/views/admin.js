import { escapeHtml, formatMoney, formatDate } from '../lib/util.js';
import { config } from '../config.js';

const STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  fulfilled: 'Enviado',
  cancelled: 'Cancelado',
  failed: 'Falhou',
};

function adminShell({ title, body, active = '' }) {
  const nav = [
    ['/admin', 'Painel'],
    ['/admin/products', 'Produtos'],
    ['/admin/orders', 'Pedidos'],
  ]
    .map(
      ([href, label]) =>
        `<a href="${href}" class="admin-nav-link${active === label ? ' is-active' : ''}">${label}</a>`
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · ${escapeHtml(config.storeName)} Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" href="/favicon.svg">
</head>
<body class="admin-body">
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">${escapeHtml(config.storeName)}<span>Admin</span></div>
      <nav class="admin-nav">${nav}</nav>
      <form method="post" action="/admin/logout" class="admin-logout"><button class="link-arrow" type="submit">Sair</button></form>
      <a href="/" class="admin-store-link" target="_blank">Ver loja ↗</a>
    </aside>
    <main class="admin-main">
      <div class="admin-topbar">
        <h1>${escapeHtml(title)}</h1>
        <div class="admin-mode ${config.stripeEnabled ? 'is-live' : ''}">${config.stripeEnabled ? 'Stripe: ATIVO' : 'Stripe: modo teste'}</div>
      </div>
      ${body}
    </main>
  </div>
</body>
</html>`;
}

export function adminLoginPage({ error }) {
  const body = `<div class="login-wrap">
    <form method="post" action="/admin/login" class="login-card">
      <div class="admin-brand center">${escapeHtml(config.storeName)}<span>Admin</span></div>
      <h1>Entrar</h1>
      <p class="muted small">Acesse o painel para gerenciar produtos, estoque e pedidos.</p>
      ${error ? `<div class="alert">${escapeHtml(error)}</div>` : ''}
      <label>Senha<input type="password" name="password" required autofocus placeholder="••••••••"></label>
      <button class="btn btn-primary btn-block" type="submit">Entrar no painel</button>
      <p class="muted small center">A senha é definida em ADMIN_PASSWORD no arquivo .env.</p>
    </form>
  </div>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Entrar · Admin</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"><link rel="icon" href="/favicon.svg"></head><body class="admin-body">${body}</body></html>`;
}

function statCard(label, value, sub = '') {
  return `<div class="stat-card"><span class="stat-label">${escapeHtml(label)}</span><span class="stat-value">${value}</span>${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div>`;
}

export function adminDashboard({ stats, recentOrders }) {
  const lowStock = stats.lowStock.length
    ? `<table class="admin-table"><thead><tr><th>Produto</th><th>Variação</th><th>SKU</th><th>Estoque</th></tr></thead><tbody>${stats.lowStock
        .map(
          (v) =>
            `<tr><td>${escapeHtml(v.product_name)}</td><td>${escapeHtml(v.name)}</td><td class="muted">${escapeHtml(v.sku)}</td><td><span class="pill ${v.stock <= 0 ? 'pill-red' : 'pill-amber'}">${v.stock}</span></td></tr>`
        )
        .join('')}</tbody></table>`
    : '<p class="muted">Todos os produtos estão com bom estoque.</p>';

  const ordersRows = recentOrders.length
    ? `<table class="admin-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr></thead><tbody>${recentOrders
        .map(
          (o) =>
            `<tr><td><a href="/admin/orders">${escapeHtml(o.number)}</a></td><td>${escapeHtml(o.email || '—')}</td><td>${formatMoney(o.total_cents)}</td><td><span class="pill ${statusPill(o.status)}">${escapeHtml(STATUS_LABELS[o.status] || o.status)}</span></td><td class="muted">${escapeHtml(formatDate(o.created_at))}</td></tr>`
        )
        .join('')}</tbody></table>`
    : '<p class="muted">Nenhum pedido ainda.</p>';

  const body = `
    <div class="stats-grid">
      ${statCard('Receita (pago)', formatMoney(stats.revenue_cents))}
      ${statCard('Pedidos pagos', stats.paidOrders)}
      ${statCard('Pedidos pendentes', stats.pendingOrders)}
      ${statCard('Produtos', stats.productCount)}
    </div>
    <section class="admin-panel">
      <div class="panel-head"><h2>Pedidos recentes</h2><a class="link-arrow" href="/admin/orders">Todos os pedidos →</a></div>
      ${ordersRows}
    </section>
    <section class="admin-panel">
      <div class="panel-head"><h2>Alertas de estoque baixo</h2><span class="muted">≤ 3 unidades</span></div>
      ${lowStock}
    </section>`;
  return adminShell({ title: 'Painel', body, active: 'Painel' });
}

export function statusPill(status) {
  return {
    paid: 'pill-green',
    fulfilled: 'pill-green',
    pending: 'pill-amber',
    failed: 'pill-red',
    cancelled: 'pill-grey',
  }[status] || 'pill-grey';
}

export function adminProductsPage({ products }) {
  const rows = products
    .map((p) => {
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      return `<tr>
        <td class="cell-product"><img src="/img/${encodeURIComponent(p.slug)}.svg" alt=""><div><strong>${escapeHtml(p.name)}</strong><br><span class="muted small">${escapeHtml(p.category)} · ${p.variants.length} variação(ões)</span></div></td>
        <td>${formatMoney(p.price_cents)}</td>
        <td><span class="pill ${stock <= 0 ? 'pill-red' : stock <= 5 ? 'pill-amber' : 'pill-green'}">${stock} em estoque</span></td>
        <td><span class="pill ${p.active ? 'pill-green' : 'pill-grey'}">${p.active ? 'Visível' : 'Oculto'}</span></td>
        <td class="cell-actions">
          <a class="btn btn-mini" href="/admin/products/${p.id}/edit">Editar</a>
          <form method="post" action="/admin/products/${p.id}/delete" onsubmit="return confirm('Excluir ${escapeHtml(p.name)}?');" class="inline"><button class="btn btn-mini btn-danger" type="submit">Excluir</button></form>
        </td>
      </tr>`;
    })
    .join('');

  const body = `
    <div class="admin-actions-row"><a class="btn btn-primary" href="/admin/products/new">+ Novo produto</a></div>
    <section class="admin-panel">
      <table class="admin-table">
        <thead><tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="muted">Nenhum produto cadastrado.</td></tr>'}</tbody>
      </table>
    </section>`;
  return adminShell({ title: 'Produtos', body, active: 'Produtos' });
}

function moneyInput(cents) {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function adminProductFormPage({ product, error }) {
  const isNew = !product;
  const variants = product?.variants?.length
    ? product.variants
    : [{ id: '', name: '', sku: '', price_cents: product?.price_cents || 0, stock: 0 }];

  const variantRows = variants
    .map(
      (v, i) => `<tr class="variant-row">
        <td><input type="hidden" name="variant_id" value="${v.id ?? ''}"><input name="variant_name" value="${escapeHtml(v.name)}" placeholder="128GB · 8GB · Preto" required></td>
        <td><input name="variant_sku" value="${escapeHtml(v.sku)}" placeholder="SKU-001" required></td>
        <td><input name="variant_price" value="${moneyInput(v.price_cents)}" inputmode="decimal"></td>
        <td><input name="variant_stock" value="${v.stock}" inputmode="numeric"></td>
        <td><button type="button" class="btn btn-mini btn-danger" data-remove-variant>×</button></td>
      </tr>`
    )
    .join('');

  const body = `
    <form method="post" action="${isNew ? '/admin/products' : `/admin/products/${product.id}`}" class="admin-form">
      ${error ? `<div class="alert">${escapeHtml(error)}</div>` : ''}
      <section class="admin-panel">
        <h2>Detalhes do produto</h2>
        <div class="form-grid">
          <label>Nome<input name="name" value="${escapeHtml(product?.name || '')}" required></label>
          <label>Categoria<input name="category" value="${escapeHtml(product?.category || '')}" list="cats" required>
            <datalist id="cats"><option>Apple</option><option>Samsung</option><option>Motorola</option><option>Xiaomi</option><option>Realme</option></datalist>
          </label>
          <label>Subtítulo<input name="subtitle" value="${escapeHtml(product?.subtitle || '')}" placeholder="Tela 6,1&quot; · 128GB · Câmera 48MP"></label>
          <label>Preço (R$)<input name="price" value="${product ? moneyInput(product.price_cents) : ''}" inputmode="decimal" required></label>
          <label>Preço comparativo (opcional)<input name="compare_at" value="${product?.compare_at_cents ? moneyInput(product.compare_at_cents) : ''}" inputmode="decimal"></label>
          <label class="checkbox"><input type="checkbox" name="featured" ${product?.featured ? 'checked' : ''}> Destaque na home</label>
          <label class="checkbox"><input type="checkbox" name="active" ${!product || product.active ? 'checked' : ''}> Visível na loja</label>
        </div>
        <label>Descrição<textarea name="description" rows="4">${escapeHtml(product?.description || '')}</textarea></label>
        <label>Detalhes (separe com ·)<input name="details" value="${escapeHtml(product?.details || '')}" placeholder="Tela 6,1&quot; · Chip A18 · Câmera 48MP"></label>
      </section>

      <section class="admin-panel">
        <div class="panel-head"><h2>Variações e estoque</h2><button type="button" class="btn btn-mini" id="add-variant">+ Adicionar variação</button></div>
        <p class="muted small">Dica: use o formato <strong>128GB · 8GB · Preto</strong> para ativar os seletores de armazenamento, RAM e cor na página do produto.</p>
        <table class="admin-table variants-table">
          <thead><tr><th>Variação</th><th>SKU</th><th>Preço</th><th>Estoque</th><th></th></tr></thead>
          <tbody id="variants-body">${variantRows}</tbody>
        </table>
      </section>

      <div class="admin-form-actions">
        <button class="btn btn-primary" type="submit">${isNew ? 'Criar produto' : 'Salvar alterações'}</button>
        <a class="btn btn-ghost" href="/admin/products">Cancelar</a>
      </div>
    </form>
    <script>
      document.getElementById('add-variant')?.addEventListener('click', () => {
        const tbody = document.getElementById('variants-body');
        const row = document.createElement('tr');
        row.className = 'variant-row';
        row.innerHTML = '<td><input type="hidden" name="variant_id" value=""><input name="variant_name" placeholder="128GB \\u00b7 8GB \\u00b7 Preto" required></td><td><input name="variant_sku" placeholder="SKU-002" required></td><td><input name="variant_price" inputmode="decimal" value="0,00"></td><td><input name="variant_stock" inputmode="numeric" value="0"></td><td><button type="button" class="btn btn-mini btn-danger" data-remove-variant>×</button></td>';
        tbody.appendChild(row);
      });
      document.addEventListener('click', (e) => {
        if (e.target.matches('[data-remove-variant]')) {
          const rows = document.querySelectorAll('.variant-row');
          if (rows.length > 1) e.target.closest('tr').remove();
        }
      });
    </script>`;
  return adminShell({ title: isNew ? 'Novo produto' : 'Editar produto', body, active: 'Produtos' });
}

export function adminOrdersPage({ orders }) {
  const rows = orders
    .map((o) => {
      const items = o.items
        .map(
          (it) =>
            `${escapeHtml(it.product_name)} × ${it.quantity} <span class="muted small">(${escapeHtml(it.variant_name)})</span>`
        )
        .join('<br>');
      const statusOptions = ['pending', 'paid', 'fulfilled', 'cancelled', 'failed']
        .map((s) => `<option value="${s}"${o.status === s ? ' selected' : ''}>${STATUS_LABELS[s]}</option>`)
        .join('');
      return `<tr>
        <td><strong>${escapeHtml(o.number)}</strong><br><span class="muted small">${escapeHtml(formatDate(o.created_at))}</span></td>
        <td>${escapeHtml(o.full_name || '—')}<br><span class="muted small">${escapeHtml(o.email || '')}</span><br><span class="muted small">${escapeHtml(o.address || '')}</span></td>
        <td class="cell-items">${items}</td>
        <td>${formatMoney(o.total_cents)}<br><span class="muted small">${escapeHtml(o.payment_provider)} · ${escapeHtml(o.payment_ref || '—')}</span></td>
        <td>
          <form method="post" action="/admin/orders/${o.id}/status" class="inline">
            <select name="status" onchange="this.form.submit()">${statusOptions}</select>
          </form>
        </td>
      </tr>`;
    })
    .join('');

  const body = `
    <section class="admin-panel">
      <table class="admin-table">
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="muted">Nenhum pedido ainda.</td></tr>'}</tbody>
      </table>
    </section>`;
  return adminShell({ title: 'Pedidos', body, active: 'Pedidos' });
}
