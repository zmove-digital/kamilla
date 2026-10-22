import { db, createProduct, upsertVariant, migrate } from './db.js';

// ---------------------------------------------------------------------------
// Brand: KAMILLA - Smartphones & Tecnologia
// Catálogo demo com 10 dos celulares mais vendidos. Cada produto tem variações
// de armazenamento (128GB/256GB), memória RAM (8GB/12GB) e cor.
// Edite livremente (ou pelo painel /admin) - a loja lê tudo do banco.
// ---------------------------------------------------------------------------

const COLORS = {
  iphone: [
    { name: 'Preto', slug: 'PRE' },
    { name: 'Branco', slug: 'BRA' },
    { name: 'Rosa', slug: 'ROS' },
    { name: 'Ultramarino', slug: 'ULT' },
  ],
  titanium: [
    { name: 'Titânio Natural', slug: 'TN' },
    { name: 'Titânio Preto', slug: 'TP' },
    { name: 'Titânio Deserto', slug: 'TD', extra: 20000 },
    { name: 'Titânio Branco', slug: 'TB' },
  ],
  galaxyS: [
    { name: 'Titânio Cinza', slug: 'TC' },
    { name: 'Titânio Preto', slug: 'TP' },
    { name: 'Titânio Violeta', slug: 'TV', extra: 10000 },
  ],
  galaxyA55: [
    { name: 'Azul Marinho', slug: 'AM' },
    { name: 'Lilás', slug: 'LL' },
    { name: 'Branco', slug: 'BR' },
    { name: 'Preto', slug: 'PR' },
  ],
  galaxyA15: [
    { name: 'Preto', slug: 'PR' },
    { name: 'Azul', slug: 'AZ' },
    { name: 'Amarelo', slug: 'AM' },
  ],
  motorola: [
    { name: 'Azul Petróleo', slug: 'AP' },
    { name: 'Magenta', slug: 'MG' },
    { name: 'Grafite', slug: 'GF' },
  ],
  edge: [
    { name: 'Preto', slug: 'PT' },
    { name: 'Lilás', slug: 'LL' },
    { name: 'Branco', slug: 'BR' },
  ],
  xiaomi: [
    { name: 'Preto', slug: 'PR' },
    { name: 'Branco', slug: 'BR' },
    { name: 'Roxo', slug: 'RX' },
  ],
  poco: [
    { name: 'Preto', slug: 'PR' },
    { name: 'Amarelo', slug: 'AM' },
    { name: 'Cinza', slug: 'CZ' },
  ],
  realme: [
    { name: 'Azul', slug: 'AZ' },
    { name: 'Bege', slug: 'BG' },
    { name: 'Preto', slug: 'PR' },
  ],
};

const PRODUCTS = [
  {
    slug: 'iphone-16',
    name: 'iPhone 16',
    category: 'Apple',
    skuPrefix: 'IP16',
    subtitle: 'Tela 6,1" Super Retina XDR · Chip A18 · Câmera 48MP',
    price_cents: 549900,
    compare_at_cents: 619900,
    featured: 1,
    description:
      'O iPhone 16 chega com o chip A18, botão de Ação e o novo Controle de Câmera. Fotos incríveis com a câmera Fusion de 48MP, bateria para o dia inteiro e Apple Intelligence para deixar tudo mais rápido. É o iPhone que cabe no seu bolso e entrega potência de sobra.',
    details: 'Tela 6,1" · Chip A18 · Câmera 48MP · 5G · Face ID · USB-C · Resistente à água',
    combos: [
      { storage: '128GB', ram: '8GB', price_cents: 549900, stock: 14 },
      { storage: '256GB', ram: '8GB', price_cents: 629900, stock: 9 },
    ],
    colors: [
      { name: 'Preto', slug: 'PRE' },
      { name: 'Branco', slug: 'BRA' },
      { name: 'Rosa', slug: 'ROS', stock: 0 },
      { name: 'Ultramarino', slug: 'ULT' },
    ],
  },
  {
    slug: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    category: 'Apple',
    skuPrefix: 'IP16PM',
    subtitle: 'Tela 6,9" ProMotion · Titânio · Chip A18 Pro',
    price_cents: 899900,
    compare_at_cents: 999900,
    featured: 1,
    description:
      'O topo de linha da Apple em titânio: tela de 6,9" com ProMotion 120Hz, chip A18 Pro e o melhor sistema de câmera já feito para um iPhone, com gravação em 4K 120fps. Para quem quer o máximo em performance, fotografia e status.',
    details: 'Tela 6,9" 120Hz · Chip A18 Pro · Câmera 48MP · 5G · Face ID · Titânio',
    combos: [
      { storage: '128GB', ram: '8GB', price_cents: 899900, stock: 7 },
      { storage: '256GB', ram: '8GB', price_cents: 999900, stock: 5 },
    ],
    colors: COLORS.titanium,
  },
  {
    slug: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Samsung',
    skuPrefix: 'S24U',
    subtitle: 'Tela 6,8" AMOLED · S Pen · Câmera 200MP',
    price_cents: 649900,
    compare_at_cents: 749900,
    featured: 1,
    description:
      'O Galaxy S24 Ultra é uma estação de trabalho no bolso: câmera de 200MP, S Pen integrada, tela AMOLED de 6,8" e Galaxy AI para traduzir, resumir e editar em segundos. Titânio, bateria de longa duração e desempenho de sobra.',
    details: 'Tela 6,8" AMOLED 120Hz · S Pen · 200MP · Galaxy AI · 5G · Titânio',
    combos: [
      { storage: '128GB', ram: '12GB', price_cents: 649900, stock: 10 },
      { storage: '256GB', ram: '12GB', price_cents: 729900, stock: 6 },
    ],
    colors: COLORS.galaxyS,
  },
  {
    slug: 'galaxy-a55-5g',
    name: 'Samsung Galaxy A55 5G',
    category: 'Samsung',
    skuPrefix: 'A55',
    subtitle: 'Tela 6,6" Super AMOLED · 50MP · Bateria 5000mAh',
    price_cents: 219900,
    compare_at_cents: 259900,
    featured: 1,
    description:
      'O campeão de vendas da Samsung no Brasil. Tela Super AMOLED de 6,6", câmera de 50MP com estabilização óptica, 5G e bateria de 5000mAh que aguenta o dia todo. Acabamento premium em vidro e metal, com 4 anos de atualizações.',
    details: 'Tela 6,6" Super AMOLED 120Hz · 50MP OIS · 5000mAh · 5G · IP67',
    combos: [
      { storage: '128GB', ram: '8GB', price_cents: 219900, stock: 25 },
      { storage: '256GB', ram: '12GB', price_cents: 259900, stock: 15 },
    ],
    colors: COLORS.galaxyA55,
  },
  {
    slug: 'galaxy-a15',
    name: 'Samsung Galaxy A15',
    category: 'Samsung',
    skuPrefix: 'A15',
    subtitle: 'Tela 6,5" AMOLED · 50MP · Bateria 5000mAh',
    price_cents: 109900,
    compare_at_cents: 139900,
    featured: 0,
    description:
      'O melhor custo-benefício para o dia a dia. Tela AMOLED de 6,5", câmera de 50MP, bateria de 5000mAh com carregamento rápido e 5G. Ideal para quem quer um Samsung confiável sem gastar muito.',
    details: 'Tela 6,5" AMOLED 90Hz · 50MP · 5000mAh · 5G · Carregamento 25W',
    combos: [
      { storage: '128GB', ram: '8GB', price_cents: 109900, stock: 30 },
      { storage: '256GB', ram: '12GB', price_cents: 139900, stock: 3 },
    ],
    colors: COLORS.galaxyA15,
  },
  {
    slug: 'moto-g84-5g',
    name: 'Motorola Moto G84 5G',
    category: 'Motorola',
    skuPrefix: 'G84',
    subtitle: 'Tela 6,5" pOLED · 50MP · 256GB de fábrica',
    price_cents: 149900,
    compare_at_cents: 179900,
    featured: 1,
    description:
      'Um dos celulares mais vendidos da Motorola: tela pOLED de 6,5" com 120Hz, câmera de 50MP com OIS, som estéreo e acabamento em couro vegano. Desempenho equilibrado e bateria que passa de um dia inteiro.',
    details: 'Tela 6,5" pOLED 120Hz · 50MP OIS · Som estéreo · 5000mAh · 5G',
    combos: [
      { storage: '128GB', ram: '8GB', price_cents: 149900, stock: 18 },
      { storage: '256GB', ram: '12GB', price_cents: 179900, stock: 11 },
    ],
    colors: COLORS.motorola,
  },
  {
    slug: 'moto-edge-50-pro',
    name: 'Motorola Edge 50 Pro',
    category: 'Motorola',
    skuPrefix: 'E50P',
    subtitle: 'Tela 6,7" pOLED 144Hz · 50MP · Carregamento 125W',
    price_cents: 299900,
    compare_at_cents: 349900,
    featured: 0,
    description:
      'Design fino, tela pOLED de 6,7" com 144Hz e carregamento turbo de 125W: em poucos minutos você tem bateria para o dia todo. Câmera de 50MP com OIS, proteção IP68 e acabamento sofisticado.',
    details: 'Tela 6,7" pOLED 144Hz · 50MP OIS · 4500mAh · TurboPower 125W · IP68',
    combos: [
      { storage: '128GB', ram: '8GB', price_cents: 299900, stock: 9 },
      { storage: '256GB', ram: '12GB', price_cents: 349900, stock: 6 },
    ],
    colors: COLORS.edge,
  },
  {
    slug: 'redmi-note-13-pro-5g',
    name: 'Xiaomi Redmi Note 13 Pro 5G',
    category: 'Xiaomi',
    skuPrefix: 'RN13P',
    subtitle: 'Tela 6,67" AMOLED · Câmera 200MP · 67W',
    price_cents: 179900,
    compare_at_cents: 209900,
    featured: 1,
    description:
      'Câmera de 200MP, tela AMOLED de 6,67" com 120Hz e carregamento de 67W. O Redmi Note 13 Pro 5G entrega especificações de topo por um preço que cabe no orçamento. Um dos mais vendidos do Brasil.',
    details: 'Tela 6,67" AMOLED 120Hz · 200MP OIS · 5100mAh · 67W · 5G',
    combos: [
      { storage: '128GB', ram: '8GB', price_cents: 179900, stock: 20 },
      { storage: '256GB', ram: '12GB', price_cents: 209900, stock: 12 },
    ],
    colors: COLORS.xiaomi,
  },
  {
    slug: 'poco-x6-pro-5g',
    name: 'Xiaomi POCO X6 Pro 5G',
    category: 'Xiaomi',
    skuPrefix: 'PX6P',
    subtitle: 'Tela 6,67" AMOLED · Dimensity 8300 · 67W',
    price_cents: 209900,
    compare_at_cents: 239900,
    featured: 0,
    description:
      'Performance de flagship para jogos: Dimensity 8300 Ultra, tela AMOLED de 6,67" com 120Hz e resfriamento avançado. Se você joga, grava e multitarefa, o POCO X6 Pro é feito para você.',
    details: 'Tela 6,67" AMOLED 120Hz · Dimensity 8300 Ultra · 64MP OIS · 67W · 5G',
    combos: [
      { storage: '128GB', ram: '8GB', price_cents: 209900, stock: 13 },
      { storage: '256GB', ram: '12GB', price_cents: 239900, stock: 8 },
    ],
    colors: COLORS.poco,
  },
  {
    slug: 'realme-12-pro-plus-5g',
    name: 'Realme 12 Pro+ 5G',
    category: 'Realme',
    skuPrefix: 'RM12P',
    subtitle: 'Tela 6,7" AMOLED · Periscópio 64MP · 67W',
    price_cents: 239900,
    compare_at_cents: 279900,
    featured: 0,
    description:
      'O Realme 12 Pro+ 5G traz câmera periscópio de 64MP com zoom óptico, tela AMOLED curva de 6,7" e design inspirado em relógios de luxo. Custo-benefício imbatível para quem ama fotografia.',
    details: 'Tela 6,7" AMOLED 120Hz · Periscópio 64MP · 5000mAh · 67W · 5G',
    combos: [
      { storage: '128GB', ram: '8GB', price_cents: 239900, stock: 11 },
      { storage: '256GB', ram: '12GB', price_cents: 279900, stock: 7 },
    ],
    colors: COLORS.realme,
  },
];

// Expands combos x colors into concrete variants (each with its own SKU,
// price and stock). Colors can override the stock (e.g. a sold-out finish).
export function variantsFor(product) {
  const out = [];
  for (const combo of product.combos) {
    for (const color of product.colors) {
      out.push({
        name: `${combo.storage} · ${combo.ram} · ${color.name}`,
        sku: `${product.skuPrefix}-${combo.storage.replace('GB', '')}-${combo.ram.replace('GB', '')}-${color.slug}`,
        price_cents: combo.price_cents + (color.extra || 0),
        stock: color.stock ?? combo.stock,
      });
    }
  }
  return out;
}

export function seedIfEmpty() {
  migrate();
  const existing = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (existing > 0) return 0;
  return seed();
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
    variantsFor(p).forEach((v, i) => {
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
