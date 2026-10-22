// Generates the deterministic SVG "product photos" as real files so the static
// storefront (GitHub Pages + Supabase) can serve them without the Node backend.
//
//   node scripts/generate-static-images.js
//
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productImageSvg } from '../src/lib/images.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_FILE = join(ROOT, 'data', 'store.db');
const OUT_DIR = join(ROOT, 'public', 'images');

mkdirSync(OUT_DIR, { recursive: true });

const db = new DatabaseSync(DB_FILE);
const products = db.prepare('select slug, name, category from products order by id').all();
const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

let written = 0;
for (const product of products) {
  const file = join(OUT_DIR, `${product.slug}.svg`);
  writeFileSync(file, productImageSvg(product.slug, product.name), 'utf8');
  written += 1;
}

for (const category of categories) {
  const file = join(OUT_DIR, `cat-${category}.svg`);
  writeFileSync(file, productImageSvg(`cat-${category}`, category), 'utf8');
  written += 1;
}

writeFileSync(
  join(OUT_DIR, 'placeholder-phone.svg'),
  productImageSvg('kamilla-placeholder', 'KAMILLA'),
  'utf8'
);
written += 1;

console.log(`✔ ${written} imagens estáticas geradas em public/images/`);
console.log(`  Produtos: ${products.length} · Categorias: ${categories.length}`);
