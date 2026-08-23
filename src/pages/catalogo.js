import { supabase } from "../lib/supabase.js";

const app = document.querySelector("#app");

let todasLaminas = [];

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
          <a href="#admin">Administração</a>
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


            <select id="filter-tecnica">

              <option value="">
                Todas as técnicas
              </option>

            </select>


            <select id="filter-coloracao">

              <option value="">
                Todas as colorações
              </option>

            </select>


            <button
              id="limpar-filtros"
              type="button"
              class="button secondary"
            >
              Limpar filtros
            </button>

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
  `;

  await carregarLaminas();

  configurarFiltros();
}

async function carregarLaminas() {
  const status = document.querySelector("#catalog-status");

  const grid = document.querySelector("#catalog-grid");

  if (!status || !grid) return;

  const { data, error } = await supabase
    .from("laminas")
    .select("*")
    .eq("publicado", true)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Erro ao carregar lâminas:", error);

    status.textContent = "Não foi possível carregar as lâminas.";

    return;
  }

  todasLaminas = data || [];

  preencherFiltros();

  renderCards(todasLaminas);
}

/*
 * Preenche os três filtros com valores derivados
 * dos dados reais já carregados (sem novas consultas).
 *
 * Categoria: lâminas antigas têm apenas o texto;
 * novas têm categoria_id — a chave usada é
 * categoria_id || categoria, cobrindo ambos.
 */

function preencherFiltros() {
  const selectCategoria = document.querySelector("#filter-categoria");

  const selectTecnica = document.querySelector("#filter-tecnica");

  const selectColoracao = document.querySelector("#filter-coloracao");

  if (!selectCategoria || !selectTecnica || !selectColoracao) {
    return;
  }

  const categorias = new Map();

  const tecnicas = new Set();

  const coloracoes = new Set();

  todasLaminas.forEach((lamina) => {
    const chaveCategoria = lamina.categoria_id || lamina.categoria;

    if (chaveCategoria && !categorias.has(chaveCategoria)) {
      categorias.set(chaveCategoria, lamina.categoria || chaveCategoria);
    }

    const tecnica = String(lamina.tecnica || "").trim();

    if (tecnica) {
      tecnicas.add(tecnica);
    }

    const coloracao = String(lamina.coloracao || "").trim();

    if (coloracao) {
      coloracoes.add(coloracao);
    }
  });

  selectCategoria.innerHTML = `
    <option value="">
      Todas as categorias
    </option>

    ${[...categorias.entries()]
      .map(
        ([valor, nome]) => `
      <option value="${escapeHtml(valor)}">
        ${escapeHtml(nome)}
      </option>
    `,
      )
      .join("")}
  `;

  selectTecnica.innerHTML = `
    <option value="">
      Todas as técnicas
    </option>

    ${[...tecnicas]
      .sort()
      .map(
        (valor) => `
      <option value="${escapeHtml(valor)}">
        ${escapeHtml(valor)}
      </option>
    `,
      )
      .join("")}
  `;

  selectColoracao.innerHTML = `
    <option value="">
      Todas as colorações
    </option>

    ${[...coloracoes]
      .sort()
      .map(
        (valor) => `
      <option value="${escapeHtml(valor)}">
        ${escapeHtml(valor)}
      </option>
    `,
      )
      .join("")}
  `;
}

function renderCards(laminas) {
  const grid = document.querySelector("#catalog-grid");

  const status = document.querySelector("#catalog-status");

  status.textContent = `${laminas.length} ${
    laminas.length === 1 ? "lâmina encontrada" : "lâminas encontradas"
  }`;

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

    `;

    return;
  }

  grid.innerHTML = laminas
    .map(
      (lamina) => `

      <article class="lamina-card">

        <div class="lamina-image">

          ${
            lamina.imagem_url
              ? `
                <img
                  src="${escapeHtml(lamina.imagem_url)}"
                  alt="${escapeHtml(lamina.nome || "Lâmina histológica")}"
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

            ${escapeHtml(lamina.categoria || "Histologia")}

          </div>


          <h2>

            ${escapeHtml(lamina.nome || "Lâmina sem nome")}

          </h2>


          <p>

            ${escapeHtml(lamina.descricao || "Sem descrição.")}

          </p>


          <div class="lamina-tags">

            ${
              lamina.tecnica
                ? `
                  <span>
                    🔬 ${escapeHtml(lamina.tecnica)}
                  </span>
                `
                : ""
            }


            ${
              lamina.coloracao
                ? `
                  <span>
                    🧫 ${escapeHtml(lamina.coloracao)}
                  </span>
                `
                : ""
            }

            ${
              lamina.aumento
                ? `
                  <span>
                    🔍 Aumento: ${escapeHtml(lamina.aumento)}
                  </span>
                `
                : ""
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

    `,
    )
    .join("");
}

function configurarFiltros() {
  const busca = document.querySelector("#search-laminas");

  const categoria = document.querySelector("#filter-categoria");

  const tecnica = document.querySelector("#filter-tecnica");

  const coloracao = document.querySelector("#filter-coloracao");

  const limpar = document.querySelector("#limpar-filtros");

  function aplicarFiltros() {
    const texto = busca.value.trim().toLowerCase();

    const categoriaSelecionada = categoria.value;

    const tecnicaSelecionada = tecnica.value;

    const coloracaoSelecionada = coloracao.value;

    const resultado = todasLaminas.filter((lamina) => {
      const textoCompleto = `
            ${lamina.nome || ""}
            ${lamina.descricao || ""}
            ${lamina.tecnica || ""}
            ${lamina.coloracao || ""}
            ${lamina.categoria || ""}
          `.toLowerCase();

      const correspondeTexto = !texto || textoCompleto.includes(texto);

      const categoriaDaLamina = lamina.categoria_id || lamina.categoria || "";

      const correspondeCategoria =
        !categoriaSelecionada || categoriaDaLamina === categoriaSelecionada;

      const correspondeTecnica =
        !tecnicaSelecionada ||
        String(lamina.tecnica || "").trim() === tecnicaSelecionada;

      const correspondeColoracao =
        !coloracaoSelecionada ||
        String(lamina.coloracao || "").trim() === coloracaoSelecionada;

      return (
        correspondeTexto &&
        correspondeCategoria &&
        correspondeTecnica &&
        correspondeColoracao
      );
    });

    renderCards(resultado);
  }

  busca.addEventListener("input", aplicarFiltros);

  categoria.addEventListener("change", aplicarFiltros);

  tecnica.addEventListener("change", aplicarFiltros);

  coloracao.addEventListener("change", aplicarFiltros);

  limpar?.addEventListener("click", () => {
    busca.value = "";

    categoria.value = "";

    tecnica.value = "";

    coloracao.value = "";

    aplicarFiltros();
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

