const fs = require('fs')
const path = require('path')

const arquivo = path.join(
  __dirname,
  'src',
  'pages',
  'admin.js'
)

if (!fs.existsSync(arquivo)) {
  console.error('❌ Não encontrei:', arquivo)
  process.exit(1)
}

let codigo = fs.readFileSync(
  arquivo,
  'utf8'
)

const inicio = codigo.indexOf(
  'export function setupAdmin()'
)

const fim = codigo.indexOf(
  '\n\nasync function togglePublicacao',
  inicio
)

if (inicio === -1 || fim === -1) {
  console.error(
    '❌ Não consegui localizar a função setupAdmin().'
  )

  process.exit(1)
}

const novaFuncao = `export function setupAdmin() {

  const search =
    document.querySelector('#admin-search')

  const statusFilter =
    document.querySelector('#admin-status-filter')


  const cards = () => [
    ...document.querySelectorAll(
      '.admin-lamina-card'
    )
  ]


  function filtrar() {

    const texto =
      (search?.value || '')
        .trim()
        .toLowerCase()

    const status =
      statusFilter?.value || 'todas'


    cards().forEach(card => {

      const nome =
        card.dataset.nome || ''

      const categoria =
        card.dataset.categoria || ''

      const publicada =
        card.dataset.publicado === 'true'


      const textoOK =
        !texto ||
        nome.includes(texto) ||
        categoria.includes(texto)


      const statusOK =
        status === 'todas' ||
        (
          status === 'publicadas' &&
          publicada
        ) ||
        (
          status === 'ocultas' &&
          !publicada
        )


      card.style.display =
        textoOK && statusOK
          ? ''
          : 'none'

    })

  }


  search?.addEventListener(
    'input',
    filtrar
  )


  statusFilter?.addEventListener(
    'change',
    filtrar
  )


  /*
   * Aparência
   */

  setupAparencia()


  /*
   * Navegação entre seções
   */

  document
    .querySelectorAll('.admin-menu')
    .forEach(menu => {

      menu.addEventListener(
        'click',
        () => {

          const section =
            menu.dataset.section


          document
            .querySelectorAll('.admin-menu')
            .forEach(item => {

              item.classList.remove(
                'active'
              )

            })


          document
            .querySelectorAll('.admin-section')
            .forEach(item => {

              item.classList.remove(
                'active'
              )

            })


          menu.classList.add(
            'active'
          )


          document
            .querySelector(
              \`#admin-section-\${section}\`
            )
            ?.classList.add('active')

        }
      )

    })


  /*
   * Publicar / ocultar
   */

  document
    .querySelectorAll(
      '[data-action="toggle"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          togglePublicacao(
            button.dataset.id
          )

        }
      )

    })


  /*
   * Excluir
   */

  document
    .querySelectorAll(
      '[data-action="delete"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          excluirLamina(
            button.dataset.id
          )

        }
      )

    })


  /*
   * Editar
   */

  document
    .querySelectorAll(
      '[data-action="edit"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          editarLamina(
            button.dataset.id
          )

        }
      )

    })


  /*
   * Logout
   */

  document
    .querySelector('#logout-admin')
    ?.addEventListener(
      'click',
      async () => {

        const {
          error
        } =
          await supabase.auth.signOut()


        if (error) {

          console.error(
            'Erro ao sair:',
            error
          )

          alert(
            'Não foi possível sair da conta.'
          )

          return

        }


        window.location.hash =
          '#login'

      }
    )

}
`

codigo =
  codigo.slice(0, inicio) +
  novaFuncao +
  codigo.slice(fim)

fs.writeFileSync(
  arquivo,
  codigo,
  'utf8'
)

console.log(
  '✅ admin.js corrigido com sucesso!'
)

console.log(
  '➡️ Agora rode: npm.cmd run dev'
)