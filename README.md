This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Autenticação e painel do aprovado (TJAA TRT-2)

O projeto já conta com um fluxo completo de autenticação integrado ao Supabase, voltado para os aprovados no concurso TJAA TRT-2.

### Visão geral das rotas

- `/login`  \
	Tela de acesso ao painel dos aprovados.  \
	- Login com e-mail + senha (Supabase Auth).
	- CTA para criar perfil: link para `/signup`.
	- Layout com fundo “calçadão de São Paulo” e card central cinza claro.

- `/signup`  \
	Tela de criação de perfil de aprovado.  \
	- Cria o usuário de autenticação no Supabase.
	- Vincula o usuário a um registro da tabela `candidates`.
	- Salva os dados de contato na tabela `user_profiles`.
	- Upload opcional de foto de perfil para o bucket `avatars` (Storage).
	- Ao finalizar com sucesso, redireciona para `/resumo`.

- `/resumo`  \
	Painel inicial do aprovado.  \
	- Protegido por layout autenticado.
	- Carrega os dados do usuário logado a partir de `user_profiles` + `candidates`.

## Acesso direto ao banco (Supabase)

Além dos clients oficiais do Supabase, o projeto expõe uma camada simples de acesso SQL para rotinas administrativas.

### Arquitetura

- `db.js`: instancia o cliente `postgres` apontando para o pool de conexões do Supabase (`DATABASE_URL`). Inclui limites de pool, SSL obrigatório e validação das variáveis de ambiente.
- `scripts/test-db.js`: script utilitário que reaproveita `db.js`, executa `select now()` e um resumo de candidatos por lista.

### Pré-requisitos

Crie (ou atualize) o arquivo `.env.local` na raiz com os segredos emitidos pelo Supabase. Os campos mínimos para os scripts SQL são:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
DATABASE_URL=postgresql://<usuario_pool>:<senha>@<host>:<porta>/<database>?sslmode=require
```

> O `DATABASE_URL` deve usar o **Pooling → Transactional** do Supabase, que libera o usuário específico do pool.

### Como testar a conexão

1. Exporte as variáveis para o shell atual (o `set -a` evita digitar cada `export`):
	```bash
	set -a && source .env.local && set +a
	```
2. Execute o script de verificação:
	```bash
	node scripts/test-db.js
	```
3. A saída esperada confirma a conexão (`✅ Conectado! now() = ...`) e lista os totais por `sistema_concorrencia`.

Esse mesmo módulo (`db.js`) pode ser reutilizado em outros scripts de manutenção ou migrações, mantendo um único lugar para configurar pool/SSL.

### Estrutura no Supabase

#### Tabelas principais

- `candidates`
	- `id` (uuid, PK)
	- `nome` (text)
	- `sistema_concorrencia` (text)
	- `classificacao_lista` (int4)
	- `id_unico` (text) e outros campos auxiliares

- `user_profiles`
	- `id` (uuid, PK)
	- `user_id` (uuid, FK para auth.users)
	- `candidate_id` (uuid, FK para candidates.id)
	- `role` (text, com CHECK aceitando valores como `PUBLICO`, `COMISSAO`)
	- `telefone`, `instagram`, `facebook`, `outras_redes` (text)
	- `avatar_url` (text)
	- `created_at`, `updated_at` (timestamps)

#### Regras de RLS

- RLS **ativado** em `user_profiles`.
- Políticas principais:
	- `SELECT` onde `auth.uid() = user_id` (cada usuário lê o próprio perfil).
	- `INSERT` permitido para usuários autenticados (`auth.uid() = user_id`).
	- `UPDATE` permitido para usuários autenticados (`auth.uid() = user_id`).
	- Política de desenvolvimento opcional: `INSERT` liberado para facilitar testes.
	- Política específica do fluxo de signup: permite `INSERT` quando `auth.uid() = user_id` **ou** `role = 'COMISSAO'` para perfis institucionais.

> Em produção, recomenda-se revisar e apertar as políticas de desenvolvimento.

#### Storage: fotos de perfil

- Bucket `avatars` (público).
- Políticas:
	- `INSERT` para usuários autenticados (`bucket_id = 'avatars'`).
	- `SELECT` público para exibição dos avatares.

Fluxo de upload em `/signup`:

1. Usuário escolhe uma imagem (PNG/JPG, até 5 MB).
2. O frontend envia para `avatars`, usando `user.id` + extensão como nome do arquivo.
3. O URL público é salvo em `user_profiles.avatar_url`.
4. O painel `/resumo` exibe a foto ou, em fallback, as iniciais do nome.

### Layout / UX

- `/login` e `/signup` usam fundo com padrão “calçadão de SP” e card central cinza claro (`bg-neutral-200/95`).
- Inputs recebem `bg-neutral-300/95`, texto escuro e estados de foco coerentes.
- A seção **“3 · Contato (visível só para a Comissão)”** do `/signup` tem destaque visual com gradiente suave e inclui o upload do avatar.
- `/resumo` mostra o avatar (quando houver) ou iniciais com fallback elegante.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
