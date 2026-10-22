-- ============================================================================
-- KAMILLA · catálogo inicial (gerado por scripts/generate-supabase-seed.js)
-- Rode DEPOIS de supabase/schema.sql, no SQL Editor do Supabase.
-- Atenção: rodar novamente sobrescreve nome/preço/estoque dos produtos abaixo.
-- ============================================================================

begin;

-- iPhone 16
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'iphone-16', 'iPhone 16', 'Apple',
  'Tela 6,1" Super Retina XDR · Chip A18 · Câmera 48MP',
  'O iPhone 16 chega com o chip A18, botão de Ação e o novo Controle de Câmera. Fotos incríveis com a câmera Fusion de 48MP, bateria para o dia inteiro e Apple Intelligence para deixar tudo mais rápido. É o iPhone que cabe no seu bolso e entrega potência de sobra.',
  'Tela 6,1" · Chip A18 · Câmera 48MP · 5G · Face ID · USB-C · Resistente à água',
  549900, 619900, 'public/images/iphone-16.svg', true, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- iPhone 16 Pro Max
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'iphone-16-pro-max', 'iPhone 16 Pro Max', 'Apple',
  'Tela 6,9" ProMotion · Titânio · Chip A18 Pro',
  'O topo de linha da Apple em titânio: tela de 6,9" com ProMotion 120Hz, chip A18 Pro e o melhor sistema de câmera já feito para um iPhone, com gravação em 4K 120fps. Para quem quer o máximo em performance, fotografia e status.',
  'Tela 6,9" 120Hz · Chip A18 Pro · Câmera 48MP · 5G · Face ID · Titânio',
  899900, 999900, 'public/images/iphone-16-pro-max.svg', true, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- Samsung Galaxy S24 Ultra
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'galaxy-s24-ultra', 'Samsung Galaxy S24 Ultra', 'Samsung',
  'Tela 6,8" AMOLED · S Pen · Câmera 200MP',
  'O Galaxy S24 Ultra é uma estação de trabalho no bolso: câmera de 200MP, S Pen integrada, tela AMOLED de 6,8" e Galaxy AI para traduzir, resumir e editar em segundos. Titânio, bateria de longa duração e desempenho de sobra.',
  'Tela 6,8" AMOLED 120Hz · S Pen · 200MP · Galaxy AI · 5G · Titânio',
  649900, 749900, 'public/images/galaxy-s24-ultra.svg', true, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- Samsung Galaxy A55 5G
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'galaxy-a55-5g', 'Samsung Galaxy A55 5G', 'Samsung',
  'Tela 6,6" Super AMOLED · 50MP · Bateria 5000mAh',
  'O campeão de vendas da Samsung no Brasil. Tela Super AMOLED de 6,6", câmera de 50MP com estabilização óptica, 5G e bateria de 5000mAh que aguenta o dia todo. Acabamento premium em vidro e metal, com 4 anos de atualizações.',
  'Tela 6,6" Super AMOLED 120Hz · 50MP OIS · 5000mAh · 5G · IP67',
  219900, 259900, 'public/images/galaxy-a55-5g.svg', true, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- Samsung Galaxy A15
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'galaxy-a15', 'Samsung Galaxy A15', 'Samsung',
  'Tela 6,5" AMOLED · 50MP · Bateria 5000mAh',
  'O melhor custo-benefício para o dia a dia. Tela AMOLED de 6,5", câmera de 50MP, bateria de 5000mAh com carregamento rápido e 5G. Ideal para quem quer um Samsung confiável sem gastar muito.',
  'Tela 6,5" AMOLED 90Hz · 50MP · 5000mAh · 5G · Carregamento 25W',
  109900, 139900, 'public/images/galaxy-a15.svg', false, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- Motorola Moto G84 5G
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'moto-g84-5g', 'Motorola Moto G84 5G', 'Motorola',
  'Tela 6,5" pOLED · 50MP · 256GB de fábrica',
  'Um dos celulares mais vendidos da Motorola: tela pOLED de 6,5" com 120Hz, câmera de 50MP com OIS, som estéreo e acabamento em couro vegano. Desempenho equilibrado e bateria que passa de um dia inteiro.',
  'Tela 6,5" pOLED 120Hz · 50MP OIS · Som estéreo · 5000mAh · 5G',
  149900, 179900, 'public/images/moto-g84-5g.svg', true, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- Motorola Edge 50 Pro
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'moto-edge-50-pro', 'Motorola Edge 50 Pro', 'Motorola',
  'Tela 6,7" pOLED 144Hz · 50MP · Carregamento 125W',
  'Design fino, tela pOLED de 6,7" com 144Hz e carregamento turbo de 125W: em poucos minutos você tem bateria para o dia todo. Câmera de 50MP com OIS, proteção IP68 e acabamento sofisticado.',
  'Tela 6,7" pOLED 144Hz · 50MP OIS · 4500mAh · TurboPower 125W · IP68',
  299900, 349900, 'public/images/moto-edge-50-pro.svg', false, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- Xiaomi Redmi Note 13 Pro 5G
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'redmi-note-13-pro-5g', 'Xiaomi Redmi Note 13 Pro 5G', 'Xiaomi',
  'Tela 6,67" AMOLED · Câmera 200MP · 67W',
  'Câmera de 200MP, tela AMOLED de 6,67" com 120Hz e carregamento de 67W. O Redmi Note 13 Pro 5G entrega especificações de topo por um preço que cabe no orçamento. Um dos mais vendidos do Brasil.',
  'Tela 6,67" AMOLED 120Hz · 200MP OIS · 5100mAh · 67W · 5G',
  179900, 209900, 'public/images/redmi-note-13-pro-5g.svg', true, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- Xiaomi POCO X6 Pro 5G
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'poco-x6-pro-5g', 'Xiaomi POCO X6 Pro 5G', 'Xiaomi',
  'Tela 6,67" AMOLED · Dimensity 8300 · 67W',
  'Performance de flagship para jogos: Dimensity 8300 Ultra, tela AMOLED de 6,67" com 120Hz e resfriamento avançado. Se você joga, grava e multitarefa, o POCO X6 Pro é feito para você.',
  'Tela 6,67" AMOLED 120Hz · Dimensity 8300 Ultra · 64MP OIS · 67W · 5G',
  209900, 239900, 'public/images/poco-x6-pro-5g.svg', false, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- Realme 12 Pro+ 5G
insert into public.products
  (slug, name, category, subtitle, description, details, price_cents, compare_at_cents, image_url, featured, active)
values (
  'realme-12-pro-plus-5g', 'Realme 12 Pro+ 5G', 'Realme',
  'Tela 6,7" AMOLED · Periscópio 64MP · 67W',
  'O Realme 12 Pro+ 5G traz câmera periscópio de 64MP com zoom óptico, tela AMOLED curva de 6,7" e design inspirado em relógios de luxo. Custo-benefício imbatível para quem ama fotografia.',
  'Tela 6,7" AMOLED 120Hz · Periscópio 64MP · 5000mAh · 67W · 5G',
  239900, 279900, 'public/images/realme-12-pro-plus-5g.svg', false, true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  details = excluded.details,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  image_url = excluded.image_url,
  featured = excluded.featured,
  active = excluded.active;

-- Variações (armazenamento · memória · cor)
insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Preto', 'IP16-128-8-PRE', 549900, 14, 0 from public.products p where p.slug = 'iphone-16'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Branco', 'IP16-128-8-BRA', 549900, 14, 1 from public.products p where p.slug = 'iphone-16'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Rosa', 'IP16-128-8-ROS', 549900, 0, 2 from public.products p where p.slug = 'iphone-16'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Ultramarino', 'IP16-128-8-ULT', 549900, 14, 3 from public.products p where p.slug = 'iphone-16'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 8GB · Preto', 'IP16-256-8-PRE', 629900, 9, 4 from public.products p where p.slug = 'iphone-16'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 8GB · Branco', 'IP16-256-8-BRA', 629900, 9, 5 from public.products p where p.slug = 'iphone-16'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 8GB · Rosa', 'IP16-256-8-ROS', 629900, 0, 6 from public.products p where p.slug = 'iphone-16'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 8GB · Ultramarino', 'IP16-256-8-ULT', 629900, 9, 7 from public.products p where p.slug = 'iphone-16'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Titânio Natural', 'IP16PM-128-8-TN', 899900, 7, 0 from public.products p where p.slug = 'iphone-16-pro-max'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Titânio Preto', 'IP16PM-128-8-TP', 899900, 7, 1 from public.products p where p.slug = 'iphone-16-pro-max'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Titânio Deserto', 'IP16PM-128-8-TD', 919900, 7, 2 from public.products p where p.slug = 'iphone-16-pro-max'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Titânio Branco', 'IP16PM-128-8-TB', 899900, 7, 3 from public.products p where p.slug = 'iphone-16-pro-max'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 8GB · Titânio Natural', 'IP16PM-256-8-TN', 999900, 5, 4 from public.products p where p.slug = 'iphone-16-pro-max'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 8GB · Titânio Preto', 'IP16PM-256-8-TP', 999900, 5, 5 from public.products p where p.slug = 'iphone-16-pro-max'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 8GB · Titânio Deserto', 'IP16PM-256-8-TD', 1019900, 5, 6 from public.products p where p.slug = 'iphone-16-pro-max'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 8GB · Titânio Branco', 'IP16PM-256-8-TB', 999900, 5, 7 from public.products p where p.slug = 'iphone-16-pro-max'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 12GB · Titânio Cinza', 'S24U-128-12-TC', 649900, 10, 0 from public.products p where p.slug = 'galaxy-s24-ultra'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 12GB · Titânio Preto', 'S24U-128-12-TP', 649900, 10, 1 from public.products p where p.slug = 'galaxy-s24-ultra'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 12GB · Titânio Violeta', 'S24U-128-12-TV', 659900, 10, 2 from public.products p where p.slug = 'galaxy-s24-ultra'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Titânio Cinza', 'S24U-256-12-TC', 729900, 6, 3 from public.products p where p.slug = 'galaxy-s24-ultra'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Titânio Preto', 'S24U-256-12-TP', 729900, 6, 4 from public.products p where p.slug = 'galaxy-s24-ultra'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Titânio Violeta', 'S24U-256-12-TV', 739900, 6, 5 from public.products p where p.slug = 'galaxy-s24-ultra'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Azul Marinho', 'A55-128-8-AM', 219900, 25, 0 from public.products p where p.slug = 'galaxy-a55-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Lilás', 'A55-128-8-LL', 219900, 25, 1 from public.products p where p.slug = 'galaxy-a55-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Branco', 'A55-128-8-BR', 219900, 25, 2 from public.products p where p.slug = 'galaxy-a55-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Preto', 'A55-128-8-PR', 219900, 25, 3 from public.products p where p.slug = 'galaxy-a55-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Azul Marinho', 'A55-256-12-AM', 259900, 15, 4 from public.products p where p.slug = 'galaxy-a55-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Lilás', 'A55-256-12-LL', 259900, 15, 5 from public.products p where p.slug = 'galaxy-a55-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Branco', 'A55-256-12-BR', 259900, 15, 6 from public.products p where p.slug = 'galaxy-a55-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Preto', 'A55-256-12-PR', 259900, 15, 7 from public.products p where p.slug = 'galaxy-a55-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Preto', 'A15-128-8-PR', 109900, 30, 0 from public.products p where p.slug = 'galaxy-a15'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Azul', 'A15-128-8-AZ', 109900, 30, 1 from public.products p where p.slug = 'galaxy-a15'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Amarelo', 'A15-128-8-AM', 109900, 30, 2 from public.products p where p.slug = 'galaxy-a15'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Preto', 'A15-256-12-PR', 139900, 3, 3 from public.products p where p.slug = 'galaxy-a15'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Azul', 'A15-256-12-AZ', 139900, 3, 4 from public.products p where p.slug = 'galaxy-a15'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Amarelo', 'A15-256-12-AM', 139900, 3, 5 from public.products p where p.slug = 'galaxy-a15'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Azul Petróleo', 'G84-128-8-AP', 149900, 18, 0 from public.products p where p.slug = 'moto-g84-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Magenta', 'G84-128-8-MG', 149900, 18, 1 from public.products p where p.slug = 'moto-g84-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Grafite', 'G84-128-8-GF', 149900, 18, 2 from public.products p where p.slug = 'moto-g84-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Azul Petróleo', 'G84-256-12-AP', 179900, 11, 3 from public.products p where p.slug = 'moto-g84-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Magenta', 'G84-256-12-MG', 179900, 11, 4 from public.products p where p.slug = 'moto-g84-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Grafite', 'G84-256-12-GF', 179900, 11, 5 from public.products p where p.slug = 'moto-g84-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Preto', 'E50P-128-8-PT', 299900, 9, 0 from public.products p where p.slug = 'moto-edge-50-pro'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Lilás', 'E50P-128-8-LL', 299900, 9, 1 from public.products p where p.slug = 'moto-edge-50-pro'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Branco', 'E50P-128-8-BR', 299900, 9, 2 from public.products p where p.slug = 'moto-edge-50-pro'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Preto', 'E50P-256-12-PT', 349900, 6, 3 from public.products p where p.slug = 'moto-edge-50-pro'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Lilás', 'E50P-256-12-LL', 349900, 6, 4 from public.products p where p.slug = 'moto-edge-50-pro'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Branco', 'E50P-256-12-BR', 349900, 6, 5 from public.products p where p.slug = 'moto-edge-50-pro'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Preto', 'RN13P-128-8-PR', 179900, 20, 0 from public.products p where p.slug = 'redmi-note-13-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Branco', 'RN13P-128-8-BR', 179900, 20, 1 from public.products p where p.slug = 'redmi-note-13-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Roxo', 'RN13P-128-8-RX', 179900, 20, 2 from public.products p where p.slug = 'redmi-note-13-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Preto', 'RN13P-256-12-PR', 209900, 12, 3 from public.products p where p.slug = 'redmi-note-13-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Branco', 'RN13P-256-12-BR', 209900, 12, 4 from public.products p where p.slug = 'redmi-note-13-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Roxo', 'RN13P-256-12-RX', 209900, 12, 5 from public.products p where p.slug = 'redmi-note-13-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Preto', 'PX6P-128-8-PR', 209900, 13, 0 from public.products p where p.slug = 'poco-x6-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Amarelo', 'PX6P-128-8-AM', 209900, 13, 1 from public.products p where p.slug = 'poco-x6-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Cinza', 'PX6P-128-8-CZ', 209900, 13, 2 from public.products p where p.slug = 'poco-x6-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Preto', 'PX6P-256-12-PR', 239900, 8, 3 from public.products p where p.slug = 'poco-x6-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Amarelo', 'PX6P-256-12-AM', 239900, 8, 4 from public.products p where p.slug = 'poco-x6-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Cinza', 'PX6P-256-12-CZ', 239900, 8, 5 from public.products p where p.slug = 'poco-x6-pro-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Azul', 'RM12P-128-8-AZ', 239900, 11, 0 from public.products p where p.slug = 'realme-12-pro-plus-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Bege', 'RM12P-128-8-BG', 239900, 11, 1 from public.products p where p.slug = 'realme-12-pro-plus-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '128GB · 8GB · Preto', 'RM12P-128-8-PR', 239900, 11, 2 from public.products p where p.slug = 'realme-12-pro-plus-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Azul', 'RM12P-256-12-AZ', 279900, 7, 3 from public.products p where p.slug = 'realme-12-pro-plus-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Bege', 'RM12P-256-12-BG', 279900, 7, 4 from public.products p where p.slug = 'realme-12-pro-plus-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

insert into public.variants (product_id, name, sku, price_cents, stock, position)
select p.id, '256GB · 12GB · Preto', 'RM12P-256-12-PR', 279900, 7, 5 from public.products p where p.slug = 'realme-12-pro-plus-5g'
on conflict (sku) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  stock = excluded.stock,
  position = excluded.position;

commit;

-- Produtos: 10 · Variações: 66