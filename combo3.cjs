const fs = require('fs')
const { execFileSync } = require('child_process')

const path = './src/pages/catalogo.js'
const source = fs.readFileSync(path, 'utf8')

console.log('=== COMBO 3 — SEM CATEGORIA ===')

if (source.includes('__SEM_CATEGORIA__')) {
  throw new Error(
    'Sem categoria ja existe. Nenhuma alteracao feita.'
  )
}

/*
 * ============================================================
 * 1. LOCALIZAR BLOCO DAS CATEGORIAS
 * ============================================================
 */

const inicioCategorias =
  source.indexOf(';(data || [])')

const fimCategorias =
  source.indexOf(
    'function renderCards',
    inicioCategorias
  )

if (inicioCategorias === -1) {
  throw new Error(
    'Inicio das categorias nao encontrado. Nenhuma alteracao feita.'
  )
}

if (fimCategorias === -1) {
  throw new Error(
    'Fim das categorias nao encontrado. Nenhuma alteracao feita.'
  )
}

const blocoCategorias =
  source.slice(
    inicioCategorias,
    fimCategorias
  )

if (!blocoCategorias.includes('categoria.id')) {
  throw new Error(
    'categoria.id nao encontrado no bloco. Nenhuma alteracao feita.'
  )
}

if (!blocoCategorias.includes('categoria.nome')) {
  throw new Error(
    'categoria.nome nao encontrado no bloco. Nenhuma alteracao feita.'
  )
}

console.log('OK: bloco das categorias localizado.')

/*
 * ============================================================
 * 2. INSERIR "SEM CATEGORIA"
 * ============================================================
 */

const semCategoria =
`
  const semCategoria =
    document.createElement('option')

  semCategoria.value =
    '__SEM_CATEGORIA__'

  semCategoria.textContent =
    'Sem categoria'

  select.appendChild(
    semCategoria
  )

`

let novoSource =
  source.slice(
    0,
    fimCategorias
  ) +
  semCategoria +
  source.slice(
    fimCategorias
  )

/*
 * ============================================================
 * 3. LOCALIZAR CONDICAO DO FILTRO
 * ============================================================
 */

const marcadorFiltro =
  'const correspondeCategoria ='

const inicioFiltro =
  novoSource.indexOf(
    marcadorFiltro
  )

if (inicioFiltro === -1) {
  throw new Error(
    'const correspondeCategoria nao encontrado. Nenhuma alteracao feita.'
  )
}

/*
 * Procuramos o "return" logo depois da condicao.
 * Assim nao dependemos de espacos exatos.
 */

const fimFiltro =
  novoSource.indexOf(
    'return (',
    inicioFiltro
  )

if (fimFiltro === -1) {
  throw new Error(
    'return do filtro nao encontrado. Nenhuma alteracao feita.'
  )
}

const trechoFiltro =
  novoSource.slice(
    inicioFiltro,
    fimFiltro
  )

if (
  !trechoFiltro.includes(
    'lamina.categoria_id === categoriaSelecionada'
  )
) {
  throw new Error(
    'Comparacao categoria_id nao encontrada no filtro. Nenhuma alteracao feita.'
  )
}

console.log('OK: filtro categoria_id localizado.')

/*
 * ============================================================
 * 4. NOVA CONDICAO
 * ============================================================
 */

const novoFiltro =
`const correspondeCategoria =
          !categoriaSelecionada ||
          (
            categoriaSelecionada ===
            '__SEM_CATEGORIA__'
              ? lamina.categoria_id == null
              : lamina.categoria_id === categoriaSelecionada
          )

        `

novoSource =
  novoSource.slice(
    0,
    inicioFiltro
  ) +
  novoFiltro +
  novoSource.slice(
    fimFiltro
  )

/*
 * ============================================================
 * 5. VALIDACAO ANTES DE GRAVAR
 * ============================================================
 */

if (
  !novoSource.includes(
    '__SEM_CATEGORIA__'
  )
) {
  throw new Error(
    'Sem categoria nao foi inserido. Nenhuma alteracao feita.'
  )
}

if (
  !novoSource.includes(
    'lamina.categoria_id == null'
  )
) {
  throw new Error(
    'Tratamento de categoria_id nulo nao foi inserido. Nenhuma alteracao feita.'
  )
}

if (
  !novoSource.includes(
    'lamina.categoria_id === categoriaSelecionada'
  )
) {
  throw new Error(
    'Filtro normal por categoria_id desapareceu. Nenhuma alteracao feita.'
  )
}

/*
 * ============================================================
 * 6. BACKUP
 * ============================================================
 */

const backup =
  path +
  '.backup-combo3-' +
  Date.now() +
  '.js'

fs.copyFileSync(
  path,
  backup
)

console.log('Backup criado:')
console.log(backup)

/*
 * ============================================================
 * 7. GRAVAR
 * ============================================================
 */

try {

  fs.writeFileSync(
    path,
    novoSource,
    'utf8'
  )

  console.log('')
  console.log('Arquivo alterado.')

  /*
   * ==========================================================
   * 8. SINTAXE
   * ==========================================================
   */

  console.log('')
  console.log(
    'Verificando sintaxe JavaScript...'
  )

  execFileSync(
    process.execPath,
    ['--check', path],
    {
      stdio: 'inherit'
    }
  )

  console.log('')
  console.log(
    '=== ALTERACAO CONCLUIDA COM SUCESSO ==='
  )

  console.log('')
  console.log(
    'Implementado:'
  )

  console.log(
    '- Opcao "Sem categoria"'
  )

  console.log(
    '- categoria_id nulo detectado'
  )

  console.log(
    '- Filtro normal por categoria_id preservado'
  )

  console.log(
    '- Sintaxe JavaScript OK'
  )

  console.log(
    '- Nenhum comando npm foi executado'
  )

} catch (error) {

  fs.writeFileSync(
    path,
    source,
    'utf8'
  )

  console.error('')
  console.error(
    'ERRO NA VALIDACAO.'
  )

  console.error(
    'catalogo.js foi restaurado automaticamente.'
  )

  process.exit(1)
}
