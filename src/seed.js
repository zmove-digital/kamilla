import { db, createProduct, upsertVariant, migrate } from './db.js';

// ---------------------------------------------------------------------------
// Brand: KAMILLA - Luxury Hair Extensions
// Full demo catalog. Edit freely - the store reads everything from the DB.
// ---------------------------------------------------------------------------

const PRODUCTS = [
  {
    slug: 'seamless-clip-in-extensions',
    name: 'Seamless Clip-In Extensions',
    category: 'Clip-In',
    subtitle: '7-piece set · 100% Remy human hair',
    price_cents: 14900,
    compare_at_cents: 18900,
    featured: 1,
    description:
      'Our best-selling seamless clip-in set. Ultra-thin PU wefts lie flat against the scalp for an invisible, natural finish. Made from ethically sourced 100% Remy human hair that can be washed, styled and heat-treated like your own.',
    details: '7 wefts · 120g · PU seamless base · Remy human hair · Reusable for 12+ months',
    variants: [
      { name: '16" · Natural Black', sku: 'CI-SEAM-16-NB', price_cents: 14900, stock: 24 },
      { name: '16" · Chocolate Brown', sku: 'CI-SEAM-16-CB', price_cents: 14900, stock: 15 },
      { name: '20" · Natural Black', sku: 'CI-SEAM-20-NB', price_cents: 17900, stock: 18 },
      { name: '20" · Chocolate Brown', sku: 'CI-SEAM-20-CB', price_cents: 17900, stock: 9 },
      { name: '24" · Natural Black', sku: 'CI-SEAM-24-NB', price_cents: 21900, stock: 6 },
      { name: '24" · Honey Blonde', sku: 'CI-SEAM-24-HB', price_cents: 22900, stock: 3 },
    ],
  },
  {
    slug: 'tape-in-extensions',
    name: 'Invisible Tape-In Extensions',
    category: 'Tape-In',
    subtitle: '40 pieces · salon-grade adhesive',
    price_cents: 12900,
    compare_at_cents: 15900,
    featured: 1,
    description:
      'Salon-quality tape-ins with a medical-grade adhesive that stays put for 6–8 weeks. Lightweight, flat and undetectable — perfect for fine hair that needs volume without bulk.',
    details: '40 pieces (20 sandwiches) · 50g · Remy human hair · Biodegradable tape tabs',
    variants: [
      { name: '16" · Natural Black', sku: 'TI-INV-16-NB', price_cents: 12900, stock: 20 },
      { name: '20" · Dark Brown', sku: 'TI-INV-20-DB', price_cents: 14900, stock: 12 },
      { name: '22" · Honey Blonde', sku: 'TI-INV-22-HB', price_cents: 16900, stock: 5 },
    ],
  },
  {
    slug: 'luxe-sew-in-bundles',
    name: 'Luxe Sew-In Bundles (3-Pack)',
    category: 'Bundles',
    subtitle: 'Triple weft · double drawn',
    price_cents: 19900,
    compare_at_cents: 24900,
    featured: 1,
    description:
      'Three double-drawn bundles for a full, glamorous install. Thick from root to tip with no shedding and minimal tangling. Blends seamlessly with relaxed and natural textures.',
    details: '3 bundles · 300g total · Double drawn · Machine and hand-tied friendly',
    variants: [
      { name: '18" · Natural Black', sku: 'BD-LUX-18-NB', price_cents: 19900, stock: 14 },
      { name: '22" · Natural Black', sku: 'BD-LUX-22-NB', price_cents: 23900, stock: 8 },
      { name: '26" · Jet Black', sku: 'BD-LUX-26-JB', price_cents: 27900, stock: 4 },
    ],
  },
  {
    slug: 'wrap-ponytail',
    name: 'Wrap-Around Ponytail',
    category: 'Ponytail',
    subtitle: 'Instant length · one piece',
    price_cents: 6900,
    compare_at_cents: 8900,
    featured: 0,
    description:
      'A one-piece wrap-around ponytail that installs in under a minute. The clever wrap hides the band for a seamless, salon-blended finish. Ideal for sleek or curly updos.',
    details: '1 piece · 100g · Adjustable wrap · Heat-friendly synthetic blend',
    variants: [
      { name: '20" · Natural Black', sku: 'PT-WRAP-20-NB', price_cents: 6900, stock: 30 },
      { name: '20" · Ash Blonde', sku: 'PT-WRAP-20-AB', price_cents: 6900, stock: 22 },
      { name: '24" · Dark Brown', sku: 'PT-WRAP-24-DB', price_cents: 7900, stock: 11 },
    ],
  },
  {
    slug: 'clip-in-bangs',
    name: 'Clip-In Fringe Bangs',
    category: 'Clip-In',
    subtitle: 'Blendable · 3 clips',
    price_cents: 3900,
    compare_at_cents: null,
    featured: 0,
    description:
      'Switch up your look in seconds with clip-in fringe. Pre-styled and blendable, perfect for trying bangs without the commitment. Trim to your desired length.',
    details: '1 piece · 12g · 3 comfort clips · Remy human hair',
    variants: [
      { name: 'Natural Black', sku: 'CB-FRG-NB', price_cents: 3900, stock: 40 },
      { name: 'Warm Brown', sku: 'CB-FRG-WB', price_cents: 3900, stock: 28 },
    ],
  },
  {
    slug: 'silk-repair-hair-kit',
    name: 'Silk Repair Hair Kit',
    category: 'Care',
    subtitle: 'Shampoo · mask · serum',
    price_cents: 5900,
    compare_at_cents: 7400,
    featured: 0,
    description:
      'A three-step at-home routine formulated specifically for extensions. Sulfate-free shampoo, deep repair mask and shine serum that keep wefts soft, tangle-free and looking brand new.',
    details: '250ml shampoo · 200ml mask · 60ml serum · Sulfate & paraben free',
    variants: [
      { name: 'Repair Kit (3 pieces)', sku: 'CARE-KIT-3', price_cents: 5900, stock: 35 },
      { name: 'Refill Mask Only', sku: 'CARE-MASK', price_cents: 2400, stock: 50 },
    ],
  },
  {
    slug: 'extension-brush',
    name: 'Loop-Extension Brush',
    category: 'Accessories',
    subtitle: 'Gentle detangling for wefts',
    price_cents: 2200,
    compare_at_cents: null,
    featured: 0,
    description:
      'Specially designed bristles detangle extensions without pulling at the bonds. Ergonomic, anti-static and safe for tape-ins, clip-ins and sew-ins.',
    details: '1 brush · anti-static nylon bristles · soft-grip handle',
    variants: [{ name: 'Rose Gold', sku: 'ACC-BRUSH-RG', price_cents: 2200, stock: 60 }],
  },
  {
    slug: 'satin-sleep-bonnet',
    name: 'Satin Sleep Bonnet',
    category: 'Accessories',
    subtitle: 'Protects extensions overnight',
    price_cents: 1900,
    compare_at_cents: 2600,
    featured: 0,
    description:
      'Keep your install flawless while you sleep. Our double-lined satin bonnet reduces friction, locks in moisture and prevents tangles for longer-lasting styles.',
    details: '1 bonnet · double-layer satin · adjustable elastic band',
    variants: [
      { name: 'Black', sku: 'ACC-BONNET-BK', price_cents: 1900, stock: 45 },
      { name: 'Blush', sku: 'ACC-BONNET-BL', price_cents: 1900, stock: 38 },
    ],
  },
];

export function seedIfEmpty() {
  migrate();
  const existing = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (existing > 0) return false;
  seed();
  return true;
}

export function seed() {
  migrate();
  for (const p of PRODUCTS) {
    const productId = createProduct({
      slug: p.slug,
      name: p.name,
      category: p.category,
      subtitle: p.subtitle,
      description: p.description,
      details: p.details,
      price_cents: p.price_cents,
      compare_at_cents: p.compare_at_cents,
      active: 1,
      featured: p.featured,
    });
    p.variants.forEach((v, i) => {
      upsertVariant(productId, {
        name: v.name,
        sku: v.sku,
        price_cents: v.price_cents,
        stock: v.stock,
        position: i,
      });
    });
  }
  return PRODUCTS.length;
}

export function clearAll() {
  migrate();
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM cart_items;
    DELETE FROM carts;
    DELETE FROM variants;
    DELETE FROM products;
    DELETE FROM admin_sessions;
  `);
}
