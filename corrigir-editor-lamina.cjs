const fs = require('fs')
const path = require('path')

const arquivo = path.join(
  __dirname,
  'src',
  'pages',
  'nova-lamina.js'
)

if (!fs.existsSync(arquivo)) {
  console.error('❌ Não encontrei:')
  console.error(arquivo)
  process.exit(1)
}

let codigo = fs.readFileSync(
  arquivo,
  'utf8'
)

/*
 * ============================================================
 * BACKUP
 * ============================================================
 */

const backup =
  `${arquivo}.backup-${Date.now()}`

fs.writeFileSync(
  backup,
  codigo,
  'utf8'
)

console.log('💾 Backup criado:')
console.log(backup)


/*
 * ============================================================
 * CORREÇÕES
 * ============================================================
 */

let alteracoes = 0


/*
 * 1. GARANTE JSON SEGURO PARA ESTRUTURAS
 */

const antigoEstruturas =
`estruturas =
        carregada.estruturas`

const novoEstruturas =
`estruturas =
        Array.isArray(carregada.estruturas)
          ? carregada.estruturas.map(normalizarEstrutura)
          : []`

if (
  codigo.includes(antigoEstruturas)
) {

  codigo =
    codigo.replace(
      antigoEstruturas,
      novoEstruturas
    )

  alteracoes++

  console.log(
    '✅ Estruturas carregadas com normalização.'
  )

}


/*
 * 2. ADICIONA NORMALIZADOR
 */

if (
  !codigo.includes(
    'function normalizarEstrutura'
  )
) {

  const marcador =
    '\nasync function carregarLamina(id)'

  const normalizador = `

function normalizarEstrutura(
  estrutura = {}
) {

  return {

    nome:
      String(
        estrutura.nome || ''
      ).trim(),

    descricao:
      String(
        estrutura.descricao || ''
      ).trim(),

    x:
      Math.max(
        0,
        Math.min(
          1,
          Number(
            estrutura.x ?? 0.5
          )
        )
      ),

    y:
      Math.max(
        0,
        Math.min(
          1,
          Number(
            estrutura.y ?? 0.5
          )
        )
      ),

    largura:
      Math.max(
        0.01,
        Math.min(
          1,
          Number(
            estrutura.largura ?? 0.08
          )
        )
      ),

    altura:
      Math.max(
        0.01,
        Math.min(
          1,
          Number(
            estrutura.altura ?? 0.08
          )
        )
      )

  }

}
`

  if (
    codigo.includes(marcador)
  ) {

    codigo =
      codigo.replace(
        marcador,
        `${normalizador}${marcador}`
      )

    alteracoes++

    console.log(
      '✅ Normalizador de estruturas adicionado.'
    )

  }

}


/*
 * 3. NORMALIZA ESTRUTURAS ANTES DE SALVAR
 */

const antigoSalvar =
`const dados = {

      nome,

      descricao,

      categoria,

      tecnica,

      coloracao,

      publicado,

      estruturas,`

const novoSalvar =
`const estruturasNormalizadas =
      Array.isArray(estruturas)
        ? estruturas
            .map(normalizarEstrutura)
            .filter(estrutura => estrutura.nome)
        : []

    const dados = {

      nome,

      descricao,

      categoria,

      tecnica,

      coloracao,

      publicado,

      estruturas: estruturasNormalizadas,`

if (
  codigo.includes(antigoSalvar)
) {

  codigo =
    codigo.replace(
      antigoSalvar,
      novoSalvar
    )

  alteracoes++

  console.log(
    '✅ Estruturas serão validadas antes do salvamento.'
  )

}


/*
 * 4. VALIDA IMAGEM
 */

const marcadorImagem =
`const arquivo =
      formData.get('imagem')`

const validacaoImagem =
`const arquivo =
      formData.get('imagem')

    if (
      arquivo &&
      arquivo instanceof File &&
      arquivo.size > 0
    ) {

      if (
        !arquivo.type.startsWith('image/')
      ) {

        throw new Error(
          'O arquivo selecionado não é uma imagem válida.'
        )

      }

      const tamanhoMaximo =
        20 * 1024 * 1024

      if (
        arquivo.size > tamanhoMaximo
      ) {

        throw new Error(
          'A imagem deve ter no máximo 20 MB.'
        )

      }

    }`

if (
  codigo.includes(marcadorImagem) &&
  !codigo.includes(
    'O arquivo selecionado não é uma imagem válida.'
  )
) {

  codigo =
    codigo.replace(
      marcadorImagem,
      validacaoImagem
    )

  alteracoes++

  console.log(
    '✅ Validação de imagem adicionada.'
  )

}


/*
 * 5. VALIDA ESTRUTURAS
 */

const marcadorDados =
`const dados = {`

if (
  codigo.includes(marcadorDados) &&
  !codigo.includes(
    'estruturasNormalizadas'
  )
) {

  console.log(
    '⚠️ Estruturas não foram alteradas automaticamente nesta execução.'
  )

}


/*
 * ============================================================
 * SALVA
 * ============================================================
 */

fs.writeFileSync(
  arquivo,
  codigo,
  'utf8'
)


console.log('')
console.log(
  '=========================================='
)
console.log(
  '✅ EDITOR DE LÂMINAS ATUALIZADO'
)
console.log(
  '=========================================='
)
console.log('')
console.log(
  `Alterações realizadas: ${alteracoes}`
)
console.log('')
console.log(
  'Backup disponível em:'
)
console.log(
  backup
)
console.log('')
console.log(
  'Agora execute:'
)
console.log(
  'npm.cmd run dev'
)
console.log('')
console.log(
  'Depois teste:'
)
console.log(
  '1. Nova lâmina'
)
console.log(
  '2. Adicionar estrutura'
)
console.log(
  '3. Adicionar várias estruturas'
)
console.log(
  '4. Escolher imagem'
)
console.log(
  '5. Salvar'
)
console.log(
  '6. Editar a lâmina'
)
console.log(
  '7. Verificar se as estruturas voltaram'
)