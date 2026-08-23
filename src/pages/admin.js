import { renderAparencia, setupAparencia } from "./aparencia.js";
import "./admin.css";

import { supabase, getCurrentUser, isAdmin } from "../lib/supabase.js";
import { extrairCaminhoArmazenamento } from "../lib/storage-path.js";

export async function renderAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.hash = "#login";
    return "";
  }

  if (!(await isAdmin(user))) {
    window.location.hash = "#inicio";
    return "";
  }

  const { data: laminas, error } = await supabase
    .from("laminas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar lâminas:", error);

    return `
      <div class="admin-page">
        <div class="admin-error">
          Não foi possível carregar as lâminas.
        </div>
      </div>
    `;
  }

  const lista = laminas || [];

  const publicadas = lista.filter((lamina) => lamina.publicado === true).length;

  const ocultas = lista.filter((lamina) => lamina.publicado !== true).length;

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
            ${escapeHtml(user.email || "Administrador")}
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
             📁
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
             🔙 Voltar ao site
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

                <span>📄</span>

                <div>
                  <strong>${lista.length}</strong>
                  <small>Total</small>
                </div>

              </div>


              <div class="admin-stat">

                <span>👁️</span>

                <div>
                  <strong>${publicadas}</strong>
                  <small>Publicadas</small>
                </div>

              </div>


              <div class="admin-stat">

                <span>🙈</span>

                <div>
                  <strong>${ocultas}</strong>
                  <small>Ocultas</small>
                </div>

              </div>

            </div>


            <div class="admin-toolbar">

              <div class="admin-search">

                🔍

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

              <button
                id="nova-categoria"
                class="button primary"
                type="button"
              >
                + Nova categoria
              </button>

            </div>


            <div
              id="categoria-status"
              class="form-status"
            ></div>


            <div
              id="categoria-form-container"
              class="categoria-form-container"
              hidden
            >

              <div class="form-card">

                <div class="form-card-title">

                  <span>
                    📁
                  </span>

                  <div>

                    <h2 id="categoria-form-title">
                      Nova categoria
                    </h2>

                    <p>
                      Cadastre uma categoria para organizar as lâminas.
                    </p>

                  </div>

                </div>


                <form id="categoria-form">

                  <input
                    type="hidden"
                    id="categoria-id"
                  >


                  <div class="form-grid">

                    <div class="form-field">

                      <label for="categoria-nome">
                        Nome *
                      </label>

                      <input
                        id="categoria-nome"
                        type="text"
                        required
                        maxlength="100"
                        placeholder="Ex.: Tecido epitelial"
                      >

                    </div>


                    <div class="form-field">

                      <label for="categoria-ordem">
                        Ordem
                      </label>

                      <input
                        id="categoria-ordem"
                        type="number"
                        min="0"
                        step="1"
                        value="0"
                      >

                    </div>


                    <div class="form-field full">

                      <label for="categoria-descricao">
                        Descrição
                      </label>

                      <textarea
                        id="categoria-descricao"
                        rows="3"
                        maxlength="500"
                        placeholder="Descrição opcional da categoria."
                      ></textarea>

                    </div>


                    <div class="form-field">

                      <label for="categoria-ativo">
                        Status
                      </label>

                      <select id="categoria-ativo">

                        <option value="true">
                          ✅ Ativa
                        </option>

                        <option value="false">
                          ❌ Inativa
                        </option>

                      </select>

                    </div>

                  </div>


                  <div class="form-actions">

                    <button
                      type="button"
                      id="cancelar-categoria"
                      class="button secondary"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      class="button primary"
                    >
                      Salvar categoria
                    </button>

                  </div>

                </form>

              </div>

            </div>


            <div
              id="categorias-lista"
              class="categorias-lista"
            >

              <div class="admin-placeholder">

                <div>📁</div>

                <p>
                  Carregando categorias...
                </p>

              </div>

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
                  Visão geral das configurações e dados do Atlas.
                </p>

              </div>

            </div>


            <div
              id="configuracoes-status"
              class="form-status"
            ></div>


            <div id="configuracoes-content">

              <div class="admin-stats">

                <div class="admin-stat">

                  <span>📄</span>

                  <div>
                    <strong id="stat-laminas">-</strong>
                    <small>Lâminas</small>
                  </div>

                </div>


                <div class="admin-stat">

                  <span>👁️</span>

                  <div>
                    <strong id="stat-publicadas">-</strong>
                    <small>Publicadas</small>
                  </div>

                </div>


                <div class="admin-stat">

                  <span>📁</span>

                  <div>
                    <strong id="stat-categorias">-</strong>
                    <small>Categorias</small>
                  </div>

                </div>

              </div>


              <div class="config-card">

                <h2>
                  ⚙️ Configurações do site
                </h2>

                <p>
                  Essas configurações são gerenciadas na seção
                  <strong>Aparência</strong>.
                </p>


                <div class="config-list">

                  <div class="config-item">

                    <span class="config-label">
                      Nome do site
                    </span>

                    <span
                      id="config-view-nome"
                      class="config-value"
                    >
                      -
                    </span>

                  </div>


                  <div class="config-item">

                    <span class="config-label">
                      Subtítulo
                    </span>

                    <span
                      id="config-view-subtitulo"
                      class="config-value"
                    >
                      -
                    </span>

                  </div>


                  <div class="config-item">

                    <span class="config-label">
                      Título da página inicial
                    </span>

                    <span
                      id="config-view-titulo"
                      class="config-value"
                    >
                      -
                    </span>

                  </div>


                  <div class="config-item">

                    <span class="config-label">
                      Cor principal
                    </span>

                    <span
                      id="config-view-cor-principal"
                      class="config-value"
                    >
                      -
                    </span>

                  </div>


                  <div class="config-item">

                    <span class="config-label">
                      Cor de fundo
                    </span>

                    <span
                      id="config-view-cor-fundo"
                      class="config-value"
                    >
                      -
                    </span>

                  </div>


                  <div class="config-item">

                    <span class="config-label">
                      Logo
                    </span>

                    <span
                      id="config-view-logo"
                      class="config-value"
                    >
                      -
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </section>

        </main>

      </div>

    </div>
  `;
}

function renderLaminas(laminas) {
  if (!laminas.length) {
    return `
      <div class="admin-empty">

        <div>
          🖼️
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
    `;
  }

  return laminas
    .map((lamina) => {
      const publicada = lamina.publicado === true;

      return `
      <article
        class="admin-lamina-card"
        data-id="${lamina.id}"
        data-nome="${escapeHtml(lamina.nome || "").toLowerCase()}"
        data-categoria="${escapeHtml(
          lamina.categoria || "Histologia",
        ).toLowerCase()}"
        data-publicado="${publicada}"
      >

        <div class="admin-lamina-thumb">

          ${
            lamina.imagem_url
              ? `
                <img
                  src="${escapeHtml(lamina.imagem_url)}"
                  alt="${escapeHtml(lamina.nome || "Lâmina")}"
                >
              `
              : `
                <div class="admin-no-image">
                  🖼️
                </div>
              `
          }

        </div>


        <div class="admin-lamina-info">

          <div class="admin-lamina-top">

            <span class="admin-category">
              ${escapeHtml(lamina.categoria || "Histologia")}
            </span>

            <span
              class="admin-status ${publicada ? "published" : "hidden"}"
            >

              ${publicada ? "✅ Publicada" : "❌ Oculta"}

            </span>

          </div>


          <h2>
            ${escapeHtml(lamina.nome || "Lâmina sem nome")}
          </h2>


          <p>
            ${escapeHtml(lamina.descricao || "Sem descrição.")}
          </p>


          <div class="admin-tags">

            ${
              lamina.tecnica
                ? `<span>🔬 ${escapeHtml(lamina.tecnica)}</span>`
                : ""
            }

            ${
              lamina.coloracao
                ? `<span>🧫 ${escapeHtml(lamina.coloracao)}</span>`
                : ""
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
            title="${publicada ? "Ocultar" : "Publicar"}"
          >
            ${publicada ? "🙈" : "👁️"}
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
    `;
    })
    .join("");
}

async function carregarCategoriasAdmin() {
  const lista = document.querySelector("#categorias-lista");

  if (!lista) return;

  lista.innerHTML = `
    <div class="admin-placeholder">
      <div>📁</div>
      <p>Carregando categorias...</p>
    </div>
  `;

  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("ordem", {
      ascending: true,
    })
    .order("nome", {
      ascending: true,
    });

  if (error) {
    console.error("Erro ao carregar categorias:", error);

    lista.innerHTML = `
      <div class="admin-error">
        Não foi possível carregar as categorias.
      </div>
    `;

    return;
  }

  const categorias = data || [];

  if (!categorias.length) {
    lista.innerHTML = `
      <div class="admin-empty">
        <div>📁</div>
        <h2>Nenhuma categoria</h2>
        <p>Crie sua primeira categoria.</p>
      </div>
    `;

    return;
  }

  lista.innerHTML = categorias
    .map(
      (categoria) => `

          <article
            class="categoria-card"
            data-id="${categoria.id}"
          >

            <div class="categoria-card-icon">
              📁
            </div>


            <div class="categoria-card-info">

              <div class="categoria-card-top">

                <span class="admin-category">
                  ${escapeHtml(categoria.nome)}
                </span>

                <span
                  class="admin-status ${
                    categoria.ativo ? "published" : "hidden"
                  }"
                >
                  ${categoria.ativo ? "✅ Ativa" : "❌ Inativa"}
                </span>

              </div>


              <h2>
                ${escapeHtml(categoria.nome)}
              </h2>


              <p>
                ${escapeHtml(categoria.descricao || "Sem descrição.")}
              </p>


              <small>
                Ordem: ${categoria.ordem}
              </small>

            </div>


            <div class="admin-lamina-actions">

              <button
                type="button"
                class="admin-action edit"
                data-categoria-edit="${categoria.id}"
                title="Editar"
              >
                ✏️
              </button>


              <button
                type="button"
                class="admin-action toggle"
                data-categoria-toggle="${categoria.id}"
                title="${categoria.ativo ? "Desativar" : "Ativar"}"
              >
                ${categoria.ativo ? "🙈" : "👁️"}
              </button>


              <button
                type="button"
                class="admin-action delete"
                data-categoria-delete="${categoria.id}"
                title="Excluir"
              >
                🗑️
              </button>

            </div>

          </article>

        `,
    )
    .join("");

  lista.querySelectorAll("[data-categoria-edit]").forEach((button) => {
    button.addEventListener("click", () =>
      editarCategoria(button.dataset.categoriaEdit, categorias),
    );
  });

  lista.querySelectorAll("[data-categoria-toggle]").forEach((button) => {
    button.addEventListener("click", () =>
      alternarCategoria(button.dataset.categoriaToggle, categorias),
    );
  });

  lista.querySelectorAll("[data-categoria-delete]").forEach((button) => {
    button.addEventListener("click", () =>
      excluirCategoria(button.dataset.categoriaDelete),
    );
  });
}

function abrirFormularioCategoria(categoria = null) {
  const container = document.querySelector("#categoria-form-container");

  const id = document.querySelector("#categoria-id");

  const nome = document.querySelector("#categoria-nome");

  const descricao = document.querySelector("#categoria-descricao");

  const ordem = document.querySelector("#categoria-ordem");

  const ativo = document.querySelector("#categoria-ativo");

  const titulo = document.querySelector("#categoria-form-title");

  if (!container) return;

  container.hidden = false;

  if (categoria) {
    titulo.textContent = "Editar categoria";

    id.value = categoria.id || "";

    nome.value = categoria.nome || "";

    descricao.value = categoria.descricao || "";

    ordem.value = categoria.ordem ?? 0;

    ativo.value = categoria.ativo === false ? "false" : "true";
  } else {
    titulo.textContent = "Nova categoria";

    id.value = "";

    nome.value = "";

    descricao.value = "";

    ordem.value = "0";

    ativo.value = "true";
  }

  nome.focus();
}

function fecharFormularioCategoria() {
  const container = document.querySelector("#categoria-form-container");

  if (!container) return;

  container.hidden = true;
}

async function salvarCategoria(event) {
  event.preventDefault();

  const id = document.querySelector("#categoria-id")?.value || "";

  const nome = document.querySelector("#categoria-nome")?.value.trim() || "";

  const descricao =
    document.querySelector("#categoria-descricao")?.value.trim() || "";

  const ordem = Number(document.querySelector("#categoria-ordem")?.value || 0);

  const ativo = document.querySelector("#categoria-ativo")?.value === "true";

  if (!nome) {
    mostrarStatusCategoria("Digite o nome da categoria.", "error");

    return;
  }

  if (!Number.isInteger(ordem) || ordem < 0) {
    mostrarStatusCategoria(
      "A ordem deve ser um número inteiro maior ou igual a zero.",
      "error",
    );

    return;
  }

  mostrarStatusCategoria("Salvando categoria...", "loading");

  const dados = {
    nome,

    descricao,

    ordem,

    ativo,

    updated_at: new Date().toISOString(),
  };

  let resultado;

  if (id) {
    resultado = await supabase.from("categorias").update(dados).eq("id", id);
  } else {
    resultado = await supabase.from("categorias").insert({
      ...dados,
      created_at: new Date().toISOString(),
    });
  }

  if (resultado.error) {
    console.error(resultado.error);

    const mensagem =
      resultado.error.code === "23505"
        ? "Já existe uma categoria com esse nome."
        : resultado.error.message;

    mostrarStatusCategoria(mensagem, "error");

    return;
  }

  mostrarStatusCategoria(
    id ? "Categoria atualizada com sucesso!" : "Categoria criada com sucesso!",
    "success",
  );

  fecharFormularioCategoria();

  await carregarCategoriasAdmin();
}

function editarCategoria(id, categorias) {
  const categoria = categorias.find((item) => String(item.id) === String(id));

  if (!categoria) return;

  abrirFormularioCategoria(categoria);
}

async function alternarCategoria(id, categorias) {
  const categoria = categorias.find((item) => String(item.id) === String(id));

  if (!categoria) return;

  const novoEstado = categoria.ativo !== true;

  const { error } = await supabase
    .from("categorias")
    .update({
      ativo: novoEstado,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(error);

    mostrarStatusCategoria(
      "Não foi possível alterar o status da categoria.",
      "error",
    );

    return;
  }

  await carregarCategoriasAdmin();
}

async function excluirCategoria(id) {
  const { count, error: countError } = await supabase
    .from("laminas")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("categoria_id", id);

  if (!countError && count > 0) {
    mostrarStatusCategoria(
      "Esta categoria está sendo usada por uma ou mais lâminas. Desative-a em vez de excluí-la.",
      "error",
    );

    return;
  }

  const confirmar = confirm("Tem certeza que deseja excluir esta categoria?");

  if (!confirmar) return;

  const { error } = await supabase.from("categorias").delete().eq("id", id);

  if (error) {
    console.error(error);

    mostrarStatusCategoria("Não foi possível excluir a categoria.", "error");

    return;
  }

  mostrarStatusCategoria("Categoria excluída com sucesso.", "success");

  await carregarCategoriasAdmin();
}

function mostrarStatusCategoria(mensagem, tipo) {
  const elemento = document.querySelector("#categoria-status");

  if (!elemento) return;

  elemento.textContent = mensagem;

  elemento.className = `form-status ${tipo || ""}`;
}

async function carregarConfiguracoesAdmin() {
  const status = document.querySelector("#configuracoes-status");

  const content = document.querySelector("#configuracoes-content");

  if (!content) return;

  if (status) {
    status.textContent = "Carregando configurações...";
    status.className = "form-status loading";
  }

  try {
    const [laminasRes, categoriasRes, configRes] = await Promise.all([
      supabase.from("laminas").select("publicado", {
        count: "exact",
      }),
      supabase.from("categorias").select("id", {
        count: "exact",
        head: true,
      }),
      supabase.from("configuracoes_site").select("*").limit(1).maybeSingle(),
    ]);

    const laminas = laminasRes.data || [];

    const totalLaminas = laminasRes.count || laminas.length;

    const publicadas = laminas.filter((item) => item.publicado === true).length;

    const totalCategorias = categoriasRes.count || 0;

    const config = configRes.data || {};

    if (status) {
      status.textContent = "";
      status.className = "form-status";
    }

    const statLaminas = document.querySelector("#stat-laminas");

    const statPublicadas = document.querySelector("#stat-publicadas");

    const statCategorias = document.querySelector("#stat-categorias");

    if (statLaminas) {
      statLaminas.textContent = String(totalLaminas);
    }

    if (statPublicadas) {
      statPublicadas.textContent = String(publicadas);
    }

    if (statCategorias) {
      statCategorias.textContent = String(totalCategorias);
    }

    const viewNome = document.querySelector("#config-view-nome");

    const viewSubtitulo = document.querySelector("#config-view-subtitulo");

    const viewTitulo = document.querySelector("#config-view-titulo");

    const viewCorPrincipal = document.querySelector(
      "#config-view-cor-principal",
    );

    const viewCorFundo = document.querySelector("#config-view-cor-fundo");

    const viewLogo = document.querySelector("#config-view-logo");

    if (viewNome) {
      viewNome.textContent = config.nome_site || "Atlas";
    }

    if (viewSubtitulo) {
      viewSubtitulo.textContent = config.subtitulo || "Histológico";
    }

    if (viewTitulo) {
      viewTitulo.textContent =
        config.titulo_inicio || "Explore o mundo microscópico.";
    }

    if (viewCorPrincipal) {
      viewCorPrincipal.textContent =
        config.cor_principal || "var(--cor-principal)";
    }

    if (viewCorFundo) {
      viewCorFundo.textContent = config.cor_fundo || "#f5f7f6";
    }

    if (viewLogo) {
      viewLogo.textContent = config.logo_url ? "Logo definida" : "Sem logo";
    }
  } catch (erro) {
    console.error("Erro ao carregar configurações:", erro);

    if (status) {
      status.textContent = "Não foi possível carregar as configurações.";
      status.className = "form-status error";
    }
  }
}

export function setupAdmin() {
  /*
   * Categorias
   */

  document
    .querySelector("#nova-categoria")
    ?.addEventListener("click", () => abrirFormularioCategoria());

  document
    .querySelector("#cancelar-categoria")
    ?.addEventListener("click", fecharFormularioCategoria);

  document
    .querySelector("#categoria-form")
    ?.addEventListener("submit", salvarCategoria);

  carregarCategoriasAdmin();

  carregarConfiguracoesAdmin();

  const search = document.querySelector("#admin-search");

  const statusFilter = document.querySelector("#admin-status-filter");

  const cards = () => [...document.querySelectorAll(".admin-lamina-card")];

  function filtrar() {
    const texto = (search?.value || "").trim().toLowerCase();

    const status = statusFilter?.value || "todas";

    cards().forEach((card) => {
      const nome = card.dataset.nome || "";

      const categoria = card.dataset.categoria || "";

      const publicada = card.dataset.publicado === "true";

      const textoOK =
        !texto || nome.includes(texto) || categoria.includes(texto);

      const statusOK =
        status === "todas" ||
        (status === "publicadas" && publicada) ||
        (status === "ocultas" && !publicada);

      card.style.display = textoOK && statusOK ? "" : "none";
    });
  }

  search?.addEventListener("input", filtrar);

  statusFilter?.addEventListener("change", filtrar);

  /*
   * Aparência
   */

  setupAparencia();

  /*
   * Navegação entre seções
   */

  document.querySelectorAll(".admin-menu").forEach((menu) => {
    menu.addEventListener("click", () => {
      const section = menu.dataset.section;

      document.querySelectorAll(".admin-menu").forEach((item) => {
        item.classList.remove("active");
      });

      document.querySelectorAll(".admin-section").forEach((item) => {
        item.classList.remove("active");
      });

      menu.classList.add("active");

      document
        .querySelector(`#admin-section-${section}`)
        ?.classList.add("active");
    });
  });

  /*
   * Publicar / ocultar
   */

  document.querySelectorAll('[data-action="toggle"]').forEach((button) => {
    button.addEventListener("click", () => {
      togglePublicacao(button.dataset.id);
    });
  });

  /*
   * Excluir
   */

  document.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener("click", () => {
      excluirLamina(button.dataset.id);
    });
  });

  /*
   * Editar
   */

  document.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener("click", () => {
      editarLamina(button.dataset.id);
    });
  });

  /*
   * Logout
   */

  document
    .querySelector("#logout-admin")
    ?.addEventListener("click", async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao sair:", error);

        alert("Não foi possível sair da conta.");

        return;
      }

      window.location.hash = "#login";
    });
}

async function togglePublicacao(id) {
  const { data: lamina, error: buscarErro } = await supabase
    .from("laminas")
    .select("publicado")
    .eq("id", id)
    .single();

  if (buscarErro || !lamina) {
    alert("Não foi possível localizar a lâmina.");

    return;
  }

  const novoEstado = lamina.publicado !== true;

  const { error } = await supabase
    .from("laminas")
    .update({
      publicado: novoEstado,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(error);

    alert("Erro ao alterar a publicação da lâmina.");

    return;
  }

  window.dispatchEvent(new Event("hashchange"));
}

/*
 * FASE 21 — Coleta os caminhos no Storage pertencentes EXCLUSIVAMENTE
 * à lâmina informada, antes da exclusão.
 *
 * Fontes: laminas.imagem_url (modelo antigo/fallback) e
 * lamina_imagens.imagem_url (modelo atual), sempre filtrados pelo id.
 *
 * Proteção contra compartilhamento: uma URL também referenciada por
 * OUTRA lâmina (em qualquer uma das duas tabelas) NUNCA é removida —
 * evita apagar arquivo usado por outra lâmina.
 */
async function coletarCaminhosDaLamina(id) {
  const urls = new Set();

  const { data: lamina } = await supabase
    .from("laminas")
    .select("imagem_url")
    .eq("id", id)
    .maybeSingle();

  if (lamina?.imagem_url) {
    urls.add(lamina.imagem_url);
  }

  const { data: imagens } = await supabase
    .from("lamina_imagens")
    .select("imagem_url")
    .eq("lamina_id", id);

  (imagens || []).forEach((imagem) => {
    if (imagem.imagem_url) urls.add(imagem.imagem_url);
  });

  if (!urls.size) return [];

  const protegidas = new Set();

  const { data: imagensOutras } = await supabase
    .from("lamina_imagens")
    .select("imagem_url")
    .neq("lamina_id", id);

  (imagensOutras || []).forEach((imagem) => {
    if (imagem.imagem_url) protegidas.add(imagem.imagem_url);
  });

  const { data: laminasOutras } = await supabase
    .from("laminas")
    .select("imagem_url")
    .neq("id", id);

  (laminasOutras || []).forEach((l) => {
    if (l.imagem_url) protegidas.add(l.imagem_url);
  });

  return [...urls]
    .filter((url) => !protegidas.has(url))
    .map(extrairCaminhoArmazenamento)
    .filter(Boolean);
}

async function excluirLamina(id) {
  const confirmar = confirm(
    "Tem certeza que deseja excluir esta lâmina? Esta ação não pode ser desfeita.",
  );

  if (!confirmar) return;

  /*
   * FASE 21 — Remove os arquivos do Storage ANTES do DELETE no banco,
   * usando a Storage API oficial (nunca SQL sobre storage.objects).
   * Falha de remoção é registrada e NÃO bloqueia a exclusão:
   * degrada para o comportamento anterior (arquivo órfão possível),
   * nunca deixando a lâmina em estado inconsistente.
   */
  try {
    const caminhos = await coletarCaminhosDaLamina(id);

    if (caminhos.length) {
      const { error: erroStorage } = await supabase.storage
        .from("laminas")
        .remove(caminhos);

      if (erroStorage) {
        console.error(
          "[ATLAS] Falha ao remover arquivos do Storage:",
          erroStorage,
        );
      }
    }
  } catch (erroColeta) {
    console.error("[ATLAS] Falha ao coletar caminhos do Storage:", erroColeta);
  }

  const { error } = await supabase.from("laminas").delete().eq("id", id);

  if (error) {
    console.error(error);

    alert("Erro ao excluir a lâmina.");

    return;
  }

  alert("Lâmina excluída com sucesso.");

  window.dispatchEvent(new Event("hashchange"));
}

function editarLamina(id) {
  window.location.hash = `#nova-lamina?editar=${id}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}
