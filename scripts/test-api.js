// Testa a camada de dados (public/store/api.js) contra o mock do Supabase.
//
//   node scripts/test-api.js
//
// Sem dependências: sobe scripts/mock-supabase.js em uma porta isolada.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 54399;
const BASE = `http://localhost:${PORT}`;
const ADMIN_EMAIL = 'zmove.digital@gmail.com';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
  key: (index) => [...store.keys()][index] ?? null,
  get length() {
    return store.size;
  },
};
globalThis.KAMILLA_CONFIG = { url: BASE, key: 'mock-anon-key' };

const server = spawn('node', [join(ROOT, 'scripts', 'mock-supabase.js')], {
  cwd: ROOT,
  env: { ...process.env, MOCK_PORT: String(PORT) },
  stdio: 'ignore',
  windowsHide: true,
});

let passed = 0;
function ok(label) {
  passed += 1;
  console.log(`  ✔ ${label}`);
}

let api;

try {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) break;
    } catch {
      /* subindo */
    }
    await sleep(120);
  }

  api = await import('../public/store/api.js');

  console.log('\n[catálogo]');
  assert.equal(api.isDemo, false);
  ok('modo Supabase (não-demo)');

  const products = await api.listProducts();
  assert.equal(products.length, 10);
  ok('lista 10 produtos ativos');

  const iphone = await api.getProduct('iphone-16');
  assert.equal(iphone.slug, 'iphone-16');
  assert.ok(iphone.variants.length >= 4);
  ok('detalhe do iPhone com variações');

  const variant = iphone.variants.find((item) => item.stock > 0);
  assert.ok(variant);
  const linked = await api.getVariantsByIds([variant.id]);
  assert.equal(linked.length, 1);
  assert.equal(linked[0].product.slug, 'iphone-16');
  ok('variações da sacola vêm com o produto');

  console.log('\n[auth]');
  await assert.rejects(() => api.signIn(ADMIN_EMAIL, 'senha-errada'), /inválidos/i);
  ok('senha errada é rejeitada');

  await assert.rejects(() => api.signIn('cliente@teste.com', 'cliente123'), /permissão/i);
  assert.equal(api.currentUser(), null);
  ok('conta autenticada sem admin é recusada');

  await api.signIn(ADMIN_EMAIL, 'admin123');
  assert.equal(api.isAdminUser(), true);
  ok('login do admin e sessão persistida');

  console.log('\n[checkout]');
  const stockBefore = variant.stock;
  const order = await api.createOrder({
    email: 'cliente@teste.com',
    fullName: 'Cliente de Teste',
    address: 'Rua das Flores, 123, São Paulo, SP',
    items: [{ variant_id: variant.id, quantity: 2 }],
  });
  assert.equal(order.status, 'pending');
  assert.equal(order.shipping_cents, 0);
  assert.ok(order.total_cents > 0);
  ok('pedido criado e frete grátis calculado');

  const afterOrder = await api.getProduct('iphone-16');
  assert.equal(afterOrder.variants.find((item) => item.id === variant.id).stock, stockBefore);
  ok('estoque não é debitado antes do pagamento');

  await assert.rejects(
    () =>
      api.createOrder({
        email: 'cliente@teste.com',
        fullName: 'Cliente de Teste',
        address: 'Rua das Flores, 123, São Paulo, SP',
        items: [{ variant_id: variant.id, quantity: 999 }],
      }),
    /estoque|indisponível/i
  );
  ok('checkout bloqueia quantidade acima do estoque');

  const paid = await api.payOrder(order.number, 'success');
  assert.equal(paid.status, 'paid');
  const afterPay = await api.getProduct('iphone-16');
  assert.equal(afterPay.variants.find((item) => item.id === variant.id).stock, stockBefore - 2);
  ok('pagamento aprovado baixa o estoque');

  const remoteStatus = await api.getOrderStatus(order.number);
  assert.equal(remoteStatus.status, 'paid');
  ok('consulta pública de status do pedido');

  console.log('\n[admin]');
  const orders = await api.getAdminOrders();
  assert.equal(orders.length, 1);
  assert.equal(orders[0].order_items.length, 1);
  ok('admin lista pedidos com itens');

  await api.setOrderStatus(order.number, 'shipped');
  const shipped = await api.getOrderStatus(order.number);
  assert.equal(shipped.status, 'shipped');
  ok('admin altera status do pedido');

  const created = await api.createProduct({
    slug: 'celular-de-teste',
    name: 'Celular de Teste',
    category: 'Teste',
    subtitle: 'Produto criado pelo teste',
    description: 'Descrição',
    details: 'Tela · Bateria',
    price_cents: 100000,
    compare_at_cents: 120000,
    image_url: 'public/images/placeholder-phone.svg',
    featured: false,
    active: true,
  });
  assert.ok(created.id);
  ok('admin cria produto');

  const newVariant = await api.createVariant({
    product_id: created.id,
    name: '128GB · 8GB · Preto',
    sku: 'TESTE-128-8-PRE',
    price_cents: 100000,
    stock: 7,
    position: 0,
  });
  assert.ok(newVariant.id);
  ok('admin cria variação');

  const fetched = await api.getProductById(created.id);
  assert.equal(fetched.variants.length, 1);
  ok('admin busca produto por id com variações');

  const updated = await api.updateProduct(created.id, { name: 'Celular de Teste Editado' });
  assert.equal(updated.name, 'Celular de Teste Editado');
  ok('admin edita produto');

  await api.updateVariant(newVariant.id, { stock: 3 });
  const updatedVariant = await api.getProductById(created.id);
  assert.equal(updatedVariant.variants[0].stock, 3);
  ok('admin edita estoque da variação');

  await api.deleteVariantsExcept(created.id, [newVariant.id]);
  ok('admin remove variações fora da lista');

  await api.deleteProduct(created.id);
  assert.equal(await api.getProductById(created.id), null);
  ok('admin exclui produto');

  console.log('\n[segurança]');
  await api.signOut();
  assert.equal(api.currentUser(), null);
  ok('logout limpa a sessão');

  await assert.rejects(
    () =>
      api.createProduct({
        slug: 'invasor',
        name: 'Invasor',
        category: 'Teste',
        price_cents: 1,
        active: true,
      }),
    /negado|permiss/i
  );
  ok('sem sessão, escrita é bloqueada');

  console.log('\n' + '─'.repeat(60));
  console.log(`✔ ${passed} verificações da camada de dados passaram.`);
} catch (error) {
  console.error('\n✘ Falha no teste da API:', error.message);
  if (error.stack) console.error(error.stack.split('\n').slice(0, 4).join('\n'));
  process.exitCode = 1;
} finally {
  try {
    if (existsSync(join(ROOT, 'scripts', 'mock-supabase.js'))) {
      execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    }
  } catch {
    /* já encerrado */
  }
}
