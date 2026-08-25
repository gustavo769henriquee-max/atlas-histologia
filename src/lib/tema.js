/*
 * SISTEMA DE TOKENS DA APARÊNCIA — fonte única da verdade.
 *
 * Usado PELO SITE REAL (main.js) e PELA PRÉVIA AO VIVO do painel
 * Aparência (pages/aparencia.js). Assim a prévia consome exatamente
 * os mesmos tokens que o site: mudou na prévia → muda no site.
 *
 * Estratégia de fallback:
 * - Cada chave tem um default DERIVADO das cores base (calculado aqui
 *   em JS e espelhado por color-mix() no :root do style.css);
 * - Se o objeto `tema` não existir no banco (migration pendente), o
 *   site continua funcionando inteiro com os defaults;
 * - Valores inválidos são descartados antes de virarem CSS.
 */
// == DOCUMENTAÇÃO INTERNA: DEFAULTS ---------------------------------------------------
// Cada chave tem um default derivado que representa a configuração original
// antes de qualquer personalização.
const DEFAULTS = {
  cor_principal: "#8a2b3d",
  cor_secundaria: "#2e3a45",
  cor_acento: "#c9404f",
  cor_fundo: "#f6f3f1",
  cor_texto: "#211b1d",
};
// == END DOCUMENTAÇÃO -------------------------------------------------------------

export const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/* Cores base — espelham os defaults do :root em style.css */
const BASES = {
  cor_principal: "#8a2b3d",
  cor_secundaria: "#2e3a45",
  cor_acento: "#c9404f",
  cor_fundo: "#f6f3f1",
  cor_texto: "#211b1d",
};

export const SUPERFICIE_ESCURA = "#191d21";

/* ------------------------------------------------------------------
 * Utilitários de cor
 * ------------------------------------------------------------------ */

function normalizarHex(valor) {
  const hex = String(valor || "").trim().replace("#", "");

  if (hex.length === 3) {
    return hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  return hex.length === 6 ? hex : null;
}

export function corValida(valor) {
  return typeof valor === "string" && HEX_RE.test(valor.trim());
}

function canais(hex) {
  const h = normalizarHex(hex);

  if (!h) return null;

  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function paraHex({ r, g, b }) {
  const p = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");

  return `#${p(r)}${p(g)}${p(b)}`;
}

/* Mistura linear em sRGB — equivale a color-mix(in srgb, A x%, B). */
export function mixHex(corA, corB, pctA) {
  const a = canais(corA);
  const b = canais(corB);

  if (!a || !b) return corB;

  const t = Math.max(0, Math.min(1, Number(pctA) || 0));

  return paraHex({
    r: a.r * t + b.r * (1 - t),
    g: a.g * t + b.g * (1 - t),
    b: a.b * t + b.b * (1 - t),
  });
}


/* rgba(...) a partir de um hex — para tokens derivados translúcidos. */
export function rgbaDe(hex, alpha) {
  const c = canais(hex);

  if (!c) return hex;

  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

/* Contraste WCAG simplificado (para avisos no painel). */
export function luminanciaRelativa(hex) {
  const c = canais(hex);

  if (!c) return 0;

  const canal = (v) => {
    const s = v / 255;

    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * canal(c.r) + 0.7152 * canal(c.g) + 0.0722 * canal(c.b);
}

export function razaoContraste(hexA, hexB) {
  const la = luminanciaRelativa(hexA);
  const lb = luminanciaRelativa(hexB);

  const claro = Math.max(la, lb);
  const escuro = Math.min(la, lb);

  if (claro + 0.05 === 0) return 21;

  return (claro + 0.05) / (escuro + 0.05);
}

/* Texto branco/escuro automático sobre uma cor qualquer. */
export function textoContrasteAuto(hex) {
  return luminanciaRelativa(hex) > 0.55 ? "#1d1418" : "#ffffff";
}

/* Sanitiza valores não-cor vindos dos campos (fonte/tamanhos/peso). */
const SEGURO_RE = /^[a-zA-Z0-9\s.,%'"()-]+$/;

function valorSeguro(valor) {
  const v = String(valor || "").trim();

  return v && SEGURO_RE.test(v) ? v : "";
}

/* ------------------------------------------------------------------
 * MAPA OFICIAL chave do tema → token CSS
 * ------------------------------------------------------------------ */

export const MAPA_TOKENS = [
  /* Bases */
  { chave: "cor_principal", token: "--cor-principal" },
  { chave: "cor_secundaria", token: "--cor-secundaria" },
  { chave: "cor_acento", token: "--cor-acento" },
  { chave: "cor_fundo", token: "--cor-fundo" },
  { chave: "cor_texto", token: "--cor-texto" },

  /* Cores gerais */
  { chave: "superficie", token: "--cor-superficie" },
  { chave: "texto_secundario", token: "--cor-texto-suave" },
  { chave: "texto_terciario", token: "--cor-texto-terciario" },
  { chave: "borda", token: "--cor-borda" },
  { chave: "borda_forte", token: "--cor-borda-forte" },
  { chave: "hover", token: "--cor-hover" },
  { chave: "foco", token: "--cor-foco" },
  { chave: "link", token: "--cor-link" },
  { chave: "link_hover", token: "--cor-link-hover" },

  /* Header / menu */
  { chave: "header_fundo", token: "--header-fundo" },
  { chave: "header_borda", token: "--header-borda" },
  { chave: "header_icone", token: "--header-icone" },
  { chave: "menu_texto", token: "--menu-texto" },
  { chave: "menu_texto_ativo", token: "--menu-texto-ativo" },
  { chave: "menu_hover", token: "--menu-hover" },
  { chave: "menu_indicador", token: "--menu-indicador" },

  /* Hero */
  { chave: "hero_fundo", token: "--hero-fundo" },
  { chave: "hero_titulo", token: "--hero-titulo" },
  { chave: "hero_subtitulo", token: "--hero-subtitulo" },
  { chave: "hero_texto", token: "--hero-texto" },
  { chave: "hero_botao_fundo", token: "--hero-botao-fundo" },
  { chave: "hero_botao_hover", token: "--hero-botao-hover" },
  { chave: "hero_decorativo", token: "--hero-decorativo" },
  { chave: "hero_microscopio", token: "--hero-microscopio" },

  /* Cards Explore / Amplie / Aprenda */
  { chave: "card_fundo", token: "--card-fundo" },
  { chave: "card_titulo", token: "--card-titulo" },
  { chave: "card_texto", token: "--card-texto" },
  { chave: "card_icone", token: "--card-icone" },
  { chave: "card_borda", token: "--card-borda" },
  { chave: "card_hover", token: "--card-hover" },

  /* Catálogo */
  { chave: "catalogo_fundo", token: "--catalogo-fundo" },
  { chave: "catalogo_card_fundo", token: "--catalogo-card-fundo" },
  { chave: "catalogo_titulo", token: "--catalogo-titulo" },
  { chave: "catalogo_texto", token: "--catalogo-texto" },
  { chave: "catalogo_texto_suave", token: "--catalogo-texto-suave" },
  { chave: "catalogo_borda", token: "--catalogo-borda" },
  { chave: "catalogo_categoria", token: "--catalogo-categoria" },
  { chave: "catalogo_botao", token: "--catalogo-botao" },

  /* Página da lâmina */
  { chave: "lamina_fundo", token: "--lamina-fundo" },
  { chave: "lamina_painel_fundo", token: "--lamina-painel-fundo" },
  { chave: "lamina_moldura", token: "--lamina-moldura" },
  { chave: "lamina_indicador", token: "--lamina-indicador" },

  /* Visualizador / OpenSeadragon */
  { chave: "viewer_fundo", token: "--viewer-fundo" },
  { chave: "viewer_icone", token: "--viewer-texto" },
  { chave: "viewer_hover", token: "--viewer-hover" },
  { chave: "viewer_borda", token: "--viewer-borda" },

  /* Vídeo */
  { chave: "video_fundo", token: "--video-fundo" },
  { chave: "video_titulo", token: "--video-titulo" },
  { chave: "video_borda", token: "--video-borda" },

  /* Rodapé */
  { chave: "rodape_fundo", token: "--rodape-fundo" },
  { chave: "rodape_titulo", token: "--rodape-titulo" },
  { chave: "rodape_texto", token: "--rodape-texto" },
  { chave: "rodape_link", token: "--rodape-link" },
  { chave: "rodape_link_hover", token: "--rodape-link-hover" },
  { chave: "rodape_icone", token: "--rodape-icone" },
  { chave: "rodape_borda", token: "--rodape-borda" },
  { chave: "rodape_creditos", token: "--rodape-creditos" },

  /* Administração */
  { chave: "admin_fundo", token: "--admin-bg" },
  { chave: "admin_superficie", token: "--admin-surface" },
  { chave: "admin_texto", token: "--admin-text" },
  { chave: "admin_texto_suave", token: "--admin-text-soft" },
  { chave: "admin_borda", token: "--admin-border" },
  { chave: "admin_destaque", token: "--admin-accent" },
  { chave: "admin_sidebar", token: "--admin-sidebar" },
  { chave: "admin_item_ativo", token: "--admin-item-ativo" },
  { chave: "admin_hover", token: "--admin-hover" },

  /* Formulários e inputs */
  { chave: "input_fundo", token: "--input-fundo" },
  { chave: "input_texto", token: "--input-texto" },
  { chave: "input_placeholder", token: "--input-placeholder" },
  { chave: "input_borda", token: "--input-borda" },
  { chave: "input_foco", token: "--input-foco" },
  { chave: "input_label", token: "--input-label" },
  { chave: "input_ajuda", token: "--input-ajuda" },

  /* Botões */
  { chave: "botao_primario_fundo", token: "--botao-primario-fundo" },
  { chave: "botao_primario_texto", token: "--botao-primario-texto" },
  { chave: "botao_primario_hover", token: "--botao-primario-hover" },
  { chave: "botao_perigo", token: "--botao-perigo-fundo" },

  /* Estados semânticos */
  { chave: "sucesso", token: "--cor-sucesso" },
  { chave: "alerta", token: "--cor-alerta" },
  { chave: "erro", token: "--cor-erro" },
  { chave: "informacao", token: "--cor-info" },

  /* Tipografia (valores não-cor) */
  { chave: "fonte", token: "--fonte-principal" },
  { chave: "peso_titulos", token: "--peso-titulos" },
  { chave: "tamanho_titulo", token: "--tamanho-titulo" },
  { chave: "tamanho_texto", token: "--tamanho-texto" },

  /* Aliases legados — mantêm regras antigas no novo sistema */
  { chave: "_green", token: "--green" },
  { chave: "_green_light", token: "--green-light" },
  { chave: "_mint", token: "--mint" },
  { chave: "_cream", token: "--cream" },
  { chave: "_white", token: "--white" },
  { chave: "_text", token: "--text" },
  { chave: "_muted", token: "--muted" },
  { chave: "_border", token: "--border" },
];

/* ------------------------------------------------------------------
 * RESOLUÇÃO — calcula o valor EFETIVO de todos os tokens,
 * incluindo os derivados das cores base (fallback coerente).
 * ------------------------------------------------------------------ */

export function temaEfetivo(bruto = {}) {
  const pegarCor = (chave, padrao) =>
    corValida(bruto[chave]) ? bruto[chave].trim() : padrao;

  return {
    /* Bases */
    cor_principal: pegarCor("cor_principal", "#8a2b3d"),
    cor_secundaria: pegarCor("cor_secundaria", "#2e3a45"),
    cor_acento: pegarCor("cor_acento", "#c9404f"),
    cor_fundo: pegarCor("cor_fundo", "#f6f3f1"),
    cor_texto: pegarCor("cor_texto", "#211b1d"),

    /* Cores gerais */
    superficie: pegarCor("superficie", "#ffffff"),
    texto_secundario: pegarCor("texto_secundario", "#6f6267"),
    texto_terciario: pegarCor("texto_terciario", "#b9b2b3"),
    borda: pegarCor("borda", "#e4dcd8"),
    borda_forte: pegarCor("borda_forte", "#4c4546"),
    hover: pegarCor("hover", "#eee5e4"),
    foco: bruto.foco && corValida(bruto.foco) ? bruto.foco.trim() : "rgba(138, 43, 61, 0.32)",
    link: pegarCor("link", "#8a2b3d"),
    link_hover: pegarCor("link_hover", "#c9404f"),

    /* Header / menu */
    header_fundo: pegarCor("header_fundo", "#fefdfd"),
    header_borda: pegarCor("header_borda", "#e4dcd8"),
    header_icone: pegarCor("header_icone", "#8a2b3d"),
    menu_texto: pegarCor("menu_texto", "#6f6267"),
    menu_texto_ativo: pegarCor("menu_texto_ativo", "#8a2b3d"),
    menu_hover: pegarCor("menu_hover", "#8a2b3d"),
    menu_indicador: pegarCor("menu_indicador", "#c9404f"),

    /* Hero */
    hero_fundo: pegarCor("hero_fundo", "#f6f3f1"),
    hero_titulo: pegarCor("hero_titulo", "#211b1d"),
    hero_subtitulo: pegarCor("hero_subtitulo", "#8a2b3d"),
    hero_texto: pegarCor("hero_texto", "#6f6267"),
    hero_botao_fundo: pegarCor("hero_botao_fundo", "#8a2b3d"),
    hero_botao_hover: pegarCor("hero_botao_hover", "#772534"),
    hero_decorativo: pegarCor("hero_decorativo", "#c9404f"),
    hero_microscopio: pegarCor("hero_microscopio", "#8a2b3d"),

    /* Cards Explore / Amplie / Aprenda */
    card_fundo: pegarCor("card_fundo", "#f8f6f4"),
    card_titulo: pegarCor("card_titulo", "#211b1d"),
    card_texto: pegarCor("card_texto", "#6f6267"),
    card_icone: pegarCor("card_icone", "#8a2b3d"),
    card_borda: pegarCor("card_borda", "#e4dcd8"),
    card_hover: pegarCor("card_hover", "#cbaaad"),

    /* Catálogo */
    catalogo_fundo: pegarCor("catalogo_fundo", "#f6f3f1"),
    catalogo_card_fundo: pegarCor("catalogo_card_fundo", "#f7f4f3"),
    catalogo_titulo: pegarCor("catalogo_titulo", "#211b1d"),
    catalogo_texto: pegarCor("catalogo_texto", "#211b1d"),
    catalogo_texto_suave: pegarCor("catalogo_texto_suave", "#6f6267"),
    catalogo_borda: pegarCor("catalogo_borda", "#e4dcd8"),
    catalogo_categoria: pegarCor("catalogo_categoria", "#f2d1d5"),
    catalogo_botao: pegarCor("catalogo_botao", "#8a2b3d"),

    /* Página da lâmina */
    lamina_fundo: pegarCor("lamina_fundo", "#f6f3f1"),
    lamina_painel_fundo: pegarCor("lamina_painel_fundo", "#f7f4f2"),
    lamina_moldura: pegarCor("lamina_moldura", "#f2d1d5"),
    lamina_indicador: pegarCor("lamina_indicador", "#c9404f"),

    /* Visualizador / OpenSeadragon */
    viewer_fundo: pegarCor("viewer_fundo", "#281b21"),
    viewer_icone: pegarCor("viewer_icone", "#f3f0ef"),
    viewer_hover: pegarCor("viewer_hover", "#f4d9dc"),
    viewer_borda:
      bruto.viewer_borda && corValida(bruto.viewer_borda)
        ? bruto.viewer_borda.trim()
        : "rgba(255, 255, 255, 0.14)",

    /* Vídeo */
    video_fundo:
      bruto.video_fundo && corValida(bruto.video_fundo)
        ? bruto.video_fundo.trim()
        : "transparent",
    video_titulo: pegarCor("video_titulo", "#211b1d"),
    video_borda: pegarCor("video_borda", "#e4dcd8"),

    /* Rodapé */
    rodape_fundo: pegarCor("rodape_fundo", "#191d21"),
    rodape_titulo: pegarCor("rodape_titulo", "#f3f0ef"),
    rodape_texto:
      bruto.rodape_texto && corValida(bruto.rodape_texto)
        ? bruto.rodape_texto.trim()
        : "rgba(255, 255, 255, 0.72)",
    rodape_link: pegarCor("rodape_link", "#ffffff"),
    rodape_link_hover: pegarCor("rodape_link_hover", "#e7a9b0"),
    rodape_icone: pegarCor("rodape_icone", "#c9404f"),
    rodape_borda:
      bruto.rodape_borda && corValida(bruto.rodape_borda)
        ? bruto.rodape_borda.trim()
        : "rgba(255, 255, 255, 0.14)",
    rodape_creditos:
      bruto.rodape_creditos && corValida(bruto.rodape_creditos)
        ? bruto.rodape_creditos.trim()
        : "rgba(255, 255, 255, 0.5)",

    /* Administração */
    admin_fundo: pegarCor("admin_fundo", "#f6f3f1"),
    admin_superficie: pegarCor("admin_superficie", "#ffffff"),
    admin_texto: pegarCor("admin_texto", "#211b1d"),
    admin_texto_suave: pegarCor("admin_texto_suave", "#6f6267"),
    admin_borda: pegarCor("admin_borda", "#e4dcd8"),
    admin_destaque: pegarCor("admin_destaque", "#c9404f"),
    admin_sidebar: pegarCor("admin_sidebar", "#25181d"),
    admin_item_ativo: pegarCor("admin_item_ativo", "#c9404f"),
    admin_hover:
      bruto.admin_hover && corValida(bruto.admin_hover)
        ? bruto.admin_hover.trim()
        : "rgba(255, 255, 255, 0.055)",

    /* Formulários e inputs */
    input_fundo: pegarCor("input_fundo", "#ffffff"),
    input_texto: pegarCor("input_texto", "#211b1d"),
    input_placeholder: pegarCor("input_placeholder", "#cec8c8"),
    input_borda: pegarCor("input_borda", "#e4dcd8"),
    input_foco: pegarCor("input_foco", "#8a2b3d"),
    input_label: pegarCor("input_label", "#211b1d"),
    input_ajuda: pegarCor("input_ajuda", "#6f6267"),

    /* Botões */
    botao_primario_fundo: pegarCor("botao_primario_fundo", "#8a2b3d"),
    botao_primario_texto: pegarCor("botao_primario_texto", "#ffffff"),
    botao_primario_hover: pegarCor("botao_primario_hover", "#772534"),
    botao_perigo: pegarCor("botao_perigo", "#b63b3b"),

    /* Estados semânticos (verde = sucesso, nunca identidade) */
    sucesso: pegarCor("sucesso", "#2e7d52"),
    alerta: pegarCor("alerta", "#a06a1c"),
    erro: pegarCor("erro", "#b23f3e"),
    informacao: pegarCor("informacao", "#2f6fa3"),

    /* Derivado: texto sobre fundos coloridos (contraste automático) */
    _texto_claro: "#ffffff",

    /* Aliases legados — seguem suas cores base (não derivam) */
    _green: pegarCor("cor_principal", "#8a2b3d"),
    _green_light: pegarCor("_green_light", "#d66e79"),
    _mint: pegarCor("_mint", "#ece1e1"),
    _cream: pegarCor("cor_fundo", "#f6f3f1"),
    _white: pegarCor("_white", "#ffffff"),
    _text: pegarCor("cor_texto", "#211b1d"),
    _muted: pegarCor("texto_secundario", "#6f6267"),
    _border: pegarCor("borda", "#e4dcd8"),

    /* Tipografia */
    fonte: valorSeguro(bruto.fonte),
    peso_titulos: valorSeguro(bruto.peso_titulos),
    tamanho_titulo: valorSeguro(bruto.tamanho_titulo),
    tamanho_texto: valorSeguro(bruto.tamanho_texto),
  };
}

/* ------------------------------------------------------------------
 * APLICAÇÃO — grava os custom properties num elemento
 * (documentElement no site real; #aparencia-preview na prévia).
 * ------------------------------------------------------------------ */

export function aplicarTema(alvo, efetivo) {
  if (!alvo || !efetivo) return;

  for (const { chave, token } of MAPA_TOKENS) {
    const valor = efetivo[chave];

    if (valor === undefined || valor === null || valor === "") {
      alvo.style.removeProperty(token);
      continue;
    }

    alvo.style.setProperty(token, String(valor));
  }

  /* Texto sobre fundos coloridos — contraste automático */
  if (efetivo._texto_claro) {
    alvo.style.setProperty("--cor-texto-claro", efetivo._texto_claro);
  }
}

/*
 * Prepara o objeto `tema` para salvar: remove chaves cujo valor é
 * igual ao default derivado atual. Campos deixados no padrão continuam
 * acompanhando as cores base dinamicamente (ex.: links seguem a cor
 * principal mesmo depois dela mudar).
 */
export function temaParaSalvar(coletado = {}, efetivoAtual) {
  const efetivo = efetivoAtual || temaEfetivo(coletado);

  const resultado = {};

  for (const [chave, valor] of Object.entries(coletado)) {
    if (valor === "" || valor === undefined || valor === null) continue;

    if (chave.startsWith("_")) continue;

    if (String(efetivo[chave] ?? "") === String(valor)) continue;

    resultado[chave] = valor;
  }

  return resultado;
}

