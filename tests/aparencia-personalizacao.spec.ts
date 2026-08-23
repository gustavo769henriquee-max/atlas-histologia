import { test, expect } from "@playwright/test";
import {
  attachErrorCapture,
  assertNoAppErrors,
  createErrorLog,
  waitForEstruturas,
  waitForViewer,
} from "./helpers";

/*
 * Regression: personalização visual (Fase 17).
 *
 * A aplicação expõe uma única chamada pública anônina que carrega as
 * configurações visuais (carregarConfiguracoesSite -> GET
 * /rest/v1/configuracoes_site). Como não há credenciais de admin no
 * ambiente, simulamos a "configuração salva no Supabase" interceptando
 * essa chamada no layer de rede (page.route) e injetando valores
 * controlados. Não altera o código da aplicação nem requer login.
 *
 * O objetivo: provar que as cores salvas chegam aos elementos que ficavam
 * verdes (literal hardcoded) — header, navegação, botões, links, cards,
 * eyebrow, categoria/tag, visualizador (badges + label) — e que A e B
 * se aplicam após reload.
 */

const LAMINA_COM_ESTRUTURAS = "d43b72aa-3a0a-4ab7-a9dd-d3ef6cffb1ef";

interface CorCfg {
  cor_principal: string;
  cor_fundo: string;
  cor_texto: string;
  cor_destaque: string;
}

const TEXTO_BASE = {
  id: "62ed8ae1-ad25-45c2-9d5c-ef011bd17fa1",
  nome_site: "Atlas Histológico",
  subtitulo: "Guia Prático de Histologia Animal",
  titulo_inicio: "Explore a Microestrutura do Mundo Animal",
  descricao_inicio: "Um atlas interativo de histologia.",
  texto_botao_principal: "Explorar Lâminas",
  texto_botao_secundario: "Sobre o Atlas",
  texto_sobre: "Atlas de histologia.",
  texto_rodape: "© 2026 Atlas",
};

const CONFIG_A: CorCfg = {
  cor_principal: "#ff0000", // vermelho (fora do verde)
  cor_fundo: "#eeeeee",
  cor_texto: "#111111",
  cor_destaque: "#8000ff", // roxo (acento)
};
const CONFIG_B: CorCfg = {
  cor_principal: "#0066ff", // azul
  cor_fundo: "#eeeeee",
  cor_texto: "#111111",
  cor_destaque: "#ff6600", // laranja (acento)
};

const PRIM_A = "rgb(255, 0, 0)";
const ACC_A = "rgb(128, 0, 255)";
const PRIM_B = "rgb(0, 102, 255)";
const ACC_B = "rgb(255, 102, 0)";

const GREEN_LITERAL = [
  "rgb(30, 111, 92)", // #1e6f5c  (ex-botao / eyebrow / contador / editor)
  "rgb(25, 72, 60)", // #174c3c  (numero badge)
  "rgb(45, 117, 93)", // #2d755d (label inline)
];

function mockConfig(page: import("@playwright/test").Page, c: CorCfg) {
  const body = JSON.stringify([
    { ...TEXTO_BASE, ...c, logo_url: null, logo_tamanho: 100 },
  ]);
  return page.route(
    /\/rest\/v1\/configuracoes_site/,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": "0-0/1" },
        body,
      }),
  );
}

async function assertNotGreen(
  actual: string | null,
  where: string,
): Promise<void> {
  expect(actual, `${where} ficou verde hardcoded`).not.toBeNull();
  expect(GREEN_LITERAL, `${where} = ${actual} (verde literal)`).not.toContain(
    actual as string,
  );
}

test.describe("Personalização visual (cores salvadas -> DOM)", () => {
  test("config A (vermelho primária / roxo acento) reflete no site após reload", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await mockConfig(page, CONFIG_A);

    await page.goto("/");
    await page.waitForSelector("header.header", { state: "visible" });
    await page.waitForSelector(".hero", { state: "visible" });
    await page.waitForSelector(".footer", { state: "visible" });
    await expect(page.locator(".button.primary").first()).toBeVisible();

    // header / brand / footer = cor_principal (vermelho)
    await expect(page.locator(".brand-icon").first()).toHaveCSS(
      "background-color",
      PRIM_A,
    );
    await expect(page.locator(".button.primary").first()).toHaveCSS(
      "background-color",
      PRIM_A,
    );
    await expect(page.locator(".footer")).toHaveCSS(
      "background-color",
      PRIM_A,
    );

    // navegação hover = cor_principal
    const navLink = page.locator('.header a[href="#laminas"]').first();
    await navLink.hover();
    await expect(navLink).toHaveCSS("color", PRIM_A);

    // catálogo: botão de Explorar (antes #1e6f5c verde) e eyebrow (antes #1e6f5c verde via admin.css)
    await page.goto("/#laminas");
    await page.waitForSelector("#catalog-grid", { state: "visible" });
    await expect(page.locator(".lamina-card").first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator(".explore-button").first()).toBeVisible();

    const exploreBg = await page
      .locator(".explore-button")
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    await assertNotGreen(exploreBg, ".explore-button");
    await expect(page.locator(".explore-button").first()).toHaveCSS(
      "background-color",
      PRIM_A,
    );

    const eyebrowColor = await page
      .locator(".eyebrow")
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    await assertNotGreen(eyebrowColor, ".eyebrow");
    await expect(page.locator(".eyebrow").first()).toHaveCSS("color", ACC_A);

    await expect(page.locator(".card-link").first()).toHaveCSS(
      "color",
      ACC_A,
    );
    await expect(page.locator(".lamina-category").first()).toHaveCSS(
      "color",
      ACC_A,
    );

    assertNoAppErrors(log);
  });

  test("config B (azul primária / laranja acento) altera os mesmos elementos após reload", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await mockConfig(page, CONFIG_B);

    await page.goto("/");
    await page.waitForSelector("header.header", { state: "visible" });
    await expect(page.locator(".brand-icon").first()).toHaveCSS(
      "background-color",
      PRIM_B,
    );
    await expect(page.locator(".button.primary").first()).toHaveCSS(
      "background-color",
      PRIM_B,
    );

    await page.goto("/#laminas");
    await page.waitForSelector("#catalog-grid", { state: "visible" });
    await expect(page.locator(".explore-button").first()).toBeVisible();

    await expect(page.locator(".explore-button").first()).toHaveCSS(
      "background-color",
      PRIM_B,
    );
    await expect(page.locator(".eyebrow").first()).toHaveCSS("color", ACC_B);
    await expect(page.locator(".card-link").first()).toHaveCSS("color", ACC_B);
    await expect(page.locator(".lamina-category").first()).toHaveCSS(
      "color",
      ACC_B,
    );

    assertNoAppErrors(log);
  });

  test("visualizador: badges e label 'ESTRUTURA SELECIONADA' seguem a personalização", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await mockConfig(page, CONFIG_A);

    await page.goto(`/#lamina/${LAMINA_COM_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    // abrir o painel de estudo pela sidebar
    await page.locator(".structure[data-estrutura-index='0']").click();
    await page.waitForTimeout(200);
    await expect(page.locator("#estrutura-estudo-contador")).toHaveText(
      /1 de 3/,
    );

    // badge da estrutura selecionada (índice 0, clicada acima) tem cor
    // semântica fixa (#e05252 vermelho de seleção) — preservada intencionalmente
    await expect(page.locator(".estrutura-numero-badge").first()).toHaveCSS(
      "background-color",
      "rgb(224, 82, 82)",
    );

    // badge NÃO selecionada = var(--green) = cor_principal (antes #174c3c verde)
    const badgeBg = await page
      .locator(".estrutura-numero-badge")
      .last()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    await assertNotGreen(badgeBg, ".estrutura-numero-badge (não selecionado)");
    await expect(page.locator(".estrutura-numero-badge").last()).toHaveCSS(
      "background-color",
      PRIM_A,
    );

    const contadorColor = await page
      .locator("#estrutura-estudo-contador")
      .evaluate((el) => getComputedStyle(el).color);
    await assertNotGreen(contadorColor, "#estrutura-estudo-contador");
    await expect(page.locator("#estrutura-estudo-contador")).toHaveCSS(
      "color",
      PRIM_A,
    );

    const label = page
      .locator("span")
      .filter({ hasText: "ESTRUTURA SELECIONADA" })
      .first();
    const labelColor = await label.evaluate((el) => getComputedStyle(el).color);
    await assertNotGreen(labelColor, "label ESTRUTURA SELECIONADA");
    await expect(label).toHaveCSS("color", ACC_A);

    assertNoAppErrors(log);
  });
});
