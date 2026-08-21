const fs = require('fs')
const { execFileSync } = require('child_process')

const path = './src/pages/catalogo.js'
const source = fs.readFileSync(path, 'utf8')

console.log('=== CORRECAO REAL DE ESCOPO ===')

const semInicio = source.indexOf(
  "  const semCategoria ="
)

const renderInicio = source.indexOf(
  "function renderCards(laminas)"
)

const preencherInicio = source.indexOf(
  "async function preencherCategorias()"
)

if (
  preencherInicio === -1 ||
  semInicio === -1 ||
  renderInicio === -1
) {
  throw new Error(
    'Estrutura esperada nao encontrada. Nenhuma alteracao feita.'
  )
}

if (
  !(preencherInicio < semInicio &&
    semInicio < renderInicio)
) {
  throw new Error(
    'Ordem estrutural inesperada. Nenhuma alteracao feita.'
  )
}

console.log('OK: preencherCategorias localizado.')
console.log('OK: bloco Sem categoria localizado.')
console.log('OK: renderCards localizado.')

/*
 * O ultimo fechamento "}" antes de Sem categoria
 * e o fechamento atual de preencherCategorias.
 */

const fechamentoAtual =
  source.lastIndexOf(
    '\n}',
    semInicio
  )

if (fechamentoAtual === -1) {
  throw new Error(
    'Fechamento atual nao encontrado. Nenhuma alteracao feita.'
  )
}

console.log(
  'OK: fechamento atual localizado na posicao:',
  fechamentoAtual
)

/*
 * Localiza o fim do bloco Sem categoria.
 */

const marcadorFim =
`  select.appendChild(
    semCategoria
  )`

const fimSemCategoria =
  source.indexOf(
    marcadorFim,
    semInicio
  )

if (fimSemCategoria === -1) {
  throw new Error(
    'Fim do bloco Sem categoria nao encontrado. Nenhuma alteracao feita.'
  )
}

const fimBloco =
  fimSemCategoria +
  marcadorFim.length

console.log(
  'OK: bloco Sem categoria delimitado.'
)

/*
 * Retira o fechamento antigo.
 */

const semBloco =
  source.slice(
    semInicio,
    fimBloco
  )

const antes =
  source.slice(
    0,
    fechamentoAtual
  )

const depois =
  source.slice(
    fimBloco
  )

/*
 * Monta:
 *
 * forEach(...)
 *
 * Sem categoria
 *
 * }
 *
 * function renderCards
 */

const novoSource =
  antes +
  '\n\n' +
  semBloco +
  '\n}\n\n' +
  depois

/*
 * Validacoes finais antes de gravar.
 */

if (
  !novoSource.includes(
    "semCategoria.textContent ="
  )
) {
  throw new Error(
    'Sem categoria desapareceu. Nenhuma alteracao feita.'
  )
}

if (
  !novoSource.includes(
    "function renderCards(laminas)"
  )
) {
  throw new Error(
    'renderCards desapareceu. Nenhuma alteracao feita.'
  )
}

/*
 * Confere que o fechamento agora vem
 * depois do bloco Sem categoria.
 */

const novaPosSem =
  novoSource.indexOf(
    "  const semCategoria ="
  )

const novaPosRender =
  novoSource.indexOf(
    "function renderCards(laminas)"
  )

const fechamentoDepois =
  novoSource.lastIndexOf(
    '\n}',
    novaPosRender
  )

if (
  fechamentoDepois <= novaPosSem
) {
  throw new Error(
    'O fechamento ainda nao ficou depois de Sem categoria. Nenhuma alteracao feita.'
  )
}

const backup =
  path +
  '.backup-escopo-real-' +
  Date.now() +
  '.js'

fs.copyFileSync(
  path,
  backup
)

console.log('')
console.log('Backup criado:')
console.log(backup)

try {

  fs.writeFileSync(
    path,
    novoSource,
    'utf8'
  )

  console.log('')
  console.log('Arquivo alterado.')

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
    '=== CORRECAO CONCLUIDA ==='
  )

  console.log(
    'Sem categoria esta dentro de preencherCategorias().'
  )

  console.log(
    'Sintaxe OK.'
  )

  console.log(
    'Nenhum npm executado.'
  )

} catch (error) {

  fs.writeFileSync(
    path,
    source,
    'utf8'
  )

  console.error('')
  console.error(
    'ERRO: arquivo restaurado automaticamente.'
  )

  process.exit(1)
}
