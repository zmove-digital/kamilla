// ============================================================================
// KAMILLA · configuração do frontend
//
// A anon/publishable key é PÚBLICA por design (vai no navegador). A segurança
// fica nas políticas de RLS do Supabase. NUNCA coloque a service_role key aqui.
//
// Enquanto a URL e a chave estiverem vazias, a loja roda em modo demonstração
// (somente leitura) usando public/store/demo-data.js.
// ============================================================================

// Permite sobrescrever em testes/console sem editar este arquivo:
//   window.KAMILLA_CONFIG = { url: '...', key: '...' }
// ou, para desenvolvimento local:
//   localStorage.setItem('kamilla_config_override', '{"url":"...","key":"..."}')
const runtime = { ...((typeof globalThis !== 'undefined' && globalThis.KAMILLA_CONFIG) || {}) };
try {
  const raw = globalThis.localStorage?.getItem('kamilla_config_override');
  if (raw) Object.assign(runtime, JSON.parse(raw));
} catch {
  /* localStorage indisponível ou JSON inválido */
}

// Projeto Supabase "kamilateste". A publishable key é pública por design.
// Use `??` para que um override explícito com string vazia force o modo demo.
export const SUPABASE_URL = runtime.url ?? 'https://awzutjdfzpeeyfdjhdqf.supabase.co';
export const SUPABASE_ANON_KEY =
  runtime.key ?? 'sb_publishable_9UvonVYso4Q8FKpdFdvcYQ_NApcyMqq';

export const STORE = {
  name: 'KAMILLA',
  tagline: 'Smartphones & Tecnologia',
  email: 'contato@kamilla.com.br',
  whatsapp: '',
  adminEmail: 'zmove.digital@gmail.com',
  freeShippingFrom: 29900, // R$ 299,00
  shippingCents: 2990, // R$ 29,90
  pixDiscount: 0.05,
  maxInstallments: 12,
};

export const isDemo = !SUPABASE_URL || !SUPABASE_ANON_KEY;
