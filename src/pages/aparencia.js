import { supabase } from "../lib/supabase.js";
import { icone } from "../lib/icons.js";
import {
  aplicarTema,
  temaEfetivo,
  temaParaSalvar,
  razaoContraste,
  corValida,
} from "../lib/tema.js";

let logoUrlAtual = "";

/* Paleta padrão do site — espelha :root em style.css */
const PADRAO = {
  cor_principal: "#8a2b3d",
  cor_secundaria: "#2e3a45",
  cor_acento: "#c9404f",
  cor_fundo: "#f6f3f1",
  cor_texto: "#211b1d",
};

/*
 * ABAS DO PAINEL — cada agrupa uma categoria visual real.
 * O estado da aba atual é preservado em sessionStorage para que
 * trocar de guia (ou recarregar a página) NÃO devolva o usuário
 * para outra seção nem reinicie o painel.
 */
const ABAS_APARENCIA = [
  ["identidade", "Identidade"],
  ["cores", "Cores gerais"],
  ["header", "Header & Menu"],
  ["home", "Home"],
  ["catalogo", "Catálogo"],
  ["lamina", "Lâmina & Viewer"],
  ["rodape", "Rodapé"],
  ["admin", "Administração"],
  ["formularios", "Formulários"],
  ["estilos", "Estados & Tipo"],
];

const CHAVE_ABA_APARENCIA = "atlas.aparencia-aba";

/*
 * Campos que o usuário alterou de facto nesta sessão. Permite salvar
 * apenas configurações realmente editadas — as demais continuam
 * DERIVANDO das cores base (fallback coerente e dinâmico).
 */
const CAMPOS_MODIFICADOS = new Set();

function marcarModificado(chave) {
  if (chave) CAMPOS_MODIFICADOS.add(chave);
}

/* Lê o objeto `tema` salvo com segurança (fallback: objeto vazio) */
function obterTema(config = {}) {
  return config.tema && typeof config.tema === "object" ? config.tema : {};
}

/* Valor exibido num campo: configuração salva → senão padrão */
function valorTema(config, chave, padrao) {
  const tema = obterTema(config);

  return tema[chave] || padrao;
}

/* Abre um painel de aba respeitando a aba ativa salva (persistida) */
function abaAtivaSalva() {
  const salva = sessionStorage.getItem(CHAVE_ABA_APARENCIA);

  return ABAS_APARENCIA.some(([id]) => id === salva)
    ? salva
    : ABAS_APARENCIA[0][0];
}

function abrirAba(id) {
  const ativa = abaAtivaSalva();

  return `<div class="aparencia-aba" id="aba-${id}"${
    id === ativa ? "" : " hidden"
  }>`;
}

/* Botão de aba com estado (aria-selected + classe ativa) */
function estadoAba(id) {
  const ativa = abaAtivaSalva();

  return id === ativa
    ? ' class="aparencia-tab active" aria-selected="true"'
    : ' class="aparencia-tab" aria-selected="false"';
}

/* Seção ativa no painel lateral (NÍVEL 1) — mesma chave usada em admin.js.
   Mantém a section de Aparência visível quando a Administração é remontada
   com a seção "aparencia" restaurada do sessionStorage. */
function secaoAparenciaAtiva() {
  return sessionStorage.getItem("atlas.admin-secao") === "aparencia";
}


export async function renderAparencia() {
  const { data, error } = await supabase
    .from("configuracoes_site")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);

    return `<div class="admin-error">Erro ao carregar as configurações.</div>`;
  }

  const config = data || {};

  logoUrlAtual = config.logo_url || "";

  return `
    <section id="admin-section-aparencia" class="admin-section${secaoAparenciaAtiva() ? " active" : ""}">

      <div class="admin-title-row">

        <div>
          <span class="eyebrow">PERSONALIZAÇÃO</span>

          <h1>Aparência</h1>

          <p>
            Personalize as cores, textos e a identidade visual do Atlas.
            A prévia reflete as alterações imediatamente.
          </p>
        </div>

      </div>


      <div class="aparencia-tabs" role="tablist" aria-label="Secciones de Aparência">
        ${ABAS_APARENCIA.map(
          ([id, rotulo]) => `
            <button
              type="button"
              data-aba="${id}"
              role="tab"
              ${estadoAba(id)}
            >
              ${rotulo}
            </button>
          `,
        ).join("")}
      </div>

      <div class="aparencia-grid">

        <form id="aparencia-form" class="aparencia-formulario">

          <div id="aparencia-status" class="form-status"></div>

          <!-- ==================== ABA IDENTIDADE ==================== -->

          ${abrirAba("identidade")}

          <div class="form-card">

            <div class="form-card-title">

              <span>${icone.microscopio}</span>

              <div>
                <h2>Identidade</h2>

                <p>Nome, logo e cores principais da marca.</p>
              </div>

            </div>


            <div class="logo-editor">

              <div class="logo-preview-box">

                <div id="logo-preview" class="logo-preview">
                  ${config.logo_url ? `<img src="${escapeHtml(config.logo_url)}" alt="Logo atual">` : icone.microscopio}
                </div>

              </div>


              <div class="logo-editor-info">

                <label class="logo-upload-button">

                  <span>${icone.upload}</span>
                  Escolher logo

                  <input
                    id="config-logo"
                    data-logo-url="${escapeHtml(logoUrlAtual)}"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                  >

                </label>


                <button
                  type="button"
                  id="remover-logo"
                  class="button secondary"
                >
                  Remover logo
                </button>


                <p class="logo-help">
                  PNG, JPG ou WebP. Recomendamos imagem quadrada com
                  fundo transparente.
                </p>

                <small id="logo-nome"></small>

                <div class="logo-size-control">

                  <div class="logo-size-header">

                    <label for="config-logo-tamanho">Tamanho da logo</label>

                    <strong id="logo-tamanho-valor">
                      ${config.logo_tamanho || 100}%
                    </strong>

                  </div>

                  <input
                    id="config-logo-tamanho"
                    type="range"
                    min="50"
                    max="150"
                    step="1"
                    value="${config.logo_tamanho || 100}"
                  >

                  <div class="logo-size-labels">
                    <span>50%</span>
                    <span>100%</span>
                    <span>150%</span>
                  </div>

                </div>

              </div>

            </div>


            <div class="form-grid">

              <div class="form-field">

                <label for="config-nome">Nome do Atlas</label>

                <input
                  id="config-nome"
                  type="text"
                  value="${escapeHtml(config.nome_site || "")}"
                  placeholder="Atlas"
                >

              </div>

              <div class="form-field">

                <label for="config-subtitulo">Subtítulo</label>

                <input
                  id="config-subtitulo"
                  type="text"
                  value="${escapeHtml(config.subtitulo || "")}"
                  placeholder="Histológico"
                >

              </div>

            </div>


            <div class="aparencia-cores">

              ${campoTema("cor_principal", "Cor principal", config, config.cor_principal || PADRAO.cor_principal, "Botões, links e elementos da marca.")}

              ${campoTema("cor_secundaria", "Cor secundária", config, config.cor_secundaria || PADRAO.cor_secundaria, "Seções e elementos de apoio.")}

              ${campoTema("cor_acento", "Cor de destaque", config, config.cor_acento || PADRAO.cor_acento, "Detalhes e identidade visual.")}

            </div>

          </div>

          </div>


          <!-- ==================== ABA CORES ==================== -->

          ${abrirAba("cores")}

          <div class="form-card">

            <div class="form-card-title">

              <span>${icone.paleta}</span>

              <div>
                <h2>Cores generales</h2>

                <p>
                  Colores base del sitio. Superficies, bordes y estados
                  pueden configurarse individualmente; lo demás deriva
                  automáticamente con fallback seguro.
                </p>
              </div>

            </div>


            <div class="aparencia-cores">

              ${campoTema("cor_fundo", "Fondo principal", config, config.cor_fundo || PADRAO.cor_fundo, "Color base de las páginas.")}

              ${campoTema("cor_texto", "Texto principal", config, config.cor_texto || PADRAO.cor_texto, "Títulos, párrafos y menús.")}

              ${campoTema("superficie", "Superficie / tarjetas", config, "#ffffff", "Fondo de tarjetas y paneles.")}

              ${campoTema("texto_secundario", "Texto secundario", config, "#6f6267", "Subtítulos, metadatos y descripciones.")}

              ${campoTema("texto_terciario", "Texto terciario", config, "#a99ca1", "Notas y detalles menores.")}

              ${campoTema("borda", "Bordes", config, "#e4dcd8", "Contornos de tarjetas y separadores.")}

              ${campoTema("borda_forte", "Borde fuerte", config, "#d0c5c0", "Bordes más visibles.")}

              ${campoTema("hover", "Hover", config, "#f0adbb", "Relleno de elementos al pasar el ratón.")}

              ${campoTema("foco", "Foco / selección", config, "#b74854", "Anillo de foco y selección activa.")}

              ${campoTema("link", "Enlaces", config, "#8a2b3d", "Color de enlaces de texto.")}

              ${campoTema("link_hover", "Enlaces hover", config, "#c9404f", "Color de enlaces al pasar el ratón.")}

            </div>

          </div>

          </div>


          <!-- ==================== ABA HEADER & MENU ==================== -->

          ${abrirAba("header")}

          <div class="form-card">

            <div class="form-card-title">

              <span>${icone.paleta}</span>

              <div>
                <h2>Header & Menu</h2>

                <p>Cores do topo, do menu e do indicador abaixo dos itens.</p>
              </div>

            </div>


            <div class="aparencia-cores">

              ${campoTema("header_fundo", "Fundo do header", config, "#f6f3f1", "Barra superior do site.")}

              ${campoTema("header_titulo", "Título do header", config, "#211b1d", "")}

              ${campoTema("header_borda", "Borda do header", config, "#e4dcd8", "")}

              ${campoTema("header_icone", "Ícone do header", config, "#8a2b3d", "Logotipo / ícone da marca.")}

              ${campoTema("menu_texto", "Texto do menu", config, "#211b1d", "")}

              ${campoTema("menu_texto_ativo", "Menu ativo", config, "#c9404f", "")}

              ${campoTema("menu_hover", "Menu hover", config, "#c9404f", "")}

              ${campoTema("menu_indicador", "Indicador do menu", config, "#c9404f", "Barra abaixo do item selecionado.")}

            </div>

          </div>

          </div>


          <!-- ==================== ABA PÁGINA INICIAL ==================== -->

          ${abrirAba("home")}

          <div class="form-card">

            <div class="form-card-title">

              <span>${icone.documento}</span>

              <div>
                <h2>Página inicial</h2>

                <p>Textos e cores do hero, dos cards Explore / Amplie / Aprenda e do rodapé textual.</p>
              </div>

            </div>


            <div class="form-grid">

              <div class="form-field full">

                <label for="config-titulo">Título inicial</label>

                <input
                  id="config-titulo"
                  type="text"
                  value="${escapeHtml(config.titulo_inicio || "")}"
                  placeholder="Explore a microestrutura do mundo animal"
                >

              </div>

              <div class="form-field full">

                <label for="config-descricao">Descrição inicial</label>

                <textarea
                  id="config-descricao"
                  rows="3"
                  placeholder="Um atlas de histologia interativo..."
                >${escapeHtml(config.descricao_inicio || "")}</textarea>

              </div>

              <div class="form-field">

                <label for="config-botao">Botão principal</label>

                <input
                  id="config-botao"
                  type="text"
                  value="${escapeHtml(config.texto_botao_principal || "")}"
                  placeholder="Explorar lâminas"
                >

              </div>

              <div class="form-field">

                <label for="config-botao-secundario">Botão secundário</label>

                <input
                  id="config-botao-secundario"
                  type="text"
                  value="${escapeHtml(config.texto_botao_secundario || "")}"
                  placeholder="Conheça o projeto"
                >

              </div>

              <div class="form-field full">

                <label for="config-sobre">Texto da seção Sobre</label>

                <textarea
                  id="config-sobre"
                  rows="3"
                  placeholder="Fale sobre o projeto..."
                >${escapeHtml(config.texto_sobre || "")}</textarea>

              </div>

              <div class="form-field full">

                <label for="config-rodape">Texto do rodapé</label>

                <input
                  id="config-rodape"
                  type="text"
                  value="${escapeHtml(config.texto_rodape || "")}"
                  placeholder="Projeto acadêmico"
                >

              </div>

            </div>


            <div class="aparencia-cores">
              ${campoTema("hero_fundo", "Fundo do hero", config, "#f6f3f1", "Fundo da seção inicial.")}
              ${campoTema("hero_titulo", "Título do hero", config, "#211b1d", "")}
              ${campoTema("hero_subtitulo", "Subtítulo do hero", config, "#8a2b3d", "Eyebrow do hero.")}
              ${campoTema("hero_texto", "Texto do hero", config, "#6f6267", "")}
              ${campoTema("hero_botao_fundo", "Fundo do botão principal", config, "#8a2b3d", "")}
              ${campoTema("hero_botao_hover", "Hover do botão", config, "#771f30", "")}
              ${campoTema("hero_decorativo", "Elementos decorativos", config, "#c9404f", "")}
              ${campoTema("hero_microscopio", "Destaque do microscópio", config, "#8a2b3d", "")}
              ${campoTema("card_fundo", "Fundo dos cards", config, "#f6f3f1", "Cards Explore / Amplie / Aprenda.")}
              ${campoTema("card_titulo", "Título dos cards", config, "#211b1d", "")}
              ${campoTema("card_texto", "Texto dos cards", config, "#6f6267", "")}
              ${campoTema("card_icone", "Ícone dos cards", config, "#8a2b3d", "")}
              ${campoTema("card_borda", "Borda dos cards", config, "#e4dcd8", "")}
              ${campoTema("card_hover", "Hover dos cards", config, "#8a2b3d", "")}
            </div>

          </div>

          </div>


          <!-- ==================== ABA CATÁLOGO ==================== -->

          ${abrirAba("catalogo")}

          <div class="form-card">

            <div class="form-card-title">
              <span>${icone.camadas}</span>
              <div>
                <h2>Catálogo</h2>
                <p>Cores do catálogo, dos cards de lâmina e indicadores.</p>
              </div>
            </div>

            <div class="aparencia-cores">
              ${campoTema("catalogo_fundo", "Fundo do catálogo", config, "#f6f3f1", "")}
              ${campoTema("catalogo_card_fundo", "Fundo dos cards", config, "#f6f3f1", "")}
              ${campoTema("catalogo_titulo", "Título", config, "#211b1d", "")}
              ${campoTema("catalogo_texto", "Texto", config, "#211b1d", "")}
              ${campoTema("catalogo_texto_suave", "Texto secundário", config, "#6f6267", "")}
              ${campoTema("catalogo_borda", "Borda", config, "#e4dcd8", "")}
              ${campoTema("catalogo_categoria", "Categoria", config, "#c9404f", "Rótulo da categoria.")}
              ${campoTema("catalogo_botao", "Botão", config, "#8a2b3d", "")}
            </div>

          </div>

          </div>


<!-- ==================== ABA ADMINISTRAÇÃO ==================== -->

          ${abrirAba("admin")}

          <div class="form-card">

            <div class="form-card-title">
              <span>${icone.engrenagem}</span>
              <div>
                <h2>Administração</h2>
                <p>Cores do painel administrativo. Sem verdes de identidade.</p>
              </div>
            </div>

            <div class="aparencia-cores">
              ${campoTema("admin_fundo", "Fundo", config, "#f6f3f1", "")}
              ${campoTema("admin_superficie", "Superfície", config, "#ffffff", "Cards e painéis.")}
              ${campoTema("admin_texto", "Texto", config, "#211b1d", "")}
              ${campoTema("admin_texto_suave", "Texto secundário", config, "#6f6267", "")}
              ${campoTema("admin_borda", "Borda", config, "#e4dcd8", "")}
              ${campoTema("admin_destaque", "Destaque", config, "#c9404f", "Acentos e ações principais.")}
              ${campoTema("admin_sidebar", "Sidebar", config, "#2a2e33", "Fundo da barra lateral.")}
              ${campoTema("admin_item_ativo", "Item ativo", config, "#c9404f", "Menu ativo da sidebar.")}
              ${campoTema("admin_hover", "Hover", config, "#ffffff", "")}
            </div>

          </div>

          </div>


          <!-- ==================== ABA FORMULÁRIOS ==================== -->

          ${abrirAba("formularios")}

          <div class="form-card">

            <div class="form-card-title">
              <span>${icone.editar}</span>
              <div>
                <h2>Formulários e botões</h2>
                <p>Cores de inputs, labels e botões em todo o site.</p>
              </div>
            </div>

            <div class="aparencia-cores">
              ${campoTema("input_fundo", "Fundo do input", config, "#ffffff", "")}
              ${campoTema("input_texto", "Texto do input", config, "#211b1d", "")}
              ${campoTema("input_placeholder", "Placeholder", config, "#8d8489", "")}
              ${campoTema("input_borda", "Borda do input", config, "#e4dcd8", "")}
              ${campoTema("input_foco", "Foco do input", config, "#8a2b3d", "")}
              ${campoTema("input_label", "Label", config, "#211b1d", "")}
              ${campoTema("input_ajuda", "Texto de ajuda", config, "#6f6267", "")}
              ${campoTema("botao_primario_fundo", "Botão primário", config, "#8a2b3d", "")}
              ${campoTema("botao_primario_texto", "Texto do botão primário", config, "#ffffff", "")}
              ${campoTema("botao_primario_hover", "Hover do botão primário", config, "#771f30", "")}
              ${campoTema("botao_perigo", "Botão de perigo", config, "#b63b3b", "")}
            </div>

          </div>

          </div>


          ${abrirAba("lamina")}

          <div class="form-card">

            <div class="form-card-title">
              <span>${icone.microscopio}</span>
              <div>
                <h2>Lâmina & Visualizador</h2>
                <p>Página da lâmina, controles do OpenSeadragon e vídeo.</p>
              </div>
            </div>

            <div class="aparencia-cores">
              ${campoTema("lamina_fundo", "Fundo da página", config, "#f6f3f1", "")}
              ${campoTema("lamina_painel_fundo", "Fundo dos painéis", config, "#f6f3f1", "")}
              ${campoTema("lamina_moldura", "Moldura / destaque", config, "#c9404f", "Moldura avermelhada, com cor configurável.")}
              ${campoTema("lamina_indicador", "Indicadores", config, "#c9404f", "")}
              ${campoTema("viewer_fundo", "Fundo dos controles", config, "#2a2e33", "")}
              ${campoTema("viewer_icone", "Ícones dos controles", config, "#f3f0ef", "Ícones claros, legíveis sobre imagens claras e escuras.")}
              ${campoTema("viewer_hover", "Hover dos controles", config, "#c9404f", "")}
              ${campoTema("viewer_borda", "Borda dos controles", config, "#ffffff", "")}
              ${campoTema("video_fundo", "Fundo da seção de vídeo", config, "#f6f3f1", "")}
              ${campoTema("video_titulo", "Título da seção de vídeo", config, "#211b1d", "")}
              ${campoTema("video_borda", "Borda do vídeo", config, "#e4dcd8", "")}
            </div>

          </div>

          </div>


          <!-- ==================== ABA RODAPÉ ==================== -->

          ${abrirAba("rodape")}

          <div class="form-card">

            <div class="form-card-title">
              <span>${icone.documento}</span>
              <div>
                <h2>Rodapé</h2>
                <p>Cores individuais do rodapé, independentes do texto do site.</p>
              </div>
            </div>

            <div class="aparencia-cores">
              ${campoTema("rodape_fundo", "Fundo do rodapé", config, "#5c162b", "Ex.: #5C162B")}
              ${campoTema("rodape_titulo", "Título do rodapé", config, "#f3f0ef", "")}
              ${campoTema("rodape_texto", "Texto do rodapé", config, "#ffffff", "")}
              ${campoTema("rodape_link", "Links do rodapé", config, "#ffffff", "")}
              ${campoTema("rodape_link_hover", "Links hover", config, "#e8a6b8", "")}
              ${campoTema("rodape_icone", "Ícones", config, "#c9404f", "")}
              ${campoTema("rodape_borda", "Bordas / divisores", config, "#ffffff", "")}
              ${campoTema("rodape_creditos", "Créditos", config, "#ffffff", "")}
            </div>

          </div>

          </div>


            <!-- ==================== ABA ESTADOS & TIPOGRAFIA ==================== -->

          ${abrirAba("estilos")}

          <div class="form-card">

            <div class="form-card-title">
              <span>${icone.paleta}</span>
              <div>
                <h2>Estados semânticos & Tipografia</h2>
                <p>Sucesso, aviso, erro, informação e ajustes de texto.</p>
              </div>
            </div>

            <div class="aparencia-cores">
              ${campoTema("sucesso", "Sucesso", config, "#2e7d52", "Verde semântico — não é cor de identidade.")}
              ${campoTema("alerta", "Aviso", config, "#a06a1c", "")}
              ${campoTema("erro", "Erro", config, "#b23f3e", "")}
              ${campoTema("informacao", "Informação", config, "#2f6fa3", "")}
            </div>

            <div class="form-grid" style="margin-top:4px">

              <div class="form-field">
                <label for="config-fonte">Fonte principal</label>
                <input
                  id="config-fonte"
                  type="text"
                  value="${escapeHtml(valorTema(config, "fonte", ""))}"
                  placeholder="Inter, sans-serif"
                >
              </div>

              <div class="form-field">
                <label for="config-peso-titulos">Peso dos títulos</label>
                <select id="config-peso-titulos">
                  <option value="" ${!valorTema(config, "peso_titulos", "") ? "selected" : ""}>Padrão (800)</option>
                  <option value="700" ${valorTema(config, "peso_titulos", "") === "700" ? "selected" : ""}>700</option>
                  <option value="800" ${valorTema(config, "peso_titulos", "") === "800" ? "selected" : ""}>800</option>
                  <option value="900" ${valorTema(config, "peso_titulos", "") === "900" ? "selected" : ""}>900</option>
                </select>
              </div>

              <div class="form-field">
                <label for="config-tamanho-titulo">Tamanho do título principal</label>
                <select id="config-tamanho-titulo">
                  <option value="" ${!valorTema(config, "tamanho_titulo", "") ? "selected" : ""}>Padrão</option>
                  <option value="clamp(40px, 5vw, 68px)" ${valorTema(config, "tamanho_titulo", "") === "clamp(40px, 5vw, 68px)" ? "selected" : ""}>Menor</option>
                  <option value="clamp(48px, 6vw, 82px)" ${valorTema(config, "tamanho_titulo", "") === "clamp(48px, 6vw, 82px)" ? "selected" : ""}>Padrão atual</option>
                  <option value="clamp(56px, 7vw, 96px)" ${valorTema(config, "tamanho_titulo", "") === "clamp(56px, 7vw, 96px)" ? "selected" : ""}>Maior</option>
                </select>
              </div>

              <div class="form-field">
                <label for="config-tamanho-texto">Tamanho do texto</label>
                <select id="config-tamanho-texto">
                  <option value="" ${!valorTema(config, "tamanho_texto", "") ? "selected" : ""}>Padrão (16px)</option>
                  <option value="0.9375rem" ${valorTema(config, "tamanho_texto", "") === "0.9375rem" ? "selected" : ""}>15px</option>
                  <option value="1rem" ${valorTema(config, "tamanho_texto", "") === "1rem" ? "selected" : ""}>16px</option>
                  <option value="1.0625rem" ${valorTema(config, "tamanho_texto", "") === "1.0625rem" ? "selected" : ""}>17px</option>
                </select>
              </div>

            </div>

          </div>

          </div>


            <div class="form-actions">

              <button
                type="button"
                id="cancelar-aparencia"
                class="button secondary"
              >
                Cancelar
              </button>

              <button type="submit" class="button primary">
                ${icone.salvar}
                Salvar aparência
              </button>

            </div>

        </form>

        <!-- ==================== PRÉVIA AO VIVO ==================== -->

        <aside
          id="aparencia-preview"
          class="aparencia-preview"
          aria-label="Prévia do site"
        >

          <div class="preview-rotulo">
            ${icone.olho}
            Prévia ao vivo
          </div>


          <div class="preview-janela">

            <header class="preview-header">

              <span
                class="brand-icon preview-logo"
                style="width:${Math.round(Number(config.logo_tamanho || 100) * 0.52)}px;height:${Math.round(Number(config.logo_tamanho || 100) * 0.52)}px;"
              >
                ${config.logo_url ? `<img src="${escapeHtml(config.logo_url)}" alt="">` : icone.microscopio}
              </span>

              <span class="preview-marca">
                <strong id="preview-nome">${escapeHtml(config.nome_site || "Atlas")}</strong>
                <small id="preview-subtitulo">${escapeHtml(config.subtitulo || "Histológico")}</small>
              </span>

              <nav class="preview-navi">
                <a>Início</a>
                <a>Lâminas</a>
                <a>Sobre</a>
              </nav>

            </header>


            <div class="preview-hero">

              <span class="eyebrow">MICROSCOPIA · ESTUDO · EXPLORAÇÃO</span>

              <h1 id="preview-titulo">
                ${escapeHtml(config.titulo_inicio || "Explore a Microestrutura do Mundo Animal")}
              </h1>

              <p id="preview-descricao">
                ${escapeHtml(config.descricao_inicio || "Um atlas de histologia interativo para explorar tecidos, estruturas e lâminas histológicas de uma forma visual e dinâmica.")}
              </p>

              <div class="preview-actions">

                <span
                  class="preview-button preview-primary"
                  id="preview-botao"
                >
                  ${escapeHtml(config.texto_botao_principal || "Explorar lâminas")}
                </span>

                <span
                  class="preview-button preview-secondary"
                  id="preview-botao-secundario"
                >
                  ${escapeHtml(config.texto_botao_secundario || "Conheça o projeto")}
                </span>

              </div>

            </div>


            <div class="preview-cards">

              <div class="preview-card"><b>${icone.camadas}</b>Explore</div>

              <div class="preview-card preview-card-destaque">
                <b>${icone.microscopio}</b>Amplie
              </div>

              <div class="preview-card"><b>${icone.livro}</b>Aprenda</div>

            </div>


            <div class="preview-cat" id="preview-catalogo">

              <div class="preview-cat-titulo">Catálogo de lâminas</div>

              <div class="preview-cat-card">
                <b>Fígado</b>
                <small>HE · Fígado</small>
                <span>Explorar →</span>
              </div>

              <div class="preview-cat-card">
                <b>Rim</b>
                <small>PAS · Rim</small>
                <span>Explorar →</span>
              </div>

            </div>


            <div class="preview-slide" id="preview-lamina">

              <div class="preview-slide-titulo">Lâmina & Visualizador</div>

              <div class="preview-slide-painel">

                <div class="preview-slide-moldura">
                  Estruturas
                </div>

                <div class="preview-slide-controles">
                  <span>100%</span>
                  <i>+</i>
                  <i>−</i>
                </div>

              </div>

            </div>


            <footer class="preview-footer" id="preview-rodape">

              <div class="preview-footer-marca">
                ${icone.microscopio}
                <span>${escapeHtml(config.nome_site || "Atlas")} ${escapeHtml(config.subtitulo || "Histológico")}</span>
              </div>

              <div class="preview-footer-links">
                <a>Início</a>
                <a>Lâminas</a>
                <a>Sobre</a>
              </div>

              <small>${escapeHtml(config.texto_rodape || "Projeto acadêmico")}</small>

            </footer>

          </div>

        </aside>

      </div>

    </section>
  `;
}

/* Campo de cor reutilizável: seletor + código hex sincronizado.
   data-chave liga o campo ao token correspondente no objeto tema. */
function campoCor(chave, rotulo, valor, ajuda = "") {
  return `
    <div class="campo-cor" data-campo-cor="${chave}">

      <label for="config-cor-${chave}">${rotulo}</label>

      <div class="campo-cor-controles">

        <input
          id="config-cor-${chave}"
          data-chave="${chave}"
          type="color"
          value="${escapeHtml(valor)}"
        >

        <input
          id="cor-${chave}-valor"
          class="codigo-cor"
          type="text"
          maxlength="9"
          value="${escapeHtml(String(valor).toUpperCase())}"
          spellcheck="false"
          aria-label="${escapeHtml(rotulo)} (código)"
        >

      </div>

      ${ajuda ? `<small>${ajuda}</small>` : ""}

    </div>
  `;
}

/* Campo de cor que lê o valor salvo no objeto tema */
function campoTema(chave, rotulo, config, padraoHex, ajuda = "") {
  return campoCor(
    chave,
    rotulo,
    valorTema(config, chave, padraoHex),
    ajuda,
  );
}

/* Cores-base persistidas em colunas planas (não duplicam no objeto tema) */
const CHAVES_BASE_PLANAS = new Set([
  "cor_principal",
  "cor_secundaria",
  "cor_acento",
  "cor_fundo",
  "cor_texto",
]);

/* Coleta o tema atual do formulário (todas as cores + tipografia) */
function coletarTemaParaSalvar() {
  const tema = {};

  document.querySelectorAll("[data-chave]").forEach((input) => {
    const chave = input.dataset.chave;

    const valor = (input.value || "").trim();

    if (chave && corValida(valor)) tema[chave] = valor;
  });

  const fonte = document.querySelector("#config-fonte")?.value.trim();

  if (fonte) tema.fonte = fonte;

  const peso = document.querySelector("#config-peso-titulos")?.value;

  if (peso) tema.peso_titulos = peso;

  const tamanhoTitulo = document.querySelector("#config-tamanho-titulo")?.value;

  if (tamanhoTitulo) tema.tamanho_titulo = tamanhoTitulo;

  const tamanhoTexto = document.querySelector("#config-tamanho-texto")?.value;

  if (tamanhoTexto) tema.tamanho_texto = tamanhoTexto;

  return tema;
}

export function setupAparencia() {
  configurarPreviewAoVivo();

  configurarLogoPreview();

  configurarTamanhoLogo();

  /*
   * Restauração do NÍVEL 2 (aba interna) na remontagem da
   * Administração. O template já marca a aba e o painel corretos via
   * abaAtivaSalva()/abrirAba(); este reforço sincroniza as classes
   * garantindo que a subseção salva apareça mesmo após trocar de
   * página/guia e que o painel nunca fique vazio.
   */
  const abaRestaurada = abaAtivaSalva();

  document.querySelectorAll(".aparencia-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.aba === abaRestaurada);
    tab.setAttribute("aria-selected", tab.dataset.aba === abaRestaurada ? "true" : "false");
  });

  document.querySelectorAll(".aparencia-aba").forEach((painel) => {
    painel.hidden = painel.id !== `aba-${abaRestaurada}`;
  });

  /*
   * Navegação entre abas — preserva a aba ativa em sessionStorage.
   * Trocar de guia NÃO re-renderiza o admin nem volta para Lâminas.
   */
  document.querySelectorAll(".aparencia-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.aba;

      sessionStorage.setItem(CHAVE_ABA_APARENCIA, id);

      document.querySelectorAll(".aparencia-tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      document.querySelectorAll(".aparencia-aba").forEach((aba) => {
        aba.hidden = true;
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      const painel = document.querySelector(`#aba-${id}`);

      if (painel) painel.hidden = false;
    });
  });

  const form = document.querySelector("#aparencia-form");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (form.dataset.salvando === "true") return;
    form.dataset.salvando = "true";

    try {
      const status = document.querySelector("#aparencia-status");

      status.textContent = "Salvando...";

      status.className = "form-status loading";

      const dados = {
        nome_site: document.querySelector("#config-nome").value,

        subtitulo: document.querySelector("#config-subtitulo").value,

        titulo_inicio: document.querySelector("#config-titulo").value,

        descricao_inicio: document.querySelector("#config-descricao").value,

        texto_botao_principal: document.querySelector("#config-botao").value,

        texto_botao_secundario: document.querySelector(
          "#config-botao-secundario",
        ).value,

        texto_sobre: document.querySelector("#config-sobre").value,

        texto_rodape: document.querySelector("#config-rodape").value,

        cor_principal: document.querySelector("#config-cor-principal").value,

        cor_fundo: document.querySelector("#config-cor-fundo").value,

        cor_texto: document.querySelector("#config-cor-texto").value,

        /* Compatibilidade com a coluna antiga */
        cor_destaque: document.querySelector("#config-cor-principal").value,

        cor_secundaria:
          document.querySelector("#config-cor-secundaria").value || null,

        cor_acento:
          document.querySelector("#config-cor-acento").value || null,

        logo_tamanho: Number(
          document.querySelector("#config-logo-tamanho").value,
        ),

        logo_url:
          logoUrlAtual ||
          document.querySelector("#config-logo").dataset.logoUrl ||
          null,

        atualizado_em: new Date().toISOString(),
      };

      /*
       * Tema expandido: coleta todas as cores/tipografia e persiste
       * no objeto JSON `tema` — apenas os campos realmente editados.
       * Campos intactos continuam derivando das cores base.
       */
      const temaBruto = coletarTemaParaSalvar();

      const efetivoAtual = temaEfetivo(temaBruto);

      const temaPronto = {};

      CAMPOS_MODIFICADOS.forEach((chave) => {
        if (CHAVES_BASE_PLANAS.has(chave)) return;

        if (temaBruto[chave] !== undefined && temaBruto[chave] !== "") {
          temaPronto[chave] = temaBruto[chave];
        }
      });

      const temaParaPersistir = temaParaSalvar(temaPronto, efetivoAtual);

      if (Object.keys(temaParaPersistir).length > 0) {
        dados.tema = temaParaPersistir;
      } else {
        dados.tema = null;
      }

      const { data: existente } = await supabase
        .from("configuracoes_site")
        .select("id")
        .limit(1)
        .maybeSingle();

      let resultado = null;

      /*
       * Salvamento resiliente: se uma coluna nova ainda não existir
       * no banco (migration pendente), ela é removida do payload e o
       * salvamento é repetido — sem perder os demais campos.
       */
      let tentativas = 0;

      while (tentativas < 5) {
        tentativas += 1;

        resultado =
          existente && existente.id
            ? await supabase
                .from("configuracoes_site")
                .update(dados)
                .eq("id", existente.id)
            : await supabase.from("configuracoes_site").insert(dados);

        if (!resultado.error) break;

        const coluna = colunaDesconhecida(resultado.error.message);

        if (!coluna || !(coluna in dados)) break;

        delete dados[coluna];
      }

      if (resultado && resultado.error) {
        console.error(resultado.error);

        status.textContent = "Erro ao salvar: " + resultado.error.message;

        status.className = "form-status error";

        return;
      }

      status.textContent = "Configurações salvas com sucesso!";

      status.className = "form-status success";
    } finally {
      form.dataset.salvando = "false";
    }
  });

  document
    .querySelector("#cancelar-aparencia")
    ?.addEventListener("click", () => {
      window.dispatchEvent(new Event("hashchange"));
    });
}

/* Detecta nome de coluna inexistente em mensagens do PostgREST */
function colunaDesconhecida(mensagem = "") {
  const match = String(mensagem).match(/['"]([a-z_]+)['"]/i);

  return match ? match[1] : null;
}

/*
 * PRÉVIA AO VIVO — usa os MESMOS tokens do site real.
 * Os valores são aplicados como CSS custom properties no contêiner
 * da prévia; como todo o site consome essas variáveis (inclusive os
 * aliases legados), a miniatura reflete fielmente qualquer mudança.
 */
function configurarPreviewAoVivo() {
  const preview = document.querySelector("#aparencia-preview");

  if (!preview) return;

  /*
   * Coleta todos os campos (cores com data-chave + tipografia).
   * Valores inválidos/vazios são ignorados — quem decide o valor
   * efetivo é temaEfetivo(), com fallback derivado seguro.
   */
  function coletarTema() {
    const tema = {};

    document.querySelectorAll("[data-chave]").forEach((input) => {
      const chave = input.dataset.chave;
      const valor = (input.value || "").trim();

      if (chave && corValida(valor)) tema[chave] = valor;
    });

    const fonte = document.querySelector("#config-fonte")?.value.trim();
    if (fonte) tema.fonte = fonte;

    const peso = document.querySelector("#config-peso-titulos")?.value;
    if (peso) tema.peso_titulos = peso;

    const tamanhoTitulo = document.querySelector("#config-tamanho-titulo")?.value;
    if (tamanhoTitulo) tema.tamanho_titulo = tamanhoTitulo;

    const tamanhoTexto = document.querySelector("#config-tamanho-texto")?.value;
    if (tamanhoTexto) tema.tamanho_texto = tamanhoTexto;

    return tema;
  }

  /* Aplica os MESMOS tokens do site real na prévia */
  function aplicarAoVivo() {
    aplicarTema(preview, temaEfetivo(coletarTema()));
  }

  /* Sincroniza seletor de cor <-> código hex e reaplica */
  function sincronizarCampo(campo) {
    const chave = campo.dataset.campoCor;

    const color = campo.querySelector('input[type="color"]');

    const codigo = campo.querySelector(".codigo-cor");

    if (!chave || !color || !codigo) return;

    color.addEventListener("input", () => {
      codigo.value = color.value.toUpperCase();

      marcarModificado(chave);

      aplicarAoVivo();
    });

    codigo.addEventListener("change", () => {
      let valor = codigo.value.trim();

      if (valor && !valor.startsWith("#")) valor = "#" + valor;

      if (corValida(valor)) {
        color.value = valor;

        marcarModificado(chave);

        aplicarAoVivo();
      } else {
        codigo.value = color.value.toUpperCase();
      }
    });
  }

  document.querySelectorAll(".campo-cor").forEach(sincronizarCampo);

  /* Textos da prévia */
  function aplicarTextos() {
    const ler = (id, padrao) =>
      document.querySelector(id)?.value?.trim() || padrao;

    const definir = (seletor, id, padrao) => {
      const alvo = document.querySelector(seletor);

      if (alvo) alvo.textContent = ler(id, padrao);
    };

    definir("#preview-nome", "#config-nome", "Atlas");

    definir("#preview-subtitulo", "#config-subtitulo", "Histológico");

    definir(
      "#preview-titulo",
      "#config-titulo",
      "Explore a Microestrutura do Mundo Animal",
    );

    definir(
      "#preview-descricao",
      "#config-descricao",
      "Um atlas de histologia interativo para explorar tecidos e estruturas.",
    );

    definir("#preview-botao", "#config-botao", "Explorar lâminas");

    definir(
      "#preview-botao-secundario",
      "#config-botao-secundario",
      "Conheça o projeto",
    );

    const marca = document.querySelector(".preview-footer-marca span");

    if (marca) {
      marca.textContent =
        ler("#config-nome", "Atlas") + " " + ler("#config-subtitulo", "Histológico");
    }

    const creditos = document.querySelector(".preview-footer small");

    if (creditos) creditos.textContent = ler("#config-rodape", "Projeto acadêmico");
  }

  [
    "#config-nome",
    "#config-subtitulo",
    "#config-titulo",
    "#config-descricao",
    "#config-botao",
    "#config-botao-secundario",
    "#config-sobre",
    "#config-rodape",
  ].forEach((id) => {
    document.querySelector(id)?.addEventListener("input", aplicarTextos);
  });

  [
    "#config-fonte",
    "#config-peso-titulos",
    "#config-tamanho-titulo",
    "#config-tamanho-texto",
  ].forEach((id) => {
    const evento = id === "#config-fonte" ? "input" : "change";

    document.querySelector(id)?.addEventListener(evento, () => {
      marcarModificado(id.replace("#config-", ""));

      aplicarAoVivo();
    });
  });

  aplicarTextos();

  aplicarAoVivo();
}

function configurarTamanhoLogo() {
  const controle = document.querySelector("#config-logo-tamanho");

  if (!controle) return;

  const atualizar = () => {
    const tamanho = Number(controle.value || 100);

    const valorTexto = document.querySelector("#logo-tamanho-valor");

    if (valorTexto) {
      valorTexto.textContent = `${tamanho}%`;
    }

    const previewLogo = document.querySelector(".preview-logo");

    if (previewLogo) {
      const lado = Math.round(tamanho * 0.52);

      previewLogo.style.width = lado + "px";

      previewLogo.style.height = lado + "px";
    }

    const imagemEditor = document.querySelector("#logo-preview img");

    if (imagemEditor) {
      const ladoEditor = Math.round(90 * (tamanho / 100));

      imagemEditor.style.width = ladoEditor + "px";

      imagemEditor.style.height = ladoEditor + "px";
    }
  };

  controle.addEventListener("input", atualizar);

  atualizar();
}

function configurarLogoPreview() {
  const input = document.querySelector("#config-logo");

  const preview = document.querySelector("#logo-preview");

  const nome = document.querySelector("#logo-nome");

  const remover = document.querySelector("#remover-logo");

  if (!input || !preview || !nome || !remover) {
    return;
  }

  input.addEventListener("change", async () => {
    const arquivo = input.files[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      input.value = "";
      return;
    }

    nome.textContent = "Enviando logo...";

    const extensao = arquivo.name.split(".").pop().toLowerCase();

    const nomeArquivo = `logo-${Date.now()}.${extensao}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(nomeArquivo, arquivo, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);

      nome.textContent = "Erro ao enviar a logo";

      return;
    }

    const { data: urlData } = supabase.storage
      .from("logos")
      .getPublicUrl(nomeArquivo);

    const logoUrl = urlData.publicUrl;

    if (!logoUrl) {
      nome.textContent = "Não foi possível obter a URL da logo";

      return;
    }

    logoUrlAtual = logoUrl;

    input.dataset.logoUrl = logoUrl;

    /* Mostra no editor */

    preview.innerHTML = "";

    const imagem = document.createElement("img");

    imagem.src = logoUrl;

    imagem.alt = "Logo do Atlas";

    preview.appendChild(imagem);

    nome.textContent = arquivo.name;

    /* Mostra também na prévia do site */

    const previewLogo = document.querySelector(".preview-logo");

    if (previewLogo) {
      previewLogo.innerHTML = "";

      const imagemPreview = document.createElement("img");

      imagemPreview.src = logoUrl;

      imagemPreview.alt = "Logo";

      previewLogo.appendChild(imagemPreview);
    }

    /* Reaplica o tamanho escolhido */

    const controle = document.querySelector("#config-logo-tamanho");

    controle?.dispatchEvent(new Event("input"));
  });

  remover.addEventListener("click", () => {
    logoUrlAtual = "";

    delete input.dataset.logoUrl;

    input.value = "";

    preview.innerHTML = icone.microscopio;

    nome.textContent = "";

    const previewLogo = document.querySelector(".preview-logo");

    if (previewLogo) {
      previewLogo.innerHTML = icone.microscopio;
    }
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


