# Supabase · guia de configuração

Este guia conecta a loja estática (GitHub Pages) ao Supabase. Você precisa de uma conta em
<https://supabase.com> — o plano gratuito é suficiente para testar e começar a vender.

> **Tempo estimado:** 10 a 15 minutos.
>
> **O que você vai obter no final:** loja com catálogo real, checkout criando pedidos, painel
> administrativo com login por e-mail/senha e estoque atualizado no banco.

---

## 1. Criar o projeto

1. Acesse <https://supabase.com/dashboard> e clique em **New project**.
2. Preencha:
   - **Name:** `kamilla`
   - **Database Password:** gere uma senha forte e guarde no seu gerenciador.
   - **Region:** `South America (São Paulo)` — `sa-east-1`.
   - **Plan:** Free.
3. Aguarde a criação (1–2 minutos).

> A senha do banco **não** é usada pela loja. Ela serve para acesso direto ao PostgreSQL.
> A loja usa apenas a **Project URL** + **anon key** + as funções RPC.

---

## 2. Rodar o schema

1. No menu do projeto, abra **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo [`schema.sql`](./schema.sql) deste repositório, copie **todo** o conteúdo e cole
   no editor.
4. Clique em **Run** (ou `Ctrl + Enter`).
5. Confira se aparece **Success**. O script é idempotente: pode ser rodado de novo para atualizar
   funções/políticas sem apagar dados.

O schema cria:

- `products`, `variants`, `orders`, `order_items` e `admins`;
- o índice de pedidos e variações;
- as políticas de **Row Level Security (RLS)**;
- as funções `is_admin`, `create_order`, `pay_order`, `order_status` e `set_order_status`;
- os grants explícitos para `anon` e `authenticated`.

---

## 3. Rodar o catálogo inicial

1. Ainda no **SQL Editor**, abra **New query**.
2. Copie todo o conteúdo de [`seed.sql`](./seed.sql) e cole.
3. Clique em **Run**.

O seed cria **10 celulares** e **66 variações** (128GB/256GB × 8GB/12GB × cores), com preços e
estoques iniciais.

> ⚠️ O seed usa `on conflict (slug) do update` e `on conflict (sku) do update`: rodar de novo
> **sobrescreve nome, preço e estoque** dos produtos do catálogo. Depois de começar a vender, evite
> rodar o seed ou edite os produtos direto no admin.
>
> Se quiser um catálogo diferente, edite os produtos pelo admin e **não** rode o seed novamente.

---

## 4. Configurar o login do admin

### 4.1. Desativar cadastro público

1. Vá em **Authentication → Providers**.
2. Abra **Email**.
3. Desative **Enable email provider**? **Não** — mantenha o provedor de e-mail ativo.
4. Desative **Allow new users to sign up**. Isso impede que qualquer pessoa crie conta.
5. Salve.

> Se a opção não aparecer, procure em **Authentication → Settings** por
> **Allow new users to sign up** / **Disable signup**.

### 4.2. Criar o usuário admin

1. Vá em **Authentication → Users**.
2. Clique em **Add user → Create new user**.
3. Preencha:
   - **Email:** `zmove.digital@gmail.com`
   - **Password:** uma senha forte (mínimo 8 caracteres; use letras, números e símbolo).
   - Marque **Auto Confirm User** (ou confirme o e-mail depois).
4. Clique em **Create user**.

O e-mail já está na tabela `public.admins` (o schema insere), então esse usuário terá permissão de
escrita.

### 4.3. Adicionar outros admins (opcional)

1. Crie o usuário em **Authentication → Users** com **Auto Confirm User**.
2. No **SQL Editor**:

   ```sql
   insert into public.admins (email)
   values ('outro@email.com')
   on conflict (email) do nothing;
   ```

Pronto. Qualquer usuário autenticado cujo e-mail esteja em `public.admins` pode gerenciar a loja.

---

## 5. Copiar as chaves

1. Vá em **Project Settings → API** (ou **Settings → API Keys**).
2. Copie:
   - **Project URL** — algo como `https://abcdefghij.supabase.co`
   - **anon public** / **publishable key** — começa com `eyJ...` ou `sb_publishable_...`
3. **Não copie** a `service_role` / `secret key` para o frontend. Ela ignora a RLS e dá acesso
   total ao banco.

> A anon key é **pública por design**. Pode ir no código e no GitHub. A proteção real está nas
> políticas RLS.

---

## 6. Preencher o frontend

Abra [`../public/store/config.js`](../public/store/config.js) e substitua:

```js
export const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
export const SUPABASE_ANON_KEY = 'SUA-ANON-KEY';
```

Por padrão o arquivo tem as duas constantes vazias — é isso que ativa o **modo demonstração**.

Depois:

```bash
git add public/store/config.js
git commit -m "config: conecta Supabase"
git push
```

O GitHub Pages publica a nova versão em alguns minutos. A loja deixa de mostrar o banner de
demonstração e passa a usar o banco.

---

## 7. Testar (checklist)

Acesse a loja publicada (ou `http://localhost:5180` com `npm run serve:static`).

### Loja

- [ ] A home mostra os 10 celulares e o banner de demonstração **não** aparece.
- [ ] Abrir um produto, trocar 128GB → 256GB e ver o preço mudar.
- [ ] Adicionar à sacola, alterar quantidade e ver o frete grátis acima de R$ 299.
- [ ] Finalizar o checkout. O pedido deve ser criado com status **Pendente**.
- [ ] Na tela de pagamento simulado, clicar em **Pagar**. O status vira **Pago** e o estoque da
      variação diminui.

### Admin

- [ ] Abrir `#/admin` e entrar com `zmove.digital@gmail.com` + a senha criada.
- [ ] O dashboard mostra faturamento, pedidos, produtos e estoque baixo.
- [ ] **Produtos:** editar um preço/estoque e salvar; recarregar a loja e conferir.
- [ ] **Produtos:** criar um produto novo com uma variação `128GB · 8GB · Preto`.
- [ ] **Pedidos:** o pedido do teste aparece com os itens e o total.
- [ ] **Pedidos:** mudar o status para **Enviado**; a lista atualiza.
- [ ] Sair e entrar de novo; a sessão deve persistir até o logout.

### Segurança (opcional, mas recomendado)

- [ ] Abrir a loja em uma janela anônima, sem login. Confirmar que `#/admin` mostra o login e que
      não é possível editar produtos.
- [ ] No console do navegador, tentar um `fetch` de `POST` em `/rest/v1/products` só com a anon key.
      Deve retornar **401/403** (RLS).
- [ ] Confirmar que `#/admin` não abre apenas digitando a URL sem sessão.

---

## 8. Como o RLS protege a loja

| Tabela | Público (anon) | Admin autenticado |
| --- | --- | --- |
| `products` | `SELECT` só de `active = true` | tudo |
| `variants` | `SELECT` só de produtos ativos | tudo |
| `orders` | nada | `SELECT` (alterações só via RPC) |
| `order_items` | nada | `SELECT` |
| `admins` | nada | nada (só via `is_admin()`) |

- O checkout **não** insere direto em `orders`: chama a RPC `create_order`, que é
  `security definer` e valida itens/estoque.
- O pagamento simulado chama `pay_order`, que baixa o estoque com `FOR UPDATE` e é idempotente.
- O admin altera status via `set_order_status`, que também ajusta o estoque ao cancelar.
- `set_order_status` valida transições (ex.: `paid → pending` é bloqueado) para não duplicar baixa
  de estoque.

---

## 9. Regenerar o catálogo (opcional)

O catálogo inicial vem do SQLite local (`data/store.db`) via scripts:

```bash
# 1. (se necessário) recriar o SQLite demo
npm run reset

# 2. gerar novamente supabase/seed.sql
npm run supabase:seed

# 3. gerar novamente public/store/demo-data.js
npm run demo:data
```

Depois, rode o novo `supabase/seed.sql` no SQL Editor.

> Isso **sobrescreve** preços/estoques dos produtos com o mesmo `slug`/`sku`. Use apenas antes de
> começar a vender ou em um ambiente de teste.

---

## 10. Pagamento real (próxima etapa)

O checkout atual é uma **simulação**. Para cobrar de verdade:

1. **Edge Function** `create-payment`:
   - recebe o `order_number`;
   - valida o pedido;
   - cria a preferência no Mercado Pago ou a sessão no Stripe usando a chave **secreta** guardada
     em **Edge Functions → Secrets**;
   - devolve a URL de pagamento.
2. **Edge Function** `payment-webhook`:
   - recebe o webhook do provedor;
   - valida a assinatura;
   - chama uma RPC `confirm_payment` (a criar) que baixa o estoque de forma atômica e idempotente;
   - atualiza `orders.status`, `payment_provider`, `payment_ref` e `paid_at`.
3. **Remova ou restrinja** a RPC pública `pay_order` antes de vender de verdade. Hoje ela permite
   que qualquer pessoa marque um pedido como pago se souber o número (que é aleatório, mas ainda
   é uma simulação).
4. Configure a URL do webhook no painel do provedor e teste com o modo sandbox.

Enquanto isso, o fluxo simulado serve para validar catálogo, pedidos, estoque e painel.

---

## 11. Problemas comuns

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| “Invalid API key” | URL/chave erradas ou projeto pausado | Confira `config.js` e reative o projeto no Supabase. |
| “Acesso negado” no login | E-mail não está em `public.admins` ou usuário não confirmado | Crie o usuário com **Auto Confirm** e insira o e-mail em `admins`. |
| “new row violates row-level security policy” | Tentativa de escrita sem sessão de admin | Faça login em `#/admin`; confirme o e-mail em `admins`. |
| Loja mostra banner de demonstração | `config.js` ainda vazio | Preencha URL + anon key e faça push. |
| Produtos não aparecem | `active = false` ou seed não rodou | Rode o seed; confira a coluna `active` no Table Editor. |
| Imagens quebradas | Caminho errado ou arquivo não enviado | Use `public/images/<slug>.svg` ou uma URL HTTPS. |
| Pedido criado mas estoque não baixa | Pagamento ainda não confirmado | Clique em **Pagar** na tela de pagamento ou mude para **Pago** no admin. |
| “Transição de status inválida” | Tentou voltar um pedido para um status anterior | Use a sequência Pendente → Pago → Enviado; cancele se precisar. |
| Sessão expira rápido | Token do Supabase expirou | Faça login novamente; o refresh é automático enquanto a sessão for válida. |

---

## 12. Backup e produção

- **Backup:** Supabase Free não tem backup automático completo. Use **Database → Backups** (se
  disponível no plano) ou exporte periodicamente pelo **Table Editor** / `pg_dump`.
- **Domínio próprio:** registre o domínio e aponte para o GitHub Pages (ou para um host estático).
  Depois atualize a URL no README e, se quiser, na configuração de CORS do Supabase.
- **CORS:** o Supabase aceita chamadas de qualquer origem por padrão para a API com anon key. Se
  quiser restringir, configure em **Settings → API → CORS** (quando disponível) ou use um proxy.
- **Chaves:** nunca exponha `service_role`; se ela vazar, rotacione imediatamente em
  **Settings → API**.
- **Admin:** use senha forte e, se possível, 2FA no e-mail da conta Supabase.

---

## Referências

- [Documentação do Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Auth com e-mail/senha](https://supabase.com/docs/guides/auth/auth-email)
