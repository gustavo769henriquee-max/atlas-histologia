import './style.css'
import OpenSeadragon from 'openseadragon'
import { supabase } from './lib/supabase.js'

import { renderLogin, setupLogin } from './pages/login.js'
import { renderAdmin, setupAdmin } from './pages/admin.js'
import { renderCatalogo } from './pages/catalogo.js'
import { renderNovaLamina, setupNovaLamina } from './pages/nova-lamina.js'

const app = document.querySelector('#app')

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
    console.error('Erro ao carregar configura��es do site:', error)
    return {}
  }

  return data || {}
}

function getRoute() {
  const hash = window.location.hash

  if (hash === '#login') return 'login'
  if (hash === '#admin') return 'admin'
  if (hash.startsWith('#nova-lamina')) return 'nova-lamina'
  if (hash === '#laminas') return 'catalogo'
  if (hash.startsWith('#lamina/')) return 'lamina'

  return 'home'
}

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
      ? `<img src="${escapeHtml(config.logo_url)}" alt="Logo" style="width:100%;height:100%;object-fit:contain;">`
      : '??'
  }
</span>

          <span>
            <strong>${escapeHtml(config.nome_site || "Atlas")}</strong>
            <small>${escapeHtml(config.subtitulo || "Histol�gico")}</small>
          </span>
        </a>

        <nav class="nav">
          <a href="#inicio">In�cio</a>
          <a href="#laminas">L�minas</a>
          <a href="#sobre">Sobre</a>
          <a href="#login">Administra��o</a>
        </nav>

      </div>
    </header>
  `
}

function renderHome(config = {}) {
  return `
    ${renderHeader(config)}

    <main>

      <section class="hero" id="inicio">

        <div class="container hero-grid">

          <div class="hero-text">

            <span class="eyebrow">
              ?? MICROSCOPIA � ESTUDO � EXPLORA��O
            </span>

            <h1>
              ${escapeHtml(config.titulo_inicio || "Explore o mundo microsc�pico.")}
            </h1>

            <p>
              ${escapeHtml(config.descricao_inicio || "Um atlas de histologia interativo para explorar tecidos, estruturas e l�minas histol�gicas de uma forma visual e din�mica.")}
            </p>

            <div class="hero-actions">

              <a href="#laminas" class="button primary">
                ${escapeHtml(config.texto_botao_principal || "Explorar " + (config.nome_site || "Atlas"))}
                <span>?</span>
              </a>

              <a href="#sobre" class="button secondary">
                ${escapeHtml(config.texto_botao_secundario || "Conhe�a o projeto")}
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


      <section class="section" id="sobre">

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
              ${escapeHtml(config.texto_sobre || ("O " + (config.nome_site || "Atlas") + " " + (config.subtitulo || "Histol�gico") + " foi pensado para transformar a observa��o das l�minas em uma experi�ncia de aprendizagem visual e interativa."))}
            </p>

            <a href="#laminas" class="button primary">
              Explorar l�minas ?
            </a>

          </div>

        </div>

      </section>

    </main>


    <footer class="footer">

      <div class="container">

        <span>?? ${escapeHtml(config.nome_site || "Atlas")} ${escapeHtml(config.subtitulo || "Histol�gico")}</span>
        <span>${escapeHtml(config.texto_rodape || "Projeto acad�mico")}</span>

      </div>

    </footer>
  `
}


function escapeHtml(value = '') {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

}


function renderLamina(lamina, config) {

  const estruturas =
    Array.isArray(lamina.estruturas)
      ? lamina.estruturas
      : []


  return `
    ${renderHeader(config)}

    <main>

      <section class="slide-header">

        <div class="container">

          <a href="#laminas" class="back-link">
            ? Voltar para as l�minas
          </a>

          <div class="slide-title">

            <div>

              <span class="eyebrow">
                ${escapeHtml(lamina.categoria || 'Histologia')}
              </span>

              <h1>
                ${escapeHtml(lamina.nome || 'L�mina')}
              </h1>

              <p>
                Explore a l�mina utilizando zoom e movimenta��o.
              </p>

            </div>

            <div class="slide-meta">

              ${lamina.tecnica
                ? `<span>?? ${escapeHtml(lamina.tecnica)}</span>`
                : ''}

              ${lamina.coloracao
                ? `<span>?? ${escapeHtml(lamina.coloracao)}</span>`
                : ''}

            </div>

          </div>

        </div>

      </section>


      <section class="viewer-section">

        <div class="container viewer-layout">

          <div class="viewer-container">

            <div
              id="estrutura-estudo-panel"
              class="estrutura-estudo-panel"
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
                  �
                </button>

              </div>

              <h3 id="estrutura-estudo-nome">
                Estrutura
              </h3>

              <p id="estrutura-estudo-descricao"></p>

            </div>

            <div
              id="openseadragon"
              class="viewer"
            ></div>

            <div class="estrutura-navegacao">

              <button
                id="estrutura-anterior"
                type="button"
                class="estrutura-nav-button"
                title="Estrutura anterior"
                aria-label="Estrutura anterior"
              >
                ?
              </button>

              <span
                id="estrutura-contador"
                class="estrutura-contador"
              >
                Estrutura 0 de 0
              </span>

              <button
                id="estrutura-proxima"
                type="button"
                class="estrutura-nav-button"
                title="Pr�xima estrutura"
                aria-label="Pr�xima estrutura"
              >
                ?
              </button>

            </div>


            <div class="viewer-controls">

              <span>
                Arraste para movimentar �
                Use a roda do mouse para ampliar
              </span>

              <div class="zoom-buttons">

                <button
                  id="zoom-out"
                  type="button"
                  title="Diminuir zoom"
                  aria-label="Diminuir zoom"
                >-</button>

                <button
                  id="zoom-home"
                  type="button"
                  title="Restaurar"
                  aria-label="Restaurar zoom"
                >�</button>

                <button
                  id="zoom-in"
                  type="button"
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                >+</button>

                <button
                  id="zoom-reset"
                  type="button"
                  title="Restaurar visualiza��o"
                  aria-label="Restaurar visualiza��o"
                >?</button>

                <button
                  id="zoom-fullscreen"
                  type="button"
                  title="Tela cheia"
                  aria-label="Abrir em tela cheia"
                >?</button>

                <span
                  id="zoom-value"
                  class="zoom-value"
                >100%</span>

              </div>

            </div>

          </div>


          <aside class="info-panel">

            <div class="panel-label">
              SOBRE A L�MINA
            </div>

            <h2>
              ${escapeHtml(lamina.nome || 'L�mina')}
            </h2>

            <p class="description">
              ${escapeHtml(lamina.descricao || '')}
            </p>


            ${estruturas.length
              ? `
                <div class="info-section">

                  <h3>
                    ?? O que observar
                  </h3>

                  <div class="structure-list">

                    ${estruturas.map(estrutura => `
                      <button class="structure">

                        <span class="structure-dot"></span>

                        <span>

                          <strong>
                            ${escapeHtml(estrutura.nome || '')}
                          </strong>

                          <small>
                            ${escapeHtml(estrutura.descricao || '')}
                          </small>

                        </span>

                      </button>
                    `).join('')}

                  </div>

                </div>
              `
              : ''}

          </aside>

        </div>

      </section>

    </main>
  `
}


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
      'Erro ao buscar l�mina:',
      error
    )

    return null
  }


  return data
}





function abrirPainelEstrutura(index, lamina) {

  const estruturas =
    Array.isArray(lamina?.estruturas)
      ? lamina.estruturas
      : []

  const estrutura =
    estruturas[index]

  if (!estrutura) {
    console.warn(
      'Estrutura nao encontrada:',
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
      'Painel de estudo nao encontrado.'
    )

    return
  }

  nome.textContent =
    estrutura.nome ||
    `Estrutura ${index + 1}`

  descricao.textContent =
    estrutura.descricao ||
    'Nenhuma descri��o cadastrada.'

  panel.hidden = false

  panel.dataset.estruturaIndex =
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
          String(index)
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
          botaoIndex === index
        )

      }
    )

  console.log(
    'Painel aberto:',
    estrutura.nome
  )

}
function desenharEstruturas(viewer, lamina) {

  if (!viewer || !lamina) {
    return
  }

  const estruturas =
    Array.isArray(lamina.estruturas)
      ? lamina.estruturas
      : []

  if (!estruturas.length) {

    console.log(
      'Nenhuma estrutura cadastrada nesta l�mina.'
    )

    return
  }


  console.log(
    'Estruturas carregadas:',
    estruturas
  )


  viewer.clearOverlays()


  const tiledImage =
    viewer.world.getItemAt(0)


  if (!tiledImage) {

    console.warn(
      'Imagem ainda n�o dispon�vel para desenhar estruturas.'
    )

    return
  }


  const imageSize =
    tiledImage.getContentSize()


  const imageWidth =
    Number(imageSize.x)


  const imageHeight =
    Number(imageSize.y)


  if (
    !imageWidth ||
    !imageHeight
  ) {

    console.warn(
      'N�o foi poss�vel determinar o tamanho da imagem.'
    )

    return
  }


  estruturas.forEach(
    (estrutura, index) => {

      const nome =
        String(
          estrutura.nome ||
          `Estrutura ${index + 1}`
        )


      const descricao =
        String(
          estrutura.descricao || ''
        )


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
          'Estrutura ignorada por valores inv�lidos:',
          estrutura
        )

        return
      }


      /*
       * As posi��es cadastradas no editor s�o
       * normalizadas de 0 a 1.
       *
       * Convertemos para pixels da imagem.
       */

      x =
        Math.max(
          0,
          Math.min(1, x)
        ) * imageWidth


      y =
        Math.max(
          0,
          Math.min(1, y)
        ) * imageHeight


      largura =
        Math.max(
          0.001,
          Math.min(1, largura)
        ) * imageWidth


      altura =
        Math.max(
          0.001,
          Math.min(1, altura)
        ) * imageHeight


      /*
       * Converte coordenadas da imagem
       * para coordenadas do viewport.
       */

      const rect =
        viewer.viewport.imageToViewportRectangle(
          x,
          y,
          largura,
          altura
        )


      const overlay =
        document.createElement('div')


      overlay.className =
        'estrutura-overlay'


      overlay.dataset.estruturaIndex =
        String(index)




      overlay.dataset.imageX =
        String(x)

      overlay.dataset.imageY =
        String(y)

      overlay.dataset.imageWidth =
        String(largura)

      overlay.dataset.imageHeight =
        String(altura)
      overlay.innerHTML = `

        <div class="estrutura-box">

          <span class="estrutura-ponto"></span>

          <span class="estrutura-label">
            ${escapeHtml(nome)}
          </span>

        </div>

      `


      if (descricao) {

        overlay.title =
          `${nome}: ${descricao}`

      } else {

        overlay.title =
          nome

      }


      viewer.addOverlay({

        element:
          overlay,

        location:
          rect,

        placement:
          OpenSeadragon.Placement.TOP_LEFT

  
      /*
       * COMBO 7 - CLIQUE DIRETO
       */

    })

    }
  )

}


function configurarInteracaoEstruturas(viewer) {

  if (!viewer) {
    return
  }


  const botoes =
    document.querySelectorAll(
      '.structure'
    )


  const overlays =
    document.querySelectorAll(
      '.estrutura-overlay'
    )


  function selecionarEstrutura(
    index,
    centralizar = false
  ) {

    const indice =
      String(index)


    botoes.forEach(
      (botao, botaoIndex) => {

        botao.classList.toggle(
          'estrutura-selecionada',
          String(botaoIndex) === indice
        )

      }
    )


    overlays.forEach(
      overlay => {

        overlay.classList.toggle(
          'estrutura-selecionada',
          overlay.dataset.estruturaIndex === indice
        )

      }
    )


    if (!centralizar) {
      return
    }


    const overlay =
      Array.from(overlays).find(
        item =>
          item.dataset.estruturaIndex === indice
      )


    if (!overlay) {
      return
    }


    const x =
      Number(overlay.dataset.imageX)


    const y =
      Number(overlay.dataset.imageY)


    const largura =
      Number(overlay.dataset.imageWidth)


    const altura =
      Number(overlay.dataset.imageHeight)


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


  botoes.forEach(
    (botao, index) => {

      botao.dataset.estruturaIndex =
        String(index)


      botao.addEventListener(
        'click',
        () => {

          selecionarEstrutura(
            index,
            true
          )

        }
      )

    }
  )


  overlays.forEach(
    overlay => {

      overlay.style.cursor =
        'pointer'



    }
  )

}


function configurarNavegacaoEstruturas(viewer) {

  if (!viewer) {
    return
  }


  const botoes =
    document.querySelectorAll(
      '.structure'
    )


  const overlays =
    document.querySelectorAll(
      '.estrutura-overlay'
    )


  const contador =
    document.querySelector(
      '#estrutura-contador'
    )


  const anterior =
    document.querySelector(
      '#estrutura-anterior'
    )


  const proxima =
    document.querySelector(
      '#estrutura-proxima'
    )


  if (!botoes.length) {

    if (contador) {
      contador.textContent =
        'Nenhuma estrutura'
    }

    return
  }


  let indiceAtual = 0


  function atualizarInterface() {

    const total =
      botoes.length


    if (contador) {

      contador.textContent =
        `Estrutura ${indiceAtual + 1} de ${total}`

    }


    if (anterior) {

      anterior.disabled =
        indiceAtual <= 0

    }


    if (proxima) {

      proxima.disabled =
        indiceAtual >= total - 1

    }

  }


  function selecionar(index) {

    if (
      index < 0 ||
      index >= botoes.length
    ) {
      return
    }


    indiceAtual = index


    botoes.forEach(
      (botao, i) => {

        botao.classList.toggle(
          'estrutura-selecionada',
          i === indiceAtual
        )

      }
    )


    overlays.forEach(
      overlay => {

        overlay.classList.toggle(
          'estrutura-selecionada',
          Number(
            overlay.dataset.estruturaIndex
          ) === indiceAtual
        )

      }
    )


    const overlay =
      Array.from(overlays).find(
        item =>
          Number(
            item.dataset.estruturaIndex
          ) === indiceAtual
      )


    if (overlay) {

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
        Number.isFinite(x) &&
        Number.isFinite(y)
      ) {

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


        const zoomAtual =
          viewer.viewport.getZoom()


        const zoomMaximo =
          viewer.viewport.getMaxZoom()


        const zoomDesejado =
          Math.min(
            Math.max(
              zoomAtual * 1.5,
              viewer.viewport.getHomeZoom() * 1.8
            ),
            zoomMaximo
          )


        viewer.viewport.zoomTo(
          zoomDesejado,
          ponto,
          true
        )

      }

    }


    atualizarInterface()

  }


  botoes.forEach(
    (botao, index) => {

      botao.dataset.estruturaIndex =
        String(index)


      botao.addEventListener(
        'click',
        () => {

          selecionar(index)

            if (typeof lamina !== 'undefined') {

              abrirPainelEstrutura(
                index,
                lamina
              )

            }

        }
      )

    }
  )


  overlays.forEach(
    overlay => {

      overlay.addEventListener(
        'click',
        event => {

          event.preventDefault()
          event.stopPropagation()


          const index =
            Number(
              overlay.dataset.estruturaIndex
            )


          if (
            Number.isFinite(index)
          ) {

            selecionar(index)

          }

        }
      )

    }
  )


  anterior?.addEventListener(
    'click',
    () => {

      selecionar(
        indiceAtual - 1
      )

    }
  )


  proxima?.addEventListener(
    'click',
    () => {

      selecionar(
        indiceAtual + 1
      )

    }
  )


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
        event.key === 'ArrowLeft'
      ) {

        selecionar(
          indiceAtual - 1
        )

      }


      if (
        event.key === 'ArrowRight'
      ) {

        selecionar(
          indiceAtual + 1
        )

      }

    }
  )


  atualizarInterface()

}


function configurarModoEstudo(viewer, lamina) {

  if (!viewer || !lamina) {
    return
  }

  const estruturas =
    Array.isArray(lamina.estruturas)
      ? lamina.estruturas
      : []

  const panel =
    document.querySelector('#estrutura-estudo-panel')

  const nome =
    document.querySelector('#estrutura-estudo-nome')

  const descricao =
    document.querySelector('#estrutura-estudo-descricao')

  const fechar =
    document.querySelector('#estrutura-estudo-fechar')

  const viewerElement =
    document.querySelector('#openseadragon')

  if (!panel || !nome || !descricao) {
    console.warn(
      'COMBO 7: painel de estudo nao encontrado.'
    )
    return
  }

  let indiceAtual = -1

  function limparSelecao() {

    document
      .querySelectorAll('.estrutura-overlay')
      .forEach(overlay => {

        overlay.classList.remove(
          'estrutura-selecionada'
        )

      })

    document
      .querySelectorAll('.structure')
      .forEach(botao => {

        botao.classList.remove(
          'estrutura-selecionada'
        )

      })

  }

  function selecionarVisual(index) {

    const indice = String(index)

    document
      .querySelectorAll('.estrutura-overlay')
      .forEach(overlay => {

        overlay.classList.toggle(
          'estrutura-selecionada',
          overlay.dataset.estruturaIndex === indice
        )

      })

    document
      .querySelectorAll('.structure')
      .forEach((botao, botaoIndex) => {

        botao.classList.toggle(
          'estrutura-selecionada',
          String(botaoIndex) === indice
        )

      })

  }

  function centralizarEstrutura(index) {

    const overlay =
      Array.from(
        document.querySelectorAll(
          '.estrutura-overlay'
        )
      ).find(
        item =>
          item.dataset.estruturaIndex === String(index)
      )

    if (!overlay) {
      return
    }

    const x =
      Number(overlay.dataset.imageX)

    const y =
      Number(overlay.dataset.imageY)

    const largura =
      Number(overlay.dataset.imageWidth)

    const altura =
      Number(overlay.dataset.imageHeight)

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

  function mostrarEstrutura(
    index,
    centralizar = false
  ) {

    const estrutura =
      estruturas[index]

    if (!estrutura) {
      return
    }

    indiceAtual =
      Number(index)

    nome.textContent =
      estrutura.nome ||
      `Estrutura ${Number(index) + 1}`

    descricao.textContent =
      estrutura.descricao ||
      'Nenhuma descri��o cadastrada.'

    panel.hidden = false

    panel.dataset.estruturaIndex =
      String(index)

    selecionarVisual(index)

    if (centralizar) {
      centralizarEstrutura(index)
    }

  }

  function fecharPainel() {

    panel.hidden = true

    indiceAtual = -1

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
   * LISTA LATERAL
   */

  document.addEventListener(
    'click',
    event => {

      const botao =
        event.target.closest('.structure')

      if (!botao) {
        return
      }

      const index =
        Number(
          botao.dataset.estruturaIndex
        )

      if (!Number.isFinite(index)) {
        return
      }

      mostrarEstrutura(
        index,
        true
      )

    }
  )

  /*
   * MARCADOR SOBRE A IMAGEM
   */

  if (viewerElement) {

    viewerElement.addEventListener(
      'click',
      event => {

        const overlay =
          event.target.closest(
            '.estrutura-overlay'
          )

        if (!overlay) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        const index =
          Number(
            overlay.dataset.estruturaIndex
          )

        if (!Number.isFinite(index)) {
          return
        }

        mostrarEstrutura(
          index,
          true
        )

      },
      true
    )

  }

  /*
   * NAVEGACAO POR TECLADO
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
        mostrarEstrutura(0, true)
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
          novoIndice >= estruturas.length
        ) {
          novoIndice = 0
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
    'COMBO 7: modo estudo conectado.',
    estruturas.length,
    'estruturas.'
  )

}

function limparEstruturas(viewer) {

  if (!viewer) {
    return
  }

  const overlays =
    viewer.currentOverlays || []

  overlays
    .filter(overlay => {

      const elemento =
        overlay.element

      return (
        elemento &&
        elemento.classList &&
        elemento.classList.contains(
          'estrutura-overlay'
        )
      )

    })
    .forEach(overlay => {

      try {

        viewer.removeOverlay(
          overlay.element
        )

      } catch (erro) {

        console.warn(
          'Erro ao remover estrutura:',
          erro
        )

      }

    })

}


function iniciarViewer(lamina) {

  const elemento =
    document.querySelector('#openseadragon')


  if (!elemento) {

    console.error(
      'Elemento #openseadragon n�o encontrado.'
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
        Imagem da l�mina n�o encontrada.
      </div>
    `

    return
  }


  const viewer =
    OpenSeadragon({

      element: elemento,

      drawer: 'canvas',

      prefixUrl:
        'https://openseadragon.github.io/openseadragon/images/',

      tileSources: {

        type: 'image',

        url: lamina.imagem_url

      },

      showNavigationControl: false,

      animationTime: 0.8,

      zoomPerScroll: 1.5,

      maxZoomPixelRatio: 8,

      visibilityRatio: 1,

      constrainDuringPan: true

    })




  viewer.addOnceHandler(
    'open',
    () => {

      desenharEstruturas(
        viewer,
        lamina
      )

    }
  )


  viewer.addOnceHandler(
    'open',
    () => {

      configurarModoEstudo(
        viewer,
        lamina
      )

    }
  )

document
    .querySelector('#zoom-in')
    ?.addEventListener(
      'click',
      () => viewer.viewport.zoomBy(1.5)
    )


  document
    .querySelector('#zoom-out')
    ?.addEventListener(
      'click',
      () => viewer.viewport.zoomBy(0.67)
    )


  document
    .querySelector('#zoom-home')
    ?.addEventListener(
      'click',
      () => viewer.viewport.goHome()
    )


  /* =====================================================
     COMBO 4 - VIEWER AVANCADO
     ===================================================== */


  const zoomValue =
    document.querySelector('#zoom-value')


  const atualizarZoom =
    () => {

      if (!zoomValue) {
        return
      }

      const zoom =
        viewer.viewport.getZoom()

      zoomValue.textContent =
        Math.round(zoom * 100) + '%'

    }


  viewer.addHandler(
    'zoom',
    atualizarZoom
  )


  viewer.addHandler(
    'open',
    atualizarZoom
  )


  /*
   * Desenha todas as estruturas da l�mina
   * depois que a imagem estiver aberta.
   */



  document
    .querySelector('#zoom-fullscreen')
    ?.addEventListener(
      'click',
      () => {

        if (
          typeof viewer.setFullScreen ===
          'function'
        ) {

          viewer.setFullScreen(true)

        } else {

          viewer.setFullPage(true)

        }

      }
    )


  document
    .querySelector('#zoom-reset')
    ?.addEventListener(
      'click',
      () => {

        viewer.viewport.goHome()

        atualizarZoom()

      }
    )


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

        viewer.viewport.zoomBy(1.25)

        viewer.viewport.applyConstraints()

      }


      if (
        event.key === '-' ||
        event.key === '_'
      ) {

        viewer.viewport.zoomBy(0.8)

        viewer.viewport.applyConstraints()

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


      atualizarZoom()

    }
  )


  atualizarZoom()

}


async function render() {

  const config = await carregarConfiguracoesSite()

  const route =
    getRoute()


  if (route === 'login') {

    app.innerHTML =
      renderLogin()

    setupLogin()

    return
  }


  if (route === 'admin') {

    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser()


    if (!user) {

      window.location.hash =
        '#login'

      return
    }


    app.innerHTML =
      await renderAdmin()

    setupAdmin()

    return
  }


  if (route === 'nova-lamina') {

    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser()


    if (!user) {

      window.location.hash =
        '#login'

      return
    }


    app.innerHTML =
      renderNovaLamina()

    setupNovaLamina()

    return
  }


  if (route === 'catalogo') {

    await renderCatalogo()

    return
  }


  if (route === 'lamina') {

    const id =
      window.location.hash
        .replace('#lamina/', '')


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
          <h1>Carregando l�mina...</h1>
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
              L�mina n�o encontrada
            </h1>

            <p>
              N�o foi poss�vel carregar esta l�mina.
            </p>

            <a
              href="#laminas"
              class="button primary"
            >
              Voltar para l�minas
            </a>

          </div>

        </main>
      `

      return
    }


    app.innerHTML =
      renderLamina(lamina, config)


    iniciarViewer(lamina)

    return
  }
    aplicarConfiguracoesVisuais(config)

    app.innerHTML = renderHome(config)

}


window.addEventListener(
  'hashchange',
  render
)


render()
















































