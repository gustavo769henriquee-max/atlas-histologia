import { renderAparencia, setupAparencia } from './aparencia.js'
import './admin.css'

import { supabase } from '../lib/supabase.js'

export async function renderAdmin() {

  const { data: { user } } =
    await supabase.auth.getUser()

  if (!user) {
    window.location.hash = '#login'
    return ''
  }

  const { data: laminas, error } =
    await supabase
      .from('laminas')
      .select('*')
      .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao carregar lâminas:', error)

    return `
      <div class="admin-page">
        <div class="admin-error">
          Não foi possível carregar as lâminas.
        </div>
      </div>
    `
  }

  const lista = laminas || []

  const publicadas =
    lista.filter(lamina => lamina.publicado === true).length

  const ocultas =
    lista.filter(lamina => lamina.publicado !== true).length

  return `
    <div class="admin-page">

      <header class="admin-header">

        <div class="admin-brand">

          <a href="#inicio" class="admin-logo">
            🔬
          </a>

          <div>
            <strong>Atlas Histológico</strong>
            <small>Painel administrativo</small>
          </div>

        </div>

        <div class="admin-user">

          <span>
            ${escapeHtml(user.email || 'Administrador')}
          </span>

          <button id="logout-admin" class="admin-logout">
            Sair
          </button>

        </div>

      </header>


      <div class="admin-layout">

        <aside class="admin-sidebar">

          <button
            class="admin-menu active"
            data-section="laminas"
          >
            🔬
            <span>Lâminas</span>
          </button>

          <button
            class="admin-menu"
            data-section="categorias"
          >
            🗂️
            <span>Categorias</span>
          </button>

          <button
            class="admin-menu"
            data-section="aparencia"
          >
            🎨
            <span>Aparência</span>
          </button>

          <button
            class="admin-menu"
            data-section="configuracoes"
          >
            ⚙️
            <span>Configurações</span>
          </button>

          <div class="admin-sidebar-bottom">

            <a href="#inicio">
              ← Voltar ao site
            </a>

          </div>

        </aside>


        <main class="admin-content">

          <section
            id="admin-section-laminas"
            class="admin-section active"
          >

            <div class="admin-title-row">

              <div>

                <span class="eyebrow">
                  GERENCIAMENTO
                </span>

                <h1>
                  Lâminas
                </h1>

                <p>
                  Cadastre, edite e controle a publicação das
                  lâminas do Atlas.
                </p>

              </div>

              <a
                href="#nova-lamina"
                class="button primary"
              >
                + Nova lâmina
              </a>

            </div>


            <div class="admin-stats">

              <div class="admin-stat">

                <span>🔬</span>

                <div>
                  <strong>${lista.length}</strong>
                  <small>Total</small>
                </div>

              </div>


              <div class="admin-stat">

                <span>🟢</span>

                <div>
                  <strong>${publicadas}</strong>
                  <small>Publicadas</small>
                </div>

              </div>


              <div class="admin-stat">

                <span>⚪</span>

                <div>
                  <strong>${ocultas}</strong>
                  <small>Ocultas</small>
                </div>

              </div>

            </div>


            <div class="admin-toolbar">

              <div class="admin-search">

                🔎

                <input
                  id="admin-search"
                  type="search"
                  placeholder="Buscar lâmina..."
                >

              </div>

              <select id="admin-status-filter">

                <option value="todas">
                  Todas
                </option>

                <option value="publicadas">
                  Publicadas
                </option>

                <option value="ocultas">
                  Ocultas
                </option>

              </select>

            </div>


            <div
              id="admin-laminas-list"
              class="admin-laminas-list"
            >

              ${renderLaminas(lista)}

            </div>

          </section>


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
                  Gerencie as categorias utilizadas pelas lâminas.
                </p>

              </div>

            </div>


            <div class="admin-placeholder">

              <div>🗂️</div>

              <h2>
                Gerenciamento de categorias
              </h2>

              <p>
                Essa área será ativada na próxima etapa.
              </p>

            </div>

          </section>


          ${await renderAparencia()}


          <section
            id="admin-section-configuracoes"
            class="admin-section"
          >

            <div class="admin-title-row">

              <div>

                <span class="eyebrow">
                  SISTEMA
                </span>

                <h1>
                  Configurações
                </h1>

                <p>
                  Configurações gerais do Atlas.
                </p>

              </div>

            </div>


            <div class="admin-placeholder">

              <div>⚙️</div>

              <h2>
                Configurações gerais
              </h2>

              <p>
                Essa área será configurável diretamente pelo
                administrador.
              </p>

            </div>

          </section>

        </main>

      </div>

    </div>
  `
}


function renderLaminas(laminas) {

  if (!laminas.length) {

    return `
      <div class="admin-empty">

        <div>
          🔬
        </div>

        <h2>
          Nenhuma lâmina encontrada
        </h2>

        <p>
          Comece cadastrando sua primeira lâmina.
        </p>

        <a
          href="#nova-lamina"
          class="button primary"
        >
          + Nova lâmina
        </a>

      </div>
    `
  }


  return laminas.map(lamina => {

    const publicada =
      lamina.publicado === true


    return `
      <article
        class="admin-lamina-card"
        data-id="${lamina.id}"
        data-nome="${escapeHtml(
          lamina.nome || ''
        ).toLowerCase()}"
        data-publicado="${publicada}"
      >

        <div class="admin-lamina-thumb">

          ${
            lamina.imagem_url

              ? `
                <img
                  src="${escapeHtml(lamina.imagem_url)}"
                  alt="${escapeHtml(lamina.nome || 'Lâmina')}"
                >
              `

              : `
                <div class="admin-no-image">
                  🔬
                </div>
              `
          }

        </div>


        <div class="admin-lamina-info">

          <div class="admin-lamina-top">

            <span class="admin-category">
              ${escapeHtml(
                lamina.categoria || 'Histologia'
              )}
            </span>

            <span
              class="admin-status ${
                publicada
                  ? 'published'
                  : 'hidden'
              }"
            >

              ${
                publicada
                  ? '● Publicada'
                  : '○ Oculta'
              }

            </span>

          </div>


          <h2>
            ${escapeHtml(
              lamina.nome || 'Lâmina sem nome'
            )}
          </h2>


          <p>
            ${escapeHtml(
              lamina.descricao || 'Sem descrição.'
            )}
          </p>


          <div class="admin-tags">

            ${
              lamina.tecnica
                ? `<span>🔬 ${escapeHtml(lamina.tecnica)}</span>`
                : ''
            }

            ${
              lamina.coloracao
                ? `<span>🧫 ${escapeHtml(lamina.coloracao)}</span>`
                : ''
            }

          </div>

        </div>


        <div class="admin-lamina-actions">

          <a
            href="#lamina/${lamina.id}"
            class="admin-action view"
            title="Visualizar"
          >
            👁️
          </a>


          <button
            class="admin-action edit"
            data-action="edit"
            data-id="${lamina.id}"
            title="Editar"
          >
            ✏️
          </button>


          <button
            class="admin-action toggle"
            data-action="toggle"
            data-id="${lamina.id}"
            title="${
              publicada
                ? 'Ocultar'
                : 'Publicar'
            }"
          >
            ${
              publicada
                ? '🙈'
                : '🟢'
            }
          </button>


          <button
            class="admin-action delete"
            data-action="delete"
            data-id="${lamina.id}"
            title="Excluir"
          >
            🗑️
          </button>

        </div>

      </article>
    `
  }).join('')
}


export function setupAdmin() {

  const search =
    document.querySelector('#admin-search')

  const statusFilter =
    document.querySelector('#admin-status-filter')


  const cards =
    () => [
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

      const publicada =
        card.dataset.publicado === 'true'


      const textoOK =
        !texto ||
        nome.includes(texto)


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


  setupAparencia()

  document
    .querySelectorAll('.admin-menu')
    .forEach(menu => {

      menu.addEventListener(
        'click',
        () => {

          const section =
            menu.dataset.section


          setupAparencia()

  document
            .querySelectorAll('.admin-menu')
            .forEach(item =>
              item.classList.remove('active')
            )


          document
            .querySelectorAll('.admin-section')
            .forEach(item =>
              item.classList.remove('active')
            )


          menu.classList.add('active')


          document
            .querySelector(
              `#admin-section-${section}`
            )
            ?.classList.add('active')

        }
      )

    })


  document
    .querySelectorAll(
      '[data-action="toggle"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => togglePublicacao(
          button.dataset.id
        )
      )

    })


  document
    .querySelectorAll(
      '[data-action="delete"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => excluirLamina(
          button.dataset.id
        )

      )

    })


  document
    .querySelectorAll(
      '[data-action="edit"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => editarLamina(
          button.dataset.id
        )

      )

    })


  document
    .querySelector('#logout-admin')
    ?.addEventListener(
      'click',
      async () => {

        await supabase.auth.signOut()

        window.location.hash =
          '#login'

      }
    )
}


async function togglePublicacao(id) {

  const { data: lamina, error: buscarErro } =
    await supabase
      .from('laminas')
      .select('publicado')
      .eq('id', id)
      .single()


  if (buscarErro || !lamina) {

    alert(
      'Não foi possível localizar a lâmina.'
    )

    return
  }


  const novoEstado =
    lamina.publicado !== true


  const { error } =
    await supabase
      .from('laminas')
      .update({
        publicado: novoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)


  if (error) {

    console.error(error)

    alert(
      'Erro ao alterar a publicação da lâmina.'
    )

    return
  }


  window.location.hash =
    '#admin'
}


async function excluirLamina(id) {

  const confirmar =
    confirm(
      'Tem certeza que deseja excluir esta lâmina? Esta ação não pode ser desfeita.'
    )


  if (!confirmar) return


  const { error } =
    await supabase
      .from('laminas')
      .delete()
      .eq('id', id)


  if (error) {

    console.error(error)

    alert(
      'Erro ao excluir a lâmina.'
    )

    return
  }


  alert(
    'Lâmina excluída com sucesso.'
  )


  window.location.hash =
    '#admin'
}


function editarLamina(id) {

  window.location.hash =
    `#nova-lamina?editar=${id}`

}


function escapeHtml(value = '') {

  return String(value)

    .replaceAll('&', '&amp;')

    .replaceAll('<', '&lt;')

    .replaceAll('>', '&gt;')

    .replaceAll('"', '&quot;')

    .replaceAll("'", '&#039;')
}





