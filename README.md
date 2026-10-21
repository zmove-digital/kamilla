# KAMILLA — a complete online store

A full e-commerce storefront **with zero npm dependencies**. It runs on Node.js
built-ins only (`node:sqlite`, `node:http`, `fetch`, `crypto`), so there is
nothing to install, no build step, and no framework churn.

Brand in the demo is **KAMILLA** (luxury hair extensions) but everything —
name, copy, products, prices — is editable from the admin panel or the seed file.

---

## What's included

| Area | Details |
|------|---------|
| **Storefront** | Home, Shop (category filter, search, sort), Product detail, Cart (bag), Checkout, Order confirmation |
| **Inventory** | Per-variant stock, low-stock alerts, atomic decrement (no overselling), sold-out badges |
| **Cart** | Cookie session, add / update / remove, live stock validation |
| **Payments** | Stripe Checkout (hosted, PCI-safe) **+ a local mock mode** for testing without keys |
| **Webhooks** | Stripe signature verification, idempotent fulfilment |
| **Admin panel** | Secure login, dashboard (revenue, orders, low stock), full product & variant CRUD, order management |
| **Database** | SQLite via `node:sqlite` — a single file, no server to run |
| **Tests** | 52 automated integration + unit tests covering the whole flow |

---

## Requirements

- **Node.js 22.5 or newer** (24 LTS recommended). The app uses the built-in
  SQLite module. Check with `node --version`.
- That's it. No `npm install` required.

---

## Quick start (local)

```bash
# 1. (optional) create your config
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux

# 2. create the database with the demo catalog
npm run seed

# 3. start the store
npm start
```

Open (these only work **while the server is running on your own machine**):

- Store: <http://localhost:3000>
- Admin: <http://localhost:3000/admin>  (default password: `admin123`)

> **Important:** clicking these links on GitHub will **not** open the store.
> `localhost` means *your* computer, and this store is a Node.js server that has
> to be running locally (`npm start`). A GitHub repository only hosts the
> **code** — it does not run the site, and GitHub Pages cannot host it either
> (Pages serves static files only; this app needs a Node process + database).
> To get a public address you have to deploy it — see
> [Deploying to production](#deploying-to-production).

In this default setup Stripe runs in **local test mode** — checkout is simulated
on a fake card screen, and no real money is charged. Perfect for showing a
client the complete flow.

Run the automated tests any time with:

```bash
npm test
```

---

## Everyday commands

| Command | What it does |
|---------|--------------|
| `npm start` | Start the store |
| `npm run dev` | Start with auto-reload on file changes |
| `npm run seed` | Reset the catalog to the demo products |
| `npm run reset` | Wipe everything (orders, products) and re-seed |
| `npm test` | Run all automated tests |

---

## Testing the store locally (walkthrough)

Open <http://localhost:3000> and follow the buyer journey end to end. No real
money moves — Stripe runs in local test mode.

1. **Home** — hero, category tiles and featured products.
2. **Shop** (`/shop`) — filter by category, search, change the sort order.
3. **Product page** — pick a *Length & colour* variant, set the quantity and
   click **Add to bag**. Sold-out variants are disabled.
4. **Bag** (`/cart`) — change quantities, remove lines, see shipping and total.
   Asking for more than the available stock is rejected with a clear message.
5. **Checkout** (`/checkout`) — fill in the contact and shipping fields; the
   order summary on the right updates live. Leave the email empty to see the
   validation error.
6. **Test payment** — you land on a simulated Stripe screen showing the test
   card `4242 4242 4242 4242`. Click **Pay** to succeed, or **Simulate
   decline** to test the failed-payment path (you are sent back to checkout).
7. **Confirmation** (`/order/success`) — shows the order number (`KM-…`) and
   the items. The bag is emptied.
8. **Admin** (`/admin`, password `admin123`) — the dashboard shows the revenue
   and the new order. Under **Orders** it is `paid`, and the stock of the
   purchased variant dropped by the quantity bought.

Useful URLs:

| Page | URL |
|---|---|
| Store | `http://localhost:3000` |
| Shop | `http://localhost:3000/shop` |
| Product | `http://localhost:3000/product/seamless-clip-in-extensions` |
| Bag | `http://localhost:3000/cart` |
| Checkout | `http://localhost:3000/checkout` |
| Admin | `http://localhost:3000/admin` |

> The bag lives in a cookie, so a fresh browser window starts with an empty bag.
> Orders and stock live in `data/store.db`. Run `npm run reset` to wipe
> everything and start over from the demo catalog.

---

## Configuration (`.env`)

Copy `.env.example` to `.env` and adjust:

| Variable | Purpose |
|----------|---------|
| `PORT` | Port to listen on (default `3000`) |
| `BASE_URL` | Public URL — **must be your real https domain in production** (used for Stripe redirects) |
| `STORE_NAME` / `STORE_TAGLINE` | Brand text in the header/footer |
| `CURRENCY` | ISO currency, e.g. `usd`, `eur`, `gbp` |
| `ADMIN_PASSWORD` | **Change this before going live** |
| `STRIPE_SECRET_KEY` | `sk_test_…` or `sk_live_…` from Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from the Stripe webhook you create |
| `MOCK_PAYMENTS` | `true` = simulate payments locally, `false` = use real Stripe |
| `SHIPPING_FLAT_CENTS` | Flat shipping in cents (e.g. `1500` = $15.00) |
| `FREE_SHIPPING_THRESHOLD_CENTS` | Subtotal above which shipping is free (e.g. `15000` = $150) |
| `DATABASE_PATH` | Where the SQLite file lives (default `./data/store.db`) |

---

## Going live with Stripe (international sales)

Stripe is the recommended gateway for worldwide selling: cards, Apple Pay,
Google Pay, ~135 currencies, and tax handling.

1. **Create a Stripe account** at <https://dashboard.stripe.com/register> and
   complete the business verification (this is a legal/identity step only you
   can do).
2. **Stay in Test mode first.** Copy your *test* secret key
   (`sk_test_…`) from <https://dashboard.stripe.com/test/apikeys>.
3. Put it in `.env` and turn mock mode off:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxxxxx
   MOCK_PAYMENTS=false
   BASE_URL=http://localhost:3000
   ```
   Restart, then run a real test purchase using card `4242 4242 4242 4242`,
   any future expiry, any CVC. Verify the order appears as **paid** in the admin.
4. **Create the webhook** (this is what reliably confirms payment):
   - Dashboard → *Developers → Webhooks → Add endpoint*
   - URL: `https://YOUR-DOMAIN/webhook/stripe`
   - Events: `checkout.session.completed` and
     `checkout.payment_intent.succeeded`
   - Copy the signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
5. **Go live:** swap `sk_test_…` for `sk_live_…`, recreate the webhook on your
   live domain, set `BASE_URL` to your https domain, and restart.

> Without a webhook secret the endpoint accepts unsigned events (fine for local
> testing). With a secret set, every request must carry a valid signature.

---

## Deploying to production

The app is a single Node process with a file database. **It needs a persistent
disk**, so it is *not* suited to pure serverless platforms (Vercel, Netlify
Functions) unless you move to an external database. Good homes: a small VPS,
Render, Railway, or Fly.io with a volume.

### Option A — Any VPS (Ubuntu) with systemd + Caddy

```bash
# On the server (as root or a sudo user)
apt update && apt install -y nodejs npm git caddy
# make sure `node --version` is >= 22.5 (use nvm if not)
git clone <your-repo> /var/www/kamilla && cd /var/www/kamilla
cp .env.example .env
nano .env        # set BASE_URL, ADMIN_PASSWORD, Stripe keys
npm run seed
```

Create `/etc/systemd/system/kamilla.service`:

```ini
[Unit]
Description=KAMILLA store
After=network.target

[Service]
WorkingDirectory=/var/www/kamilla
ExecStart=/usr/bin/node src/server.js
Restart=always
Environment=NODE_ENV=production
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now kamilla
```

Create `/etc/caddy/Caddyfile` (Caddy gets you automatic HTTPS):

```
kamilla.com {
    reverse_proxy localhost:3000
}
```

```bash
systemctl reload caddy
```

### Option B — Docker

```bash
docker build -t kamilla .
docker run -d --name kamilla -p 3000:3000 \
  -v kamilla-data:/app/data \
  --env-file .env \
  kamilla
```

Put a reverse proxy (Caddy/Nginx/Cloudflare Tunnel) in front for HTTPS.
`/app/data` is the volume holding `store.db` — never deploy without it.

### Deploy checklist

- [ ] `ADMIN_PASSWORD` changed from the default
- [ ] `BASE_URL` = your real `https://` domain
- [ ] `MOCK_PAYMENTS=false` and live Stripe key in place
- [ ] Webhook created and `STRIPE_WEBHOOK_SECRET` set
- [ ] SQLite file on a **persistent volume**, backed up regularly
  (`cp data/store.db backups/store-$(date +%F).db`)
- [ ] HTTPS in front (Caddy/Nginx/Cloudflare)

---

## Managing the store

Log in at `/admin`:

- **Dashboard** — revenue, paid/pending orders, low-stock alerts.
- **Products** — create, edit, delete. Each product has one or more
  **variants** (e.g. `20" · Natural Black`) with their own SKU, price and
  **stock**. Editing stock here is how you manage inventory.
- **Orders** — every order with items, customer, payment reference and status
  (`pending → paid → fulfilled`, or `failed` / `cancelled`).

### Using real product photos

The demo generates on-brand SVG placeholder images automatically at
`/img/<name>.svg`. To replace any of them with a real photo you **don't need
to change any code** — just drop a file into `public/images/` named after the
image you want to replace. The store serves the real file when it exists and
falls back to the generated placeholder when it doesn't.

Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif` (pick one; the
first match wins in that order). Recommended dimensions: **1200×1500 (4:5)**
for products, **1600×900** for the hero.

| File to create in `public/images/`      | Replaces                                  |
| --------------------------------------- | ----------------------------------------- |
| `seamless-clip-in-extensions.jpg`       | Main photo of that product (card + page)  |
| `seamless-clip-in-extensions-2.jpg`     | 2nd gallery thumbnail on the product page |
| `seamless-clip-in-extensions-3.jpg`     | 3rd gallery thumbnail on the product page |
| `cat-Clip-In.jpg`                       | Category tile (categories: `Clip-In`, `Tape-In`, `Bundles`, `Ponytail`, `Care`, `Accessories`) |
| `hero-kamilla.jpg`                      | Home-page hero image                      |

The names are the product **slugs** (the part after `/product/` in the URL).
Current slugs: `seamless-clip-in-extensions`, `tape-in-extensions`,
`luxe-sew-in-bundles`, `wrap-ponytail`, `clip-in-bangs`,
`silk-repair-hair-kit`, `extension-brush`, `satin-sleep-bonnet`.

You can also add a brand-new product from the admin panel and give it any
slug, then place a matching file (`<slug>.jpg`) in `public/images/`.

---

## Project structure

```
src/
  config.js          # loads .env, exposes config
  db.js              # SQLite schema + all data access (inventory-safe)
  seed.js            # demo brand + catalog
  server.js          # HTTP server, router, all routes
  lib/
    util.js          # cookies, money, parsing, escaping
    images.js        # SVG placeholder generator
    stripe.js        # Stripe REST client + webhook verification
  views/
    layout.js        # storefront shell
    pages.js         # home / shop / product / cart / checkout / success
    admin.js         # admin panel pages
public/
  styles.css         # storefront + admin styling
  app.js             # cart, checkout and mock-payment client logic
scripts/
  seed.js            # npm run seed
  reset.js           # npm run reset
  test.js            # npm test  (54 tests)
data/                # SQLite database (created at runtime, git-ignored)
```

---

## Security notes

- Passwords, Stripe keys and the webhook secret live only in `.env`
  (git-ignored) — never commit them.
- Card data never touches this server: Stripe Checkout is hosted by Stripe, so
  the store stays out of PCI-DSS scope.
- Admin sessions are httpOnly cookies; the admin password is checked
  server-side.
- Stock is decremented inside a single SQLite `BEGIN IMMEDIATE` transaction, so
  two simultaneous buyers cannot oversell the last unit.
- For higher traffic, add rate limiting and move the cart/session check to a
  proper auth system.

---

## License

MIT — use it, rebrand it, sell with it.
