// Reads the current SQLite catalog and emits supabase/seed.sql (Postgres).
// Run after changing the demo catalog:
//
//   node scripts/generate-supabase-seed.js
//
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTES } from '../src/lib/util.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_FILE = join(ROOT, 'data', 'store.db');
const OUT_FILE = join(ROOT, 'supabase', 'seed.sql');

const q = (value) => {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
};
const b = (value) => (value ? 'true' : 'false');

const db = new DatabaseSync(DB_FILE);
const products = db
  .prepare(
    `select slug, name, category, subtitle, description, details,
            price_cents, compare_at_cents, featured, active
       from products order by id`
  )
  .all();
const variants = db
  .prepare(
    `select p.slug as product_slug, v.name, v.sku, v.price_cents, v.stock, v.position
       from variants v join products p on p.id = v.product_id
      order by p.id, v.position, v.id`
  )
  .all();

const lines = [];
lines.push('-- ============================================================================');
lines.push('-- KAMILLA · catálogo inicial (gerado por scripts/generate-supabase-seed.js)');
lines.push('-- Rode DEPOIS de supabase/schema.sql, no SQL Editor do Supabase.');
lines.push('-- Atenção: rodar novamente sobrescreve nome/preço/estoque dos produtos abaixo.');
lines.push('-- ============================================================================');
lines.push('');
lines.push('begin;');
lines.push('');

for (const p of products) {
  const image = `public/images/${p.slug}.svg`;
  lines.push(`-- ${p.name}`);
  lines.push(`insert into public.products`);
  lines.push(
    `  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)`
  );
  lines.push(`values (`);
  lines.push(`  ${q(p.slug)}, ${q(p.name)}, ${q(p.category)},`);
  lines.push(`  ${q(p.subtitle)},`);
  lines.push(`  ${q(p.description)},`);
  lines.push(`  ${q(p.details)},`);
  lines.push(`  ${Number(p.price_cents)}, ${Number(p.compare_at_cents)}, ${q(image)}, ${b(p.featured)}, ${b(p.active)}`);
  lines.push(`)`);
  lines.push(`on conflict (slug) do update set`);
  lines.push(`  name = excluded.name,`);
  lines.push(`  category = excluded.category,`);
  lines.push(`  subtitle = excluded.subtitle,`);
  lines.push(`  description = excluded.description,`);
  lines.push(`  details = excluded.details,`);
  lines.push(`  price_cents = excluded.price_cents,`);
  lines.push(`  compare_at_cents = excluded.compare_at_cents,`);
  lines.push(`  image_url = excluded.image_url,`);
  lines.push(`  featured = excluded.featured,`);
  lines.push(`  active = excluded.active;`);
  lines.push('');
}

lines.push('-- Variações (armazenamento · memória · cor)');
for (const v of variants) {
  lines.push(`insert into public.variants (product_id, name, sku, price_cents, stock, position)`);
  lines.push(
    `select p.id, ${q(v.name)}, ${q(v.sku)}, ${Number(v.price_cents)}, ${Number(v.stock)}, ${Number(
      v.position
    )} from public.products p where p.slug = ${q(v.product_slug)}`
  );
  lines.push(`on conflict (sku) do update set`);
  lines.push(`  name = excluded.name,`);
  lines.push(`  price_cents = excluded.price_cents,`);
  lines.push(`  stock = excluded.stock,`);
  lines.push(`  position = excluded.position;`);
  lines.push('');
}

lines.push('commit;');
lines.push('');
lines.push(`-- Produtos: ${products.length} · Variações: ${variants.length}`);

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
console.log(`✔ supabase/seed.sql gerado (${products.length} produtos, ${variants.length} variações)`);
console.log(`  Paletas disponíveis no app: ${PALETTES.length}`);
