import { supabase } from "../lib/supabase.js";
import { icone } from "../lib/icons.js";

let logoUrlAtual = "";

/* Paleta padrão do site — espelha :root em style.css */
const PADRAO = {
  cor_principal: "#8a2b3d",
  cor_secundaria: "#2e3a45",
  cor_acento: "#c9404f",
  cor_fundo: "#f6f3f1",
  cor_texto: "#211b1d",
};

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
    <section id="admin-section-aparencia" class="admin-section">

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


      <div class="aparencia-grid">


        <form id="aparencia-form" class="aparencia-formulario">

          <div id="aparencia-status" class="form-status"></div>

          <!-- ==================== IDENTIDADE ==================== -->

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

              ${campoCor("principal", "Cor principal", config.cor_principal || PADRAO.cor_principal, "Botões, links e elementos da marca.")}

              ${campoCor("secundaria", "Cor secundária", config.cor_secundaria || PADRAO.cor_secundaria, "Seções e elementos de apoio.")}

              ${campoCor("acento", "Cor de destaque", config.cor_acento || PADRAO.cor_acento, "Detalhes e identidade visual.")}

            </div>

          </div>


          <!-- ==================== CORES ==================== -->

          <div class="form-card">

            <div class="form-card-title">

              <span>${icone.paleta}</span>

              <div>
                <h2>Cores do tema</h2>

                <p>
                  Fundo e texto do site. Superfícies, bordas e estados
                  derivam automaticamente destas cores.
                </p>
              </div>

            </div>


            <div class="aparencia-cores">

              ${campoCor("fundo", "Fundo principal", config.cor_fundo || PADRAO.cor_fundo, "Cor base das páginas.")}

              ${campoCor("texto", "Texto principal", config.cor_texto || PADRAO.cor_texto, "Títulos, parágrafos e menus.")}

            </div>

          </div>


          <!-- ==================== TEXTOS ==================== -->

          <div class="form-card">

            <div class="form-card-title">

              <span>${icone.documento}</span>

              <div>
                <h2>Textos da página inicial</h2>

                <p>Conteúdo exibido no hero e no rodapé do site.</p>
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


            <footer class="preview-footer" id="preview-rodape">

              ${icone.microscopio}

              <span>
                ${escapeHtml(config.nome_site || "Atlas")} ${escapeHtml(config.subtitulo || "Histológico")} — ${escapeHtml(config.texto_rodape || "Projeto acadêmico")}
              </span>

            </footer>

          </div>

        </aside>

      </div>

    </section>
  `;
}

/* Campo de cor reutilizável: seletor + código hex sincronizado */
function campoCor(id, rotulo, valor, ajuda = "") {
  return `
    <div class="campo-cor">

      <label for="config-cor-${id}">${rotulo}</label>

      <div class="campo-cor-controles">

        <input
          id="config-cor-${id}"
          type="color"
          value="${escapeHtml(valor)}"
        >

        <input
          id="cor-${id}-valor"
          class="codigo-cor"
          type="text"
          maxlength="7"
          value="${escapeHtml(String(valor).toUpperCase())}"
          spellcheck="false"
        >

      </div>

      ${ajuda ? `<small>${ajuda}</small>` : ""}

    </div>
  `;
}

export function setupAparencia() {
  configurarPreviewAoVivo();

  configurarLogoPreview();

  configurarTamanhoLogo();

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

  const ler = (id, padrao) =>
    document.querySelector(id)?.value?.trim() || padrao;

  function aplicarCores() {
    preview.style.setProperty(
      "--cor-principal",
      ler("#config-cor-principal", PADRAO.cor_principal),
    );

    preview.style.setProperty(
      "--cor-secundaria",
      ler("#config-cor-secundaria", PADRAO.cor_secundaria),
    );

    preview.style.setProperty(
      "--cor-acento",
      ler("#config-cor-acento", PADRAO.cor_acento),
    );

    preview.style.setProperty(
      "--cor-fundo",
      ler("#config-cor-fundo", PADRAO.cor_fundo),
    );

    preview.style.setProperty(
      "--cor-texto",
      ler("#config-cor-texto", PADRAO.cor_texto),
    );

    /* Aliases legados usados por estilos compartilhados */
    preview.style.setProperty(
      "--green",
      ler("#config-cor-principal", PADRAO.cor_principal),
    );

    preview.style.setProperty(
      "--cream",
      ler("#config-cor-fundo", PADRAO.cor_fundo),
    );
  }

  function aplicarTextos() {
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

    const rodape = document.querySelector("#preview-rodape span");

    if (rodape) {
      rodape.textContent =
        ler("#config-nome", "Atlas") +
        " " +
        ler("#config-subtitulo", "Histológico") +
        " — " +
        ler("#config-rodape", "Projeto acadêmico");
    }
  }

  [
    "#config-cor-principal",
    "#config-cor-secundaria",
    "#config-cor-acento",
    "#config-cor-fundo",
    "#config-cor-texto",
  ].forEach((id) => {
    const entrada = document.querySelector(id);

    const sufixo = id.replace("#config-cor-", "");

    const codigo = document.querySelector(`#cor-${sufixo}-valor`);

    entrada?.addEventListener("input", () => {
      aplicarCores();

      if (codigo) codigo.value = entrada.value.toUpperCase();
    });

    codigo?.addEventListener("change", () => {
      let valor = codigo.value.trim();

      if (valor && !valor.startsWith("#")) valor = "#" + valor;

      if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
        entrada.value = valor;

        aplicarCores();
      } else {
        codigo.value = entrada.value.toUpperCase();
      }
    });
  });

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

  aplicarCores();
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


