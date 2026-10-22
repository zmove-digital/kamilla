# KAMILLA · Smartphones & Tecnologia

Uma loja de celulares completa, feita **do zero**, com interface 100% em português do Brasil:
catálogo, variações (armazenamento × RAM × cor), estoque por variação, carrinho, checkout com
Stripe, painel administrativo e **zero dependências npm**.

Roda em um único processo Node.js + um arquivo SQLite.

---

## O que está incluído

- **Vitrine** com home editorial, hero animado, categorias por marca, mais vendidos, ofertas com
  contagem regressiva, depoimentos e FAQ.
- **Catálogo** com 10 celulares best-sellers (iPhone, Galaxy, Motorola, Xiaomi e Realme).
- **Variações estruturadas**: `Armazenamento` (128GB/256GB), `Memória RAM` (8GB/12GB) e `Cor`.
  Cada combinação tem seu próprio SKU, preço e estoque. Combinações indisponíveis são
  desabilitadas automaticamente e o preço é atualizado na hora.
- **Fallback inteligente**: produtos cadastrados manualmente com nomes de variação livres usam um
  seletor simples, sem quebrar a página.
- **Carrinho** com barra de progresso de frete grátis, atualização de quantidade e remoção.
- **Checkout** com validação de e-mail/estoque, criação de pedido, decremento de estoque atômico e
  idempotência (webhooks repetidos não descontam estoque duas vezes).
- **Stripe Checkout** (hospedado, PCI-safe) + **modo de teste local** para demonstrações.
- **Painel admin** em `/admin`: receita, pedidos, alertas de estoque baixo, CRUD de produtos e
  variações, gestão de status de pedidos.
- **Design system** com paleta violeta → índigo → ciano, tipografia Sora/Manrope, animações de
  entrada, badges, "balões" flutuantes e logo própria.
- **Imagens geradas em SVG** (mockup de celular) quando não há foto real — a loja nunca fica sem
  imagem.
- **Página de apresentação** em `index.html` para GitHub Pages.

---

## Requisitos

- **Node.js 22.5 ou superior** (usa `node:sqlite`).
- Nenhum `npm install` — não há dependências.

---

## Começando (local)

```bash
# 1. (opcional) criar sua configuração
cp .env.example .env        # Windows: copy .env.example .env

# 2. criar o banco com o catálogo demo
npm run seed

# 3. subir a loja
npm start
```

Abra **http://localhost:3000**.

- Loja: `http://localhost:3000`
- Painel: `http://localhost:3000/admin` (senha padrão: `admin123`)

---

## Comandos do dia a dia

| Comando | O que faz |
| --- | --- |
| `npm start` | Sobe a loja na porta 3000. |
| `npm run dev` | Sobe com `--watch` (reinicia ao salvar). |
| `npm run seed` | Cria o catálogo demo **apenas se o banco estiver vazio**. |
| `npm run reset` | **Apaga** produtos/pedidos e recria o catálogo demo. |
| `npm test` | Roda a suíte de testes de integração (57 verificações). |

> ⚠️ `npm run reset` apaga pedidos e produtos. Use apenas em demonstração/desenvolvimento.

---

## Testando a loja (passo a passo)

1. **Home** — confira o hero, as categorias, os mais vendidos e a oferta com contagem regressiva.
2. **Loja** — em `/shop`, filtre por marca, busque por "galaxy" e ordene por menor preço.
3. **Produto** — abra o iPhone 16. Teste:
   - trocar **128GB → 256GB** (o preço muda);
   - trocar **8GB → 12GB** nos modelos que oferecem as duas opções;
   - selecionar cores (a cor **Rosa** do iPhone 16 está esgotada e aparece desabilitada);
   - adicionar à sacola e ver o toast de confirmação.
4. **Sacola** — altere quantidades, remova itens e acompanhe a barra de frete grátis.
5. **Checkout** — preencha os dados e finalize. Em modo de teste você cai na tela
   **Pagamento simulado**: clique em **Pagar** para concluir ou **Simular recusa** para testar a
   falha. O pedido aparece em `/admin/orders` e o estoque é decrementado após o pagamento.
6. **Admin** — faça login, veja a receita, edite um produto, crie uma variação com o formato
   `128GB · 8GB · Preto` e altere o status de um pedido.

---

## Variações: como funcionam

O banco guarda cada variação em `variants.name`. A loja reconhece o formato de **três partes
separadas por `·`**:

```
128GB · 8GB · Preto
256GB · 12GB · Ultramarino
```

Com esse formato, a página do produto renderiza os seletores de **Armazenamento**, **Memória RAM**
e **Cor**. Qualquer outro formato cai no seletor simples tradicional — ideal para produtos
cadastrados manualmente.

Cada variação tem seu próprio `sku`, `price_cents` e `stock`, então você pode vender o mesmo
modelo com preços e disponibilidades diferentes.

---

## Configuração (`.env`)

Copie `.env.example` para `.env` e ajuste:

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP. |
| `BASE_URL` | `http://localhost:3000` | URL pública usada nos redirects do Stripe. |
| `STORE_NAME` | `KAMILLA` | Nome da loja. |
| `STORE_TAGLINE` | `Smartphones & Tecnologia` | Assinatura usada no SEO. |
| `CURRENCY` | `brl` | Moeda (formatação pt-BR). |
| `ADMIN_PASSWORD` | `admin123` | Senha do painel — **troque antes de publicar**. |
| `STRIPE_SECRET_KEY` | *(vazio)* | Vazio = modo de teste local. |
| `STRIPE_WEBHOOK_SECRET` | *(vazio)* | Segredo do webhook. |
| `MOCK_PAYMENTS` | `true` | Força o modo simulado. |
| `SHIPPING_FLAT_CENTS` | `2990` | Frete fixo em centavos (R$ 29,90). |
| `FREE_SHIPPING_THRESHOLD_CENTS` | `29900` | Frete grátis a partir de R$ 299. |
| `DATABASE_PATH` | `./data/store.db` | Arquivo SQLite. |
| `SEED_ON_BOOT` | `true` | Popula o banco vazio na primeira subida. |

---

## Colocando o Stripe para valer

1. Crie uma conta em <https://stripe.com> e pegue as chaves em **Developers → API keys**.
2. No `.env`, preencha `STRIPE_SECRET_KEY=sk_test_...` e defina `MOCK_PAYMENTS=false`.
3. Configure o webhook em **Developers → Webhooks** apontando para:
   `https://SEU_DOMINIO/webhook/stripe`
   com o evento `checkout.session.completed`.
4. Copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.
5. Ajuste `BASE_URL` para o domínio público (https).
6. Teste com o cartão `4242 4242 4242 4242` (qualquer validade/CVC) e depois troque para as chaves
   `sk_live_...`.

Sem chaves, tudo funciona no **modo simulado**: o pedido é criado, o estoque é validado e o
pagamento é concluído localmente, sem cobrança real.

---

## Deploy em produção

### Opção A — VPS (Ubuntu) com systemd + Caddy

```bash
# no servidor
git clone https://github.com/zmove-digital/kamilla.git /var/www/kamilla
cd /var/www/kamilla
cp .env.example .env
# edite .env (ADMIN_PASSWORD, BASE_URL, Stripe…)
npm run seed
```

Crie `/etc/systemd/system/kamilla.service`:

```ini
[Unit]
Description=KAMILLA store
After=network.target

[Service]
WorkingDirectory=/var/www/kamilla
ExecStart=/usr/bin/node src/server.js
Restart=always
EnvironmentFile=/var/www/kamilla/.env

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable --now kamilla
```

E um `Caddyfile` simples para HTTPS automático:

```
kamilla.seudominio.com {
    reverse_proxy 127.0.0.1:3000
}
```

### Opção B — Docker

```bash
docker build -t kamilla .
docker run -d -p 3000:3000 -v kamilla-data:/app/data --env-file .env kamilla
```

> Monte um volume em `/app/data` para o SQLite sobreviver a reinícios.

### Checklist antes de publicar

- [ ] Trocar `ADMIN_PASSWORD`.
- [ ] Configurar `BASE_URL` com https.
- [ ] Ativar o Stripe real e o webhook.
- [ ] Fazer backup de `data/store.db`.
- [ ] Revisar preços e estoque no admin.

---

## Gerenciando a loja

- **Produtos**: `/admin/products` → criar, editar, ocultar e excluir.
- **Variações**: nome no formato `128GB · 8GB · Preto`, SKU único, preço e estoque.
- **Pedidos**: `/admin/orders` → acompanhar itens, cliente, pagamento e mudar o status
  (Pendente, Pago, Enviado, Cancelado, Falhou).
- **Estoque baixo**: o painel lista variações com **≤ 3 unidades**.

### Usando fotos reais

As imagens dos produtos são geradas em SVG (mockup de celular) para a loja funcionar sem nenhum
arquivo externo. Para usar fotos reais, basta soltar o arquivo em `public/images/` com o nome do
slug do produto:

```
public/images/iphone-16.jpg
public/images/iphone-16-2.jpg
public/images/iphone-16-3.jpg
public/images/cat-Apple.jpg
```

Extensões aceitas: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`. A loja detecta automaticamente e
passa a servir a foto no lugar do SVG (a galeria mostra as miniaturas `-2` e `-3` quando existem).

---

## Estrutura do projeto

```
kamilla/
├── index.html              # página de apresentação (GitHub Pages)
├── package.json            # apenas scripts; nenhuma dependência
├── .env.example            # modelo de configuração
├── data/                   # SQLite (ignorado no git)
├── public/
│   ├── styles.css          # design system completo
│   ├── app.js              # carrinho, seletores de variação, animações
│   ├── logo.svg
│   └── images/             # fotos reais opcionais
├── scripts/
│   ├── seed.js             # catálogo demo
│   ├── reset.js            # reset do banco
│   └── test.js             # testes de integração
└── src/
    ├── server.js           # rotas HTTP
    ├── config.js           # .env + configurações
    ├── db.js               # schema + estoque + pedidos
    ├── seed.js             # catálogo (10 celulares)
    ├── lib/                # util, imagens SVG, Stripe
    └── views/              # layout, páginas e admin (SSR)
```

---

## Segurança

- Sessões de admin via cookie `HttpOnly` + `SameSite=Lax`.
- Senha comparada com `crypto.timingSafeEqual`.
- Webhook do Stripe validado por assinatura HMAC (quando o segredo está configurado).
- Estoque descontado em transação atômica com verificação de disponibilidade.
- Sem dependências npm = superfície de ataque mínima.

Para produção, rode atrás de HTTPS (Caddy/Nginx) e troque a senha padrão.

---

## Licença

MIT.
