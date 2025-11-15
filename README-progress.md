## 2025-11-15 — Landing pública TRT-2 (versão beta)

### 1. Identidade visual e layout geral

- **Fundo global**: página com fundo cinza médio (`bg-neutral-300` / tom semelhante) definido em `app/layout.tsx`.
- **Faixa superior**: barra preta fixa com o texto  
  `📧 Entre em contato com a Comissão` alinhado à direita, usando `mailto:aprovados.tjaa.trt2.2025@gmail.com`.
- **Assets de branding**:
  - Logos oficiais da Comissão em:  
    - `public/Branding/LogoOficial1.png`  
    - `public/Branding/LogoOficial2.png`  
    - `public/Branding/LogoOficial3.png`  
    - `public/Branding/LogoOficial4.png`  
    - `public/Branding/LogoOficial5.png`
  - Padrões do “calçadão de SP” (para uso futuro em seções/backs):  
    - `public/patterns/calcada-red-black.png`  
    - `public/patterns/calcada-red-black1.png`  
    - `public/patterns/calcada-red-white.png.png`
- Criado um **mapeamento central de logos** (ex.: `logos.ts`) para importar as variações de forma tipada, sem usar caminhos soltos no código.

### 2. Hero principal — “Aprovados TRT da 2ª Região”

**Arquivo principal**: `app/page.tsx` (componente `HeroSection`)

- Hero em **cards largos**, ocupando quase toda a largura até ~1440px.
- **Gradiente totalmente vermelho** (horizontal), para evitar o “choque” branco entre versão desktop e mobile.
- **Logo oficial**:
  - Exibida dentro de um card neutro (fundo claro), para respeitar o PNG com transparência.
  - Tamanho e padding ajustados para encaixar sem “sobras” nem recortes.
- **Tipografia**:
  - Linha superior: `COMISSÃO TJAA · CONCURSO 2025` em caixa alta e tamanho menor.
  - Título principal: “Aprovados TRT da 2ª Região”.
  - Descrição em parágrafo com fonte menor, ocupando largura confortável, mantendo boa leitura em desktop e mobile.
- **Card “Ambiente do aprovado”** (lado direito):
  - Card escuro em destaque, posicionado dentro do próprio hero.
  - Texto curto explicando que a área é restrita aos aprovados.
  - **Botão de CTA**:
    - Texto: `Entrar no ambiente do aprovado`.
    - Fundo vermelho escuro **igual** ao topo dos cards de “Resumo” e “Instagram” (tom padrão: algo na faixa do `#b91c1c`).
    - Texto em branco e shadow forte (`0_18px_40px rgba(0,0,0,0.65)`).
    - Hover com tom ainda mais escuro.
  - Botão abre o **modal de acesso restrito** (ver item 4).

### 3. Card “Resumo do concurso TJAA TRT-2”

**Componente**: `ResumoSection` (em `app/page.tsx`)

- Card grande com topo vermelho (mesmo tom dos demais) e corpo branco.
- Largura quase total da linha, acompanhando o hero.
- Estrutura de **slider de indicadores** já pronta para receber dados reais:
  - Array estático `RESUMO_INDICATORS` com 4 indicadores (ex.: total de aprovados, total de nomeados, TDs etc.).
  - Slider exibe **um indicador por vez**, ocupando o corpo inteiro do card (conteúdo centralizado vertical e horizontalmente).
  - **Conteúdo padrão do indicador**:
    - Rótulo (ex.: “Total de aprovados TJAA” / “Por sistema de concorrência” etc.).
    - Valor principal em tipografia grande (ex.: `3.000`, `0`, listas etc.).
    - Subtítulo auxiliar (ex.: “Somatório geral do concurso (dado de exemplo)”) — facilmente substituível por texto real do backend.
  - **Auto-slide**:
    - Muda automaticamente de indicador a cada ~7 segundos (com `setInterval`/`setTimeout` controlando o índice atual).
  - **Navegação manual**:
    - Dots na parte inferior, centralizados.
    - Dot preenchido indica indicador ativo; ao clicar em um dot, troca o slide.
- A altura útil do card foi ajustada para evitar espaços gigantes em branco e manter o conteúdo visualmente equilibrado.

> **Futuro**: basta substituir o array `RESUMO_INDICATORS` por dados vindos do Supabase/BD mantendo a mesma estrutura (`title`, `value`, `description` etc.).

### 4. Card “Instagram da Comissão”

**Componente**: `InstagramSection` (em `app/page.tsx`)

- Layout em dois níveis:
  - Topo vermelho com título `Instagram da Comissão` + botão “Ver perfil” à direita.
  - Corpo branco com **quatro cards** representando posts oficiais.
- Cada “post”:
  - Placeholder textual com handle `@aprovados_tjaa`.
  - Título `Post oficial #1`, `#2`, `#3`, `#4` etc.
  - Link `Ver no Instagram ↗` (pode apontar para o perfil ou para o post específico no futuro).
- **Link oficial do perfil**:
  - Botão “Ver perfil” configurado para `https://www.instagram.com/aprovados_tjaa/`.
- Estrutura também preparada para, no futuro, ser alimentada por API/BD (basta trocar o array de posts placeholder).

### 5. Modal “Ambiente do aprovado”

**Componente**: `RestrictedAccessModal` (em `app/page.tsx`)

- Abre ao clicar no botão “Entrar no ambiente do aprovado” no hero.
- **Conteúdo atual (temporário)**:
  - Título: `Ambiente do aprovado`.
  - Subtítulo: `Acesso restrito em desenvolvimento`.
  - Texto curto explicando que o fluxo de login ainda será definido e que, no futuro, o acesso será validado pelo e-mail oficial do concurso.
  - Botão único `Entendi`, que fecha o modal.
- Fundo da página é escurecido com overlay translúcido; card centralizado tanto no desktop quanto no mobile.
- Esse modal é **placeholder**: o fluxo real (login, e-mail, ID de candidato etc.) será implementado em outra fase.

### 6. Comportamento responsivo

- **Desktop**:
  - Hero ocupando largura máxima com logo à esquerda e card de acesso à direita.
  - Cards de “Resumo” e “Instagram” lado a lado, respeitando o grid.
- **Mobile**:
  - Hero empilhado: logo + textos principais, seguido do card de acesso.
  - Cards de “Resumo” e “Instagram” empilhados verticalmente, com o slider funcionando por swipe/tap (via click nos dots).
  - Gradiente do hero totalmente em tons de vermelho, evitando transição de branco que gerava “estranho” entre as versões.

### 7. Próximos passos (TODO)

- Conectar `ResumoSection` a dados reais do banco (Supabase ou outra fonte).
- Trocar placeholders de posts do Instagram por integração real (API oficial, embed ou processamento manual).
- Definir fluxo de autenticação do “Ambiente do aprovado” (e-mail oficial, ID de candidato etc.) e substituir o modal temporário.
- Eventualmente aplicar o padrão do **calçadão de SP** em seções específicas (rodapés, faixas de destaque) respeitando acessibilidade e legibilidade.
