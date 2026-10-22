// Generates public/store/demo-data.js from the local SQLite catalog.
// Used as a read-only preview when Supabase keys are not configured yet.
//
//   node scripts/generate-demo-data.js
//
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'store', 'demo-data.js');
const db = new DatabaseSync(join(ROOT, 'data', 'store.db'));

const products = db
  .prepare(
    `select id, slug, name, category, subtitle, description, details,
            price_cents, compare_at_cents, featured, active, created_at
       from products order by id`
  )
  .all();

const variants = db
  .prepare(
    `select id, product_id, name, sku, price_cents, stock, position
       from variants order by product_id, position, id`
  )
  .all();

const byProduct = new Map();
for (const v of variants) {
  if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, []);
  byProduct.get(v.product_id).push({ ...v });
}

const data = products.map((p) => ({
  ...p,
  featured: Boolean(p.featured),
  active: Boolean(p.active),
  image_url: `public/images/${p.slug}.svg`,
  variants: byProduct.get(p.id) || [],
}));

const body = `// Gerado automaticamente por scripts/generate-demo-data.js
// Preview local (somente leitura) quando o Supabase ainda não está configurado.
export const DEMO_PRODUCTS = ${JSON.stringify(data, null, 2)};
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, body, 'utf8');
console.log(`✔ public/store/demo-data.js (${data.length} produtos, ${variants.length} variações)`);
