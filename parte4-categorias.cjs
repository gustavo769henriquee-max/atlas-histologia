const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const SRC = path.join(ROOT, 'src')
const PAGES = path.join(SRC, 'pages')

const ADMIN = path.join(PAGES, 'admin.js')
const NOVA_LAMINA = path.join(PAGES, 'nova-lamina.js')

const SQL_FILE = path.join(
  ROOT,
  'supabase-categorias.sql'
)

console.log('')
console.log('==========================================')
console.log(' ATLAS HISTOLÓGICO — PARTE 4')
console.log(' Sistema de categorias')
console.log('==========================================')
console.log('')


/*
 * ============================================================
 * VERIFICAÇÃO
 * ============================================================
 */

for (const arquivo of [
  ADMIN,
  NOVA_LAMINA
]) {

  if (!fs.existsSync(arquivo)) {

    console.error(
      '❌ Arquivo não encontrado:'
    )

    console.error(arquivo)

    process.exit(1)

  }

}


/*
 * ============================================================
 * BACKUPS
 * ============================================================
 */

function backup(arquivo) {

  const destino =
    `${arquivo}.backup-parte4-${Date.now()}`

  fs.copyFileSync(
    arquivo,
    destino
  )

  console.log(
    `💾 Backup: ${path.basename(destino)}`
  )

}

backup(ADMIN)
backup(NOVA_LAMINA)


/*
 * ============================================================
 * SQL DO SUPABASE
 * ============================================================
 */

const sql = `
-- ============================================================
-- ATLAS HISTOLÓGICO
-- PARTE 4 — CATEGORIAS
-- ============================================================

create extension if not exists "pgcrypto";


-- ============================================================
-- TABELA
-- ============================================================

create table if not exists public.categorias (

  id uuid primary key default gen_random_uuid(),

  nome text not null,

  descricao text,

  ativo boolean not null default true,

  ordem integer not null default 0,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);


-- ============================================================
-- NOME ÚNICO
-- ============================================================

create unique index if not exists
categorias_nome_lower_unique
on public.categorias (
  lower(trim(nome))
);


-- ============================================================
-- ÍNDICE
-- ============================================================

create index if not exists
categorias_ordem_idx
on public.categorias (
  ordem,
  nome
);


-- ============================================================
-- RLS
-- ============================================================

alter table public.categorias
enable row level security;


-- ============================================================
-- LEITURA PÚBLICA
-- Categorias ativas podem ser usadas pelo catálogo.
-- ============================================================

drop policy if exists
"categorias_publicas_select"
on public.categorias;

create policy
"categorias_publicas_select"
on public.categorias

for select

using (
  ativo = true
  or
  auth.uid() is not null
);


-- ============================================================
-- ADMIN
-- ============================================================

drop policy if exists
"categorias_admin_insert"
on public.categorias;

create policy
"categorias_admin_insert"
on public.categorias

for insert

to authenticated

with check (
  true
);


drop policy if exists
"categorias_admin_update"
on public.categorias;

create policy
"categorias_admin_update"
on public.categorias

for update

to authenticated

using (
  true
)

with check (
  true
);


drop policy if exists
"categorias_admin_delete"
on public.categorias;

create policy
"categorias_admin_delete"
on public.categorias

for delete

to authenticated

using (
  true
);


-- ============================================================
-- CATEGORIAS INICIAIS
-- Só serão criadas se ainda não existirem.
-- ============================================================

insert into public.categorias
  (nome, descricao, ordem)

values

  (
    'Tecido epitelial',
    'Lâminas relacionadas aos tecidos epiteliais.',
    1
  ),

  (
    'Tecido conjuntivo',
    'Lâminas relacionadas aos tecidos conjuntivos.',
    2
  ),

  (
    'Tecido muscular',
    'Lâminas relacionadas ao tecido muscular.',
    3
  ),

  (
    'Tecido nervoso',
    'Lâminas relacionadas ao tecido nervoso.',
    4
  ),

  (
    'Órgãos',
    'Lâminas de órgãos e sistemas.',
    5
  )

on conflict (
  lower(trim(nome))
)

do nothing;


-- ============================================================
-- FUNÇÃO updated_at
-- ============================================================

create or replace function
public.atualizar_updated_at_categorias()

returns trigger

language plpgsql

as $$
begin

  new.updated_at = now();

  return new;

end;
$$;


-- ============================================================
-- TRIGGER
-- ============================================================

drop trigger if exists
categorias_updated_at
on public.categorias;

create trigger
categorias_updated_at

before update
on public.categorias

for each row

execute function
public.atualizar_updated_at_categorias();


-- ============================================================
-- FINAL
-- ============================================================

select *

from public.categorias

order by ordem, nome;
`

fs.writeFileSync(
  SQL_FILE,
  sql.trimStart(),
  'utf8'
)

console.log('')
console.log(
  '✅ SQL criado: supabase-categorias.sql'
)
console.log('')


/*
 * ============================================================
 * ADMIN.JS
 * ============================================================
 */

let admin =
  fs.readFileSync(
    ADMIN,
    'utf8'
  )


/*
 * Substitui o placeholder de categorias
 */

const placeholderRegex =
/<section\s+id="admin-section-categorias"[\s\S]*?<\/section>/


const categoriasSection = `
<section
  id="admin-section-categorias"
  class="admin-section"
>

  <div class="admin-title-row">

    <div>

      <span class="eyebrow">
        ORGANIZAÇÃO
      </span>

      <h1>
        Categorias
      </h1>

      <p>
        Organize as lâminas do Atlas por categoria.
      </p>

    </div>

    <button
      id="nova-categoria"
      class="button primary"
      type="button"
    >
      + Nova categoria
    </button>

  </div>


  <div
    id="categoria-status"
    class="form-status"
  ></div>


  <div
    id="categoria-form-container"
    class="categoria-form-container"
    hidden
  >

    <div class="form-card">

      <div class="form-card-title">

        <span>
          🗂️
        </span>

        <div>

          <h2 id="categoria-form-title">
            Nova categoria
          </h2>

          <p>
            Cadastre uma categoria para organizar as lâminas.
          </p>

        </div>

      </div>


      <form id="categoria-form">

        <input
          type="hidden"
          id="categoria-id"
        >


        <div class="form-grid">

          <div class="form-field">

            <label for="categoria-nome">
              Nome *
            </label>

            <input
              id="categoria-nome"
              type="text"
              required
              maxlength="100"
              placeholder="Ex.: Tecido epitelial"
            >

          </div>


          <div class="form-field">

            <label for="categoria-ordem">
              Ordem
            </label>

            <input
              id="categoria-ordem"
              type="number"
              min="0"
              step="1"
              value="0"
            >

          </div>


          <div class="form-field full">

            <label for="categoria-descricao">
              Descrição
            </label>

            <textarea
              id="categoria-descricao"
              rows="3"
              maxlength="500"
              placeholder="Descrição opcional da categoria."
            ></textarea>

          </div>


          <div class="form-field">

            <label for="categoria-ativo">
              Status
            </label>

            <select id="categoria-ativo">

              <option value="true">
                🟢 Ativa
              </option>

              <option value="false">
                ⚪ Inativa
              </option>

            </select>

          </div>

        </div>


        <div class="form-actions">

          <button
            type="button"
            id="cancelar-categoria"
            class="button secondary"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="button primary"
          >
            Salvar categoria
          </button>

        </div>

      </form>

    </div>

  </div>


  <div
    id="categorias-lista"
    class="categorias-lista"
  >

    <div class="admin-placeholder">

      <div>🗂️</div>

      <p>
        Carregando categorias...
      </p>

    </div>

  </div>

</section>
`


if (
  placeholderRegex.test(admin)
) {

  admin =
    admin.replace(
      placeholderRegex,
      categoriasSection
    )

  console.log(
    '✅ Área de categorias substituída.'
  )

} else {

  console.log(
    '⚠️ Não encontrei o placeholder de categorias.'
  )

}


/*
 * ============================================================
 * NOVA LAMINA — SELECT
 * ============================================================
 */

let novaLamina =
  fs.readFileSync(
    NOVA_LAMINA,
    'utf8'
  )


const categoriaInputRegex =
/<div class="form-field">\s*<label for="categoria">[\s\S]*?<\/div>\s*(?=<div class="form-field">)/


const categoriaSelect = `
<div class="form-field">

  <label for="categoria">
    Categoria
  </label>

  <select
    id="categoria"
    name="categoria"
  >

    <option value="">
      Selecione uma categoria
    </option>

  </select>

</div>
`


if (
  categoriaInputRegex.test(
    novaLamina
  )
) {

  novaLamina =
    novaLamina.replace(
      categoriaInputRegex,
      categoriaSelect
    )

  console.log(
    '✅ Campo de categoria transformado em seletor.'
  )

} else {

  console.log(
    'ℹ️ Campo de categoria já pode estar configurado.'
  )

}


/*
 * ============================================================
 * FUNÇÕES DE CATEGORIA NO ADMIN
 * ============================================================
 */

const marcador =
'\nexport function setupAdmin()'


const funcoesCategorias = `

async function carregarCategoriasAdmin() {

  const lista =
    document.querySelector(
      '#categorias-lista'
    )

  if (!lista) return


  lista.innerHTML = \`
    <div class="admin-placeholder">
      <div>⏳</div>
      <p>Carregando categorias...</p>
    </div>
  \`


  const {
    data,
    error
  } =
    await supabase
      .from('categorias')
      .select('*')
      .order('ordem', {
        ascending: true
      })
      .order('nome', {
        ascending: true
      })


  if (error) {

    console.error(
      'Erro ao carregar categorias:',
      error
    )

    lista.innerHTML = \`
      <div class="admin-error">
        Não foi possível carregar as categorias.
      </div>
    \`

    return

  }


  const categorias =
    data || []


  if (!categorias.length) {

    lista.innerHTML = \`
      <div class="admin-empty">
        <div>🗂️</div>
        <h2>Nenhuma categoria</h2>
        <p>Crie sua primeira categoria.</p>
      </div>
    \`

    return

  }


  lista.innerHTML =
    categorias
      .map(
        categoria => \`

          <article
            class="categoria-card"
            data-id="\${categoria.id}"
          >

            <div class="categoria-card-icon">
              🗂️
            </div>


            <div class="categoria-card-info">

              <div class="categoria-card-top">

                <span class="admin-category">
                  \${escapeHtml(
                    categoria.nome
                  )}
                </span>

                <span
                  class="admin-status \${
                    categoria.ativo
                      ? 'published'
                      : 'hidden'
                  }"
                >
                  \${
                    categoria.ativo
                      ? '● Ativa'
                      : '○ Inativa'
                  }
                </span>

              </div>


              <h2>
                \${escapeHtml(
                  categoria.nome
                )}
              </h2>


              <p>
                \${escapeHtml(
                  categoria.descricao ||
                  'Sem descrição.'
                )}
              </p>


              <small>
                Ordem: \${categoria.ordem}
              </small>

            </div>


            <div class="admin-lamina-actions">

              <button
                type="button"
                class="admin-action edit"
                data-categoria-edit="\${categoria.id}"
                title="Editar"
              >
                ✏️
              </button>


              <button
                type="button"
                class="admin-action toggle"
                data-categoria-toggle="\${categoria.id}"
                title="\${
                  categoria.ativo
                    ? 'Desativar'
                    : 'Ativar'
                }"
              >
                \${
                  categoria.ativo
                    ? '🙈'
                    : '🟢'
                }
              </button>


              <button
                type="button"
                class="admin-action delete"
                data-categoria-delete="\${categoria.id}"
                title="Excluir"
              >
                🗑️
              </button>

            </div>

          </article>

        \`
      )
      .join('')


  lista
    .querySelectorAll(
      '[data-categoria-edit]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => editarCategoria(
          button.dataset.categoriaEdit,
          categorias
        )
      )

    })


  lista
    .querySelectorAll(
      '[data-categoria-toggle]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => alternarCategoria(
          button.dataset.categoriaToggle,
          categorias
        )
      )

    })


  lista
    .querySelectorAll(
      '[data-categoria-delete]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => excluirCategoria(
          button.dataset.categoriaDelete
        )
      )

    })

}


function abrirFormularioCategoria(
  categoria = null
) {

  const container =
    document.querySelector(
      '#categoria-form-container'
    )

  const id =
    document.querySelector(
      '#categoria-id'
    )

  const nome =
    document.querySelector(
      '#categoria-nome'
    )

  const descricao =
    document.querySelector(
      '#categoria-descricao'
    )

  const ordem =
    document.querySelector(
      '#categoria-ordem'
    )

  const ativo =
    document.querySelector(
      '#categoria-ativo'
    )

  const titulo =
    document.querySelector(
      '#categoria-form-title'
    )


  if (!container) return


  container.hidden = false


  if (categoria) {

    titulo.textContent =
      'Editar categoria'

    id.value =
      categoria.id || ''

    nome.value =
      categoria.nome || ''

    descricao.value =
      categoria.descricao || ''

    ordem.value =
      categoria.ordem ?? 0

    ativo.value =
      categoria.ativo === false
        ? 'false'
        : 'true'

  } else {

    titulo.textContent =
      'Nova categoria'

    id.value = ''

    nome.value = ''

    descricao.value = ''

    ordem.value = '0'

    ativo.value = 'true'

  }


  nome.focus()

}


function fecharFormularioCategoria() {

  const container =
    document.querySelector(
      '#categoria-form-container'
    )

  if (!container) return

  container.hidden = true

}


async function salvarCategoria(event) {

  event.preventDefault()


  const id =
    document.querySelector(
      '#categoria-id'
    )?.value || ''


  const nome =
    document.querySelector(
      '#categoria-nome'
    )?.value
      .trim() || ''


  const descricao =
    document.querySelector(
      '#categoria-descricao'
    )?.value
      .trim() || ''


  const ordem =
    Number(
      document.querySelector(
        '#categoria-ordem'
      )?.value || 0
    )


  const ativo =
    document.querySelector(
      '#categoria-ativo'
    )?.value === 'true'


  if (!nome) {

    mostrarStatusCategoria(
      'Digite o nome da categoria.',
      'error'
    )

    return

  }


  if (
    !Number.isInteger(ordem) ||
    ordem < 0
  ) {

    mostrarStatusCategoria(
      'A ordem deve ser um número inteiro maior ou igual a zero.',
      'error'
    )

    return

  }


  mostrarStatusCategoria(
    'Salvando categoria...',
    'loading'
  )


  const dados = {

    nome,

    descricao,

    ordem,

    ativo,

    updated_at:
      new Date().toISOString()

  }


  let resultado


  if (id) {

    resultado =
      await supabase
        .from('categorias')
        .update(dados)
        .eq('id', id)

  } else {

    resultado =
      await supabase
        .from('categorias')
        .insert({
          ...dados,
          created_at:
            new Date().toISOString()
        })

  }


  if (resultado.error) {

    console.error(
      resultado.error
    )


    const mensagem =
      resultado.error.code === '23505'
        ? 'Já existe uma categoria com esse nome.'
        : resultado.error.message


    mostrarStatusCategoria(
      mensagem,
      'error'
    )

    return

  }


  mostrarStatusCategoria(
    id
      ? 'Categoria atualizada com sucesso!'
      : 'Categoria criada com sucesso!',
    'success'
  )


  fecharFormularioCategoria()

  await carregarCategoriasAdmin()

}


function editarCategoria(
  id,
  categorias
) {

  const categoria =
    categorias.find(
      item =>
        String(item.id) ===
        String(id)
    )


  if (!categoria) return


  abrirFormularioCategoria(
    categoria
  )

}


async function alternarCategoria(
  id,
  categorias
) {

  const categoria =
    categorias.find(
      item =>
        String(item.id) ===
        String(id)
    )


  if (!categoria) return


  const novoEstado =
    categoria.ativo !== true


  const {
    error
  } =
    await supabase
      .from('categorias')
      .update({
        ativo: novoEstado,
        updated_at:
          new Date().toISOString()
      })
      .eq('id', id)


  if (error) {

    console.error(error)

    mostrarStatusCategoria(
      'Não foi possível alterar o status da categoria.',
      'error'
    )

    return

  }


  await carregarCategoriasAdmin()

}


async function excluirCategoria(id) {

  const {
    count,
    error: countError
  } =
    await supabase
      .from('laminas')
      .select('id', {
        count: 'exact',
        head: true
      })
      .eq(
        'categoria_id',
        id
      )


  if (
    !countError &&
    count > 0
  ) {

    mostrarStatusCategoria(
      'Esta categoria está sendo usada por uma ou mais lâminas. Desative-a em vez de excluí-la.',
      'error'
    )

    return

  }


  const confirmar =
    confirm(
      'Tem certeza que deseja excluir esta categoria?'
    )


  if (!confirmar) return


  const {
    error
  } =
    await supabase
      .from('categorias')
      .delete()
      .eq('id', id)


  if (error) {

    console.error(error)

    mostrarStatusCategoria(
      'Não foi possível excluir a categoria.',
      'error'
    )

    return

  }


  mostrarStatusCategoria(
    'Categoria excluída com sucesso.',
    'success'
  )


  await carregarCategoriasAdmin()

}


function mostrarStatusCategoria(
  mensagem,
  tipo
) {

  const elemento =
    document.querySelector(
      '#categoria-status'
    )

  if (!elemento) return


  elemento.textContent =
    mensagem


  elemento.className =
    \`form-status \${tipo || ''}\`

}


async function carregarCategoriasLamina(
  valorAtual = ''
) {

  const select =
    document.querySelector(
      '#categoria'
    )

  if (!select) return


  const {
    data,
    error
  } =
    await supabase
      .from('categorias')
      .select(
        'id, nome, ativo, ordem'
      )
      .eq(
        'ativo',
        true
      )
      .order(
        'ordem',
        {
          ascending: true
        }
      )
      .order(
        'nome',
        {
          ascending: true
        }
      )


  if (error) {

    console.error(
      'Erro ao carregar categorias:',
      error
    )

    return

  }


  select.innerHTML = \`
    <option value="">
      Selecione uma categoria
    </option>
  \`


  ;(data || [])
    .forEach(
      categoria => {

        const option =
          document.createElement(
            'option'
          )

        option.value =
          categoria.nome

        option.textContent =
          categoria.nome

        if (
          categoria.nome ===
          valorAtual
        ) {

          option.selected = true

        }

        select.appendChild(
          option
        )

      }
    )

}
`


if (
  !admin.includes(
    'async function carregarCategoriasAdmin()'
  )
) {

  admin =
    admin.replace(
      marcador,
      `${funcoesCategorias}${marcador}`
    )

  console.log(
    '✅ Funções de categorias adicionadas ao admin.'
  )

}


/*
 * ============================================================
 * SETUP ADMIN — INICIALIZA CATEGORIAS
 * ============================================================
 */

const setupMarker =
`export function setupAdmin() {

`

if (
  admin.includes(setupMarker) &&
  !admin.includes(
    "document.querySelector('#nova-categoria')"
  )
) {

  const inicializacao = `  document
    .querySelector('#nova-categoria')
    ?.addEventListener(
      'click',
      () => abrirFormularioCategoria()
    )


  document
    .querySelector('#cancelar-categoria')
    ?.addEventListener(
      'click',
      fecharFormularioCategoria
    )


  document
    .querySelector('#categoria-form')
    ?.addEventListener(
      'submit',
      salvarCategoria
    )


  carregarCategoriasAdmin()


`

  admin =
    admin.replace(
      setupMarker,
      `${setupMarker}${inicializacao}`
    )

  console.log(
    '✅ Inicialização de categorias adicionada.'
  )

}


/*
 * ============================================================
 * NOVA LAMINA — CARREGAMENTO
 * ============================================================
 */

const setupNovaMarker =
`export async function setupNovaLamina() {

`

if (
  novaLamina.includes(
    setupNovaMarker
  ) &&
  !novaLamina.includes(
    'carregarCategoriasLamina'
  )
) {

  const inicializacao =
`  await carregarCategoriasLamina()


`

  novaLamina =
    novaLamina.replace(
      setupNovaMarker,
      `${setupNovaMarker}${inicializacao}`
    )

}


/*
 * ============================================================
 * ADICIONA FUNÇÃO DE CATEGORIA AO NOVA-LAMINA
 * ============================================================
 */

if (
  !novaLamina.includes(
    'async function carregarCategoriasLamina'
  )
) {

  const funcao =
`

async function carregarCategoriasLamina(
  valorAtual = ''
) {

  const select =
    document.querySelector(
      '#categoria'
    )

  if (!select) return


  const {
    data,
    error
  } =
    await supabase
      .from('categorias')
      .select(
        'id, nome, ativo, ordem'
      )
      .eq(
        'ativo',
        true
      )
      .order(
        'ordem',
        {
          ascending: true
        }
      )
      .order(
        'nome',
        {
          ascending: true
        }
      )


  if (error) {

    console.error(
      'Erro ao carregar categorias:',
      error
    )

    return

  }


  select.innerHTML = \`
    <option value="">
      Selecione uma categoria
    </option>
  \`


  ;(data || [])
    .forEach(
      categoria => {

        const option =
          document.createElement(
            'option'
          )

        option.value =
          categoria.nome

        option.textContent =
          categoria.nome

        if (
          categoria.nome ===
          valorAtual
        ) {

          option.selected = true

        }

        select.appendChild(
          option
        )

      }
    )

}


`

  const marcadorFinal =
    '\nfunction mostrarStatus('

  if (
    novaLamina.includes(
      marcadorFinal
    )
  ) {

    novaLamina =
      novaLamina.replace(
        marcadorFinal,
        `${funcao}${marcadorFinal}`
      )

  }

}


/*
 * ============================================================
 * CUIDADO COM CATEGORIA NA EDIÇÃO
 * ============================================================
 */

const categoriaAtual =
`document.querySelector('#categoria').value =
    data.categoria || ''`

if (
  novaLamina.includes(
    categoriaAtual
  )
) {

  novaLamina =
    novaLamina.replace(
      categoriaAtual,
`await carregarCategoriasLamina(
    data.categoria || ''
  )`
    )

  console.log(
    '✅ Categoria da edição será selecionada automaticamente.'
  )

}


/*
 * ============================================================
 * SALVA ARQUIVOS
 * ============================================================
 */

fs.writeFileSync(
  ADMIN,
  admin,
  'utf8'
)

fs.writeFileSync(
  NOVA_LAMINA,
  novaLamina,
  'utf8'
)


/*
 * ============================================================
 * RESULTADO
 * ============================================================
 */

console.log('')
console.log(
  '=========================================='
)
console.log(
  '✅ PARTE 4 PREPARADA'
)
console.log(
  '=========================================='
)
console.log('')

console.log(
  'Arquivos alterados:'
)

console.log(
  ' • src/pages/admin.js'
)

console.log(
  ' • src/pages/nova-lamina.js'
)

console.log('')

console.log(
  'SQL criado:'
)

console.log(
  ' • supabase-categorias.sql'
)

console.log('')

console.log(
  '⚠️ PRÓXIMO PASSO OBRIGATÓRIO:'
)

console.log(
  '1. Abra o Supabase'
)

console.log(
  '2. Vá em SQL Editor'
)

console.log(
  '3. Abra supabase-categorias.sql'
)

console.log(
  '4. Cole o conteúdo'
)

console.log(
  '5. Execute o SQL'
)

console.log('')

console.log(
  'Depois rode:'
)

console.log(
  'npm.cmd run dev'
)

console.log('')