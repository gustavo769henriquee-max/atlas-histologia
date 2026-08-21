const fs = require('fs')
const { execFileSync } = require('child_process')

const path = './src/pages/catalogo.js'
const source = fs.readFileSync(path, 'utf8')

console.log('=== CORRECAO — SEM CATEGORIA FORA DO ESCOPO ===')

const blocoAtual = `
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

const posBloco = source.indexOf(blocoAtual)

if (posBloco === -1) {
  throw new Error(
    'Bloco Sem categoria nao encontrado exatamente. Nenhuma alteracao feita.'
  )
}

const posRender = source.indexOf(
  'function renderCards(laminas)'
)

if (posRender === -1) {
  throw new Error(
    'function renderCards nao encontrada. Nenhuma alteracao feita.'
  )
}

if (posBloco > posRender) {
  throw new Error(
    'Bloco Sem categoria nao esta antes de renderCards. Nenhuma alteracao feita.'
  )
}

console.log('OK: bloco Sem categoria localizado.')
console.log('OK: renderCards localizado.')

const trechoAntes = source.slice(
  0,
  posBloco
)

const trechoDepois = source.slice(
  posBloco + blocoAtual.length
)

const marcadorFechamento = `
    }
  )
}
`

const posFechamento = trechoAntes.lastIndexOf(
  marcadorFechamento
)

if (posFechamento === -1) {
  throw new Error(
    'Fechamento de preencherCategorias nao encontrado. Nenhuma alteracao feita.'
  )
}

console.log(
  'OK: fechamento de preencherCategorias localizado.'
)

const novoSource =
  trechoAntes.slice(0, posFechamento) +
  `
    }
  )

${blocoAtual}
` +
  trechoAntes.slice(
    posFechamento + marcadorFechamento.length
  ) +
  trechoDepois

if (
  novoSource.indexOf(blocoAtual) === -1
) {
  throw new Error(
    'Bloco Sem categoria desapareceu durante a montagem. Nenhuma alteracao feita.'
  )
}

const backup =
  path +
  '.backup-correcao-escopo-' +
  Date.now() +
  '.js'

fs.copyFileSync(
  path,
  backup
)

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
    '=== CORRECAO CONCLUIDA COM SUCESSO ==='
  )

  console.log(
    '- Sem categoria voltou para dentro de preencherCategorias'
  )

  console.log(
    '- select permanece no escopo correto'
  )

  console.log(
    '- Sintaxe JavaScript OK'
  )

  console.log(
    '- Nenhum npm executado'
  )

} catch (error) {

  fs.writeFileSync(
    path,
    source,
    'utf8'
  )

  console.error('')
  console.error(
    'ERRO NA VALIDACAO — arquivo restaurado.'
  )

  process.exit(1)
}
