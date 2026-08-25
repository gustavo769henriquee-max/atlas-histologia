import "./style.css";
import OpenSeadragon from "openseadragon";
import { supabase, getCurrentSession, isAdmin } from "./lib/supabase.js";
import { icone } from "./lib/icons.js";
import { aplicarTema, temaEfetivo } from "./lib/tema.js";


import { renderLogin, setupLogin } from "./pages/login.js";
import { renderAdmin, setupAdmin } from "./pages/admin.js";
import { renderCatalogo } from "./pages/catalogo.js";
import { renderNovaLamina, setupNovaLamina } from "./pages/nova-lamina.js";

const app = document.querySelector("#app");

/*
 * Aplica as configurações vindas do painel Aparência sobre os
 * tokens centralizados (:root em style.css), usando a fonte única
 * de verdade (lib/tema.js) — a MESMA função usada pela prévia do
 * painel. Cores derivadas (superfícies, bordas, hover, rodapé,
 * visualizador etc.) acompanham automaticamente.
 */
function aplicarConfiguracoesVisuais(config = {}) {
  const temaSalvo =
    config.tema && typeof config.tema === "object" ? config.tema : {};

  /*
   * Combina as colunas planas (cor_principal, cor_fundo...) com o
   * objeto `tema` salvo; colunas planas vencem quando presentes,
   * preservando compatibilidade com configurações antigas.
   */
  const combinado = { ...temaSalvo };

  for (const chave of [
    "cor_principal",
    "cor_secundaria",
    "cor_acento",
    "cor_fundo",
    "cor_texto",
  ]) {
    if (config[chave]) {
      combinado[chave] = config[chave];
    }
  }

  aplicarTema(document.documentElement, temaEfetivo(combinado));

  /*
   * Verificação objetiva (requisito #7): o valor computado precisa ser
   * exatamente o valor salvo no banco para o token testado.
   */
  console.debug(
    "[APARÊNCIA DEBUG] --cor-texto-suave computada:",
    getComputedStyle(document.documentElement)
      .getPropertyValue("--cor-texto-suave")
      .trim(),
  );
}


async function carregarConfiguracoesSite() {
  const { data, error } = await supabase
    .from("configuracoes_site")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar configurações do site:", error);
    return {};
  }

  return data || {};
}

function getRoute() {
  const hash = window.location.hash;

  if (hash === "#login") return "login";
  if (hash === "#admin") return "admin";
  if (hash.startsWith("#nova-lamina")) return "nova-lamina";
  if (hash === "#laminas") return "catalogo";
  if (hash.startsWith("#lamina/")) return "lamina";

  return "home";
}

function renderHeader(config = {}) {
  const tamanhoLogo = Math.round(Number(config.logo_tamanho || 100) * 0.52);

  return `
    <header class="header">
      <div class="container header-content">

        <a href="#inicio" class="brand" aria-label="Ir para o início">
          <span
            class="brand-icon"
            style="width:${tamanhoLogo}px;height:${tamanhoLogo}px;"
          >
            ${
              config.logo_url
                ? `<img src="${escapeHtml(config.logo_url)}" alt="Logo do ${escapeHtml(config.nome_site || "Atlas")}">`
                : icone.microscopio
            }
          </span>

          <span class="brand-texto">
            <strong>${escapeHtml(config.nome_site || "Atlas")}</strong>
            <small>${escapeHtml(config.subtitulo || "Histológico")}</small>
          </span>
        </a>

        <nav class="nav" aria-label="Navegação principal">
          <a href="#inicio">Início</a>
          <a href="#laminas">Lâminas</a>
          <a href="#sobre">Sobre</a>
          <a href="#admin">Administração</a>
        </nav>

      </div>
    </header>
  `;
}

function renderHome(config = {}, laminaDestaqueId = "") {
  /*
   * Destinos distintos para os três painéis:
   * - EXPLORE → catálogo completo (navegação/descoberta);
   * - AMPLIE  → abre direto uma lâmina publicada (experiência
   *             real de microscopia e zoom); se não houver nenhuma,
   *             cai no catálogo;
   * - APRENDA → seção Sobre (conteúdo didático do projeto).
   */
  const destinoAmplie = laminaDestaqueId
    ? `#lamina/${laminaDestaqueId}`
    : "#laminas";

  return `
    ${renderHeader(config)}

    <main class="home-page">

      <section class="home-hero" id="inicio">

        <div class="container-wide home-hero-grid">

          <div class="home-hero-content">

            <div class="home-eyebrow">
              <span class="home-eyebrow-dot"></span>
              <span>MICROSCOPIA • ESTUDO • EXPLORAÇÃO</span>
            </div>

            <h1>${escapeHtml(config.titulo_inicio || "Explore a Microestrutura do Mundo Animal")}</h1>

            <p class="home-hero-description">
              ${escapeHtml(
                config.descricao_inicio ||
                  "Um atlas de histologia interativo para explorar tecidos, estruturas e lâminas histológicas de uma forma visual e dinâmica."
              )}
            </p>

            <div class="home-hero-actions">

              <a href="#laminas" class="button primary home-primary-button">
                ${escapeHtml(
                  config.texto_botao_principal ||
                    "Explorar " + (config.nome_site || "Atlas")
                )}
                <span>→</span>
              </a>

              <a href="#sobre" class="button secondary home-secondary-button">
                ${escapeHtml(
                  config.texto_botao_secundario || "Conheça o projeto"
                )}
              </a>

            </div>

            <div class="home-hero-note">
              <span>↗</span>
              Explore lâminas, estruturas e detalhes em alta resolução.
            </div>

          </div>


          <div class="home-hero-visual">

            <div class="home-visual-card">

              <div class="home-visual-grid"></div>

              <div class="home-visual-orbit home-orbit-one"></div>
              <div class="home-visual-orbit home-orbit-two"></div>

              <div class="home-microscope">

                <div class="home-microscope-head"></div>

                <div class="home-microscope-neck"></div>

                <div class="home-microscope-body">

                  <div class="home-microscope-detail"></div>

                </div>

                <div class="home-microscope-stage">

                  <div class="home-microscope-slide">
                    <span></span>
                  </div>

                </div>

                <div class="home-microscope-base"></div>

                <div class="home-microscope-foot"></div>

              </div>


              <div class="home-floating-card home-floating-card-top">

                <span class="home-floating-icon">${icone.zoom}</span>

                <div>
                  <strong>Atlas interativo</strong>
                  <small>Explore em alta resolução</small>
                </div>

              </div>


              <div class="home-floating-card home-floating-card-bottom">

                <span class="home-floating-number">01</span>

                <div>
                  <small>Experiência</small>
                  <strong>Visual + Interativa</strong>
                </div>

              </div>

            </div>

          </div>

        </div>


        <div class="home-hero-bottom">

          <div class="container home-hero-bottom-inner">

            <span>Atlas de Histologia</span>

            <span class="home-hero-line"></span>

            <span>Aprender observando</span>

          </div>

        </div>

      </section>


      <section class="home-about section" id="sobre">

        <div class="container-wide">

          <div class="home-section-heading">

            <div>

              <span class="eyebrow">
                SOBRE O ATLAS
              </span>

              <h2>
                Aprender histologia
                <span>de uma forma diferente.</span>
              </h2>

            </div>

            <p>
              ${escapeHtml(
                config.texto_sobre ||
                  "O " +
                    (config.nome_site || "Atlas") +
                    " " +
                    (config.subtitulo || "Histológico") +
                    " foi pensado para transformar a observação das lâminas em uma experiência de aprendizagem visual e interativa."
              )}
            </p>

          </div>


          <div class="home-about-cards">

            <article
              class="home-feature-card"
              data-revelar
            >

              <span class="home-feature-number">01</span>

              <div class="home-feature-icon">
                ${icone.camadas}
              </div>

              <h3>
                Explore
              </h3>

              <p>
                Descubra o acervo navegando pelas lâminas e categorias —
                tecidos, técnicas e colorações organizados para estudo.
              </p>

              <a href="#laminas">
                Navegar pelo acervo
                <span>→</span>
              </a>

            </article>


            <article
              class="home-feature-card home-feature-destaque"
              data-revelar
            >

              <span class="home-feature-number">02</span>

              <div class="home-feature-icon">
                ${icone.microscopio}
              </div>

              <h3>
                Amplie
              </h3>

              <p>
                Entre no visualizador de microscopia: aproxime, movimente
                e observe cada detalhe da lâmina em alta resolução.
              </p>

              <a href="${destinoAmplie}">
                Abrir o visualizador
                <span>→</span>
              </a>

            </article>


            <article
              class="home-feature-card"
              data-revelar
            >

              <span class="home-feature-number">03</span>

              <div class="home-feature-icon">
                ${icone.livro}
              </div>

              <h3>
                Aprenda
              </h3>

              <p>
                Relacione estruturas observadas com explicações didáticas,
                anotações e conteúdos de apoio em cada lâmina.
              </p>

              <a href="#sobre">
                Conhecer a proposta
                <span>→</span>
              </a>

            </article>

          </div>

        </div>

      </section>


      <section class="home-cta">

        <div class="container-wide home-cta-inner">

          <div>

            <span class="eyebrow">
              PRONTO PARA EXPLORAR?
            </span>

            <h2>
              Entre no mundo microscópico.
            </h2>

          </div>

          <a href="#laminas" class="button primary">
            Explorar lâminas
            <span>→</span>
          </a>

        </div>

      </section>

    </main>


    <footer class="footer">

      <div class="container footer-conteudo">

        <span class="footer-marca">
          ${icone.microscopio}
          ${escapeHtml(config.nome_site || "Atlas")} ${escapeHtml(
            config.subtitulo || "Histológico"
          )}
        </span>

        <span class="footer-texto">
          ${escapeHtml(config.texto_rodape || "Projeto acadêmico")}
        </span>

        ${
          config.link_institucional
            ? `<a
                 href="${escapeHtml(config.link_institucional)}"
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 ${escapeHtml(config.nome_institucional || "Instituição")}
               </a>`
            : ""
        }

        ${
          config.creditos
            ? `<small>${escapeHtml(config.creditos)}</small>`
            : ""
        }

      </div>

    </footer>
  `;
}
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*
 * Vídeo opcional da lâmina.
 * REGRA: seção aparece SOMENTE quando existe video_url.
 * Sem vídeo → nada é renderizado (sem caixa vazia).
 * Suporta YouTube, Vimeo e arquivos de vídeo diretos (mp4/webm/ogg).
 */
function renderSecaoVideo(lamina) {
  const url = String(lamina?.video_url || "").trim();

  if (!url) return "";

  /* YouTube */
  const youtube =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/) ||
    null;

  if (youtube) {
    return `
      <section class="video-secao">
        <div class="container">
          <div class="video-cabecalho">
            ${icone.play}
            <h2>Vídeo da lâmina</h2>
          </div>
          <div class="video-moldura">
            <iframe
              src="https://www.youtube.com/embed/${escapeHtml(youtube[1])}"
              title="Vídeo da lâmina"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>
    `;
  }

  /* Vimeo */
  const vimeo = url.match(/vimeo\.com\/(\d+)/);

  if (vimeo) {
    return `
      <section class="video-secao">
        <div class="container">
          <div class="video-cabecalho">
            ${icone.play}
            <h2>Vídeo da lâmina</h2>
          </div>
          <div class="video-moldura">
            <iframe
              src="https://player.vimeo.com/video/${escapeHtml(vimeo[1])}"
              title="Vídeo da lâmina"
              allow="autoplay; fullscreen; picture-in-picture"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>
    `;
  }

  /* Arquivo de vídeo direto */
  return `
    <section class="video-secao">
      <div class="container">
        <div class="video-cabecalho">
          ${icone.play}
          <h2>Vídeo da lâmina</h2>
        </div>
        <div class="video-moldura">
          <video controls preload="metadata" src="${escapeHtml(url)}"></video>
        </div>
      </div>
    </section>
  `;
}


function renderLamina(lamina, config) {
  const estruturas = Array.isArray(lamina.estruturas) ? lamina.estruturas : [];

  return `
    ${renderHeader(config)}

    <main>

      <section class="slide-header">

        <div class="container">

          <a href="#laminas" class="back-link">
            ← Voltar para as lâminas
          </a>

          <div class="slide-title">

            <div>

              <span class="eyebrow">
                ${escapeHtml(lamina.categoria || "Histologia")}
              </span>

              <h1>
                ${escapeHtml(lamina.nome || "Lâmina")}
              </h1>

              <p>
                Explore a lâmina utilizando zoom e movimentação.
              </p>

            </div>

            <div class="slide-meta">

              ${
                lamina.tecnica
                  ? `<span>${icone.microscopio} ${escapeHtml(lamina.tecnica)}</span>`
                  : ""
              }

               ${
                 lamina.coloracao
                   ? `<span>${icone.pasta} ${escapeHtml(lamina.coloracao)}</span>`
                   : ""
               }

               ${
                 lamina.aumento
                   ? `<span>${icone.zoom} Aumento: ${escapeHtml(lamina.aumento)}</span>`
                   : ""
               }

             </div>

          </div>

        </div>

      </section>


      ${renderSecaoVideo(lamina)}


      <section class="viewer-section">

        <div class="container viewer-layout">

          <div class="viewer-container">

            <div
              id="estrutura-estudo-panel"
              hidden
              style="
                position: fixed;
                top: 96px;
                right: 28px;
                z-index: 60;
                width: min(320px, calc(100vw - 48px));
                padding: 20px 22px;
                background: var(--cor-superficie);
                border: 1px solid var(--border);
                border-radius: 16px;
                box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
              "
            >

              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 8px;
              ">

                <span style="
                  color: var(--green-light);
                  font-size: 10px;
                  font-weight: 800;
                  letter-spacing: 1.6px;
                ">
                  ESTRUTURA SELECIONADA
                </span>

                <button
                  id="estrutura-estudo-fechar"
                  type="button"
                  title="Fechar"
                  aria-label="Fechar painel de estudo"
                  style="
                    width: 30px;
                    height: 30px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: var(--cor-hover);
                    color: var(--cor-texto);
                    font-size: 16px;
                    line-height: 1;
                    cursor: pointer;
                  "
                >
                  ×
                </button>

              </div>

              <div
                id="estrutura-estudo-contador"
                class="estrutura-estudo-contador"
              >
                Selecione uma estrutura
              </div>

              <span
                id="estrutura-estudo-tipo"
                class="estrutura-estudo-tipo"
                hidden
              ></span>

              <h3
                id="estrutura-estudo-nome"
                style="margin: 6px 0 8px; font-size: 19px; color: var(--cor-texto);"
              >
                Estrutura
              </h3>

              <p
                id="estrutura-estudo-descricao"
                style="margin: 0; color: var(--cor-texto-suave); font-size: 13px; line-height: 1.6;"
              ></p>

              <p
                id="estrutura-estudo-texto"
                class="estrutura-estudo-texto"
                hidden
              ></p>

              <div class="estrutura-estudo-navegacao">

                <button
                  id="estrutura-anterior"
                  class="estrutura-nav-item"
                  type="button"
                  title="Estrutura anterior"
                  aria-label="Estrutura anterior"
                >
                  ← Anterior
                </button>

                <button
                  id="estrutura-proxima"
                  class="estrutura-nav-item"
                  type="button"
                  title="Próxima estrutura"
                  aria-label="Próxima estrutura"
                >
                  Próxima →
                </button>

              </div>

            </div>

            <div
              id="openseadragon"
              class="viewer"
            ></div>

            <div
              id="imagem-nav"
              class="imagem-nav"
              hidden
            >

              <span
                id="img-contador"
                class="img-contador"
              >0 / 0</span>

              <div class="imagem-nav-controles">

                <button
                  id="img-anterior"
                  type="button"
                  title="Imagem anterior"
                  aria-label="Imagem anterior"
                  disabled
                >‹</button>

                <button
                  id="img-proximo"
                  type="button"
                  title="Próxima imagem"
                  aria-label="Próxima imagem"
                >›</button>

              </div>

            </div>

            <div class="viewer-controls">

              <span>
                Arraste para movimentar •
                Use a roda do mouse para ampliar •
                <span id="zoom-value">100%</span>
              </span>

              <div class="zoom-buttons" role="group" aria-label="Controles de zoom">

                <button
                  id="zoom-out"
                  type="button"
                  title="Reduzir zoom"
                  aria-label="Reduzir zoom"
                >−</button>

                <button
                  id="zoom-home"
                  type="button"
                  title="Visão geral"
                  aria-label="Voltar para visão geral"
                >⌂</button>

                <button
                  id="zoom-in"
                  type="button"
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                >+</button>

                <button
                  id="zoom-fullscreen"
                  type="button"
                  title="Tela cheia"
                  aria-label="Abrir em tela cheia"
                >⛶</button>

              </div>

            </div>

          </div>


          <aside class="info-panel">

            <div class="panel-label">
              SOBRE A LÂMINA
            </div>

            <h2>
              ${escapeHtml(lamina.nome || "Lâmina")}
            </h2>

            <p class="description">
              ${escapeHtml(lamina.descricao || "")}
            </p>


            ${
              estruturas.length
                ? `
                <div class="info-section">

                  <h3>
                    ${icone.lupa} O que observar
                  </h3>

                  <div class="structure-list">

                    ${estruturas
                      .map((estrutura, index) => {
                        const seguro = estruturaSegura(estrutura);

                        return `
                          <button
                            class="structure"
                            data-estrutura-index="${index}"
                            type="button"
                            title="${escapeHtml(
                              seguro.descricao ||
                                `Estrutura ${String(index + 1).padStart(2, "0")}`,
                            )}"
                          >

                            <span class="structure-numero">${String(
                              index + 1,
                            ).padStart(2, "0")}</span>

                            <span class="structure-info">

                              <strong>
                                ${
                                  seguro.nome ||
                                  `Estrutura ${String(index + 1).padStart(2, "0")}`
                                }
                              </strong>

                              <small class="structure-tipo">
                                ${escapeHtml(rotuloTipoEstrutura(seguro))}
                              </small>

                              <small>
                                ${escapeHtml(
                                  seguro.descricao || "Sem descrição.",
                                )}
                              </small>

                            </span>

                          </button>
                        `;
                      })
                      .join("")}

                  </div>

                </div>
              `
                : `
                <div class="info-section">

                  <h3>
                    ${icone.lupa} O que observar
                  </h3>

                  <p class="structure-empty">
                    Esta lâmina não possui marcações.
                  </p>

                </div>
              `
            }

          </aside>

        </div>

      </section>

    </main>
  `;
}

async function buscarLamina(id) {
  const { data, error } = await supabase
    .from("laminas")
    .select("*")
    .eq("id", id)
    .eq("publicado", true)
    .single();

  if (error) {
    console.error("Erro ao buscar lâmina:", error);

    return null;
  }

  return data;
}

async function buscarImagensLamina(lamina) {
  if (!lamina || !lamina.id) return [];

  const { data, error } = await supabase
    .from("lamina_imagens")
    .select("*")
    .eq("lamina_id", lamina.id)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao carregar imagens da lâmina:", error);

    return [];
  }

  const lista = (data || [])
    .slice()
    .sort(
      (a, b) =>
        (Number(a.ordem) || 0) - (Number(b.ordem) || 0) ||
        new Date(a.created_at || 0) - new Date(b.created_at || 0),
    )
    .map((img) => ({
      id: img.id ?? null,
      url: img.imagem_url,
      ordem: Number(img.ordem) || 0,
    }));

  /*
   * Fallback gradativo (regra 14): lâminas antigas sem lamina_imagens
   * continuam usando laminas.imagem_url como única imagem.
   */
  if (!lista.length && lamina.imagem_url) {
    lista.push({ id: null, url: lamina.imagem_url, ordem: 0 });
  }

  return lista;
}

function iniciarViewer(lamina, imagens) {
  const elemento = document.querySelector("#openseadragon");

  if (!elemento) {
    console.error("Elemento #openseadragon não encontrado.");
    return;
  }

  /*
   * Resolve a lista de imagens com fallback gradativo:
   * - lâminas novas: lamina_imagens (ordenada);
   * - lâminas antigas (sem lamina_imagens): laminas.imagem_url.
   */
  imagensLamina =
    Array.isArray(imagens) && imagens.length
      ? imagens
      : lamina.imagem_url
        ? [{ id: null, url: lamina.imagem_url, ordem: 0 }]
        : [];

  imagemAtualIndex = 0;

  const urlInicial = imagensLamina[0]?.url || lamina.imagem_url;

  if (!urlInicial) {
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
    `;

    return;
  }

  const viewer = OpenSeadragon({
    element: elemento,

    /*
     * Canvas evita o caminho WebGL que falha
     * em alguns navegadores ("Error creating
     * texture in WebGL").
     */

    drawer: "canvas",

    prefixUrl: "https://openseadragon.github.io/openseadragon/images/",

    tileSources: {
      type: "image",

      url: urlInicial,
    },

    showNavigationControl: false,

    animationTime: 0.8,

    zoomPerScroll: 1.5,

    maxZoomPixelRatio: 8,

    visibilityRatio: 1,

    constrainDuringPan: true,

    /*
     * Impede que o usuário se afaste além da lâmina inteira
     * (a visão "toda a lâmina" vira o limite mínimo de zoom),
     * evitando que a imagem fique minúscula e o usuário se perca.
     */
    minZoomImageRatio: 1,
  });

  document
    .querySelector("#zoom-in")
    ?.addEventListener("click", () => viewer.viewport.zoomBy(1.5));

  /*
   * OpenSeadragon não aplica minZoomImageRatio em zoomBy/zoomTo — o
   * clamping só ocorre em applyConstraints(), que não é chamado aqui.
   * Por isso, sem este teto mínimo, o usuário consegue afastar a
   * lâmina para além da visão "toda a lâmina" (contrariando a intenção
   * declarada em minZoomImageRatio: 1). Correção mínima: respeitar o
   * mínimo declarado antes de aplicar o zoom de saída.
   */
  document.querySelector("#zoom-out")?.addEventListener("click", () => {
    const viewport = viewer.viewport;
    const alvo = viewport.getZoom() * 0.67;
    if (alvo < viewport.getMinZoom()) return;
    viewport.zoomBy(0.67);
  });

  document
    .querySelector("#zoom-home")
    ?.addEventListener("click", () => viewer.viewport.goHome());

  document
    .querySelector("#zoom-fullscreen")
    ?.addEventListener("click", (event) => {
      event.preventDefault();

      if (typeof viewer.setFullScreen === "function") {
        viewer.setFullScreen(true);
      } else {
        viewer.setFullPage(true);
      }
    });

  const zoomValue = document.querySelector("#zoom-value");

  function atualizarZoom() {
    if (!zoomValue) return;

    zoomValue.textContent = Math.round(viewer.viewport.getZoom() * 100) + "%";
  }

  viewer.addHandler("zoom", atualizarZoom);

  /*
   * `open` é persistente (addHandler) — não addOnceHandler — para que a
   * troca de imagem via trocarImagem() (mesmo viewer, viewer.open)
   * regenere overlays/limpagem. destruirViewer() limpa este viewer a
   * cada navegação, evitando listeners duplicados (regra 20).
   */
  viewer.addHandler("open", () => {
    atualizarZoom();
    desenharEstruturas(viewer, lamina);
    atualizarControlesImagem();
  });

  configurarModoEstudo(viewer, lamina, imagensLamina);

  /*
   * Controles de navegação entre imagens (uma visível por vez).
   */
  const nav = document.querySelector("#imagem-nav");
  const contador = document.querySelector("#img-contador");
  const btnAnterior = document.querySelector("#img-anterior");
  const btnProximo = document.querySelector("#img-proximo");

  if (imagensLamina.length > 1 && nav) {
    nav.hidden = false;
  }

  function atualizarControlesImagem() {
    if (!contador) return;

    contador.textContent = `${imagemAtualIndex + 1} / ${imagensLamina.length}`;

    if (btnAnterior) btnAnterior.disabled = imagemAtualIndex <= 0;

    if (btnProximo)
      btnProximo.disabled = imagemAtualIndex >= imagensLamina.length - 1;
  }

  btnAnterior?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    trocarImagem(viewer, imagemAtualIndex - 1);
  });

  btnProximo?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    trocarImagem(viewer, imagemAtualIndex + 1);
  });

  atualizarControlesImagem();

  /*
   * Handle de diagnóstico (Fase 19): permite aos testes E2E inspecionar
   * o estado real do viewer (ex.: world.getItemCount()) sem expor
   * variáveis de módulo. Sem efeito funcional na aplicação.
   */
  elemento.__atlasViewer = viewer;

  viewerAtual = viewer;
}

function trocarImagem(viewer, novoIndex) {
  if (!viewer || !imagensLamina.length) return;

  if (novoIndex < 0 || novoIndex >= imagensLamina.length) return;

  imagemAtualIndex = novoIndex;

  const url = imagensLamina[novoIndex]?.url;

  if (!url) return;

  /*
   * Reusa o MESMO viewer (viewer.open) — não cria outro.
   * O handler persistente `open` acima redesenha/limpa
   * as estruturas conforme o índice atual.
   */
  viewer.open({ type: "image", url });
}

/* ============================================================
   MARCAÇÕES SOBRE A IMAGEM (overlays do OpenSeadragon)
   ============================================================ */

function obterTipoEstrutura(estrutura) {
  return ["ponto", "retangulo", "seta", "texto"].includes(estrutura?.tipo)
    ? estrutura.tipo
    : "ponto";
}

const ROTULO_TIPO_ESTRUTURA = {
  ponto: "Ponto",
  retangulo: "Retângulo",
  seta: "Seta",
  texto: "Texto",
};

function rotuloTipoEstrutura(estrutura) {
  return ROTULO_TIPO_ESTRUTURA[obterTipoEstrutura(estrutura)] || "Ponto";
}

/*
 * View-model somente leitura da estrutura.
 * NÃO modifica os dados originais da lâmina.
 * Garante tipos seguros e nunca gera NaN/Infinity
 * ao exibir nome/descricao/texto/tipo no painel.
 */
function estruturaSegura(estrutura = {}) {
  if (!estrutura || typeof estrutura !== "object") estrutura = {};

  return {
    nome: String(estrutura.nome || "").trim(),
    descricao: String(estrutura.descricao || "").trim(),
    texto: String(estrutura.texto || "").trim(),
    tipo: obterTipoEstrutura(estrutura),
  };
}

function limitar01(valor, padrao) {
  if (valor === undefined || valor === null) {
    return padrao === null ? null : Number(padrao);
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) return null;

  return Math.max(0, Math.min(1, numero));
}

/*
 * Calcula a caixa normalizada (0–1) que envolve a
 * marcação, conforme o tipo da estrutura.
 * Estruturas antigas sem "tipo" são tratadas como ponto.
 */

function calcularCaixaDaEstrutura(estrutura) {
  const tipo = obterTipoEstrutura(estrutura);

  const x = limitar01(estrutura.x, 0.5);

  const y = limitar01(estrutura.y, 0.5);

  if (x === null || y === null) return null;

  if (tipo === "retangulo") {
    const largura = limitar01(estrutura.largura, 0.08);

    const altura = limitar01(estrutura.altura, 0.08);

    if (largura === null || altura === null) return null;

    return { tipo, x, y, largura, altura };
  }

  if (tipo === "seta") {
    const x2 = limitar01(estrutura.x2 ?? estrutura.x, x);

    const y2 = limitar01(estrutura.y2 ?? estrutura.y, y);

    if (x2 === null || y2 === null) return null;

    return {
      tipo,

      x: Math.min(x, x2),

      y: Math.min(y, y2),

      largura: Math.max(Math.abs(x2 - x), 0.012),

      altura: Math.max(Math.abs(y2 - y), 0.012),

      x1: x,

      y1: y,

      x2f: x2,

      y2f: y2,
    };
  }

  /*
   * ponto e texto: marcador pequeno ancorado em x,y.
   */

  return {
    tipo,

    x,

    y,

    largura: tipo === "texto" ? 0.16 : 0.04,

    altura: tipo === "texto" ? 0.05 : 0.04,
  };
}

/*
 * Função de seleção ativa, definida por configurarModoEstudo().
 * Permite que o clique em uma overlay (desenharEstruturas)
 * utilize EXATAMENTE a mesma lógica do painel/lista/teclado,
 * sem duplicar atualização de contador/tipo/texto/seleção.
 */
let selecionarEstruturaAtiva = null;

let keydownHandlerLamina = null;

let viewerAtual = null;

/*
 * Imagens da lâmina corrente (resposta da fallback de
 * lamina_imagens -> laminas.imagem_url). Controlam a navegação
 * entre fotos e limitam as estruturas à imagem principal (índice 0).
 */
let imagensLamina = [];
let imagemAtualIndex = 0;

function destruirViewer() {
  if (keydownHandlerLamina) {
    document.removeEventListener("keydown", keydownHandlerLamina);

    keydownHandlerLamina = null;
  }

  if (viewerAtual) {
    try {
      viewerAtual.destroy();
    } catch (erro) {
      console.error("Erro ao destruir o visualizador:", erro);
    }

    viewerAtual = null;
  }
}

function mostrarTextoEstrutura(index, lamina) {
  const indice = Number(index);

  if (Number.isNaN(indice)) return;

  if (typeof selecionarEstruturaAtiva !== "function") return;

  /*
   * centralizar=false: o handler do overlay já chama
   * centralizarEstrutura() logo após, evitando zoom duplicado.
   */
  selecionarEstruturaAtiva(indice, false);
}

function centralizarEstrutura(viewer, overlay, aplicarZoom = true) {
  if (!viewer || !overlay) return;

  const x = Number(overlay.dataset.imageX);

  const y = Number(overlay.dataset.imageY);

  const largura = Number(overlay.dataset.imageWidth);

  const altura = Number(overlay.dataset.imageHeight);

  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  const centroX = x + (Number.isFinite(largura) ? largura / 2 : 0);

  const centroY = y + (Number.isFinite(altura) ? altura / 2 : 0);

  const ponto = viewer.viewport.imageToViewportCoordinates(centroX, centroY);

  viewer.viewport.panTo(ponto, true);

  if (!aplicarZoom) return;

  /*
   * Zoom inteligente:
   * - retangulo/seta: enquadra a caixa da marcação com margem
   *   (~70% do container), usando o tamanho real da marcação;
   * - ponto/texto: mantém o fator confortável de 1.8x,
   *   garantindo um piso relacionado ao "home".
   * Sempre clampado entre os limites nativos do viewer.
   */

  const zoomAtual = viewer.viewport.getZoom();

  const zoomMinimo = viewer.viewport.getMinZoom();

  const zoomMaximo = viewer.viewport.getMaxZoom();

  const zoomHome = viewer.viewport.getHomeZoom();

  const tipo = overlay.dataset.estruturaTipo || "ponto";

  let zoomDesejado;

  if (tipo === "retangulo" || tipo === "seta") {
    const rect = viewer.viewport.imageToViewportRectangle(
      x,
      y,
      Number.isFinite(largura) && largura > 0 ? largura : 0,
      Number.isFinite(altura) && altura > 0 ? altura : 0,
    );

    if (rect && rect.width > 0 && rect.height > 0) {
      const container = viewer.viewport.getContainerSize();

      const alvoLargura = container.x * 0.7;

      const alvoAltura = container.y * 0.7;

      const zoomPorLargura = alvoLargura / rect.width;

      const zoomPorAltura = alvoAltura / rect.height;

      /*
       * Menor dos dois = garante que a caixa inteira
       * (retângulo ou seta — inicial+final) caiba no visor
       * com ~30% de margem. Sem cap extra de 1.8x, para que
       * retângulos/setas pequenos realmente sejam enquadrados.
       */
      zoomDesejado = Math.min(zoomPorLargura, zoomPorAltura);
    } else {
      /*
       * Caixa inválida/extraordinária: mantém o fator
       * confortável em vez de abortar o zoom.
       */
      zoomDesejado = zoomAtual * 1.8;
    }
  } else {
    /*
     * ponto/texto: fator confortável 1.8x, com piso
     * relativo ao "home" para nunca deixar a estrutura
     * invisível após o zoom.
     */
    zoomDesejado = Math.max(zoomAtual * 1.8, zoomHome * 1.2);
  }

  const zoomFinal = Math.min(Math.max(zoomDesejado, zoomMinimo), zoomMaximo);

  viewer.viewport.zoomTo(zoomFinal, ponto, true);
}

function configurarModoEstudo(viewer, lamina, imagensParam) {
  if (!viewer || !lamina) return;

  const estruturas = Array.isArray(lamina.estruturas) ? lamina.estruturas : [];

  const panel = document.querySelector("#estrutura-estudo-panel");

  const nome = document.querySelector("#estrutura-estudo-nome");

  const descricao = document.querySelector("#estrutura-estudo-descricao");

  const contador = document.querySelector("#estrutura-estudo-contador");

  const tipo = document.querySelector("#estrutura-estudo-tipo");

  const texto = document.querySelector("#estrutura-estudo-texto");

  const anterior = document.querySelector("#estrutura-anterior");

  const proxima = document.querySelector("#estrutura-proxima");

  const fechar = document.querySelector("#estrutura-estudo-fechar");

  if (!panel || !nome || !descricao) return;

  let indiceAtual = -1;

  const total = estruturas.length;

  const imagens = Array.isArray(imagensParam) ? imagensParam : [];

  function atualizarContador() {
    if (!contador) return;

    if (!total) {
      contador.textContent = "Esta lâmina não possui marcações.";
      return;
    }

    contador.textContent =
      indiceAtual >= 0
        ? `${indiceAtual + 1} de ${total}`
        : "Selecione uma estrutura";
  }

  function atualizarNavegacao() {
    if (!anterior || !proxima) return;

    const desabilitado = total < 2;

    anterior.disabled = desabilitado;

    proxima.disabled = desabilitado;
  }

  function limparSelecao() {
    document.querySelectorAll(".estrutura-overlay").forEach((overlay) => {
      overlay.classList.remove("estrutura-selecionada");
    });

    document.querySelectorAll(".structure").forEach((botao) => {
      botao.classList.remove("estrutura-selecionada");
    });
  }

  function selecionarVisual(index) {
    const indice = String(index);

    document.querySelectorAll(".estrutura-overlay").forEach((overlay) => {
      overlay.classList.toggle(
        "estrutura-selecionada",
        overlay.dataset.estruturaIndex === indice,
      );
    });

    document.querySelectorAll(".structure").forEach((botao, i) => {
      botao.classList.toggle("estrutura-selecionada", String(i) === indice);
    });
  }

  /*
   * ÚNICA função de seleção do visualizador.
   * Todas as entradas (lista, overlay, teclado, botões) passam por aqui.
   */
  function mostrarEstrutura(index, centralizar = false) {
    const indice = Number(index);

    if (Number.isNaN(indice)) return;

    const estrutura = estruturas[indice];

    if (!estrutura) return;

    const seguro = estruturaSegura(estrutura);

    indiceAtual = indice;

    nome.textContent = seguro.nome || `Estrutura ${indice + 1}`;

    descricao.textContent = seguro.descricao || "Sem descrição.";

    if (tipo) {
      tipo.textContent = rotuloTipoEstrutura(seguro);
      tipo.hidden = false;
    }

    if (texto) {
      if (seguro.tipo === "texto" && seguro.texto) {
        texto.textContent = seguro.texto;
        texto.hidden = false;
      } else {
        texto.textContent = "";
        texto.hidden = true;
      }
    }

    atualizarContador();

    panel.hidden = false;

    panel.dataset.estruturaIndex = String(indice);

    selecionarVisual(indice);

    if (centralizar) {
      const overlay = document.querySelector(
        `.estrutura-overlay[data-estrutura-index="${indice}"]`,
      );

      if (overlay) {
        centralizarEstrutura(viewer, overlay, true);
      }
    }
  }

  function navegar(direcao) {
    if (!total) return;

    if (indiceAtual < 0) {
      mostrarEstrutura(0, true);

      return;
    }

    let novoIndice = indiceAtual + direcao;

    if (novoIndice < 0) novoIndice = total - 1;

    if (novoIndice >= total) novoIndice = 0;

    mostrarEstrutura(novoIndice, true);
  }

  function fecharPainel() {
    panel.hidden = true;

    indiceAtual = -1;

    if (contador) contador.textContent = "Selecione uma estrutura";

    if (tipo) tipo.hidden = true;

    if (texto) {
      texto.textContent = "";
      texto.hidden = true;
    }

    limparSelecao();
  }

  selecionarEstruturaAtiva = mostrarEstrutura;

  atualizarContador();

  atualizarNavegacao();

  fechar?.addEventListener("click", (event) => {
    event.preventDefault();

    event.stopPropagation();

    fecharPainel();
  });

  document.querySelectorAll(".structure").forEach((botao, index) => {
    botao.dataset.estruturaIndex = String(index);

    botao.addEventListener("click", (event) => {
      event.preventDefault();

      event.stopPropagation();

      mostrarEstrutura(index, true);
    });
  });

  anterior?.addEventListener("click", (event) => {
    event.preventDefault();

    event.stopPropagation();

    navegar(-1);
  });

  proxima?.addEventListener("click", (event) => {
    event.preventDefault();

    event.stopPropagation();

    navegar(1);
  });

  if (keydownHandlerLamina) {
    document.removeEventListener("keydown", keydownHandlerLamina);
  }

  keydownHandlerLamina = (event) => {
    if (event.key === "Escape") {
      if (!panel.hidden) {
        fecharPainel();
      }

      return;
    }

    /*
     * Navegação entre imagens: ativa somente quando o painel de estudo
     * está FECHADO e há mais de uma foto. NÃO entra em conflito com a
     * navegação de estruturas (que exige o painel aberto).
     */
    if (imagens.length > 1 && panel.hidden) {
      const ativo =
        event.target &&
        (event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA" ||
          event.target.isContentEditable);

      if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !ativo) {
        event.preventDefault();

        trocarImagem(
          viewer,
          imagemAtualIndex + (event.key === "ArrowRight" ? 1 : -1),
        );

        return;
      }
    }

    if (panel.hidden || !total) return;

    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    event.preventDefault();

    navegar(event.key === "ArrowRight" ? 1 : -1);
  };

  document.addEventListener("keydown", keydownHandlerLamina);
}

function limparOverlaysEstrutura(viewer) {
  if (!viewer) return;

  viewer.currentOverlays.slice().forEach((overlay) => {
    if (overlay?.element?.classList?.contains("estrutura-overlay")) {
      try {
        viewer.removeOverlay(overlay.element);
      } catch (erro) {
        /* ignora remoções problemáticas */
      }
    }
  });
}

function desenharEstruturas(viewer, lamina) {
  if (!viewer || !lamina) return;

  const estruturas = Array.isArray(lamina.estruturas) ? lamina.estruturas : [];

  /*
   * As estruturas são específicas da imagem principal (índice 0): suas
   * coordenadas normalizadas (0..1) foram autorreadas sobre ela. Não
   * sobrepor as mesmas coordenadas sobre fotos de dimensões distintas
   * (regra 17/18). Em imagem não-primária, apenas limpa os overlays.
   */
  if (imagemAtualIndex !== 0) {
    limparOverlaysEstrutura(viewer);

    return;
  }

  limparOverlaysEstrutura(viewer);

  if (!estruturas.length) return;

  const tiledImage = viewer.world.getItemAt(0);

  if (!tiledImage) return;

  const tamanho = tiledImage.getContentSize();

  const larguraImagem = Number(tamanho.x);

  const alturaImagem = Number(tamanho.y);

  if (
    !Number.isFinite(larguraImagem) ||
    !Number.isFinite(alturaImagem) ||
    larguraImagem <= 0 ||
    alturaImagem <= 0
  ) {
    return;
  }

  estruturas.forEach((estrutura, index) => {
    const caixa = calcularCaixaDaEstrutura(estrutura);

    if (!caixa) return;

    const nome = String(estrutura.nome || `Estrutura ${index + 1}`);

    const descricao = String(estrutura.descricao || "");

    const rotulo =
      caixa.tipo === "texto" ? String(estrutura.texto || nome) : nome;

    const imagemX = caixa.x * larguraImagem;

    const imagemY = caixa.y * alturaImagem;

    const imagemLargura = caixa.largura * larguraImagem;

    const imagemAltura = caixa.altura * alturaImagem;

    const rect = viewer.viewport.imageToViewportRectangle(
      imagemX,
      imagemY,
      imagemLargura,
      imagemAltura,
    );

    if (!rect) return;

    const overlay = document.createElement("div");

    overlay.className = "estrutura-overlay";

    overlay.dataset.estruturaIndex = String(index);

    overlay.dataset.estruturaTipo = caixa.tipo || "ponto";

    overlay.dataset.imageX = String(imagemX);

    overlay.dataset.imageY = String(imagemY);

    overlay.dataset.imageWidth = String(imagemLargura);

    overlay.dataset.imageHeight = String(imagemAltura);

    overlay.title = descricao ? `${nome}: ${descricao}` : nome;

    const numeroRotulo = String(index + 1).padStart(2, "0");

    let conteudoInterno = "";

    if (caixa.tipo === "seta") {
      const x1Pct = ((caixa.x1 - caixa.x) / caixa.largura) * 100;

      const y1Pct = ((caixa.y1 - caixa.y) / caixa.altura) * 100;

      const x2Pct = ((caixa.x2f - caixa.x) / caixa.largura) * 100;

      const y2Pct = ((caixa.y2f - caixa.y) / caixa.altura) * 100;

      conteudoInterno = `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;">
          <line x1="${x1Pct}" y1="${y1Pct}" x2="${x2Pct}" y2="${y2Pct}" stroke="#e05252" stroke-width="3" vector-effect="non-scaling-stroke"></line>
          <circle cx="${x2Pct}" cy="${y2Pct}" r="4" fill="#e05252"></circle>
        </svg>
        <span class="estrutura-numero-badge">${numeroRotulo}</span>
      `;
    } else if (caixa.tipo === "retangulo") {
      conteudoInterno = `
        <div style="position:absolute;inset:6px;border:2px solid #e05252;border-radius:6px;background:rgba(224,82,82,0.14);"></div>
        <span class="estrutura-numero-badge">${numeroRotulo}</span>
        <span style="position:absolute;left:44px;top:14px;background:#e05252;color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:999px;white-space:nowrap;">${escapeHtml(rotulo)}</span>
      `;
    } else if (caixa.tipo === "texto") {
      conteudoInterno = `
        <span class="estrutura-numero-badge">${numeroRotulo}</span>
        <span style="display:inline-block;max-width:100%;background:rgba(25, 21, 23, 0.88);color:#fff;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(rotulo)}</span>
      `;
    } else {
      conteudoInterno = `
        <span class="estrutura-numero-badge">${numeroRotulo}</span>
        <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;background:#e05252;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></span>
        <span style="position:absolute;left:60px;top:50%;transform:translateY(-50%);background:rgba(25, 21, 23, 0.88);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;">${escapeHtml(rotulo)}</span>
      `;
    }

    overlay.innerHTML = conteudoInterno;

    overlay.style.cursor = "pointer";

    overlay.addEventListener("click", (event) => {
      event.preventDefault();

      event.stopPropagation();

      mostrarTextoEstrutura(index, lamina);

      centralizarEstrutura(viewer, overlay, true);
    });

    viewer.addOverlay({
      element: overlay,

      location: rect,

      placement: OpenSeadragon.Placement.TOP_LEFT,
    });
  });
}

let renderToken = 0;

async function render() {
  destruirViewer();

  const token = ++renderToken;

  const config = await carregarConfiguracoesSite();

  if (token !== renderToken) return;

  aplicarConfiguracoesVisuais(config);

  const route = getRoute();

  if (route === "login") {
    app.innerHTML = renderLogin();

    setupLogin();

    return;
  }

  if (route === "admin") {
    const session = await getCurrentSession();

    if (token !== renderToken) return;

    if (!session?.user) {
      window.location.hash = "#login";
      return;
    }

    if (!(await isAdmin(session.user))) {
      window.location.hash = "#inicio";
      return;
    }

    if (token !== renderToken) return;

    app.innerHTML = await renderAdmin();

    if (token !== renderToken) return;

    setupAdmin();

    return;
  }

  if (route === "nova-lamina") {
    const session = await getCurrentSession();

    if (token !== renderToken) return;

    if (!session?.user) {
      window.location.hash = "#login";
      return;
    }

    if (!(await isAdmin(session.user))) {
      window.location.hash = "#inicio";
      return;
    }

    if (token !== renderToken) return;

    app.innerHTML = renderNovaLamina(config);

    setupNovaLamina();

    return;
  }

  if (route === "catalogo") {
    if (token !== renderToken) return;

    await renderCatalogo(config);

    return;
  }

  if (route === "lamina") {
    const id = window.location.hash.replace("#lamina/", "");

    if (!id) {
      window.location.hash = "#laminas";

      return;
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
          <h1>Carregando lâmina...</h1>
        </div>

      </main>
    `;

    const lamina = await buscarLamina(id);

    if (token !== renderToken) return;

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
      `;

      return;
    }

    app.innerHTML = renderLamina(lamina, config);

    const imagens = await buscarImagensLamina(lamina);

    if (token !== renderToken) return;

    iniciarViewer(lamina, imagens);

    return;
  }

  /*
   * Home — busca a lâmina publicada mais recente para dar ao
   * painel AMPLIE um destino real de microscopia. Se falhar
   * (sem conexão/sem lâminas), o painel cai no catálogo.
   */
  let laminaDestaqueId = "";

  try {
    const { data: destaque } = await supabase
      .from("laminas")
      .select("id")
      .eq("publicado", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (destaque?.id && token === renderToken) {
      laminaDestaqueId = destaque.id;
    }
  } catch (erroDestaque) {
    console.warn("Sem lâmina em destaque:", erroDestaque);
  }

  app.innerHTML = renderHome(config, laminaDestaqueId);

  configurarRevelacao();
}

/*
 * Animações de entrada discretas: elementos com [data-revelar]
 * ganham a classe .revelado quando entram no viewport.
 * Respeita prefers-reduced-motion (ver CSS).
 */
function configurarRevelacao() {
  const elementos = document.querySelectorAll("[data-revelar]");

  if (!elementos.length) return;

  const prefereMenosMovimento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (
    prefereMenosMovimento ||
    typeof IntersectionObserver === "undefined"
  ) {
    elementos.forEach((el) => el.classList.add("revelado"));

    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada, indice) => {
        if (!entrada.isIntersecting) return;

        entrada.target.style.transitionDelay = `${Math.min(indice * 90, 270)}ms`;

        entrada.target.classList.add("revelado");

        observador.unobserve(entrada.target);
      });
    },
    { threshold: 0.15 },
  );

  elementos.forEach((el) => observador.observe(el));
}

window.addEventListener("hashchange", render);

/*
 * Reaplicação imediata do tema após o painel Aparência salvar.
 * O evento é disparado pelo submit verificado de aparencia.js; aqui o
 * banco é RELIDO (sem cache em memória/storage) e os tokens são
 * reaplicados ao documento, sem exigir navegação nem recarregamento.
 */
window.addEventListener("atlas:config-atualizada", async () => {
  const config = await carregarConfiguracoesSite();

  aplicarConfiguracoesVisuais(config);
});

/*
 * Mantém a interface sincronizada com o estado de autenticação.
 * A sessão continua persistida entre navegações e recarregamentos.
 */
supabase.auth.onAuthStateChange((event) => {
  if (
    event === "SIGNED_OUT" ||
    event === "SIGNED_IN" ||
    event === "TOKEN_REFRESHED" ||
    event === "USER_UPDATED"
  ) {
    const route = getRoute();

    if (route === "admin" || route === "nova-lamina" || route === "login") {
      window.setTimeout(() => render(), 0);
    }
  }
});

render();

