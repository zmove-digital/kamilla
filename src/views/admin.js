import { escapeHtml, formatMoney } from '../lib/util.js';
import { config } from '../config.js';

function adminShell({ title, body, active = '' }) {
  const nav = [
    ['/admin', 'Dashboard'],
    ['/admin/products', 'Products'],
    ['/admin/orders', 'Orders'],
  ]
    .map(
      ([href, label]) =>
        `<a href="${href}" class="admin-nav-link${active === label ? ' is-active' : ''}">${label}</a>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · ${escapeHtml(config.storeName)} Admin</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" href="/favicon.svg">
</head>
<body class="admin-body">
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">${escapeHtml(config.storeName)}<span>Admin</span></div>
      <nav class="admin-nav">${nav}</nav>
      <form method="post" action="/admin/logout" class="admin-logout"><button class="link-arrow" type="submit">Sign out</button></form>
      <a href="/" class="admin-store-link" target="_blank">View store ↗</a>
    </aside>
    <main class="admin-main">
      <div class="admin-topbar">
        <h1>${escapeHtml(title)}</h1>
        <div class="admin-mode ${config.stripeEnabled ? 'is-live' : ''}">${config.stripeEnabled ? 'Stripe: LIVE' : 'Stripe: TEST mode'}</div>
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
      <h1>Sign in</h1>
      ${error ? `<div class="alert">${escapeHtml(error)}</div>` : ''}
      <label>Password<input type="password" name="password" required autofocus placeholder="••••••••"></label>
      <button class="btn btn-primary btn-block" type="submit">Enter dashboard</button>
      <p class="muted small center">Password is set via ADMIN_PASSWORD in your .env file.</p>
    </form>
  </div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Admin sign in</title><link rel="stylesheet" href="/styles.css"></head><body class="admin-body">${body}</body></html>`;
}

function statCard(label, value, sub = '') {
  return `<div class="stat-card"><span class="stat-label">${escapeHtml(label)}</span><span class="stat-value">${value}</span>${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div>`;
}

export function adminDashboard({ stats, recentOrders }) {
  const lowStock = stats.lowStock.length
    ? `<table class="admin-table"><thead><tr><th>Product</th><th>Variant</th><th>SKU</th><th>Stock</th></tr></thead><tbody>${stats.lowStock
        .map(
          (v) =>
            `<tr><td>${escapeHtml(v.product_name)}</td><td>${escapeHtml(v.name)}</td><td class="muted">${escapeHtml(v.sku)}</td><td><span class="pill ${v.stock <= 0 ? 'pill-red' : 'pill-amber'}">${v.stock}</span></td></tr>`
        )
        .join('')}</tbody></table>`
    : '<p class="muted">All products are well stocked.</p>';

  const ordersRows = recentOrders.length
    ? `<table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>${recentOrders
        .map(
          (o) =>
            `<tr><td><a href="/admin/orders">${escapeHtml(o.number)}</a></td><td>${escapeHtml(o.email || '—')}</td><td>${formatMoney(o.total_cents)}</td><td><span class="pill ${statusPill(o.status)}">${escapeHtml(o.status)}</span></td><td class="muted">${escapeHtml(o.created_at)}</td></tr>`
        )
        .join('')}</tbody></table>`
    : '<p class="muted">No orders yet.</p>';

  const body = `
    <div class="stats-grid">
      ${statCard('Revenue (paid)', formatMoney(stats.revenue_cents))}
      ${statCard('Paid orders', stats.paidOrders)}
      ${statCard('Pending orders', stats.pendingOrders)}
      ${statCard('Products', stats.productCount)}
    </div>
    <section class="admin-panel">
      <div class="panel-head"><h2>Recent orders</h2><a class="link-arrow" href="/admin/orders">All orders →</a></div>
      ${ordersRows}
    </section>
    <section class="admin-panel">
      <div class="panel-head"><h2>Low stock alerts</h2><span class="muted">≤ 3 units</span></div>
      ${lowStock}
    </section>`;
  return adminShell({ title: 'Dashboard', body, active: 'Dashboard' });
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
        <td class="cell-product"><img src="/img/${encodeURIComponent(p.slug)}.svg" alt=""><div><strong>${escapeHtml(p.name)}</strong><br><span class="muted small">${escapeHtml(p.category)} · ${p.variants.length} variant(s)</span></div></td>
        <td>${formatMoney(p.price_cents)}</td>
        <td><span class="pill ${stock <= 0 ? 'pill-red' : stock <= 5 ? 'pill-amber' : 'pill-green'}">${stock} in stock</span></td>
        <td><span class="pill ${p.active ? 'pill-green' : 'pill-grey'}">${p.active ? 'Active' : 'Hidden'}</span></td>
        <td class="cell-actions">
          <a class="btn btn-mini" href="/admin/products/${p.id}/edit">Edit</a>
          <form method="post" action="/admin/products/${p.id}/delete" onsubmit="return confirm('Delete ${escapeHtml(p.name)}?');" class="inline"><button class="btn btn-mini btn-danger" type="submit">Delete</button></form>
        </td>
      </tr>`;
    })
    .join('');

  const body = `
    <div class="admin-actions-row"><a class="btn btn-primary" href="/admin/products/new">+ New product</a></div>
    <section class="admin-panel">
      <table class="admin-table">
        <thead><tr><th>Product</th><th>Price</th><th>Inventory</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="muted">No products yet.</td></tr>'}</tbody>
      </table>
    </section>`;
  return adminShell({ title: 'Products', body, active: 'Products' });
}

export function adminProductFormPage({ product, error }) {
  const isNew = !product;
  const variants = product?.variants?.length
    ? product.variants
    : [{ id: '', name: '', sku: '', price_cents: product?.price_cents || 0, stock: 0 }];

  const variantRows = variants
    .map(
      (v, i) => `<tr class="variant-row">
        <td><input type="hidden" name="variant_id" value="${v.id ?? ''}"><input name="variant_name" value="${escapeHtml(v.name)}" placeholder="20&quot; · Natural Black" required></td>
        <td><input name="variant_sku" value="${escapeHtml(v.sku)}" placeholder="SKU-001" required></td>
        <td><input name="variant_price" value="${(v.price_cents / 100).toFixed(2)}" inputmode="decimal"></td>
        <td><input name="variant_stock" value="${v.stock}" inputmode="numeric"></td>
        <td><button type="button" class="btn btn-mini btn-danger" data-remove-variant>×</button></td>
      </tr>`
    )
    .join('');

  const body = `
    <form method="post" action="${isNew ? '/admin/products' : `/admin/products/${product.id}`}" class="admin-form">
      ${error ? `<div class="alert">${escapeHtml(error)}</div>` : ''}
      <section class="admin-panel">
        <h2>Product details</h2>
        <div class="form-grid">
          <label>Name<input name="name" value="${escapeHtml(product?.name || '')}" required></label>
          <label>Category<input name="category" value="${escapeHtml(product?.category || '')}" list="cats" required>
            <datalist id="cats"><option>Clip-In</option><option>Tape-In</option><option>Bundles</option><option>Ponytail</option><option>Care</option><option>Accessories</option></datalist>
          </label>
          <label>Subtitle<input name="subtitle" value="${escapeHtml(product?.subtitle || '')}" placeholder="7-piece set · 100% Remy human hair"></label>
          <label>Price (USD)<input name="price" value="${product ? (product.price_cents / 100).toFixed(2) : ''}" inputmode="decimal" required></label>
          <label>Compare-at price (optional)<input name="compare_at" value="${product?.compare_at_cents ? (product.compare_at_cents / 100).toFixed(2) : ''}" inputmode="decimal"></label>
          <label class="checkbox"><input type="checkbox" name="featured" ${product?.featured ? 'checked' : ''}> Featured on home</label>
          <label class="checkbox"><input type="checkbox" name="active" ${!product || product.active ? 'checked' : ''}> Visible in store</label>
        </div>
        <label>Description<textarea name="description" rows="4">${escapeHtml(product?.description || '')}</textarea></label>
        <label>Details (separate with ·)<input name="details" value="${escapeHtml(product?.details || '')}" placeholder="7 wefts · 120g · Remy human hair"></label>
      </section>

      <section class="admin-panel">
        <div class="panel-head"><h2>Variants &amp; inventory</h2><button type="button" class="btn btn-mini" id="add-variant">+ Add variant</button></div>
        <table class="admin-table variants-table">
          <thead><tr><th>Variant</th><th>SKU</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody id="variants-body">${variantRows}</tbody>
        </table>
      </section>

      <div class="admin-form-actions">
        <button class="btn btn-primary" type="submit">${isNew ? 'Create product' : 'Save changes'}</button>
        <a class="btn btn-ghost" href="/admin/products">Cancel</a>
      </div>
    </form>
    <script>
      document.getElementById('add-variant')?.addEventListener('click', () => {
        const tbody = document.getElementById('variants-body');
        const row = document.createElement('tr');
        row.className = 'variant-row';
        row.innerHTML = '<td><input type="hidden" name="variant_id" value=""><input name="variant_name" placeholder="22\\" · Colour" required></td><td><input name="variant_sku" placeholder="SKU-002" required></td><td><input name="variant_price" inputmode="decimal" value="0.00"></td><td><input name="variant_stock" inputmode="numeric" value="0"></td><td><button type="button" class="btn btn-mini btn-danger" data-remove-variant>×</button></td>';
        tbody.appendChild(row);
      });
      document.addEventListener('click', (e) => {
        if (e.target.matches('[data-remove-variant]')) {
          const rows = document.querySelectorAll('.variant-row');
          if (rows.length > 1) e.target.closest('tr').remove();
        }
      });
    </script>`;
  return adminShell({ title: isNew ? 'New product' : 'Edit product', body, active: 'Products' });
}

export function adminOrdersPage({ orders }) {
  const rows = orders
    .map((o) => {
      const items = o.items.map((it) => `${escapeHtml(it.product_name)} × ${it.quantity} <span class="muted small">(${escapeHtml(it.variant_name)})</span>`).join('<br>');
      const statusOptions = ['pending', 'paid', 'fulfilled', 'cancelled', 'failed']
        .map((s) => `<option value="${s}"${o.status === s ? ' selected' : ''}>${s}</option>`)
        .join('');
      return `<tr>
        <td><strong>${escapeHtml(o.number)}</strong><br><span class="muted small">${escapeHtml(o.created_at)}</span></td>
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
        <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="muted">No orders yet.</td></tr>'}</tbody>
      </table>
    </section>`;
  return adminShell({ title: 'Orders', body, active: 'Orders' });
}
