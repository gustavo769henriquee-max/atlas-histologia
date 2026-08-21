import './style.css'
import OpenSeadragon from 'openseadragon'
import { supabase, isAdmin } from './lib/supabase.js'

import { renderLogin, setupLogin } from './pages/login.js'
import { renderAdmin, setupAdmin } from './pages/admin.js'
import { renderCatalogo } from './pages/catalogo.js'
import { renderNovaLamina, setupNovaLamina } from './pages/nova-lamina.js'


const app = document.querySelector('#app')


/* ============================================================
   CONFIGURAÇÕES VISUAIS
   ============================================================ */

function aplicarConfiguracoesVisuais(config = {}) {

  const root = document.documentElement

  if (config.cor_principal) {
    root.style.setProperty('--green', config.cor_principal)
    root.style.setProperty('--green-light', config.cor_principal)
    root.style.setProperty('--cor-principal', config.cor_principal)
  }

  if (config.cor_fundo) {
    root.style.setProperty('--cream', config.cor_fundo)
    root.style.setProperty('--cor-fundo', config.cor_fundo)
  }

  if (config.cor_texto) {
    root.style.setProperty('--text', config.cor_texto)
    root.style.setProperty('--cor-texto', config.cor_texto)
  }

  if (config.cor_destaque) {
    root.style.setProperty('--green-light', config.cor_destaque)
    root.style.setProperty('--cor-destaque', config.cor_destaque)
  }

}


async function carregarConfiguracoesSite() {

  const { data, error } =
    await supabase
      .from('configuracoes_site')
      .select('*')
      .limit(1)
      .maybeSingle()

  if (error) {

    console.error(
      'Erro ao carregar configurações do site:',
      error
    )

    return {}
  }

  return data || {}

}


/* ============================================================
   ROTAS
   ============================================================ */

function getRoute() {

  const hash =
    window.location.hash

  if (hash === '#login') {
    return 'login'
  }

  if (hash === '#admin') {
    return 'admin'
  }

  if (hash.startsWith('#nova-lamina')) {
    return 'nova-lamina'
  }

  if (hash === '#laminas') {
    return 'catalogo'
  }

  if (hash.startsWith('#lamina/')) {
    return 'lamina'
  }

  return 'home'

}


/* ============================================================
   HEADER
   ============================================================ */

function renderHeader(config = {}) {

  return `
    <header class="header">

      <div class="container header-content">

        <a href="#inicio" class="brand">

          <span
            class="brand-icon"
            style="
              width: ${Number(config.logo_tamanho || 100) * 0.42}px;
              height: ${Number(config.logo_tamanho || 100) * 0.42}px;
            "
          >

            ${
              config.logo_url
                ? `
                  <img
                    src="${escapeHtml(config.logo_url)}"
                    alt="Logo"
                    style="
                      width:100%;
                      height:100%;
                      object-fit:contain;
                    "
                  >
                `
                : '🔬'
            }

          </span>

          <span>

            <strong>
              ${escapeHtml(config.nome_site || 'Atlas')}
            </strong>

            <small>
              ${escapeHtml(config.subtitulo || 'Histológico')}
            </small>

          </span>

        </a>


        <nav class="nav">

          <a href="#inicio">
            Início
          </a>

          <a href="#laminas">
            Lâminas
          </a>

          <a href="#sobre">
            Sobre
          </a>

          <a href="#login">
            Administração
          </a>

        </nav>

      </div>

    </header>
  `

}


/* ============================================================
   HOME
   ============================================================ */

function renderHome(config = {}) {

  return `
    ${renderHeader(config)}

    <main>

      <section
        class="hero"
        id="inicio"
      >

        <div class="container hero-grid">

          <div class="hero-text">

            <span class="eyebrow">
              🔬 MICROSCOPIA • ESTUDO • EXPLORAÇÃO
            </span>

            <h1>
              ${escapeHtml(
                config.titulo_inicio ||
                'Explore o mundo microscópico.'
              )}
            </h1>

            <p>
              ${escapeHtml(
                config.descricao_inicio ||
                'Um atlas de histologia interativo para explorar tecidos, estruturas e lâminas histológicas de uma forma visual e dinâmica.'
              )}
            </p>

            <div class="hero-actions">

              <a
                href="#laminas"
                class="button primary"
              >
                ${escapeHtml(
                  config.texto_botao_principal ||
                  'Explorar ' +
                  (config.nome_site || 'Atlas')
                )}

                <span>
                  →
                </span>

              </a>

              <a
                href="#sobre"
                class="button secondary"
              >
                ${escapeHtml(
                  config.texto_botao_secundario ||
                  'Conheça o projeto'
                )}
              </a>

            </div>

          </div>


          <div class="hero-visual">

            <div class="microscope-card">

              <div class="microscope-glow"></div>

              <div class="microscope">

                <div class="microscope-top"></div>
                <div class="microscope-body"></div>
                <div class="microscope-base"></div>
                <div class="microscope-lens"></div>

              </div>

              <div class="scan-line"></div>

            </div>

          </div>

        </div>

      </section>


      <section
        class="section"
        id="sobre"
      >

        <div class="container about-grid">

          <div>

            <span class="eyebrow">
              SOBRE O ATLAS
            </span>

            <h2>
              Aprender histologia
              de uma forma diferente.
            </h2>

          </div>


          <div class="about-text">

            <p>
              ${escapeHtml(
                config.texto_sobre ||
                (
                  'O ' +
                  (config.nome_site || 'Atlas') +
                  ' ' +
                  (config.subtitulo || 'Histológico') +
                  ' foi pensado para transformar a observação das lâminas em uma experiência de aprendizagem visual e interativa.'
                )
              )}
            </p>

            <a
              href="#laminas"
              class="button primary"
            >
              Explorar lâminas →
            </a>

          </div>

        </div>

      </section>

    </main>


    <footer class="footer">

      <div class="container">

        <span>
          🔬
          ${escapeHtml(config.nome_site || 'Atlas')}
          ${escapeHtml(config.subtitulo || 'Histológico')}
        </span>

        <span>
          ${escapeHtml(
            config.texto_rodape ||
            'Projeto acadêmico'
          )}
        </span>

      </div>

    </footer>
  `

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(value = '') {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

}


/* ============================================================
   RENDER DA LÂMINA
   ============================================================ */

function renderLamina(lamina, config = {}) {

  const estruturas =
    Array.isArray(lamina?.estruturas)
      ? lamina.estruturas
      : []


  return `
    ${renderHeader(config)}

    <main>

      <section class="slide-header">

        <div class="container">

          <a
            href="#laminas"
            class="back-link"
          >
            ← Voltar para as lâminas
          </a>


          <div class="slide-title">

            <div>

              <span class="eyebrow">
                ${escapeHtml(
                  lamina.categoria ||
                  'Histologia'
                )}
              </span>

              <h1>
                ${escapeHtml(
                  lamina.nome ||
                  'Lâmina'
                )}
              </h1>

              <p>
                Explore a lâmina utilizando zoom e movimentação.
              </p>

            </div>


            <div class="slide-meta">

              ${
                lamina.tecnica
                  ? `
                    <span>
                      🔬
                      ${escapeHtml(lamina.tecnica)}
                    </span>
                  `
                  : ''
              }

              ${
                lamina.coloracao
                  ? `
                    <span>
                      🧫
                      ${escapeHtml(lamina.coloracao)}
                    </span>
                  `
                  : ''
              }

            </div>

          </div>

        </div>

      </section>


      <section class="viewer-section">

        <div class="container viewer-layout">


          <div class="viewer-container">


            <!-- PAINEL DE ESTUDO -->

            <div
              id="estrutura-estudo-panel"
              class="estrutura-estudo-panel estrutura-estudo-panel-refinado modo-estudo-card"
              hidden
            >

              <div class="estrutura-estudo-header">

                <span class="estrutura-estudo-eyebrow">
                  ESTRUTURA SELECIONADA
                </span>

                <button
                  id="estrutura-estudo-fechar"
                  type="button"
                  title="Fechar"
                  aria-label="Fechar modo estudo"
                >
                  ×
                </button>

              </div>


              <h3 id="estrutura-estudo-nome">
                Estrutura
              </h3>


              <p id="estrutura-estudo-descricao"></p>

            </div>


            <!-- VIEWER -->

            <div
              id="openseadragon"
              class="viewer"
            ></div>


            <div class="estrutura-navegacao"></div>


            <!-- CONTROLES -->

            <div class="viewer-controls">

              <span>
                Arraste para movimentar •
                Use a roda do mouse para ampliar
              </span>


              <div class="zoom-buttons">

                <button
                  id="zoom-out"
                  type="button"
                  title="Diminuir zoom"
                  aria-label="Diminuir zoom"
                >
                  −
                </button>


                <button
                  id="zoom-home"
                  type="button"
                  title="Restaurar posição"
                  aria-label="Restaurar posição original"
                >
                  ⌂
                </button>


                <button
                  id="zoom-in"
                  type="button"
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                >
                  +
                </button>


                <button
                  id="zoom-fullscreen"
                  type="button"
                  title="Tela cheia"
                  aria-label="Abrir em tela cheia"
                >
                  ⛶
                </button>


                <span
                  id="zoom-value"
                  class="zoom-value"
                >
                  100%
                </span>

              </div>

            </div>

          </div>


          <!-- PAINEL LATERAL -->

          <aside class="info-panel">

            <div class="panel-label">
              SOBRE A LÂMINA
            </div>


            <h2>
              ${escapeHtml(
                lamina.nome ||
                'Lâmina'
              )}
            </h2>


            <p class="description">
              ${escapeHtml(
                lamina.descricao ||
                ''
              )}
            </p>


            ${
              estruturas.length
                ? `
                  <div class="info-section">

                    <h3>
                      🔎 O que observar
                    </h3>


                    <div class="structure-list">

                      ${
                        estruturas
                          .map(
                            (estrutura, index) => `
                              <button
                                class="structure"
                                data-estrutura-index="${index}"
                                type="button"
                              >

                                <span class="structure-dot"></span>

                                <span>

                                  <strong>
                                    ${escapeHtml(
                                      estrutura.nome ||
                                      ''
                                    )}
                                  </strong>

                                  <small>
                                    ${escapeHtml(
                                      estrutura.descricao ||
                                      ''
                                    )}
                                  </small>

                                </span>

                              </button>
                            `
                          )
                          .join('')
                      }

                    </div>

                  </div>
                `
                : ''
            }

          </aside>

        </div>

      </section>

    </main>
  `

}


/* ============================================================
   BUSCAR LÂMINA
   ============================================================ */

async function buscarLamina(id) {

  const { data, error } =
    await supabase
      .from('laminas')
      .select('*')
      .eq('id', id)
      .eq('publicado', true)
      .single()


  if (error) {

    console.error(
      'Erro ao buscar lâmina:',
      error
    )

    return null
  }


  return data

}


/* ============================================================
   PAINEL DE ESTUDO
   ============================================================ */

function mostrarTextoEstrutura(
  index,
  lamina
) {

  const estruturas =
    Array.isArray(lamina?.estruturas)
      ? lamina.estruturas
      : []


  const indice =
    Number(index)


  const estrutura =
    estruturas[indice]


  if (!estrutura) {

    console.warn(
      'Estrutura não encontrada:',
      index
    )

    return

  }


  const panel =
    document.querySelector(
      '#estrutura-estudo-panel'
    )


  const nome =
    document.querySelector(
      '#estrutura-estudo-nome'
    )


  const descricao =
    document.querySelector(
      '#estrutura-estudo-descricao'
    )


  if (
    !panel ||
    !nome ||
    !descricao
  ) {

    console.warn(
      'Painel de estudo não encontrado.'
    )

    return

  }


  nome.textContent =
    estrutura.nome ||
    `Estrutura ${indice + 1}`


  descricao.textContent =
    estrutura.descricao ||
    'Nenhuma descrição cadastrada.'


  panel.hidden = false


  panel.dataset.estruturaIndex =
    String(indice)


  document
    .querySelectorAll('.estrutura-overlay')
    .forEach(overlay => {

      overlay.classList.toggle(
        'estrutura-selecionada',
        overlay.dataset.estruturaIndex ===
        String(indice)
      )

    })


  document
    .querySelectorAll('.structure')
    .forEach((botao, botaoIndex) => {

      botao.classList.toggle(
        'estrutura-selecionada',
        botaoIndex === indice
      )

    })


  console.log(
    'Painel aberto:',
    estrutura.nome
  )

}


/* ============================================================
   DESENHAR ESTRUTURAS
   ============================================================ */

function desenharEstruturas(
  viewer,
  lamina
) {

  if (!viewer || !lamina) {

    console.warn(
      'Viewer ou lâmina ausente.'
    )

    return

  }


  const estruturas =
    Array.isArray(lamina.estruturas)
      ? lamina.estruturas
      : []


  console.log(
    '========================================'
  )

  console.log(
    'DESENHAR ESTRUTURAS'
  )

  console.log(
    'Estruturas:',
    estruturas
  )

  console.log(
    'Quantidade:',
    estruturas.length
  )

  console.log(
    '========================================'
  )


  if (!estruturas.length) {

    console.log(
      'Nenhuma estrutura cadastrada nesta lâmina.'
    )

    return

  }


  const tiledImage =
    viewer.world.getItemAt(0)


  console.log(
    'TILED IMAGE:',
    tiledImage
  )


  if (!tiledImage) {

    console.warn(
      'Imagem ainda não disponível para desenhar estruturas.'
    )

    return

  }


  const imageSize =
    tiledImage.getContentSize()


  console.log(
    'IMAGE SIZE:',
    imageSize
  )


  const imageWidth =
    Number(imageSize.x)


  const imageHeight =
    Number(imageSize.y)


  if (
    !Number.isFinite(imageWidth) ||
    !Number.isFinite(imageHeight) ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {

    console.warn(
      'Não foi possível determinar o tamanho da imagem.'
    )

    return

  }


  /*
   * Remove somente os marcadores antigos.
   * Não remove overlays de outros tipos.
   */

  viewer
    .currentOverlays
    .slice()
    .forEach(overlay => {

      const elemento =
        overlay?.element


      if (
        elemento?.classList?.contains(
          'estrutura-overlay'
        )
      ) {

        try {

          viewer.removeOverlay(
            elemento
          )

        } catch (erro) {

          console.warn(
            'Erro removendo marcador antigo:',
            erro
          )

        }

      }

    })


  estruturas.forEach(
    (estrutura, index) => {

      console.log(
        'CRIANDO MARCADOR:',
        index,
        estrutura
      )


      console.log(
        'COORDENADAS ORIGINAIS:',
        estrutura.x,
        estrutura.y,
        estrutura.largura,
        estrutura.altura
      )


      const nome =
        String(
          estrutura.nome ||
          `Estrutura ${index + 1}`
        )


      const descricao =
        String(
          estrutura.descricao ||
          ''
        )


      /*
       * Coordenadas normalizadas:
       * 0 = início da imagem
       * 1 = final da imagem
       */

      let x =
        Number(estrutura.x)


      let y =
        Number(estrutura.y)


      let largura =
        Number(
          estrutura.largura ??
          estrutura.width ??
          0.08
        )


      let altura =
        Number(
          estrutura.altura ??
          estrutura.height ??
          0.08
        )


      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(largura) ||
        !Number.isFinite(altura)
      ) {

        console.warn(
          'Estrutura ignorada por valores inválidos:',
          estrutura
        )

        return

      }


      /*
       * Limita as coordenadas ao intervalo 0–1.
       */

      x =
        Math.max(
          0,
          Math.min(1, x)
        )


      y =
        Math.max(
          0,
          Math.min(1, y)
        )


      largura =
        Math.max(
          0.001,
          Math.min(1, largura)
        )


      altura =
        Math.max(
          0.001,
          Math.min(1, altura)
        )


      /*
       * Converte normalizado -> pixels.
       */

      const imageX =
        x * imageWidth


      const imageY =
        y * imageHeight


      const imageWidthEstrutura =
        largura * imageWidth


      const imageHeightEstrutura =
        altura * imageHeight


      /*
       * Converte pixels -> viewport.
       */

      const rect =
        viewer.viewport.imageToViewportRectangle(
          imageX,
          imageY,
          imageWidthEstrutura,
          imageHeightEstrutura
        )


      if (!rect) {

        console.warn(
          'Não foi possível criar retângulo:',
          estrutura
        )

        return

      }


      /*
       * Cria elemento visual.
       */

      const overlay =
        document.createElement('div')


      overlay.className =
        'estrutura-overlay'


      overlay.dataset.estruturaIndex =
        String(index)


      overlay.dataset.imageX =
        String(imageX)


      overlay.dataset.imageY =
        String(imageY)


      overlay.dataset.imageWidth =
        String(imageWidthEstrutura)


      overlay.dataset.imageHeight =
        String(imageHeightEstrutura)


      overlay.innerHTML = `

        <div class="estrutura-box">

          <span class="estrutura-ponto"></span>

          <span class="estrutura-label">
            ${escapeHtml(nome)}
          </span>

        </div>

      `


      overlay.title =
        descricao
          ? `${nome}: ${descricao}`
          : nome


      overlay.style.cursor =
        'pointer'


      /*
       * Clique diretamente no marcador.
       */

      overlay.addEventListener(
        'click',
        event => {

          event.preventDefault()
          event.stopPropagation()


          mostrarTextoEstrutura(
            index,
            lamina
          )


          centralizarEstrutura(
            viewer,
            overlay,
            true
          )

        }
      )


      /*
       * Adiciona o marcador ao OpenSeadragon.
       */

      viewer.addOverlay({

        element: overlay,

        location: rect,

        placement:
          OpenSeadragon.Placement.TOP_LEFT

      })


      console.log(
        'MARCADOR CRIADO:',
        index,
        rect
      )

    }
  )


  console.log(
    'Total de marcadores criados:',
    document.querySelectorAll(
      '.estrutura-overlay'
    ).length
  )

}


/* ============================================================
   CENTRALIZAR ESTRUTURA
   ============================================================ */

function centralizarEstrutura(
  viewer,
  overlay,
  aplicarZoom = true
) {

  if (!viewer || !overlay) {
    return
  }


  const x =
    Number(
      overlay.dataset.imageX
    )


  const y =
    Number(
      overlay.dataset.imageY
    )


  const largura =
    Number(
      overlay.dataset.imageWidth
    )


  const altura =
    Number(
      overlay.dataset.imageHeight
    )


  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {

    return

  }


  const centroX =
    x +
    (
      Number.isFinite(largura)
        ? largura / 2
        : 0
    )


  const centroY =
    y +
    (
      Number.isFinite(altura)
        ? altura / 2
        : 0
    )


  const ponto =
    viewer.viewport.imageToViewportCoordinates(
      centroX,
      centroY
    )


  viewer.viewport.panTo(
    ponto,
    true
  )


  if (!aplicarZoom) {
    return
  }


  const zoomAtual =
    viewer.viewport.getZoom()


  const zoomMaximo =
    viewer.viewport.getMaxZoom()


  const zoomDesejado =
    Math.min(
      zoomAtual * 1.8,
      zoomMaximo
    )


  viewer.viewport.zoomTo(
    zoomDesejado,
    ponto,
    true
  )

}


/* ============================================================
   MODO ESTUDO
   ============================================================ */

function configurarModoEstudo(
  viewer,
  lamina
) {

  if (!viewer || !lamina) {
    return
  }


  const estruturas =
    Array.isArray(lamina.estruturas)
      ? lamina.estruturas
      : []


  const panel =
    document.querySelector(
      '#estrutura-estudo-panel'
    )


  const nome =
    document.querySelector(
      '#estrutura-estudo-nome'
    )


  const descricao =
    document.querySelector(
      '#estrutura-estudo-descricao'
    )


  const fechar =
    document.querySelector(
      '#estrutura-estudo-fechar'
    )


  if (
    !panel ||
    !nome ||
    !descricao
  ) {

    console.warn(
      'Painel de estudo não encontrado.'
    )

    return

  }


  let indiceAtual =
    -1


  function limparSelecao() {

    document
      .querySelectorAll(
        '.estrutura-overlay'
      )
      .forEach(
        overlay => {

          overlay.classList.remove(
            'estrutura-selecionada'
          )

        }
      )


    document
      .querySelectorAll(
        '.structure'
      )
      .forEach(
        botao => {

          botao.classList.remove(
            'estrutura-selecionada'
          )

        }
      )

  }


  function selecionarVisual(index) {

    const indice =
      String(index)


    document
      .querySelectorAll(
        '.estrutura-overlay'
      )
      .forEach(
        overlay => {

          overlay.classList.toggle(
            'estrutura-selecionada',
            overlay.dataset.estruturaIndex ===
            indice
          )

        }
      )


    document
      .querySelectorAll(
        '.structure'
      )
      .forEach(
        (botao, botaoIndex) => {

          botao.classList.toggle(
            'estrutura-selecionada',
            String(botaoIndex) === indice
          )

        }
      )

  }


  function mostrarEstrutura(
    index,
    centralizar = false
  ) {

    const indice =
      Number(index)


    const estrutura =
      estruturas[indice]


    if (!estrutura) {
      return
    }


    indiceAtual =
      indice


    nome.textContent =
      estrutura.nome ||
      `Estrutura ${indice + 1}`


    descricao.textContent =
      estrutura.descricao ||
      'Nenhuma descrição cadastrada.'


    panel.hidden =
      false


    panel.dataset.estruturaIndex =
      String(indice)


    selecionarVisual(
      indice
    )


    if (centralizar) {

      const overlay =
        document.querySelector(
          `.estrutura-overlay[data-estrutura-index="${indice}"]`
        )


      if (overlay) {

        centralizarEstrutura(
          viewer,
          overlay,
          true
        )

      }

    }

  }


  function fecharPainel() {

    panel.hidden =
      true


    indiceAtual =
      -1


    limparSelecao()

  }


  fechar?.addEventListener(
    'click',
    event => {

      event.preventDefault()
      event.stopPropagation()

      fecharPainel()

    }
  )


  /*
   * Clique na lista.
   *
   * IMPORTANTE:
   * Este é o único controlador de clique
   * necessário para os botões .structure.
   */

  document
    .querySelectorAll(
      '.structure'
    )
    .forEach(
      (botao, index) => {

        botao.dataset.estruturaIndex =
          String(index)


        botao.addEventListener(
          'click',
          event => {

            event.preventDefault()
            event.stopPropagation()


            mostrarEstrutura(
              index,
              true
            )

          }
        )

      }
    )


  /*
   * Teclado.
   */

  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key === 'Escape'
      ) {

        if (!panel.hidden) {
          fecharPainel()
        }

        return

      }


      if (
        panel.hidden ||
        !estruturas.length
      ) {

        return

      }


      if (
        event.key !== 'ArrowRight' &&
        event.key !== 'ArrowLeft'
      ) {

        return

      }


      event.preventDefault()


      if (indiceAtual < 0) {

        mostrarEstrutura(
          0,
          true
        )

        return

      }


      let novoIndice =
        indiceAtual


      if (
        event.key === 'ArrowRight'
      ) {

        novoIndice =
          indiceAtual + 1


        if (
          novoIndice >=
          estruturas.length
        ) {

          novoIndice =
            0

        }

      } else {

        novoIndice =
          indiceAtual - 1


        if (novoIndice < 0) {

          novoIndice =
            estruturas.length - 1

        }

      }


      mostrarEstrutura(
        novoIndice,
        true
      )

    }
  )


  console.log(
    'Modo estudo conectado:',
    estruturas.length,
    'estruturas.'
  )

}


/* ============================================================
   VIEWER
   ============================================================ */

function iniciarViewer(lamina) {

  const elemento =
    document.querySelector(
      '#openseadragon'
    )


  if (!elemento) {

    console.error(
      'Elemento #openseadragon não encontrado.'
    )

    return

  }


  if (!lamina.imagem_url) {

    elemento.innerHTML = `

      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        height:100%;
        color:white;
        padding:30px;
        text-align:center;
      ">

        Imagem da lâmina não encontrada.

      </div>

    `

    return

  }


  /*
   * Criação do OpenSeadragon.
   */

  const viewer =
    OpenSeadragon({

      element: elemento,

      drawer: 'canvas',

      prefixUrl:
        'https://openseadragon.github.io/openseadragon/images/',

      tileSources: {

        type: 'image',

        url:
          lamina.imagem_url

      },

      showNavigationControl:
        false,

      animationTime:
        0.8,

      zoomPerScroll:
        1.5,

      maxZoomPixelRatio:
        8,

      visibilityRatio:
        1,

      constrainDuringPan:
        true

    })


  /*
   * Zoom.
   */

  const zoomValue =
    document.querySelector(
      '#zoom-value'
    )


  function atualizarZoom() {

    if (!zoomValue) {
      return
    }


    const zoom =
      viewer.viewport.getZoom()


    zoomValue.textContent =
      Math.round(
        zoom * 100
      ) + '%'

  }


  document
    .querySelector(
      '#zoom-in'
    )
    ?.addEventListener(
      'click',
      event => {

        event.preventDefault()

        viewer.viewport.zoomBy(
          1.5
        )

        viewer.viewport.applyConstraints()

        atualizarZoom()

      }
    )


  document
    .querySelector(
      '#zoom-out'
    )
    ?.addEventListener(
      'click',
      event => {

        event.preventDefault()

        viewer.viewport.zoomBy(
          0.67
        )

        viewer.viewport.applyConstraints()

        atualizarZoom()

      }
    )


  document
    .querySelector(
      '#zoom-home'
    )
    ?.addEventListener(
      'click',
      event => {

        event.preventDefault()

        viewer.viewport.goHome()

        atualizarZoom()

      }
    )


  document
    .querySelector(
      '#zoom-fullscreen'
    )
    ?.addEventListener(
      'click',
      event => {

        event.preventDefault()


        if (
          typeof viewer.setFullScreen ===
          'function'
        ) {

          viewer.setFullScreen(
            true
          )

        } else {

          viewer.setFullPage(
            true
          )

        }

      }
    )


  /*
   * Atualização do zoom.
   */

  viewer.addHandler(
    'zoom',
    atualizarZoom
  )


  viewer.addHandler(
    'open',
    atualizarZoom
  )


  /*
   * ABERTURA DA IMAGEM
   *
   * Aqui existe APENAS UM handler.
   */

  viewer.addOnceHandler(
    'open',
    () => {

      console.log(
        '========================================'
      )

      console.log(
        'DIAGNÓSTICO DA LÂMINA NO OPEN'
      )

      console.log(
        'LÂMINA:',
        lamina
      )

      console.log(
        'ESTRUTURAS:',
        lamina?.estruturas
      )

      console.log(
        'TIPO:',
        typeof lamina?.estruturas
      )

      console.log(
        'É ARRAY:',
        Array.isArray(
          lamina?.estruturas
        )
      )

      console.log(
        'QUANTIDADE:',
        Array.isArray(
          lamina?.estruturas
        )
          ? lamina.estruturas.length
          : 'NÃO É ARRAY'
      )

      console.log(
        '========================================'
      )


      /*
       * Primeiro desenha os marcadores.
       */

      desenharEstruturas(
        viewer,
        lamina
      )


      /*
       * Depois conecta o modo estudo.
       */

      configurarModoEstudo(
        viewer,
        lamina
      )


      atualizarZoom()

    }
  )


  /*
   * Atalhos de teclado do viewer.
   */

  document.addEventListener(
    'keydown',
    event => {

      const tag =
        event.target?.tagName


      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT'
      ) {

        return

      }


      if (
        event.key === '+' ||
        event.key === '='
      ) {

        viewer.viewport.zoomBy(
          1.25
        )

        viewer.viewport.applyConstraints()

        atualizarZoom()

      }


      if (
        event.key === '-' ||
        event.key === '_'
      ) {

        viewer.viewport.zoomBy(
          0.8
        )

        viewer.viewport.applyConstraints()

        atualizarZoom()

      }


      if (
        event.key === '0'
      ) {

        viewer.viewport.goHome()

        atualizarZoom()

      }


      if (
        event.key.toLowerCase() === 'f'
      ) {

        if (
          typeof viewer.setFullScreen ===
          'function'
        ) {

          viewer.setFullScreen(
            !viewer.isFullScreen()
          )

        }

      }

    }
  )


  atualizarZoom()


  /*
   * Guarda referência para diagnóstico.
   */

  window.__atlasViewer =
    viewer


  return viewer

}


/* ============================================================
   LIMPAR ESTRUTURAS
   ============================================================ */

function limparEstruturas(viewer) {

  if (!viewer) {
    return
  }


  const overlays =
    viewer.currentOverlays || []


  overlays
    .slice()
    .forEach(
      overlay => {

        const elemento =
          overlay?.element


        if (
          elemento?.classList?.contains(
            'estrutura-overlay'
          )
        ) {

          try {

            viewer.removeOverlay(
              elemento
            )

          } catch (erro) {

            console.warn(
              'Erro ao remover estrutura:',
              erro
            )

          }

        }

      }
    )

}


/* ============================================================
   INFORMAÇÃO SIMPLES
   ============================================================ */

function mostrarInfoEstruturaSimples(
  index,
  lamina
) {

  const estruturas =
    Array.isArray(lamina?.estruturas)
      ? lamina.estruturas
      : []


  const indice =
    Number(index)


  const estrutura =
    estruturas[indice]


  if (!estrutura) {

    console.warn(
      'Estrutura não encontrada:',
      index
    )

    return

  }


  let area =
    document.querySelector(
      '#estrutura-info-simples'
    )


  if (!area) {

    area =
      document.createElement(
        'div'
      )


    area.id =
      'estrutura-info-simples'


    area.style.cssText = `

      margin-top:16px;

      padding:20px;

      background:#ffffff;

      border:1px solid #dcdcdc;

      border-radius:12px;

      box-shadow:
        0 4px 16px
        rgba(0,0,0,0.08);

      position:relative;

      z-index:20;

    `


    const titulo =
      document.createElement(
        'h3'
      )


    titulo.id =
      'estrutura-info-simples-nome'


    titulo.style.cssText = `

      margin:
        0 35px 8px 0;

      font-size:20px;

    `


    const descricao =
      document.createElement(
        'p'
      )


    descricao.id =
      'estrutura-info-simples-descricao'


    descricao.style.cssText = `

      margin:0;

      line-height:1.6;

      color:#555;

    `


    const fechar =
      document.createElement(
        'button'
      )


    fechar.type =
      'button'


    fechar.textContent =
      '×'


    fechar.title =
      'Fechar'


    fechar.style.cssText = `

      position:absolute;

      top:10px;

      right:12px;

      border:none;

      background:transparent;

      font-size:26px;

      cursor:pointer;

      color:#777;

      line-height:1;

    `


    fechar.addEventListener(
      'click',
      () => {

        area.hidden =
          true

      }
    )


    area.appendChild(
      fechar
    )


    area.appendChild(
      titulo
    )


    area.appendChild(
      descricao
    )


    const viewer =
      document.querySelector(
        '#openseadragon'
      )


    if (
      viewer?.parentElement
    ) {

      viewer.parentElement.appendChild(
        area
      )

    } else {

      document.body.appendChild(
        area
      )

    }

  }


  const titulo =
    document.querySelector(
      '#estrutura-info-simples-nome'
    )


  const descricao =
    document.querySelector(
      '#estrutura-info-simples-descricao'
    )


  if (
    !titulo ||
    !descricao
  ) {

    return

  }


  titulo.textContent =
    estrutura.nome ||
    `Estrutura ${indice + 1}`


  descricao.textContent =
    estrutura.descricao ||
    'Nenhuma descrição cadastrada.'


  area.hidden =
    false


  area.dataset.estruturaIndex =
    String(indice)


  console.log(
    'INFO DA ESTRUTURA ABERTA:',
    estrutura.nome
  )

}


/* ============================================================
   INFORMAÇÃO DA LISTA
   ============================================================ */

function mostrarInfoListaEstrutura(
  index,
  lamina
) {

  const estruturas =
    Array.isArray(lamina?.estruturas)
      ? lamina.estruturas
      : []


  const indice =
    Number(index)


  const estrutura =
    estruturas[indice]


  if (!estrutura) {

    console.warn(
      'Estrutura não encontrada:',
      index
    )

    return

  }


  let area =
    document.querySelector(
      '#estrutura-info-lista'
    )


  if (!area) {

    const layout =
      document.querySelector(
        '.viewer-layout'
      )


    if (!layout) {

      console.warn(
        'viewer-layout não encontrado.'
      )

      return

    }


    area =
      document.createElement(
        'div'
      )


    area.id =
      'estrutura-info-lista'


    area.style.cssText = `

      grid-column:1 / -1;

      margin-top:18px;

      padding:22px;

      background:white;

      border:1px solid #ddd;

      border-radius:14px;

      box-shadow:
        0 4px 15px
        rgba(0,0,0,.08);

    `


    layout.appendChild(
      area
    )

  }


  const nome =
    estrutura.nome ||
    `Estrutura ${indice + 1}`


  const descricao =
    estrutura.descricao ||
    'Nenhuma descrição cadastrada.'


  area.innerHTML = `

    <div style="
      font-size:11px;
      font-weight:700;
      letter-spacing:.08em;
      text-transform:uppercase;
      color:#777;
      margin-bottom:6px;
    ">
      Estrutura selecionada
    </div>


    <h3 style="
      margin:0 0 8px 0;
      font-size:21px;
    ">
      ${escapeHtml(nome)}
    </h3>


    <p style="
      margin:0;
      font-size:15px;
      line-height:1.6;
      color:#555;
    ">
      ${escapeHtml(descricao)}
    </p>

  `


  area.hidden =
    false


  console.log(
    'INFORMAÇÃO DA LISTA EXIBIDA:',
    nome
  )

}


/* ============================================================
   NAVEGAÇÃO DAS ESTRUTURAS
   ============================================================ */

function configurarNavegacaoEstruturas(
  viewer,
  lamina
) {

  if (!viewer || !lamina) {
    return
  }


  const botoes =
    document.querySelectorAll(
      '.structure'
    )


  const estruturas =
    Array.isArray(lamina?.estruturas)
      ? lamina.estruturas
      : []


  console.log(
    'LISTA FINAL:',
    botoes.length,
    'botões /',
    estruturas.length,
    'estruturas'
  )

}


/* ============================================================
   CONECTAR INFO DOS MARCADORES
   ============================================================ */

function conectarInfoEstruturasSimples(
  lamina
) {

  const overlays =
    document.querySelectorAll(
      '.estrutura-overlay'
    )


  if (!overlays.length) {

    console.warn(
      'Nenhum marcador encontrado.'
    )

    return

  }


  overlays.forEach(
    overlay => {

      if (
        overlay.dataset.infoSimples ===
        '1'
      ) {

        return

      }


      overlay.dataset.infoSimples =
        '1'


      overlay.style.cursor =
        'pointer'


      overlay.addEventListener(
        'click',
        event => {

          event.preventDefault()
          event.stopPropagation()


          mostrarInfoEstruturaSimples(
            overlay.dataset.estruturaIndex,
            lamina
          )

        }
      )

    }
  )


  console.log(
    'INFO SIMPLES CONECTADA:',
    overlays.length,
    'marcadores.'
  )

}


/* ============================================================
   INSTALAR CLIQUE DA LISTA
   ============================================================ */

function instalarCliqueListaEstruturas(
  lamina
) {

  if (!lamina) {

    console.warn(
      'Clique lista: lâmina não encontrada.'
    )

    return

  }


  document
    .querySelectorAll(
      '.structure'
    )
    .forEach(
      (botao, index) => {

        botao.dataset.estruturaIndex =
          String(index)

      }
    )


  console.log(
    'Índices da lista instalados:',
    document.querySelectorAll(
      '.structure'
    ).length
  )

}


/* ============================================================
   RENDER PRINCIPAL
   ============================================================ */

async function render() {

  try {

    /*
     * Configurações.
     */

    const config =
      await carregarConfiguracoesSite()


    /*
     * Aplica imediatamente.
     */

    aplicarConfiguracoesVisuais(
      config
    )


    /*
     * Rota atual.
     */

    const route =
      getRoute()


    console.log(
      'ROTA:',
      route
    )


    /* ========================================================
       LOGIN
       ======================================================== */

    if (
      route === 'login'
    ) {

      const {
        data: {
          session
        },
        error
      } =
        await supabase.auth.getSession()


      if (
        !error &&
        session?.user
      ) {

        window.location.hash =
          '#admin'

        return

      }


      app.innerHTML =
        renderLogin()


      setupLogin()


      return

    }


    /* ========================================================
       ADMIN
       ======================================================== */

    if (
      route === 'admin'
    ) {

      const autorizado =
        await isAdmin()


      if (!autorizado) {

        window.location.hash =
          '#login'

        return

      }


      app.innerHTML =
        await renderAdmin()


      setupAdmin()


      return

    }


    /* ========================================================
       NOVA LÂMINA
       ======================================================== */

    if (
      route === 'nova-lamina'
    ) {

      const autorizado =
        await isAdmin()


      if (!autorizado) {

        window.location.hash =
          '#login'

        return

      }


      app.innerHTML =
        renderNovaLamina()


      setupNovaLamina()


      return

    }


    /* ========================================================
       CATÁLOGO
       ======================================================== */

    if (
      route === 'catalogo'
    ) {

      await renderCatalogo()

      return

    }


    /* ========================================================
       LÂMINA
       ======================================================== */

    if (
      route === 'lamina'
    ) {

      const id =
        window.location.hash
          .replace(
            '#lamina/',
            ''
          )


      if (!id) {

        window.location.hash =
          '#laminas'

        return

      }


      app.innerHTML = `

        ${renderHeader(config)}

        <main style="
          min-height:60vh;
          display:flex;
          align-items:center;
          justify-content:center;
        ">

          <div>

            <h1>
              Carregando lâmina...
            </h1>

          </div>

        </main>

      `


      const lamina =
        await buscarLamina(id)


      if (!lamina) {

        app.innerHTML = `

          ${renderHeader(config)}

          <main style="
            min-height:60vh;
            display:flex;
            align-items:center;
            justify-content:center;
            text-align:center;
          ">

            <div>

              <h1>
                Lâmina não encontrada
              </h1>


              <p>
                Não foi possível carregar esta lâmina.
              </p>


              <a
                href="#laminas"
                class="button primary"
              >
                Voltar para lâminas
              </a>

            </div>

          </main>

        `

        return

      }


      /*
       * Renderiza a página.
       */

      app.innerHTML =
        renderLamina(
          lamina,
          config
        )


      /*
       * Inicia o viewer.
       */

      iniciarViewer(
        lamina
      )


      return

    }


    /* ========================================================
       HOME
       ======================================================== */

    app.innerHTML =
      renderHome(
        config
      )

  } catch (erro) {

    console.error(
      'ERRO FATAL NO RENDER:',
      erro
    )


    /*
     * Não deixa o site simplesmente
     * ficar branco se alguma função falhar.
     */

    if (app) {

      app.innerHTML = `

        <main style="
          min-height:70vh;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:30px;
          font-family:system-ui,sans-serif;
        ">

          <div style="
            max-width:700px;
            width:100%;
            padding:30px;
            border:1px solid #ddd;
            border-radius:16px;
            background:white;
          ">

            <h1>
              Ocorreu um erro ao carregar o Atlas.
            </h1>


            <p>
              Abra o console do navegador
              para ver os detalhes.
            </p>


            <button
              type="button"
              onclick="location.reload()"
              style="
                padding:10px 18px;
                border:none;
                border-radius:8px;
                cursor:pointer;
              "
            >
              Recarregar
            </button>

          </div>

        </main>

      `

    }

  }

}


/* ============================================================
   HASHCHANGE
   ============================================================ */

window.addEventListener(
  'hashchange',
  render
)


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

render()
