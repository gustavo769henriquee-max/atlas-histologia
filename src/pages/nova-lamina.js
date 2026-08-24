import { supabase } from "../lib/supabase.js";
import { extrairCaminhoArmazenamento } from "../lib/storage-path.js";
import { icone } from "../lib/icons.js";

let resizeHandlerNovaLamina = null;

/*
 * Estado de imagens múltiplas (Fase 18) — escopo de módulo para ser
 * acessível tanto pelo setup do formulário quanto por carregarLamina
 * e salvarLamina.
 * Cada item: { id, url, ordem, path } (existente, já no banco)
 *         ou { file, previewUrl, localId } (novo, ainda não enviado).
 * A ordem do array == ordem exibida (índice 0 = principal).
 */
let imagens = [];

export function renderNovaLamina(config = {}) {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");

  const editarId = params.get("editar");
  const editarIdAttr = escapeHtml(editarId || "");

  return `
    <header class="header">

      <div class="container header-content">

        <a href="#inicio" class="brand">

          <span
            class="brand-icon"
            style="width:${Math.round(Number(config.logo_tamanho || 100) * 0.52)}px;height:${Math.round(Number(config.logo_tamanho || 100) * 0.52)}px;"
          >
            ${
              config.logo_url
                ? `<img src="${escapeHtml(config.logo_url)}" alt="">`
                : icone.microscopio
            }
          </span>

          <span class="brand-texto">
            <strong>${escapeHtml(config.nome_site || "Atlas")}</strong>
            <small>${escapeHtml(config.subtitulo || "Histológico")}</small>
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

          <a href="#admin">
            Administração
          </a>

        </nav>

      </div>

    </header>


    <main>

      <section class="form-page">

        <div class="container">

          <a
            href="#admin"
            class="back-link"
          >
            ← Voltar para administração
          </a>


          <div class="form-header">

            <span class="eyebrow">
              ${editarId ? "EDIÇÃO" : "CADASTRO"}
            </span>

            <h1>
              ${editarId ? "Editar lâmina" : "Nova lâmina"}
            </h1>

            <p>
              ${
                editarId
                  ? "Altere as informações desta lâmina."
                  : "Cadastre uma nova lâmina no Atlas Histológico."
              }
            </p>

          </div>


          <div
            id="lamina-form-status"
            class="form-status"
          ></div>


          <form
            id="lamina-form"
            class="lamina-form"
            data-editar-id="${editarIdAttr}"
          >

            <div class="form-card">

              <div class="form-card-title">

                <span>
                  ${icone.documento}
                </span>

                <div>

                  <h2>
                    Informações
                  </h2>

                  <p>
                    Dados básicos da lâmina.
                  </p>

                </div>

              </div>


              <div class="form-grid">


                <div class="form-field full">

                  <label for="nome">
                    Nome da lâmina *
                  </label>

                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Ex.: Epitélio intestinal"
                    required
                  >

                </div>


                <div class="form-field full">

                  <label for="descricao">
                    Descrição
                  </label>

                  <textarea
                    id="descricao"
                    name="descricao"
                    rows="5"
                    placeholder="Descreva o que pode ser observado nesta lâmina..."
                  ></textarea>

                </div>



<div class="form-field">

  <label for="categoria">
    Categoria
  </label>

  <select
    id="categoria"
    name="categoria"
  >

    <option value="">
      Selecione uma categoria
    </option>

  </select>

</div>
<div class="form-field">

                  <label for="tecnica">
                    Técnica
                  </label>

                  <input
                    id="tecnica"
                    name="tecnica"
                    type="text"
                    placeholder="Ex.: Corte histológico"
                  >

                </div>


                <div class="form-field">

                  <label for="coloracao">
                    Coloração
                  </label>

                  <input
                    id="coloracao"
                    name="coloracao"
                    type="text"
                    placeholder="Ex.: Hematoxilina e eosina"
                  >

                </div>


                <div class="form-field">

                  <label for="publicado">
                    Visibilidade
                  </label>

                  <select
                    id="publicado"
                    name="publicado"
                  >

                    <option value="true">
                      Publicada
                    </option>

                    <option value="false">
                      Oculta
                    </option>

                  </select>

                   </div>

               </div>

               <div class="form-grid">

                 <div class="form-field full">

                   <label for="aumento">
                     Aumento
                   </label>

                   <input
                     id="aumento"
                     name="aumento"
                     type="text"
                     placeholder="Ex.: 400×"
                   >

                   <small>
                     Aumento real da observação (ex.: 40×, 1000× óleo).
                   </small>

                 </div>

                 <div class="form-field full">

                   <label for="video_url">
                     Vídeo (opcional)
                   </label>

                   <input
                     id="video_url"
                     name="video_url"
                     type="url"
                     placeholder="https://youtube.com/watch?v=... ou URL do arquivo"
                   >

                   <small>
                     Link do YouTube, Vimeo ou arquivo de vídeo (MP4/WebM).
                     A seção de vídeo só aparece na lâmina quando preenchida.
                   </small>

                 </div>

               </div>

             </div>



             <div class="form-card">

               <div class="form-card-title">

                 <span>
                   ${icone.imagem}
                 </span>

                 <div>

                   <h2>
                     Imagens
                   </h2>

                   <p>
                     Uma ou mais imagens da lâmina. A primeira é a principal.
                   </p>

                 </div>

               </div>


               <div
                 id="imagens-preview"
                 class="imagens-preview"
               ></div>


               <div class="upload-area">

                 <input
                   id="imagem"
                   type="file"
                   accept="image/*"
                   multiple
                 >

                 <label for="imagem">

                   <span class="upload-icon">
                     ${icone.upload}
                   </span>

                   <strong>
                     Selecionar imagens
                   </strong>

                   <small>
                     PNG, JPG ou WEBP — selecione uma ou várias
                   </small>

                 </label>

               </div>

             </div>



            <div class="form-card estruturas-editor-card">

              <div class="form-card-title">

                <span>
                  ${icone.microscopio}
                </span>

                <div>

                  <h2>
                    Estruturas da lâmina
                  </h2>

                  <p>
                    Cadastre as estruturas que poderão ser identificadas na lâmina.
                  </p>

                </div>

              </div>


              <div
                id="estruturas-lista"
                class="estruturas-lista"
              ></div>


                            <div class="estrutura-editor">

                <div class="estrutura-editor-toolbar">

                  <div class="form-field">

                    <label for="estrutura-nome">
                      Nome da estrutura
                    </label>

                    <input
                      id="estrutura-nome"
                      type="text"
                      placeholder="Ex.: Núcleo"
                    >

                  </div>


                  <div class="form-field">

                    <label for="estrutura-descricao">
                      Descrição
                    </label>

                    <input
                      id="estrutura-descricao"
                      type="text"
                      placeholder="Ex.: Região central da célula"
                    >

                  </div>

                </div>


                <div class="form-field">

                  <label>
                    Tipo de marcação
                  </label>

                  <div
                    id="estrutura-ferramentas"
                    class="estrutura-ferramentas"
                  >

                    <button
                      type="button"
                      class="estrutura-tool active"
                      data-estrutura-tool="ponto"
                    >
                      Ponto
                    </button>

                    <button
                      type="button"
                      class="estrutura-tool"
                      data-estrutura-tool="retangulo"
                    >
                      Retângulo
                    </button>

                    <button
                      type="button"
                      class="estrutura-tool"
                      data-estrutura-tool="seta"
                    >
                      Seta
                    </button>

                    <button
                      type="button"
                      class="estrutura-tool"
                      data-estrutura-tool="texto"
                    >
                      Texto
                    </button>

                  </div>

                </div>


                <div
                  id="estrutura-imagem-editor"
                  class="estrutura-imagem-editor"
                >

                  <div class="estrutura-imagem-placeholder">

                    Escolha uma imagem da lâmina para começar
                    a apontar as estruturas.

                  </div>

                </div>


                <div
                  id="estrutura-texto-editor"
                  class="estrutura-texto-editor"
                  hidden
                >

                  <div class="form-field">

                    <label for="estrutura-texto">
                      Texto da marcação
                    </label>

                    <input
                      id="estrutura-texto"
                      type="text"
                      placeholder="Ex.: Lúmen"
                    >

                  </div>

                </div>


                <div
                  id="estrutura-editor-ajuda"
                  class="estrutura-editor-ajuda"
                >
                  Selecione uma ferramenta e clique ou arraste
                  sobre a imagem.
                </div>


                <button
                  type="button"
                  class="button secondary"
                  id="adicionar-estrutura"
                >
                  + Adicionar estrutura
                </button>




              </div>

            </div>

            <div class="form-actions">

              <a
                href="#admin"
                class="button secondary"
              >
                Cancelar
              </a>

              <button
                type="submit"
                class="button primary"
                id="save-lamina"
              >
                ${editarId ? "Salvar alterações" : "Cadastrar lâmina"}
              </button>

            </div>

          </form>

        </div>

      </section>

    </main>
  `;
}

export async function setupNovaLamina() {
  let estruturas = [];

  /*
   * Reseta o estado de imagens a cada entrada no formulário (regra 13):
   * evita que imagens de uma edição anterior "vazem" para uma nova lâmina.
   */
  imagens = [];

  const form = document.querySelector("#lamina-form");

  if (!form) {
    console.error("[ATLAS] formulário #lamina-form não encontrado");
    return;
  }

  const editarId = form.dataset.editarId || null;

  /*
   * PRIORIDADE: o listener de submit é registrado
   * ANTES de qualquer componente auxiliar
   * (categorias / editor / carregamento de edição),
   * para que nenhuma falha secundária impeça
   * o salvamento da lâmina.
   */

  let salvandoLamina = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (salvandoLamina) {
      return;
    }

    salvandoLamina = true;

    try {
      await salvarLamina(form, editarId, estruturas, imagens);
    } finally {
      salvandoLamina = false;
    }
  });

  try {
    await carregarCategoriasLamina();
  } catch (erro) {
    console.error("[ATLAS] Erro ao carregar categorias:", erro);
  }

  /*
   * Componentes auxiliares do editor são
   * inicializados com segurança: uma falha
   * visual NÃO pode impedir o salvamento.
   */

  function iniciarComSeguranca(rotulo, inicializar) {
    try {
      inicializar();
    } catch (erro) {
      console.error("[ATLAS] Erro ao inicializar " + rotulo + ":", erro);
    }
  }

  /*
   * ============================================================
   * TODAS AS ESTRUTURAS DA LÂMINA
   * ============================================================
   */
  const listaEstruturas = document.querySelector("#estruturas-lista");

  function renderizarEstruturas() {
    if (!listaEstruturas) return;

    if (!estruturas.length) {
      listaEstruturas.innerHTML = `
        <div class="estrutura-vazia">
          Nenhuma estrutura adicionada ainda.
        </div>
      `;

      return;
    }

    listaEstruturas.innerHTML = estruturas
      .map(
        (estrutura, index) => `

            <div class="estrutura-item">

              <div class="estrutura-item-info">

                <strong>
                  ${escapeHtml(estrutura.nome || "Estrutura")}
                </strong>


                ${
                  estrutura.descricao
                    ? `
                      <small>
                        ${escapeHtml(estrutura.descricao)}
                      </small>
                    `
                    : ""
                }


                ${
                  estrutura.texto
                    ? `
                      <small>
                        Texto: ${escapeHtml(estrutura.texto)}
                      </small>
                    `
                    : ""
                }


                <small>
                  ${rotuloTipo(estrutura.tipo)}
                  • X: ${Number(estrutura.x).toFixed(3)}
                  • Y: ${Number(estrutura.y).toFixed(3)}${
                    estrutura.tipo === "retangulo"
                      ? `
                  • L: ${Number(estrutura.largura).toFixed(3)}
                  • A: ${Number(estrutura.altura).toFixed(3)}`
                      : ""
                  }
                </small>

              </div>


              <button
                type="button"
                class="button secondary"
                data-remover-estrutura="${index}"
              >
                Remover
              </button>

            </div>
          `,
      )
      .join("");

    listaEstruturas
      .querySelectorAll("[data-remover-estrutura]")
      .forEach((botao) => {
        botao.addEventListener("click", () => {
          const index = Number(botao.dataset.removerEstrutura);

          if (Number.isNaN(index)) {
            return;
          }

          estruturas.splice(index, 1);

          renderizarEstruturas();
        });
      });
  }

  /*
   * ============================================================
   * EDITOR VISUAL DAS MARCAÇÕES
   * Ferramentas: Ponto, Retângulo, Seta e Texto.
   * As coordenadas X/Y são definidas clicando ou arrastando
   * sobre a imagem — nunca por digitação manual.
   * ============================================================
   */

  let ferramentaAtual = "ponto";

  let marcacaoPendente = null;

  let origemArrasto = null;

  let arrastando = false;

  let imagemEditorUrl = null;

  let imagemEditorUrlCriado = false;

  const imagemEditor = document.querySelector("#estrutura-imagem-editor");

  const ajudaEditor = document.querySelector("#estrutura-editor-ajuda");

  const campoTextoEditor = document.querySelector("#estrutura-texto-editor");

  const textosAjuda = {
    ponto:
      "Ferramenta Ponto: clique sobre a imagem para marcar a posição da estrutura.",

    retangulo:
      "Ferramenta Retângulo: clique e arraste sobre a imagem para delimitar a área.",

    seta: "Ferramenta Seta: clique e arraste sobre a imagem, do início ao fim da seta.",

    texto:
      "Ferramenta Texto: clique sobre a imagem e informe o texto da marcação.",
  };

  function atualizarAjudaEditor() {
    if (!ajudaEditor) return;

    ajudaEditor.textContent = textosAjuda[ferramentaAtual] || textosAjuda.ponto;
  }

  function selecionarFerramenta(ferramenta) {
    ferramentaAtual = ferramenta;

    marcacaoPendente = null;

    origemArrasto = null;

    arrastando = false;

    document.querySelectorAll("[data-estrutura-tool]").forEach((botao) => {
      botao.classList.toggle(
        "active",
        botao.dataset.estruturaTool === ferramenta,
      );
    });

    if (campoTextoEditor) {
      campoTextoEditor.hidden = ferramenta !== "texto";
    }

    atualizarAjudaEditor();

    desenharMarcacoes();
  }

  iniciarComSeguranca("ferramentas do editor", () => {
    document.querySelectorAll("[data-estrutura-tool]").forEach((botao) => {
      botao.addEventListener("click", () => {
        selecionarFerramenta(botao.dataset.estruturaTool || "ponto");
      });
    });
  });

  function obterImagemEditor() {
    return imagemEditorUrl || null;
  }

  function renderizarImagemEditor() {
    if (!imagemEditor) return;

    const src = obterImagemEditor();

    imagemEditor.classList.toggle("com-imagem", Boolean(src));

    if (!src) {
      /*
       * Sem imagem: devolve a altura mínima
       * padrão do placeholder ao container.
       */

      imagemEditor.style.minHeight = "";

      imagemEditor.innerHTML = `
        <div class="estrutura-imagem-placeholder">

          Escolha uma imagem da lâmina para começar
          a apontar as estruturas.

        </div>
      `;

      return;
    }

    /*
     * Geometria crítica EMBUTIDA INLINE:
     * stage, imagem e overlay compartilham
     * exatamente a mesma área renderizada,
     * independente de qualquer folha de
     * estilo externa (cascade/especificidade).
     *
     * O stage (.estrutura-imagem-area) tem sua
     * altura determinada unicamente pela imagem
     * (display:block; width:100%; height:auto)
     * e o overlay fica absoluto sobre ela.
     */

    imagemEditor.style.minHeight = "0";

    imagemEditor.innerHTML = `
      <div
        class="estrutura-imagem-area"
        style="position: relative; line-height: 0;"
      >

        <img
          class="estrutura-imagem-img"
          src="${escapeHtml(src)}"
          alt="Imagem da lâmina para marcação"
          draggable="false"
          style="display: block; width: 100%; height: auto; pointer-events: none;"
        >

        <svg
          class="estrutura-imagem-overlay"
          aria-hidden="true"
          style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; display: block;"
        ></svg>

      </div>
    `;

    /*
     * Redesenha quando a imagem terminar de carregar,
     * pois a altura só é conhecida após o load.
     */

    imagemEditor
      .querySelector(".estrutura-imagem-img")
      ?.addEventListener("load", () => {
        desenharMarcacoes();
      });

    /*
     * Vincula os eventos ao wrapper que coincide
     * exatamente com a imagem.
     */

    vincularEventosDaImagem();

    desenharMarcacoes();
  }

  function coordenadasRelativas(event) {
    /*
     * Usa SEMPRE o DOMRect real da imagem,
     * nunca o retângulo de um container externo.
     */

    const imagem = imagemEditor.querySelector(".estrutura-imagem-img");

    if (!imagem) {
      return { x: 0, y: 0 };
    }

    const rect = imagem.getBoundingClientRect();

    const x = (event.clientX - rect.left) / (rect.width || 1);

    const y = (event.clientY - rect.top) / (rect.height || 1);

    return {
      x: Math.max(0, Math.min(1, x)),

      y: Math.max(0, Math.min(1, y)),
    };
  }

  function desenharMarcacoes() {
    if (!imagemEditor) return;

    const svg = imagemEditor.querySelector(".estrutura-imagem-overlay");

    if (!svg) return;

    const imagem = imagemEditor.querySelector(".estrutura-imagem-img");

    if (!imagem) return;

    const retangulo = imagem.getBoundingClientRect();

    const larguraPx = Math.round(retangulo.width);

    const alturaPx = Math.round(retangulo.height);

    if (!larguraPx || !alturaPx) return;

    const itens = [
      ...estruturas,
      ...(marcacaoPendente ? [marcacaoPendente] : []),
    ];

    svg.setAttribute("viewBox", `0 0 ${larguraPx} ${alturaPx}`);

    svg.innerHTML = itens
      .map((item, indice) => {
        const cx = item.x * larguraPx;

        const cy = item.y * alturaPx;

        const pendente = item === marcacaoPendente;

        const cor = pendente ? "#f39c12" : "#d9534f";

        if (item.tipo === "retangulo") {
          const l = (item.largura ?? 0.08) * larguraPx;

          const a = (item.altura ?? 0.08) * alturaPx;

          return `
            <rect
              x="${cx}"
              y="${cy}"
              width="${l}"
              height="${a}"
              fill="${cor}26"
              stroke="${cor}"
              stroke-width="2"
              rx="3"
            ></rect>
          `;
        }

        if (item.tipo === "seta") {
          const fx = (item.x2 ?? item.x) * larguraPx;

          const fy = (item.y2 ?? item.y) * alturaPx;

          const angulo = Math.atan2(fy - cy, fx - cx);

          const ponta = 13;

          const asa1x = fx - ponta * Math.cos(angulo - Math.PI / 7);

          const asa1y = fy - ponta * Math.sin(angulo - Math.PI / 7);

          const asa2x = fx - ponta * Math.cos(angulo + Math.PI / 7);

          const asa2y = fy - ponta * Math.sin(angulo + Math.PI / 7);

          return `
            <line
              x1="${cx}"
              y1="${cy}"
              x2="${fx}"
              y2="${fy}"
              stroke="${cor}"
              stroke-width="2.5"
            ></line>

            <polygon
              points="${fx},${fy} ${asa1x},${asa1y} ${asa2x},${asa2y}"
              fill="${cor}"
            ></polygon>
          `;
        }

        if (item.tipo === "texto") {
          const rotulo = item.texto || item.nome || "Texto";

          return `
            <text
              x="${cx}"
              y="${cy}"
              fill="${cor}"
              font-size="14"
              font-weight="700"
              paint-order="stroke"
              stroke="#ffffff"
              stroke-width="4"
            >${escapeHtml(rotulo)}</text>
          `;
        }

        /*
         * Ponto (padrão).
         */

        return `
          <circle
            cx="${cx}"
            cy="${cy}"
            r="7"
            fill="${cor}"
            stroke="#ffffff"
            stroke-width="2"
          ></circle>
        `;
      })
      .join("");
  }

  function ponteiroDentroDaImagem(event) {
    /*
     * Só permite marcar quando o ponteiro está
     * dentro do retângulo físico real da imagem.
     */

    const imagem = imagemEditor.querySelector(".estrutura-imagem-img");

    if (!imagem) return false;

    const rect = imagem.getBoundingClientRect();

    if (!rect.width || !rect.height) return false;

    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }

  function finalizarArrasto() {
    /*
     * Encerra o arrasto corrente (pointerup) e
     * redesenha a marcação pendente como definitiva.
     */

    if (!arrastando) return;

    arrastando = false;

    desenharMarcacoes();
  }

  function vincularEventosDaImagem() {
    /*
     * Os eventos de pointer são vinculados ao wrapper
     * que ocupa EXATAMENTE o retângulo da imagem.
     */

    const area = imagemEditor?.querySelector(".estrutura-imagem-area");

    if (!area) return;

    area.addEventListener("pointerdown", (event) => {
      if (!obterImagemEditor()) return;

      if (event.button !== 0) return;

      if (!ponteiroDentroDaImagem(event)) return;

      const { x, y } = coordenadasRelativas(event);

      if (ferramentaAtual === "retangulo" || ferramentaAtual === "seta") {
        arrastando = true;

        origemArrasto = { x, y };

        marcacaoPendente = {
          tipo: ferramentaAtual,

          x,

          y,

          x2: x,

          y2: y,

          largura: 0.01,

          altura: 0.01,
        };
      } else {
        arrastando = false;

        origemArrasto = null;

        const textoInput = document.querySelector("#estrutura-texto");

        marcacaoPendente = {
          tipo: ferramentaAtual,

          x,

          y,

          largura: 0.01,

          altura: 0.01,

          texto: textoInput?.value.trim() || "",
        };
      }

      if (ferramentaAtual === "texto" && campoTextoEditor) {
        campoTextoEditor.hidden = false;
      }

      try {
        area.setPointerCapture(event.pointerId);
      } catch (erro) {
        /*
         * Captura de ponteiro é opcional.
         */
      }

      desenharMarcacoes();
    });

    area.addEventListener("pointermove", (event) => {
      if (!arrastando) return;

      if (!marcacaoPendente) return;

      if (!origemArrasto) return;

      const { x, y } = coordenadasRelativas(event);

      if (marcacaoPendente.tipo === "retangulo") {
        marcacaoPendente.x = Math.min(origemArrasto.x, x);

        marcacaoPendente.y = Math.min(origemArrasto.y, y);

        marcacaoPendente.largura = Math.max(
          0.005,
          Math.abs(x - origemArrasto.x),
        );

        marcacaoPendente.altura = Math.max(
          0.005,
          Math.abs(y - origemArrasto.y),
        );
      } else if (marcacaoPendente.tipo === "seta") {
        marcacaoPendente.x2 = x;

        marcacaoPendente.y2 = y;
      }

      desenharMarcacoes();
    });

    area.addEventListener("pointerup", finalizarArrasto);

    area.addEventListener("pointercancel", () => {
      arrastando = false;
    });
  }

  iniciarComSeguranca("preview de imagens", () => {
    const inputImagem = document.querySelector("#imagem");

    inputImagem?.addEventListener("change", () => {
      const arquivos = Array.from(inputImagem.files || []);

      arquivos.forEach((arquivo) => {
        if (!arquivo || !arquivo.type.startsWith("image/")) {
          return;
        }

        imagens.push({
          file: arquivo,

          previewUrl: URL.createObjectURL(arquivo),

          localId: gerarNomeArquivoUnico(
            arquivo.name.split(".").pop() || "png",
          ).replace(/\.[^.]+$/, ""),
        });
      });

      inputImagem.value = "";

      renderizarImagensPreview();

      atualizarImagemEditor();
    });
  });

  /*
   * Renderiza a lista de miniaturas com remoção e reordenação.
   */
  function renderizarImagensPreview() {
    const container = document.querySelector("#imagens-preview");

    if (!container) return;

    if (!imagens.length) {
      container.innerHTML = `
        <div class="imagens-vazia">
          Nenhuma imagem selecionada.
        </div>
      `;

      return;
    }

    container.innerHTML = imagens
      .map((imagem, index) => {
        const src = imagem.previewUrl || imagem.url;

        return `
          <div class="imagem-item" data-imagem-index="${index}">

            <img
              class="imagem-item-thumb"
              src="${escapeHtml(src)}"
              alt="Imagem ${index + 1}"
            >

            ${
              index === 0
                ? `<span class="imagem-item-principal">Principal</span>`
                : ""
            }

            <div class="imagem-item-acoes">

              <button
                type="button"
                class="imagem-mover"
                data-mover="${index}"
                data-direcao="cima"
                title="Mover para cima"
                ${index === 0 ? "disabled" : ""}
              >↑</button>

              <button
                type="button"
                class="imagem-mover"
                data-mover="${index}"
                data-direcao="baixo"
                title="Mover para baixo"
                ${index === imagens.length - 1 ? "disabled" : ""}
              >↓</button>

              <button
                type="button"
                class="imagem-remover"
                data-remover="${index}"
                title="Remover"
              >×</button>

            </div>

          </div>
        `;
      })
      .join("");

    container.querySelectorAll(".imagem-remover").forEach((botao) => {
      botao.addEventListener("click", () => {
        const index = Number(botao.dataset.remover);

        if (Number.isNaN(index)) return;

        const removida = imagens[index];

        /*
         * Limpa o ObjectURL do arquivo novo para não vazar memória
         * (regra 24).
         */
        if (removida && removida.previewUrl) {
          URL.revokeObjectURL(removida.previewUrl);
        }

        imagens.splice(index, 1);

        renderizarImagensPreview();

        atualizarImagemEditor();
      });
    });

    container.querySelectorAll(".imagem-mover").forEach((botao) => {
      botao.addEventListener("click", () => {
        const index = Number(botao.dataset.mover);

        const direcao = botao.dataset.direcao;

        if (Number.isNaN(index)) return;

        const novoIndex = direcao === "cima" ? index - 1 : index + 1;

        if (novoIndex < 0 || novoIndex >= imagens.length) return;

        const temp = imagens[index];

        imagens[index] = imagens[novoIndex];

        imagens[novoIndex] = temp;

        renderizarImagensPreview();

        atualizarImagemEditor();
      });
    });
  }

  /*
   * A imagem do editor de marcações é sempre a principal (índice 0),
   * a mesma sobre a qual as estruturas serão exibidas no visualizador.
   */
  function atualizarImagemEditor() {
    const principal = imagens[0];

    if (imagemEditorUrl && imagemEditorUrlCriado) {
      URL.revokeObjectURL(imagemEditorUrl);

      imagemEditorUrl = null;

      imagemEditorUrlCriado = false;
    }

    imagemEditorUrl = principal
      ? principal.previewUrl || principal.url || null
      : null;

    /*
     * Só marcamos como "criado" (e portanto elegível a revoke) os
     * ObjectURLs locais. URLs remotas de imagens existentes não são
     * revogadas.
     */
    imagemEditorUrlCriado = Boolean(principal && principal.previewUrl);

    renderizarImagemEditor();
  }

  iniciarComSeguranca("redimensionamento", () => {
    if (resizeHandlerNovaLamina) {
      window.removeEventListener("resize", resizeHandlerNovaLamina);
    }

    resizeHandlerNovaLamina = () => {
      desenharMarcacoes();
    };

    window.addEventListener("resize", resizeHandlerNovaLamina);
  });

  /*
   * Limpa os ObjectURLs ao sair do formulário (navegação), evitando
   * vazamento de memória (regra 24). Auto-remove-se: qualquer hashchange
   * significa que se está deixando #nova-lamina.
   */
  const limparObjectUrls = () => {
    window.removeEventListener("hashchange", limparObjectUrls);

    imagens.forEach((imagem) => {
      if (imagem.previewUrl) {
        URL.revokeObjectURL(imagem.previewUrl);
      }
    });

    if (imagemEditorUrl && imagemEditorUrlCriado) {
      URL.revokeObjectURL(imagemEditorUrl);
      imagemEditorUrl = null;
      imagemEditorUrlCriado = false;
    }
  };

  window.addEventListener("hashchange", limparObjectUrls);

  /*
   * ============================================================
   * BOTÃO ADICIONAR ESTRUTURA
   * ============================================================
   */

  iniciarComSeguranca("botão adicionar estrutura", () => {
    const adicionarEstrutura = document.querySelector("#adicionar-estrutura");

    adicionarEstrutura?.addEventListener("click", () => {
      const nomeInput = document.querySelector("#estrutura-nome");

      const descricaoInput = document.querySelector("#estrutura-descricao");

      const textoInput = document.querySelector("#estrutura-texto");

      const nome = nomeInput?.value.trim() || "";

      const descricao = descricaoInput?.value.trim() || "";

      const texto = textoInput?.value.trim() || "";

      if (!nome) {
        mostrarStatus("Digite o nome da estrutura.", "error");

        nomeInput?.focus();

        return;
      }

      if (!marcacaoPendente) {
        mostrarStatus(
          "Marque a posição na imagem usando a ferramenta selecionada.",
          "error",
        );

        return;
      }

      const marcacao = marcacaoPendente;

      const largura =
        marcacao.tipo === "seta"
          ? Math.abs(marcacao.x2 - marcacao.x)
          : marcacao.largura;

      const altura =
        marcacao.tipo === "seta"
          ? Math.abs(marcacao.y2 - marcacao.y)
          : marcacao.altura;

      estruturas.push({
        nome,

        descricao,

        tipo: marcacao.tipo,

        texto: marcacao.tipo === "texto" ? texto : "",

        x: Math.max(0, Math.min(1, marcacao.x)),

        y: Math.max(0, Math.min(1, marcacao.y)),

        ...(marcacao.tipo === "seta"
          ? {
              x2: Math.max(0, Math.min(1, marcacao.x2)),

              y2: Math.max(0, Math.min(1, marcacao.y2)),
            }
          : {}),

        largura: Math.max(0.01, Math.min(1, largura)),

        altura: Math.max(0.01, Math.min(1, altura)),
      });

      renderizarEstruturas();

      /*
       * Limpa os campos e a marcação pendente.
       */

      if (nomeInput) {
        nomeInput.value = "";
      }

      if (descricaoInput) {
        descricaoInput.value = "";
      }

      if (textoInput) {
        textoInput.value = "";
      }

      marcacaoPendente = null;

      desenharMarcacoes();

      nomeInput?.focus();

      mostrarStatus("Estrutura adicionada.", "success");
    });
  });

  /*
   * ============================================================
   * CARREGA LÂMINA QUANDO ESTÁ EDITANDO
   * ============================================================
   */

  if (editarId) {
    try {
      const carregada = await carregarLamina(editarId);

      if (carregada && Array.isArray(carregada.estruturas)) {
        estruturas = Array.isArray(carregada.estruturas)
          ? carregada.estruturas.map(normalizarEstrutura)
          : [];

        renderizarEstruturas();
      }

      /*
       * Atualiza a lista de imagens e o editor após o carregamento,
       * tanto para edição (imagens do banco) quanto para nova lâmina.
       */
      renderizarImagensPreview();

      atualizarImagemEditor();
    } catch (erro) {
      console.error("[ATLAS] Erro ao carregar lâmina para edição:", erro);
    }
  }

  atualizarAjudaEditor();

  renderizarImagemEditor();

  renderizarEstruturas();
}

const TIPOS_ESTRUTURA = ["ponto", "retangulo", "seta", "texto"];

function rotuloTipo(tipo) {
  switch (tipo) {
    case "retangulo":
      return "Retângulo";

    case "seta":
      return "Seta";

    case "texto":
      return "Texto";

    default:
      return "Ponto";
  }
}

function normalizarEstrutura(estrutura = {}) {
  const tipo = TIPOS_ESTRUTURA.includes(estrutura.tipo)
    ? estrutura.tipo
    : "ponto";

  return {
    nome: String(estrutura.nome || "").trim(),

    descricao: String(estrutura.descricao || "").trim(),

    tipo,

    texto: String(estrutura.texto || "").trim(),

    x: Math.max(0, Math.min(1, Number(estrutura.x ?? 0.5))),

    y: Math.max(0, Math.min(1, Number(estrutura.y ?? 0.5))),

    ...(tipo === "seta"
      ? {
          x2: Math.max(0, Math.min(1, Number(estrutura.x2 ?? estrutura.x))),

          y2: Math.max(0, Math.min(1, Number(estrutura.y2 ?? estrutura.y))),
        }
      : {}),

    largura: Math.max(0.01, Math.min(1, Number(estrutura.largura ?? 0.08))),

    altura: Math.max(0.01, Math.min(1, Number(estrutura.altura ?? 0.08))),
  };
}
async function carregarLamina(id) {
  mostrarStatus("Carregando informações da lâmina...", "loading");

  const { data, error } = await supabase
    .from("laminas")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Erro ao carregar lâmina:", error);

    mostrarStatus("Não foi possível carregar esta lâmina.", "error");

    return;
  }

  document.querySelector("#nome").value = data.nome || "";

  document.querySelector("#descricao").value = data.descricao || "";

  await carregarCategoriasLamina(data.categoria_id || "", data.categoria || "");

  document.querySelector("#tecnica").value = data.tecnica || "";

  document.querySelector("#coloracao").value = data.coloracao || "";

  document.querySelector("#publicado").value =
    data.publicado === false ? "false" : "true";

  const campoAumento = document.querySelector("#aumento");

  if (campoAumento) {
    campoAumento.value = data.aumento || "";
  }

  const campoVideo = document.querySelector("#video_url");

  if (campoVideo) {
    campoVideo.value = data.video_url || "";
  }

  /*
   * Carrega imagens existentes: lamina_imagens (ordenada) ou, em
   * lâminas antigas, apenas laminas.imagem_url como fallback (regra 14).
   */
  await carregarImagensLamina(id, data);

  mostrarStatus("", "");

  return data;
}

async function carregarImagensLamina(id, dadosBasicos) {
  imagens = [];

  try {
    const { data, error } = await supabase
      .from("lamina_imagens")
      .select("*")
      .eq("lamina_id", id)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    if (data && data.length) {
      data.forEach((imagem, index) => {
        imagens.push({
          id: imagem.id,

          url: imagem.imagem_url,

          ordem: Number(imagem.ordem) || index,

          path: imagem.imagem_url
            ? extrairCaminhoArmazenamento(imagem.imagem_url)
            : null,
        });
      });

      return;
    }
  } catch (erro) {
    console.error("[ATLAS] Erro ao carregar imagens da lâmina:", erro);
  }

  /*
   * Fallback: lâmina antiga com apenas imagem_url.
   */
  if (dadosBasicos && dadosBasicos.imagem_url) {
    imagens.push({
      id: null,

      url: dadosBasicos.imagem_url,

      ordem: 0,

      path: extrairCaminhoArmazenamento(dadosBasicos.imagem_url),
    });
  }
}

/*
 * Erro já traduzido para o usuário:
 * o catch exibe a mensagem sem prefixos extras.
 */

function erroAmigavel(mensagem) {
  const erro = new Error(mensagem);

  erro.amigavel = true;

  return erro;
}

/*
 * Nome único para o arquivo no Storage.
 * Fallback para contextos sem randomUUID
 * (ex.: páginas servidas sem HTTPS).
 */

function gerarNomeArquivoUnico(extensao) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${crypto.randomUUID()}.${extensao}`;
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));

  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}.${extensao}`;
}

async function salvarLamina(form, editarId, estruturas = [], imagens = []) {
  const button = document.querySelector("#save-lamina");

  button.disabled = true;

  button.textContent = editarId ? "Salvando alterações..." : "Cadastrando...";

  mostrarStatus("Salvando informações...", "loading");

  try {
    /*
     * O upload no Storage e o INSERT/UPDATE na tabela
     * exigem sessão autenticada (políticas RLS).
     * Sem sessão, o Supabase bloqueia a operação
     * com um erro genérico — verificamos antes
     * para dar um feedback claro ao usuário.
     */

    const { data: sessao } = await supabase.auth.getUser();

    if (!sessao?.user) {
      throw erroAmigavel(
        "Sua sessão expirou. Faça login novamente para salvar a lâmina.",
      );
    }

    const formData = new FormData(form);

    const nome = String(formData.get("nome") || "").trim();

    if (!nome) {
      throw erroAmigavel("Digite o nome da lâmina.");
    }

    const descricao = String(formData.get("descricao") || "").trim();

    const categoriaId = String(formData.get("categoria") || "").trim();

    const tecnica = String(formData.get("tecnica") || "").trim();

    const coloracao = String(formData.get("coloracao") || "").trim();

    const publicado = formData.get("publicado") === "true";

    const aumento = String(formData.get("aumento") || "").trim();

    const videoUrl = String(formData.get("video_url") || "").trim();

    /*
     * Imagens múltiplas (Fase 18). O estado `imagens` (array em ordem
     * de exibição, índice 0 = principal) contém itens existentes
     * { id, url, ordem, path } e itens novos { file, previewUrl, localId }.
     * Faz o upload dos novos, define a url primária e rastreia os
     * enviados para permitir rollback em caso de falha (regra 22).
     */

    const uploadsParaLimpar = [];

    let imagemUrl = null;

    try {
      imagemUrl = await processarImagens(editarId, imagens, uploadsParaLimpar);
    } catch (erroUpload) {
      /*
       * Falha no upload: remove os objetos já enviados para não deixar
       * arquivos órfãos no Storage.
       */

      await rollbackStorage(uploadsParaLimpar);

      throw erroUpload;
    }

    let categoriaNome = "";

    if (categoriaId) {
      const { data: categoriaData, error: categoriaError } = await supabase
        .from("categorias")
        .select("id, nome")
        .eq("id", categoriaId)
        .eq("ativo", true)
        .maybeSingle();

      if (categoriaError) {
        console.error("Erro ao verificar categoria:", categoriaError);

        throw erroAmigavel(
          "Não foi possível verificar a categoria selecionada.",
        );
      }

      if (!categoriaData) {
        throw erroAmigavel(
          "A categoria selecionada não existe ou está inativa.",
        );
      }

      categoriaNome = categoriaData.nome;
    }

    const estruturasNormalizadas = Array.isArray(estruturas)
      ? estruturas
          .map(normalizarEstrutura)
          .filter((estrutura) => estrutura.nome)
      : [];

    const dados = {
      nome,

      descricao,

      categoria: categoriaNome,

      categoria_id: categoriaId || null,

      tecnica,

      coloracao,

      aumento: aumento || null,

      video_url: videoUrl || null,

      publicado,

      estruturas: estruturasNormalizadas,

      updated_at: new Date().toISOString(),
    };

    if (imagemUrl) {
      dados.imagem_url = imagemUrl;
    }

    let resultado;

    if (editarId) {
      resultado = await supabase
        .from("laminas")
        .update(dados)
        .eq("id", editarId);

      /*
       * FASE 20 — Fallback para anomalia de RLS da plataforma: alguns
       * projetos rejeitam UPDATE que altera `publicado` (42501 "new row
       * violates row-level security policy") mesmo com policy permissiva.
       * Nesse caso: atualiza sem o campo e define a publicação via RPC
       * privilegiada admin_definir_publicacao (security definer).
       */
      if (
        resultado.error &&
        /row-level security/i.test(resultado.error.message || "") &&
        Object.prototype.hasOwnProperty.call(dados, "publicado")
      ) {
        const { publicado: publicadoAlvo, ...dadosSemPublicacao } = dados;

        const retry = await supabase
          .from("laminas")
          .update(dadosSemPublicacao)
          .eq("id", editarId);

        if (!retry.error) {
          const { error: erroRpc } = await supabase.rpc(
            "admin_definir_publicacao",
            {
              p_lamina_id: editarId,
              p_publicado: Boolean(publicadoAlvo),
            },
          );

          resultado = erroRpc ? { error: erroRpc } : retry;
        } else {
          resultado = retry;
        }
      }
    } else {
      /*
       * .select("id") garante o retorno do id recém-criado, necessário
       * para vincular as imagens em lamina_imagens (FK).
       */
      resultado = await supabase.from("laminas").insert(dados).select("id");
    }

    /*
     * Fallback: se a coluna video_url ainda não existir no banco
     * (migration pendente), salva a lâmina sem o vídeo em vez de
     * interromper todo o cadastro.
     */
    if (
      resultado.error &&
      /video_url/i.test(resultado.error.message || "") &&
      Object.prototype.hasOwnProperty.call(dados, "video_url")
    ) {
      delete dados.video_url;

      resultado = editarId
        ? await supabase.from("laminas").update(dados).eq("id", editarId)
        : await supabase.from("laminas").insert(dados).select("id");
    }

    if (resultado.error) {
      console.error("Erro ao salvar:", resultado.error);

      /*
       * Falha ao persistir a lâmina: remove os objetos de imagem que
       * haviam sido enviados para não deixar arquivos órfãos.
       */

      await rollbackStorage(uploadsParaLimpar);

      /*
       * Registra o erro completo no console para
       * diagnóstico e mostra uma mensagem clara,
       * incluindo detalhes/hints do PostgREST
       * quando disponíveis (sem dados sensíveis).
       */

      const detalhes = [resultado.error.details, resultado.error.hint]
        .filter(Boolean)
        .join(" ");

      throw erroAmigavel(
        `Não foi possível ${
          editarId ? "salvar as alterações" : "cadastrar"
        } a lâmina: ${resultado.error.message}${
          detalhes ? ` (${detalhes})` : ""
        }`,
      );
    }

    /*
     * Critério de sucesso: ausência de erro.
     * A inserção precisa retornar o id para vincular as imagens; por
     * isso usamos .select() no insert (lamina_imagens depende da FK).
     */

    const registro = Array.isArray(resultado.data)
      ? resultado.data[0]
      : resultado.data;

    const laminaId = editarId || registro?.id;

    /*
     * Persiste o conjunto ordenado de imagens em lamina_imagens e
     * reconcilia (remove as que o usuário excluiu) na edição.
     */
    if (laminaId) {
      try {
        await reconciliarImagens(laminaId, imagens, editarId, imagemUrl);
      } catch (erroImagens) {
        console.error("[ATLAS] Erro ao salvar imagens:", erroImagens);

        throw erroAmigavel(
          `A lâmina foi salva, mas não foi possível ${
            editarId ? "atualizar as imagens" : "anexar as imagens"
          }.`,
        );
      }
    }

    if (registro && registro.id) {
      console.log(
        editarId ? "Lâmina atualizada, id:" : "Lâmina cadastrada, id:",
        registro.id,
      );
    }

    mostrarStatus(
      editarId
        ? "Lâmina atualizada com sucesso!"
        : "Lâmina cadastrada com sucesso!",
      "success",
    );

    setTimeout(() => {
      window.location.hash = "#admin";
    }, 1000);
  } catch (error) {
    console.error(error);

    const mensagem =
      error && error.amigavel && error.message
        ? error.message
        : `Não foi possível salvar a lâmina: ${
            (error && error.message) ||
            "erro inesperado. Verifique o console para mais detalhes."
          }`;

    mostrarStatus(mensagem, "error");

    button.disabled = false;

    button.textContent = editarId ? "Salvar alterações" : "Cadastrar lâmina";
  }
}

/*
 * Faz o upload dos arquivos novos (os que possuem `file`) na ordem em que
 * aparecem em `imagens`. Retorna a URL da imagem principal (índice 0),
 * usada como laminas.imagem_url (fallback/catálogo/admin).
 * Em caso de falha, quem chama deve invocar rollbackStorage().
 */
async function processarImagens(editarId, imagens, uploadsParaLimpar) {
  let urlPrincipal = null;

  for (let index = 0; index < imagens.length; index += 1) {
    const imagem = imagens[index];

    if (!imagem.file) {
      /*
       * Imagem já existente (veio do banco): apenas garante `path`
       * (para possível remoção futura) e registra a principal.
       */
      if (!imagem.path && imagem.url) {
        imagem.path = extrairCaminhoArmazenamento(imagem.url);
      }

      if (urlPrincipal === null && imagem.url) {
        urlPrincipal = imagem.url;
      }

      continue;
    }

    const arquivo = imagem.file;

    if (!arquivo.type.startsWith("image/")) {
      throw erroAmigavel(
        "Um dos arquivos selecionados não é uma imagem válida.",
      );
    }

    const tamanhoMaximo = 20 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
      throw erroAmigavel("Uma das imagens excede o máximo de 20 MB.");
    }

    const extensao = arquivo.name.split(".").pop().toLowerCase();

    const nomeArquivo = gerarNomeArquivoUnico(extensao);

    const caminho = `laminas/${nomeArquivo}`;

    const { error: uploadError } = await supabase.storage
      .from("laminas")
      .upload(caminho, arquivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro no upload:", uploadError);

      throw erroAmigavel(
        `Não foi possível enviar uma das imagens: ${uploadError.message}`,
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("laminas")
      .getPublicUrl(caminho);

    imagem.url = publicUrl.publicUrl;

    imagem.path = caminho;

    uploadsParaLimpar.push(caminho);

    if (urlPrincipal === null) {
      urlPrincipal = publicUrl.publicUrl;
    }
  }

  /*
   * Edição sem novas imagens e sem alterações: preserva a URL principal
   * que já está no banco (fallback).
   */
  if (urlPrincipal === null && editarId) {
    const { data: atual } = await supabase
      .from("laminas")
      .select("imagem_url")
      .eq("id", editarId)
      .single();

    urlPrincipal = atual?.imagem_url || null;
  }

  return urlPrincipal;
}

/*
 * Remove do Storage os objetos enviados numa tentativa que falhou, para
 * não deixar arquivos órfãos (regra 22).
 */
async function rollbackStorage(uploadsParaLimpar) {
  if (!uploadsParaLimpar.length) return;

  try {
    await supabase.storage.from("laminas").remove(uploadsParaLimpar);
  } catch (erro) {
    console.error("[ATLAS] Falha no rollback de uploads:", erro);
  }
}

/*
 * Persiste o conjunto ordenado de imagens em lamina_imagens.
 * - Nova lâmina: insere todas na ordem atual.
 * - Edição: remove as que o usuário excluiu (e seus arquivos no Storage),
 *   inclui as novas e atualiza a ordem das que foram mantidas.
 * Estruturas só existem na imagem principal (índice 0), que é a primeira
 * do array — preservada na reordenação apenas se o usuário não a mover.
 */
/*
 * imagemUrlAtual: URL que permanecerá em laminas.imagem_url após o
 * salvamento (fallback/catálogo). O arquivo correspondente NUNCA é
 * removido do Storage, mesmo quando sua linha é excluída da
 * reconciliação — caso contrário a lâmina ficaria com imagem morta
 * (regra 21: não remover a imagem_url antiga acidentalmente).
 */
async function reconciliarImagens(
  laminaId,
  imagens,
  editarId,
  imagemUrlAtual = null,
) {
  const itensFinais = imagens
    .map((imagem, index) => ({
      ...imagem,
      ordem: index,
    }))
    .filter((imagem) => imagem.url);

  if (editarId) {
    const { data: existentes, error: erroConsulta } = await supabase
      .from("lamina_imagens")
      .select("id, imagem_url")
      .eq("lamina_id", laminaId);

    if (erroConsulta) {
      throw erroConsulta;
    }

    const idsMantidos = new Set(
      imagens.filter((imagem) => imagem.id).map((imagem) => imagem.id),
    );

    const paraExcluir = (existentes || []).filter(
      (item) => !idsMantidos.has(item.id),
    );

    if (paraExcluir.length) {
      const { error: erroExcluir } = await supabase
        .from("lamina_imagens")
        .delete()
        .in(
          "id",
          paraExcluir.map((item) => item.id),
        );

      if (erroExcluir) {
        throw erroExcluir;
      }

      /*
       * Remove do Storage os arquivos das imagens excluídas pelo usuário.
       * Só remove objetos que pertencem a esta lâmina (path derivado da
       * própria linha), nunca a imagem_url de outra lâmina (regra 21).
       */
      const urlsPreservadas = new Set(imagemUrlAtual ? [imagemUrlAtual] : []);

      const caminhosExcluidos = paraExcluir
        .filter((item) => !urlsPreservadas.has(item.imagem_url))
        .map((item) => extrairCaminhoArmazenamento(item.imagem_url))
        .filter(Boolean);

      if (caminhosExcluidos.length) {
        try {
          await supabase.storage.from("laminas").remove(caminhosExcluidos);
        } catch (erro) {
          console.error(
            "[ATLAS] Falha ao remover imagens excluídas do Storage:",
            erro,
          );
        }
      }
    }
  }

  /*
   * Insere as imagens novas (sem id) e atualiza ordem/url das mantidas.
   */
  for (const imagem of itensFinais) {
    if (!imagem.id) {
      /*
       * .select("id") devolve o id da linha criada. Em uma nova
       * tentativa após falha parcial (regra 22), o item já possui
       * id e passa pelo caminho de UPDATE abaixo — sem duplicar
       * linhas em lamina_imagens.
       */
      const { data: inserida, error: erroInserir } = await supabase
        .from("lamina_imagens")
        .insert({
          lamina_id: laminaId,
          imagem_url: imagem.url,
          ordem: imagem.ordem,
        })
        .select("id");

      if (erroInserir) {
        throw erroInserir;
      }

      if (inserida && inserida[0] && inserida[0].id) {
        imagem.id = inserida[0].id;
      }

      continue;
    }

    const { error: erroAtualizar } = await supabase
      .from("lamina_imagens")
      .update({
        imagem_url: imagem.url,
        ordem: imagem.ordem,
      })
      .eq("id", imagem.id);

    if (erroAtualizar) {
      throw erroAtualizar;
    }
  }
}

async function carregarCategoriasLamina(
  categoriaIdAtual = "",
  categoriaNomeAtual = "",
) {
  const select = document.querySelector("#categoria");

  if (!select) return;

  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome, ativo, ordem")
    .eq("ativo", true)
    .order("ordem", {
      ascending: true,
    })
    .order("nome", {
      ascending: true,
    });

  if (error) {
    console.error("Erro ao carregar categorias:", error);

    mostrarStatus("Não foi possível carregar as categorias.", "error");

    return;
  }

  select.innerHTML = `
    <option value="">
      Selecione uma categoria
    </option>
  `;
  (data || []).forEach((categoria) => {
    const option = document.createElement("option");

    option.value = categoria.id;

    option.textContent = categoria.nome;

    if (categoria.id === categoriaIdAtual) {
      option.selected = true;
    } else if (!categoriaIdAtual && categoria.nome === categoriaNomeAtual) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

function mostrarStatus(mensagem, tipo) {
  const elemento = document.querySelector("#lamina-form-status");

  if (!elemento) return;

  elemento.textContent = mensagem;

  elemento.className = `form-status ${tipo || ""}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}
