# KAMILLA · Smartphones & Tecnologia

Loja de celulares **100% em português do Brasil**, com catálogo de 10 best-sellers, variações
(armazenamento × memória × cor), estoque por variação, sacola, checkout e painel administrativo.

A loja publicada roda como **SPA estática no GitHub Pages** e conversa direto com o
**Supabase** (PostgreSQL + Auth + RLS). Não há servidor Node em produção e **não há nenhuma
dependência npm**.

- **Loja:** <https://zmove-digital.github.io/kamilla/>
- **Admin:** <https://zmove-digital.github.io/kamilla/#/admin>
- **Apresentação:** [`apresentacao.html`](apresentacao.html)

> Se as chaves do Supabase estiverem vazias, a loja abre em **modo demonstração**: catálogo
> completo com dados locais, checkout e login do admin desabilitados com um aviso. É ideal para
> aprovar o visual antes de conectar o banco real.

---

## O que está incluído

- **Home editorial** com hero animado, contagem regressiva, categorias, mais vendidos,
  depoimentos, FAQ e “balões” de urgência.
- **Catálogo** com iPhone, Galaxy, Motorola, Xiaomi e Realme; busca, filtro por marca e ordenação.
- **Variações estruturadas** no formato `128GB · 8GB · Preto`: cada combinação tem SKU, preço e
  estoque próprios. Combinações esgotadas ficam desabilitadas e o preço muda na hora.
- **Fallback inteligente**: variações fora desse formato usam um seletor simples, sem quebrar.
- **Sacola** em `localStorage`, com quantidade, remoção e barra de progresso de frete grátis.
- **Checkout** com validação de e-mail/estoque, frete grátis acima de R$ 299 e criação de pedido
  via RPC transacional no Supabase.
- **Pagamento simulado** (aprovar/recusar) para testar o fluxo completo. A integração real com
  Mercado Pago/Stripe entra depois via **Supabase Edge Functions** (veja abaixo).
- **Painel admin** em `#/admin`: faturamento, pedidos, estoque baixo, CRUD de produtos e
  variações, e mudança de status dos pedidos.
- **Design system** com paleta violeta → índigo → ciano, tipografia Sora/Manrope, animações,
  badges, logo própria e imagens SVG geradas.
- **App Node/SQLite legado** incluso para rodar a versão SSR localmente (referência e testes).

---

## Como a arquitetura funciona

```
GitHub Pages (index.html + public/store/*.js)
        │  HTTPS · Auth + REST + RPC (chave anon pública)
        ▼
Supabase
  ├── PostgreSQL (products, variants, orders, order_items, admins)
  ├── Row Level Security (leitura pública; escrita só para o admin)
  ├── Auth (e-mail/senha do admin)
  └── RPCs: create_order, pay_order, order_status, set_order_status
```

- O **carrinho** fica no navegador; o banco só recebe o pedido no checkout.
- O **anon key** do Supabase é público por design. A segurança real vem das **políticas RLS**.
- **Nunca** coloque a chave `service_role` no frontend.
- A navegação usa **hash routing** (`#/produto/iphone-16`), então qualquer link profundo funciona
  no GitHub Pages sem configurar rewrite.
- Os caminhos de imagem são relativos (`public/images/...`) para funcionar na subpasta `/kamilla/`.

---

## Rodar localmente

Requisito: **Node.js 22.5+**. Não precisa de `npm install`.

```bash
npm run serve:static
```

Abra <http://localhost:5180>. A loja usa o Supabase configurado em
`public/store/config.js` (projeto `kamilateste`).

### Forçar o modo demonstração

No console do navegador:

```js
localStorage.setItem('kamilla_config_override', JSON.stringify({ url: '', key: '' }));
```

Recarregue a página. A loja passa a usar `public/store/demo-data.js` e mostra o banner de
demonstração. Para voltar ao Supabase real:

```js
localStorage.removeItem('kamilla_config_override');
```

### Testar contra o mock do Supabase

Suba o mock em outro terminal:

```bash
npm run mock:supabase
```

O mock responde em `http://localhost:54321` e aceita:

```
admin: zmove.digital@gmail.com
senha: admin123
```

Aponte o navegador para ele:

```js
localStorage.setItem(
  'kamilla_config_override',
  JSON.stringify({ url: 'http://localhost:54321', key: 'mock-anon-key' })
);
```

Recarregue a página. Depois, remova o override para voltar ao Supabase real.

> Esses overrides são opcionais e servem apenas para desenvolvimento/testes.

---

## Conectar o Supabase (passo a passo)

O guia detalhado está em **[`supabase/README.md`](supabase/README.md)**. Resumo:

1. Crie um projeto em <https://supabase.com> na região **South America (São Paulo)**.
2. No **SQL Editor**, rode `supabase/schema.sql` e depois `supabase/seed.sql`.
3. Em **Authentication → Providers → Email**, desative **“Allow new users to sign up”**.
4. Em **Authentication → Users**, crie o admin `zmove.digital@gmail.com` com uma senha forte e
   marque **Auto Confirm User**.
5. Copie **Project URL** e **anon public key** em **Settings → API**.
6. Preencha `public/store/config.js`:

   ```js
   export const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

7. Commit e push. O GitHub Pages atualiza sozinho em alguns minutos.
8. Entre em `#/admin` com o e-mail/senha do admin e cadastre/edite os produtos.

> O `seed.sql` já cria os 10 celulares com 66 variações. Rodar de novo **sobrescreve** nome,
> preço e estoque desses produtos — use com cuidado depois de começar a vender.

### Adicionar outro administrador

1. Crie o usuário em **Authentication → Users** (Auto Confirm).
2. No SQL Editor:

   ```sql
   insert into public.admins (email) values ('outro@email.com')
   on conflict (email) do nothing;
   ```

A política RLS libera escrita para qualquer e-mail presente em `public.admins`.

---

## Gerenciar a loja

- **Produtos:** `#/admin/produtos` → criar, editar, ocultar e excluir.
- **Variações:** nome no formato `128GB · 8GB · Preto`, SKU único, preço e estoque.
- **Pedidos:** `#/admin/pedidos` → itens, cliente, pagamento e status
  (Pendente, Pago, Enviado, Cancelado, Falhou).
- **Estoque baixo:** o dashboard lista variações com **≤ 5 unidades**.

### Imagens

As imagens atuais são SVGs gerados em `public/images/` (mockup de celular). Para usar fotos reais,
basta subir o arquivo e informar a URL no campo **Imagem** do produto, por exemplo
`public/images/iphone-16.jpg`. Também é possível usar uma URL externa (HTTPS).

---

## Variações: como funcionam

O banco guarda a variação em `variants.name`. Quando o nome tem **três partes separadas por `·`**,
a página do produto monta os seletores:

```
128GB · 8GB · Preto
256GB · 12GB · Ultramarino
```

Cada variação tem seu próprio `sku`, `price_cents` e `stock`. Qualquer outro formato cai no seletor
simples tradicional — útil para produtos cadastrados manualmente.

---

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run serve:static` | Serve a SPA em `http://localhost:5180`. |
| `npm run mock:supabase` | Sobe o Supabase falso para testar checkout/admin. |
| `npm run test:api` | 23 verificações da camada de dados contra o mock. |
| `npm run test:smoke` | Smoke test do frontend em modo demonstração (headless). |
| `npm run test:smoke:live` | Smoke test completo com checkout, pagamento e admin (mock). |
| `npm run test:smoke:real` | Smoke test contra o Supabase real configurado (não cria pedido). |
| `npm test` | Suíte do app Node/SQLite legado (57 verificações). |
| `npm start` | Sobe o app Node/SQLite legado em `http://localhost:3000`. |
| `npm run seed` | Cria o catálogo demo no SQLite (se estiver vazio). |
| `npm run reset` | **Apaga** produtos/pedidos do SQLite e recria o catálogo demo. |
| `npm run supabase:seed` | Regenera `supabase/seed.sql` a partir do SQLite. |
| `npm run demo:data` | Regenera `public/store/demo-data.js` a partir do SQLite. |
| `npm run images:static` | Regenera as imagens SVG em `public/images/`. |

Os testes de frontend usam Brave/Chrome/Edge headless + CDP. Se o navegador não estiver no caminho
padrão, defina `BRAVE_PATH`.

---

## Estrutura do projeto

```
kamilla/
├── index.html                  # shell da SPA publicada no GitHub Pages
├── apresentacao.html           # página de apresentação (landing)
├── package.json                # apenas scripts; nenhuma dependência
├── .nojekyll                   # evita processamento Jekyll no Pages
├── public/
│   ├── styles.css              # design system compartilhado
│   ├── logo.svg / favicon.svg
│   ├── images/                 # SVGs dos produtos e categorias
│   └── store/
│       ├── config.js           # URL + anon key do Supabase
│       ├── api.js              # Auth/REST/RPC do Supabase + modo demo
│       ├── pages.js            # home, catálogo, produto, sacola, checkout…
│       ├── admin.js            # login, dashboard, CRUD, pedidos
│       ├── cart.js             # sacola em localStorage
│       ├── ui.js               # componentes, preços, animações, toast
│       ├── app.js              # router por hash
│       ├── store.css           # estilos específicos da SPA
│       └── demo-data.js        # catálogo local (modo demonstração)
├── supabase/
│   ├── schema.sql              # tabelas, RLS, RPCs e grants
│   ├── seed.sql                # catálogo inicial (10 produtos / 66 variações)
│   └── README.md               # guia de configuração do projeto
├── scripts/
│   ├── serve-static.js         # servidor local da SPA
│   ├── mock-supabase.js        # Supabase falso para testes
│   ├── test-api.js             # testes da camada de dados
│   ├── smoke-static.js         # testes de UI headless
│   ├── generate-static-images.js
│   ├── generate-supabase-seed.js
│   └── generate-demo-data.js
└── src/                        # app Node/SQLite legado (SSR)
```

---

## Pagamento real (próxima etapa)

O checkout atual termina em um **pagamento simulado** (`pay_order`). Para cobrar de verdade em uma
SPA estática:

1. Crie uma **Edge Function** no Supabase para criar a preferência/sessão no Mercado Pago ou Stripe.
   A chave secreta fica nas variáveis de ambiente da função, nunca no navegador.
2. Configure o **webhook** do provedor para outra Edge Function.
3. No webhook, valide a assinatura e chame uma RPC `confirm_payment` que baixa o estoque de forma
   atômica e idempotente.
4. **Remova/limite** a RPC pública `pay_order` antes de vender de verdade — hoje ela existe para
   demonstração e permite que qualquer pessoa marque um pedido como pago se souber o número.

Enquanto isso, o fluxo atual serve para validar catálogo, pedidos, estoque e painel.

---

## App Node/SQLite legado

A versão original em SSR continua no repositório para referência e uso local:

```bash
npm run seed
npm start
```

- Loja: <http://localhost:3000>
- Admin: <http://localhost:3000/admin> (senha padrão `admin123`)

Ele usa `node:sqlite`, Stripe em modo mock por padrão e não é o que está publicado no GitHub Pages.
A configuração fica em `.env` (veja `.env.example`).

---

## Segurança

- **RLS** em todas as tabelas: leitura pública apenas de produtos ativos; escrita apenas para
  e-mails em `public.admins`.
- **Auth** do Supabase para o admin; a senha nunca passa pelo código da loja.
- **Anon key** é pública; **service_role** nunca é exposta no frontend.
- Checkout valida itens e estoque no banco antes de criar o pedido.
- Pagamento simulado **não deve** ser usado em produção (veja a seção acima).
- Para produção: HTTPS (o GitHub Pages já fornece), senha forte e backup do banco.

---

## Licença

MIT.
