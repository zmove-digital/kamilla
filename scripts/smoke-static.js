// Smoke test do frontend estático usando Brave/Chrome headless + CDP (sem deps).
//
//   node scripts/smoke-static.js
//   node scripts/smoke-static.js --live   (sobe o mock do Supabase e testa checkout/admin)
//
// Requer o servidor estático em http://localhost:5180 (npm run serve:static).
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9333;
const BASE = process.env.BASE_URL || 'http://localhost:5180/';
const LIVE = process.argv.includes('--live') || process.env.MOCK_SUPABASE === '1';
const MOCK_PORT = 54398;
const MOCK_URL = `http://localhost:${MOCK_PORT}`;
const CANDIDATES = [
  process.env.BRAVE_PATH,
  'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const browserPath = CANDIDATES.find((path) => existsSync(path));
if (!browserPath) {
  console.error('Navegador não encontrado. Defina BRAVE_PATH.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let mock = null;
if (LIVE) {
  mock = spawn(process.execPath, [join(ROOT, 'scripts', 'mock-supabase.js')], {
    cwd: ROOT,
    env: { ...process.env, MOCK_PORT: String(MOCK_PORT) },
    stdio: 'ignore',
    windowsHide: true,
  });
  let ready = false;
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${MOCK_URL}/`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      /* subindo */
    }
    await sleep(120);
  }
  if (!ready) {
    console.error('Mock do Supabase não subiu.');
    process.exit(1);
  }
}

const profile = mkdtempSync(join(tmpdir(), 'kamilla-smoke-'));
const browser = spawn(
  browserPath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true }
);

async function target() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((res) => res.json());
      const page = list.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch {
      /* ainda subindo */
    }
    await sleep(150);
  }
  throw new Error('Não foi possível conectar ao navegador headless.');
}

const failures = [];
const consoleErrors = [];
const networkErrors = [];

function check(label, condition, extra = '') {
  if (condition) {
    console.log(`  ✔ ${label}`);
  } else {
    failures.push(`${label}${extra ? ` — ${extra}` : ''}`);
    console.log(`  ✘ ${label}${extra ? ` — ${extra}` : ''}`);
  }
}

try {
  const page = await target();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let nextId = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(message.params.exceptionDetails?.exception?.description || 'exception');
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const entry = message.params.entry;
      consoleErrors.push(entry.text || entry.url || 'log error');
    }
    if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
      networkErrors.push(message.params.errorText);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || 'Erro de avaliação');
    }
    return result.result?.value;
  };

  const waitFor = async (expression, label, timeout = 12000) => {
    const start = Date.now();
    let lastError = '';
    while (Date.now() - start < timeout) {
      try {
        if (await evaluate(expression)) return;
      } catch (error) {
        lastError = error.message;
      }
      await sleep(120);
    }
    throw new Error(`Timeout aguardando: ${label}${lastError ? ` (${lastError})` : ''}`);
  };

  const go = async (hash, readyExpression) => {
    await evaluate(`location.hash = ${JSON.stringify(hash)}`);
    if (readyExpression) {
      try {
        await waitFor(readyExpression, hash);
      } catch (error) {
        const state = await evaluate(
          `JSON.stringify({hash: location.hash, title: document.title, text: document.getElementById('app').innerText.slice(0, 400)})`
        );
        throw new Error(`${error.message} :: ${state}`);
      }
    }
    await sleep(250);
  };

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Network.enable');
  await send('Page.enable');

  if (LIVE) {
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.KAMILLA_CONFIG = { url: ${JSON.stringify(MOCK_URL)}, key: 'mock-anon-key' };`,
    });
  }

  await send('Page.navigate', { url: BASE });
  await waitFor('window.KAMILLA_READY === true', 'home');
  await sleep(400);

  console.log(`\n[home · ${LIVE ? 'Supabase (mock)' : 'modo demo'}]`);
  check('título da página', (await evaluate('document.title')).includes('KAMILLA'));
  check('hero renderizado', await evaluate("!!document.querySelector('.hero h1')"));
  check('produtos na home', (await evaluate("document.querySelectorAll('.product-card').length")) >= 6);
  check('contador de sacola presente', await evaluate("!!document.getElementById('cart-count')"));
  check('sem overflow horizontal (1440)', await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'));
  check(
    LIVE ? 'banner demo escondido' : 'banner demo visível',
    (await evaluate("document.getElementById('demo-banner').hidden")) === LIVE
  );

  console.log('\n[produto]');
  await go('#/produto/iphone-16', "!!document.querySelector('#add-to-cart')");
  check('nome do produto', (await evaluate("document.querySelector('.pdp h1').textContent")).includes('iPhone 16'));
  check('seletores de variação', await evaluate("!!document.querySelector('.picker[data-attr=\"storage\"]')"));
  const beforePrice = await evaluate("document.querySelector('#pdp-price').textContent");
  await evaluate(`(() => {
    const buttons = [...document.querySelectorAll('.picker[data-attr="storage"] .opt')];
    const target = buttons.find((b) => b.dataset.value === '256GB') || buttons[1];
    target?.click();
  })()`);
  await sleep(150);
  const afterPrice = await evaluate("document.querySelector('#pdp-price').textContent");
  check('preço muda ao trocar armazenamento', beforePrice !== afterPrice, `${beforePrice} → ${afterPrice}`);
  check('parcelamento visível', (await evaluate("document.querySelector('#pdp-installments').textContent")).includes('12x'));
  await evaluate("document.querySelector('#add-to-cart').click()");
  await sleep(350);
  check('adicionar à sacola atualiza contador', (await evaluate("document.getElementById('cart-count').textContent")) === '1');
  check('sacola persistida no localStorage', (await evaluate("JSON.parse(localStorage.getItem('kamilla_cart_v1')||'[]').length")) === 1);

  console.log('\n[sacola]');
  await go('#/carrinho', "!!document.querySelector('.cart-summary')");
  check('item na sacola', (await evaluate("document.querySelectorAll('.cart-line').length")) === 1);
  check('frete grátis acima de R$ 299', await evaluate("!!document.querySelector('.ship-progress.is-done')"));
  check('total exibido', (await evaluate("document.querySelector('.summary-row.total').textContent")).includes('R$'));

  if (LIVE) {
    console.log('\n[checkout + pagamento]');
    await go('#/checkout', "!!document.querySelector('#checkout-form')");
    check('formulário de checkout', await evaluate("!!document.querySelector('[name=email]')"));
    check('checkout habilitado no Supabase', await evaluate("!document.querySelector('#checkout-form button').disabled"));
    await evaluate(`(() => {
      const form = document.getElementById('checkout-form');
      form.querySelector('[name=full_name]').value = 'Cliente Smoke';
      form.querySelector('[name=email]').value = 'smoke@teste.com';
      form.querySelector('[name=address]').value = 'Rua do Teste, 123, São Paulo, SP';
      form.requestSubmit();
    })()`);
    await waitFor("location.hash.startsWith('#/pagamento/') && !!document.querySelector('[data-pay]')", 'página de pagamento');
    check('pedido criado e página de pagamento', await evaluate("document.body.innerText.includes('Pedido')"));
    const orderNumber = await evaluate("location.hash.split('/').pop()");
    check('número do pedido no formato KM-', /^KM-/.test(orderNumber), orderNumber);

    await evaluate("document.querySelector('[data-pay=\"success\"]').click()");
    await waitFor("location.hash.startsWith('#/pedido/') && document.body.innerText.includes('Pagamento confirmado')", 'pedido pago');
    check('pagamento aprovado e tela de sucesso', await evaluate("document.body.innerText.includes('Pagamento confirmado')"));
    check('status pago no pedido', await evaluate("document.body.innerText.includes('Pago')"));
    check(
      'sacola esvaziada após pagamento',
      (await evaluate("JSON.parse(localStorage.getItem('kamilla_cart_v1') || '[]').length")) === 0
    );

    console.log('\n[admin]');
    await go('#/admin', "!!document.querySelector('#login-form')");
    check('tela de login do admin', await evaluate("!!document.querySelector('#login-form')"));
    await evaluate(`(() => {
      const form = document.getElementById('login-form');
      form.querySelector('[name=email]').value = 'zmove.digital@gmail.com';
      form.querySelector('[name=password]').value = 'admin123';
      form.requestSubmit();
    })()`);
    await waitFor("!!document.querySelector('.admin-shell')", 'dashboard do admin');
    check('dashboard com estatísticas', (await evaluate("document.querySelectorAll('.stat-card').length")) === 4);
    check('pedido no faturamento/lista', await evaluate(`document.body.innerText.includes(${JSON.stringify(orderNumber)})`));

    await go('#/admin/produtos', "!!document.querySelector('.admin-table')");
    check('catálogo no admin', (await evaluate("document.querySelectorAll('.admin-table tbody tr').length")) === 10);

    await go('#/admin/pedidos', "!!document.querySelector('[data-order-status]')");
    check('pedido listado no admin', await evaluate(`document.body.innerText.includes(${JSON.stringify(orderNumber)})`));
    await evaluate(`(() => {
      const select = document.querySelector('[data-order-status]');
      select.value = 'shipped';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await waitFor("document.body.innerText.includes('Enviado') && !document.querySelector('select[disabled]')", 'status enviado');
    check('admin altera status para enviado', await evaluate("document.body.innerText.includes('Enviado')"));

    await go('#/admin/produto/novo', "!!document.querySelector('#product-form')");
    check('formulário de novo produto', await evaluate("!!document.querySelector('[data-variant-row]')"));
    await evaluate(`(() => {
      const form = document.getElementById('product-form');
      form.querySelector('[name=name]').value = 'Celular Smoke';
      form.querySelector('[name=slug]').value = 'celular-smoke';
      form.querySelector('[name=category]').value = 'Teste';
      form.querySelector('[name=price]').value = '1.999,00';
      form.querySelector('[name=image_url]').value = 'public/images/placeholder-phone.svg';
      form.querySelector('[name=details]').value = 'Tela 6,5" · 5G · 128GB';
      const row = form.querySelector('[data-variant-row]');
      row.querySelector('[data-variant-name]').value = '128GB · 8GB · Azul';
      row.querySelector('[data-variant-sku]').value = 'SMOKE-128-8-AZU';
      row.querySelector('[data-variant-stock]').value = '5';
      form.requestSubmit();
    })()`);
    await waitFor("location.hash === '#/admin/produtos' && document.body.innerText.includes('Celular Smoke')", 'produto criado');
    check('admin cria produto pelo formulário', await evaluate("document.body.innerText.includes('Celular Smoke')"));
    check('catálogo agora tem 11 produtos', (await evaluate("document.querySelectorAll('.admin-table tbody tr').length")) === 11);

    await evaluate("document.querySelector('[data-admin-logout]').click()");
    await waitFor("!!document.querySelector('#login-form')", 'logout do admin');
    check('logout volta para o login', await evaluate("!!document.querySelector('#login-form')"));
  } else {
    console.log('\n[checkout]');
    await go('#/checkout', "!!document.querySelector('#checkout-form')");
    check('formulário de checkout', await evaluate("!!document.querySelector('[name=email]')"));
    check('aviso de prévia local', await evaluate("!!document.querySelector('.alert')"));
    check('checkout desabilitado no modo demo', await evaluate("document.querySelector('#checkout-form button').disabled"));

    console.log('\n[admin]');
    await go('#/admin', "!!document.querySelector('.login-card')");
    check('tela de login do admin', await evaluate("!!document.querySelector('#login-form')"));
    check('login desabilitado no modo demo', await evaluate("document.querySelector('#login-form button').disabled"));
  }

  console.log('\n[mobile 390px]');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await go('#/', "!!document.querySelector('.hero h1')");
  check('sem overflow horizontal (390)', await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'));
  check('menu mobile disponível', await evaluate("getComputedStyle(document.querySelector('.nav-toggle')).display !== 'none'"));
  await go('#/produto/galaxy-s24-ultra', "!!document.querySelector('#add-to-cart')");
  check('PDP sem overflow (390)', await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'));

  console.log('\n[console]');
  check('sem erros de JavaScript', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  check('sem falhas de rede relevantes', networkErrors.length === 0, networkErrors.slice(0, 3).join(' | '));

  console.log('\n' + '─'.repeat(60));
  if (failures.length) {
    console.log(`✘ ${failures.length} falha(s):`);
    failures.forEach((failure) => console.log(`  - ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`✔ Smoke test do frontend estático passou${LIVE ? ' (com Supabase mock)' : ''}.`);
  }
} catch (error) {
  console.error('Erro no smoke test:', error.message);
  if (consoleErrors.length) {
    console.error('Erros de console:');
    consoleErrors.slice(0, 8).forEach((item) => console.error(`  - ${item}`));
  }
  if (networkErrors.length) {
    console.error('Falhas de rede:');
    networkErrors.slice(0, 8).forEach((item) => console.error(`  - ${item}`));
  }
  process.exitCode = 1;
} finally {
  try {
    execFileSync('taskkill', ['/pid', String(browser.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {
    /* já encerrado */
  }
  if (mock) {
    try {
      execFileSync('taskkill', ['/pid', String(mock.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      /* já encerrado */
    }
  }
  await sleep(400);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* perfil em uso */
  }
}
