import { supabase } from '../lib/supabase.js'

const app = document.querySelector('#app')

let todasLaminas = []

export async function renderCatalogo() {

  app.innerHTML = `
    <header class="header">
      <div class="container header-content">

        <a href="#inicio" class="brand">
          <span class="brand-icon">🔬</span>

          <span>
            <strong>Atlas</strong>
            <small>Histológico</small>
          </span>
        </a>

        <nav class="nav">
          <a href="#inicio">Início</a>
          <a href="#laminas" class="active">Lâminas</a>
          <a href="#sobre">Sobre</a>
          <a href="#login">Administração</a>
        </nav>

      </div>
    </header>


    <main>

      <section class="catalog-hero">

        <div class="container">

          <span class="eyebrow">
            🔬 ATLAS HISTOLÓGICO
          </span>

          <h1>
            Explore as lâminas
          </h1>

          <p>
            Navegue pelo acervo e explore as estruturas
            microscópicas em alta resolução.
          </p>

        </div>

      </section>


      <section class="catalog-section">

        <div class="container">

          <div class="catalog-tools">

            <div class="search-box">

              <span>🔎</span>

              <input
                id="search-laminas"
                type="search"
                placeholder="Buscar lâmina..."
                autocomplete="off"
              >

            </div>


            <select id="filter-categoria">

              <option value="">
                Todas as categorias
              </option>

            </select>

          </div>


          <div
            id="catalog-status"
            class="catalog-status"
          >
            Carregando lâminas...
          </div>


          <div
            id="catalog-grid"
            class="catalog-grid"
          ></div>

        </div>

      </section>

    </main>


    <footer class="footer">

      <div class="container">

        <span>
          🔬 Atlas Histológico
        </span>

        <span>
          Projeto acadêmico
        </span>

      </div>

    </footer>
  `


  await carregarLaminas()

  configurarFiltros()
}


async function carregarLaminas() {

  const status =
    document.querySelector('#catalog-status')


  const grid =
    document.querySelector('#catalog-grid')


  const {
    data,
    error
  } =
    await supabase
      .from('laminas')
      .select('*')
      .eq('publicado', true)
      .order('created_at', {
        ascending: false
      })


  if (error) {

    console.error(
      'Erro ao carregar lâminas:',
      error
    )


    status.textContent =
      'Não foi possível carregar as lâminas.'


    return
  }


  todasLaminas =
    data || []


  const {
    data: categoriasData,
    error: categoriasError
  } =
    await supabase
      .from('categorias')
      .select('id, nome')
      .eq(
        'ativo',
        true
      )


  if (categoriasError) {

    console.error(
      'Erro ao carregar categorias das lâminas:',
      categoriasError
    )

  }


  const categoriasPorId =
    new Map(
      (categoriasData || [])
        .map(
          categoria => [
            categoria.id,
            categoria.nome
          ]
        )
    )


  todasLaminas =
    todasLaminas.map(
      lamina => ({
        ...lamina,

        categoria_nome:
          categoriasPorId.get(
            lamina.categoria_id
          ) ||
          lamina.categoria ||
          'Histologia'
      })
    )


  await preencherCategorias()

  renderCards(todasLaminas)
}


async function preencherCategorias() {

  const select =
    document.querySelector('#filter-categoria')

  if (!select) return


  const {
    data,
    error
  } =
    await supabase
      .from('categorias')
      .select('id, nome, ativo, ordem')
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

    select.innerHTML = `
      <option value="">
        Não foi possível carregar as categorias
      </option>
    `

    return
  }


  select.innerHTML = `
    <option value="">
      Todas as categorias
    </option>
  `


  ;(data || [])
    .forEach(
      categoria => {

        const option =
          document.createElement(
            'option'
          )

        option.value =
          categoria.id

        option.textContent =
          categoria.nome

        select.appendChild(
          option
        )

      }
    )
}


function renderCards(laminas) {

  const grid =
    document.querySelector('#catalog-grid')


  const status =
    document.querySelector('#catalog-status')


  status.textContent =
    `${laminas.length} ${
      laminas.length === 1
        ? 'lâmina encontrada'
        : 'lâminas encontradas'
    }`


  if (!laminas.length) {

    grid.innerHTML = `

      <div class="empty-catalog">

        <div class="empty-icon">
          🔬
        </div>

        <h2>
          Nenhuma lâmina encontrada
        </h2>

        <p>
          Tente mudar a busca ou o filtro.
        </p>

      </div>

    `

    return
  }


  grid.innerHTML =
    laminas.map(lamina => `

      <article class="lamina-card">

        <div class="lamina-image">

          ${
            lamina.imagem_url

              ? `
                <img
                  src="${escapeHtml(lamina.imagem_url)}"
                  alt="${escapeHtml(lamina.nome || 'Lâmina histológica')}"
                  loading="lazy"
                >
              `

              : `
                <div class="no-image">
                  🔬
                </div>
              `
          }


          <div class="image-overlay">

            <a
              href="#lamina/${lamina.id}"
              class="explore-button"
            >
              Explorar →
            </a>

          </div>

        </div>


        <div class="lamina-content">

          <div class="lamina-category">

            ${escapeHtml(
              lamina.categoria_nome ||
              lamina.categoria ||
              'Histologia'
            )}

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


          <div class="lamina-tags">

            ${
              lamina.tecnica
                ? `
                  <span>
                    🔬 ${escapeHtml(lamina.tecnica)}
                  </span>
                `
                : ''
            }


            ${
              lamina.coloracao
                ? `
                  <span>
                    🧫 ${escapeHtml(lamina.coloracao)}
                  </span>
                `
                : ''
            }

          </div>


          <a
            href="#lamina/${lamina.id}"
            class="card-link"
          >
            Explorar lâmina
            <span>→</span>
          </a>

        </div>

      </article>

    `).join('')
}


function configurarFiltros() {

  const busca =
    document.querySelector('#search-laminas')


  const categoria =
    document.querySelector('#filter-categoria')


  function aplicarFiltros() {

    const texto =
      busca.value
        .trim()
        .toLowerCase()


    const categoriaSelecionada =
      categoria.value


    const resultado =
      todasLaminas.filter(lamina => {

        const textoCompleto =
          `
            ${lamina.nome || ''}
            ${lamina.descricao || ''}
            ${lamina.tecnica || ''}
            ${lamina.coloracao || ''}
            ${lamina.categoria_nome || ''}
            ${lamina.categoria || ''}
          `
            .toLowerCase()


        const correspondeTexto =
          !texto ||
          textoCompleto.includes(texto)


        const correspondeCategoria =
          !categoriaSelecionada ||
          lamina.categoria_id === categoriaSelecionada


        return (
          correspondeTexto &&
          correspondeCategoria
        )
      })


    renderCards(resultado)
  }


  busca.addEventListener(
    'input',
    aplicarFiltros
  )


  categoria.addEventListener(
    'change',
    aplicarFiltros
  )
}


function escapeHtml(value = '') {

  return String(value)

    .replaceAll('&', '&amp;')

    .replaceAll('<', '&lt;')

    .replaceAll('>', '&gt;')

    .replaceAll('"', '&quot;')

    .replaceAll("'", '&#039;')
}

