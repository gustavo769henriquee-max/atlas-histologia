const fs = require('fs')

const path = './src/pages/catalogo.js'
const s = fs.readFileSync(path, 'utf8')

const marcador1 = 'select.appendChild'
const marcador2 = 'lamina.categoria_id === categoriaSelecionada'

const pos1 = s.indexOf(marcador1)
const pos2 = s.indexOf(marcador2)

console.log('=== POSICOES DOS MARCADORES ===')
console.log('select.appendChild:', pos1)
console.log('categoria_id ===:', pos2)

console.log('')
console.log('=== TRECHO CATEGORIAS ===')
console.log(
  s.slice(
    Math.max(0, pos1 - 250),
    pos1 + 300
  )
)

console.log('')
console.log('=== TRECHO FILTRO ===')
console.log(
  s.slice(
    Math.max(0, pos2 - 250),
    pos2 + 250
  )
)

console.log('')
console.log('=== NENHUMA ALTERACAO ===')
