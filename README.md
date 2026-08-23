# Atlas Histológico

Um atlas de histologia interativo para explorar tecidos, estruturas e lâminas histológicas de forma visual e dinâmica.

## Stack

- **Vite** — build e dev server.
- **Vanilla JS** — SPA renderizada via hash.
- **Supabase** — banco de dados, autenticação, RLS e Storage.
- **OpenSeadragon** — visualização das lâminas com zoom e marcações.
- **Playwright** — testes end-to-end.

## Pré-requisitos

- Node.js (>= 18)
- npm

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (ou copie de `.env.example`):

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

- `VITE_SUPABASE_URL` — URL do projeto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — a **publishable key** (anônima) do Supabase.

> A publishable key é pública por design e usada apenas para o cliente frontend. Ela **não** é a `service_role` key. A `service_role` key nunca deve ser colocada no frontend nem versionada.

## Executar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`.

## Build de produção

```bash
npm run build
```

Os arquivos são gerados em `dist/`.

## Testes

Os testes usam Playwright e sobem o servidor Vite automaticamente:

```bash
npm test
```

Ou, para executar os testes E2E diretamente:

```bash
npx playwright test
```

A suíte inclui testes de roteamento, visualizador (OpenSeadragon), múltiplas imagens, aumento óptico, personalização de cores e responsividade.

## Estrutura do projeto

```
├── index.html
├── playwright.config.ts
├── public/
├── src/
│   ├── main.js               # Roteamento e renderização principal
│   ├── style.css
│   ├── lib/
│   │   ├── supabase.js       # Cliente Supabase + isAdmin
│   │   └── storage-path.js   # Helper de caminhos do Storage
│   └── pages/
│       ├── admin.js          # Painel administrativo
│       ├── aparencia.js      # Personalização visual
│       ├── catalogo.js       # Catálogo público de lâminas
│       ├── login.js          # Autenticação
│       └── nova-lamina.js    # Cadastro/edição de lâminas
├── supabase/migrations/      # Migrations do banco
└── tests/                    # Testes Playwright
```

## Autenticação administrativa

- Visitantes anônimos veem somente as lâminas **publicadas**.
- A administração (`#admin`, `#nova-lamina`, edição, publicação/ocultação, categorias, aparência) exige login.
- O acesso administrativo é verificado no frontend (usuário autenticado) e reforçado no banco via RLS e pela RPC `admin_definir_publicacao`.
- Credenciais de administrador não são versionadas nem documentadas aqui.

## Múltiplas imagens

Cada lâmina pode ter **uma ou mais imagens**:

- A primeira imagem da lista é a **principal**.
- No visualizador, a navegação entre imagens usa os controles ‹ › e as setas do teclado (quando o painel de estudo está fechado).
- As estruturas/marcações pertencem à **imagem principal**.
- Lâminas antigas (sem `lamina_imagens`) utilizam `laminas.imagem_url` como único fallback.

## Storage

- As imagens das lâminas ficam no bucket `laminas`, em caminhos no formato `laminas/<uuid>.<ext>`.
- O upload usa `upsert: false` e, em caso de falha, faz rollback dos arquivos já enviados.
- A exclusão de uma lâmina remove os arquivos do Storage apenas quando não são compartilhados com outras lâminas.
- A lógica de caminhos está centralizada em `src/lib/storage-path.js`.
- A remoção usa a **Storage API** oficial (`supabase.storage.from('laminas').remove(...)`), nunca SQL direto sobre `storage.objects`.

## Notas

- Aumento óptico (ex.: "400×") é um campo de texto livre da lâmina e é exibido no visualizador e no catálogo, distinto do zoom digital do visualizador.
- As cores configuráveis (principal, destaque, fundo, texto) são aplicadas via CSS variables e seguem a configuração salva em `configuracoes_site`.
