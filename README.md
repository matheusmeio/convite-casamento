# Convite Digital White-Label

Projeto estatico de convite digital com efeito flipbook, carregado por `slug` via Supabase.

## Fluxo Operacional Escolhido

O MVP fica em **cadastro manual no Supabase**, sem painel admin neste momento.

Por que esta decisao:

- evita colocar credenciais sensiveis no frontend
- evita construir autenticacao antes de validar vendas
- mantem um unico deploy para todos os casais
- reduz o trabalho operacional a cadastrar um `slug` e um `config jsonb`

## Como Funciona

- deploy unico do frontend estatico
- URL publica por casal: `/?casal=camila-eduardo`
- o frontend busca `public.invitations` no Supabase
- apenas convites com `is_published = true` sao carregados
- sem `?casal=`, o sistema usa `window.defaultWeddingConfig` como fallback de demonstracao

## Cadastro De Um Novo Casal

1. Duplique o JSON de demonstracao salvo em `assets/js/config.js`.
2. Ajuste nomes, data, local, links e paginas.
3. Insira um novo registro em `public.invitations` com:
   - `slug`
   - `is_published`
   - `config`
4. Envie o link final no formato `https://seu-dominio.com/?casal=slug-do-casal`.

## Painel Admin

Rota local/publicada:

- `admin.html`

Fluxo:

1. crie um usuario de admin em `Supabase Auth`
2. acesse `/admin.html`
3. faca login com e-mail e senha
4. informe o `slug`
5. carregue um convite existente ou use o template
6. edite o JSON
7. salve pelo proprio painel

O admin usa:

- leitura e escrita por usuario autenticado (`authenticated`)
- leitura publica apenas para convites publicados (`anon`)
- geracao de SQL de backup no proprio painel

Arquivos do admin:

- `admin.html`
- `assets/css/admin.css`
- `assets/js/admin.js`
- `assets/js/supabase-public.js`
- `assets/templates/invitation-template.json`
- `assets/templates/upsert-invitation-template.sql`

## Seed De Demonstracao

- seed preservado existente: `julia-renan`
- demo comercial adicionada: `camila-eduardo`
- SQL do demo comercial: `supabase/migrations/upsert_camila_eduardo_demo.sql`

## Assets Locais

As artes de demonstracao ficam hospedadas no proprio projeto:

- `assets/media/backgrounds/garden-dusk.svg`
- `assets/media/pages/demo-cover.svg`
- `assets/media/pages/demo-garden-scene.svg`
- `assets/media/pages/demo-closing.svg`

Isso remove a dependencia dos endpoints internos da Trae para imagem.

Bibliotecas e estilos locais usados no frontend:

- `assets/vendor/page-flip/stPageFlip.min.css`
- `assets/vendor/page-flip/page-flip.browser.min.js`

Tipografia:

- o projeto nao depende mais de Google Fonts
- o layout usa stacks locais via CSS (`sans-serif` e `serif`)

## Deploy Na Vercel

Como o projeto e estatico, basta publicar a raiz do repositorio.

Passos minimos:

1. importar o repositorio na Vercel
2. manter framework preset como `Other`
3. definir output como padrao estatico
4. publicar

Depois do deploy, teste:

- `/`
- `/?casal=camila-eduardo`
- `/?casal=julia-renan`
- `/admin.html`

## Auditoria De Producao

Se o deploy abrir uma tela de login da Vercel em vez do convite, o problema nao esta no frontend.

Nesse caso, revise no painel da Vercel:

- deployment protection
- preview protection
- password protection do projeto
- visibilidade do ambiente publicado

## Pendencia Intencional

Nao existe painel admin neste momento. Isso foi deixado de fora de proposito para manter o MVP simples, seguro e barato de operar.
