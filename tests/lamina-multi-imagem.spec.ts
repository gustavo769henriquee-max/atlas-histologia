import { test, expect } from "@playwright/test";
import {
  attachErrorCapture,
  assertNoAppErrors,
  createErrorLog,
  structureOverlayCount,
  waitForEstruturas,
  waitForViewer,
  zoomValueNumber,
} from "./helpers";

/*
 * Fase 18 — aumento + múltiplas imagens por lâmina.
 *
 * Sem credenciais de admin, simulamos o "conteúdo salvo no Supabase"
 * interceptando as chamadas de rede (page.route) para GET
 * /rest/v1/laminas e GET /rest/v1/lamina_imagens, injetando uma lâmina
 * controlada (publicada, com estruturas + aumento) e um conjunto
 * controlado de imagens. As URLs de imagem apontam para objetos reais
 * e públicos do Storage, de modo que o OpenSeadragon dispare o evento
 * "open" de verdade (pré-condição para overlays/estruturas).
 *
 * Isso exercita o caminho completo: config salva -> laminas -> busca de
 * imagens -> render -> viewer -> troca -> estruturas. Não altera código
 * da aplicação nem requer login.
 */

test.describe.configure({ retries: 1 });

/* Objetos reais e públicos do Storage (atingíveis). */
const IMG_A =
  "https://anotdcjauvsvsyfjfpcc.supabase.co/storage/v1/object/public/laminas/laminas/bd36ff9f-09f5-4a31-9571-595b6e349807.png";
const IMG_B =
  "https://anotdcjauvsvsyfjfpcc.supabase.co/storage/v1/object/public/laminas/laminas/377053ca-56e5-417b-9d99-4a2dfd0f2a91.png";
const IMG_C =
  "https://anotdcjauvsvsyfjfpcc.supabase.co/storage/v1/object/public/laminas/laminas/775ae5ec-da92-455c-85f2-fed7d334d105.png";

const LAMINA_MULTI = "11111111-1111-4111-a111-111111111111";
const LAMINA_SINGLE = "22222222-2222-4222-a222-222222222222";
const LAMINA_SINGLE_B = "33333333-3333-4333-a333-333333333333";

function estruturasMock() {
  return [
    {
      nome: "Núcleo",
      descricao: "Região central da célula",
      tipo: "ponto",
      x: 0.4,
      y: 0.4,
    },
    {
      nome: "Membrana",
      descricao: "Limite da célula",
      tipo: "ponto",
      x: 0.6,
      y: 0.5,
    },
    {
      nome: "Citoplasma",
      descricao: "Região intermediária",
      tipo: "ponto",
      x: 0.5,
      y: 0.6,
    },
  ];
}

function laminaRow(id: string, cfg: {
  nome?: string;
  descricao?: string;
  aumento?: string | null;
  imagens?: string[];
  imagemUrl?: string | null;
}) {
  return {
    id,
    nome: cfg.nome ?? "Lâmina de teste",
    categoria: "Teste",
    descricao: cfg.descricao ?? "Descrição de teste.",
    tecnica: "Microscopia óptica",
    coloracao: "H&E",
    aumento: cfg.aumento ?? null,
    imagem_url: cfg.imagemUrl ?? cfg.imagens?.[0] ?? null,
    publicado: true,
    estruturas: estruturasMock(),
    created_at: "2026-08-20T00:00:00+00:00",
    updated_at: "2026-08-20T00:00:00+00:00",
  };
}

function imagensRows(laminaId: string, imagens: string[]) {
  return imagens.map((url, i) => ({
    id: `img-${laminaId}-${i}`,
    lamina_id: laminaId,
    imagem_url: url,
    ordem: i,
    created_at: `2026-08-20T0${i}:00:00+00:00`,
  }));
}

/*
 * Registro por teste: um mapa id->config e handlers únicos de rota.
 * Como o Playwright isola cada teste em uma página nova, o mapa e o
 * flag de registro são reiniciados no beforeEach — assim cada teste
 * registra suas próprias rotas e responde corretamente ao id da URL.
 */
const registro: Record<string, any> = {};
let rotasRegistradas = false;

test.beforeEach(() => {
  for (const key of Object.keys(registro)) delete registro[key];
  rotasRegistradas = false;
});

async function mockLamina(
  page: import("@playwright/test").Page,
  cfg: {
    id: string;
    nome?: string;
    descricao?: string;
    aumento?: string | null;
    imagens?: string[];
    imagemUrl?: string | null;
  },
) {
  registro[cfg.id] = cfg;

  if (!rotasRegistradas) {
    rotasRegistradas = true;

    await page.route(/rest\/v1\/laminas\?.*id=eq\./, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const url = route.request().url();
      const m = url.match(/id=eq\.([^&]+)/);
      const id = m ? decodeURIComponent(m[1]) : "";
      const c = registro[id];
      if (!c) return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": "*/*" },
        body: JSON.stringify(laminaRow(c.id, c)),
      });
    });

    await page.route(/rest\/v1\/lamina_imagens/, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const url = route.request().url();
      const m = url.match(/lamina_id=eq\.([^&]+)/);
      const id = m ? decodeURIComponent(m[1]) : "";
      const c = registro[id];
      if (!c) return route.continue();
      const rows = c.imagens ? imagensRows(c.id, c.imagens) : [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "content-range": `0-${Math.max(0, rows.length - 1)}/${rows.length}`,
        },
        body: JSON.stringify(rows),
      });
    });
  }
}

test.describe("Múltiplas imagens por lâmina (viewer)", () => {
  test("1. lâmina antiga com imagem_url continua abrindo (fallback)", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_SINGLE,
      nome: "Lâmina antiga",
      descricao: "Apenas imagem_url, sem lamina_imagens.",
      imagens: [],
      imagemUrl: IMG_A,
    });

    await page.goto(`/#lamina/${LAMINA_SINGLE}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    // fallback: nav escondido (só uma imagem)
    await expect(page.locator("#imagem-nav")).toBeHidden();
    expect(await structureOverlayCount(page)).toBe(3);
    assertNoAppErrors(log);
  });

  test("2. lâmina com múltiplas imagens carrega as três", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      nome: "Lâmina multi-imagem",
      descricao: "Três fotos da mesma lâmina.",
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await expect(page.locator("#imagem-nav")).toBeVisible();
    await expect(page.locator("#img-contador")).toHaveText("1 / 3");
    assertNoAppErrors(log);
  });

  test("3. primeira imagem eh exibida inicialmente", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await expect(page.locator("#img-contador")).toHaveText("1 / 3");
    await expect(page.locator("#img-anterior")).toBeDisabled();
    await expect(page.locator("#img-proximo")).toBeEnabled();
    assertNoAppErrors(log);
  });

  test("4. proxima imagem avanca o contador e redesenha", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await page.click("#img-proximo");
    await page.waitForTimeout(1500);
    await expect(page.locator("#img-contador")).toHaveText("2 / 3");
    await expect(page.locator("#img-anterior")).toBeEnabled();
    await expect(page.locator("#img-proximo")).toBeEnabled();

    await page.click("#img-proximo");
    await page.waitForTimeout(1500);
    await expect(page.locator("#img-contador")).toHaveText("3 / 3");
    await expect(page.locator("#img-proximo")).toBeDisabled();
    assertNoAppErrors(log);
  });

  test("5. imagem anterior volta o contador", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await page.click("#img-proximo");
    await page.waitForTimeout(1500);
    await expect(page.locator("#img-contador")).toHaveText("2 / 3");

    await page.click("#img-anterior");
    await page.waitForTimeout(1500);
    await expect(page.locator("#img-contador")).toHaveText("1 / 3");
    await expect(page.locator("#img-anterior")).toBeDisabled();
    assertNoAppErrors(log);
  });

  test("6. contador reflete a navegacao completa", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await expect(page.locator("#img-contador")).toHaveText("1 / 3");
    await page.click("#img-proximo");
    await page.waitForTimeout(1500);
    await expect(page.locator("#img-contador")).toHaveText("2 / 3");
    await page.click("#img-anterior");
    await page.waitForTimeout(1500);
    await expect(page.locator("#img-contador")).toHaveText("1 / 3");
    assertNoAppErrors(log);
  });

  test("7. troca de imagem nao duplica viewer", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await page.click("#img-proximo");
    await page.waitForTimeout(1500);
    await page.click("#img-proximo");
    await page.waitForTimeout(1500);
    await page.click("#img-anterior");
    await page.waitForTimeout(1500);

    expect(await page.locator(".openseadragon-container").count()).toBe(1);

    // Fase 19 (Parte 10): viewer.open() SUBSTITUI a imagem — o World
    // mantém exatamente 1 item (não acumula TileSources).
    const worldCount = await page.evaluate(() => {
      const el = document.querySelector(
        "#openseadragon",
      ) as (Element & {
        __atlasViewer?: { world: { getItemCount(): number } };
      }) | null;
      return el && el.__atlasViewer
        ? el.__atlasViewer.world.getItemCount()
        : -1;
    });
    expect(worldCount).toBe(1);

    // Fase 19 (Parte 2): zoom e Home continuam funcionando após trocas.
    await page.click("#zoom-in");
    await page.waitForTimeout(600);
    expect(await zoomValueNumber(page)).toBeGreaterThan(100);
    await page.click("#zoom-home");
    await page.waitForTimeout(1200);
    expect(await zoomValueNumber(page)).toBe(100);

    assertNoAppErrors(log);
  });

  test("8. troca de imagem nao duplica overlays (estruturas só na principal)", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    // imagem principal (0): 3 overlays
    expect(await structureOverlayCount(page)).toBe(3);

    // vai p/ imagem 1 -> estruturas sao limpadas (coords especificas da principal)
    await page.click("#img-proximo");
    await page.waitForTimeout(1500);
    expect(await structureOverlayCount(page)).toBe(0);

    // volta p/ principal -> 3 overlays de novo (nao 6)
    await page.click("#img-anterior");
    await page.waitForTimeout(1500);
    await waitForEstruturas(page, 3);
    expect(await structureOverlayCount(page)).toBe(3);
    assertNoAppErrors(log);
  });

  test("9. Escape continua fechando o painel de estudo", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    const panel = page.locator("#estrutura-estudo-panel");
    expect((await panel.getAttribute("hidden"))).not.toBeNull();

    await page.locator(".structure[data-estrutura-index='0']").click();
    await page.waitForTimeout(200);
    expect((await panel.getAttribute("hidden"))).toBeNull();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    expect((await panel.getAttribute("hidden"))).not.toBeNull();
    expect(await page.locator(".estrutura-selecionada").count()).toBe(0);
    assertNoAppErrors(log);
  });

  test("10. selecao de estruturas continua funcionando na principal", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await page.locator(".structure[data-estrutura-index='0']").click();
    await page.waitForTimeout(200);
    await expect(page.locator("#estrutura-estudo-contador")).toHaveText(
      /1 de 3/,
    );
    expect(
      await page.locator(".estrutura-overlay.estrutura-selecionada").count(),
    ).toBe(1);
    expect(await page.locator(".structure.estrutura-selecionada").count()).toBe(
      1,
    );

    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    await expect(page.locator("#estrutura-estudo-contador")).toHaveText(
      /2 de 3/,
    );

    // Fase 19 (Parte 2): com o painel aberto, as setas NÃO trocam de
    // imagem — o contador de imagens permanece na principal (1 / 3).
    await expect(page.locator("#img-contador")).toHaveText("1 / 3");
    assertNoAppErrors(log);
  });

  test("11. aumento aparece nas informacoes da lamina", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      nome: "Lâmina com aumento",
      aumento: "400×",
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);

    const slideMeta = page.locator(".slide-meta");
    await expect(slideMeta).toContainText("400×");
    assertNoAppErrors(log);
  });

  test("12. zoom minimo (minZoomImageRatio) continua funcionando", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      imagens: [IMG_A, IMG_B, IMG_C],
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await page.click("#zoom-home");
    await page.waitForTimeout(1200);
    const home = await zoomValueNumber(page);
    expect(home).toBe(100);

    for (let i = 0; i < 5; i++) {
      await page.click("#zoom-out");
      await page.waitForTimeout(1000);
    }
    const after = await zoomValueNumber(page);
    expect(after).toBeGreaterThanOrEqual(home);
    expect(after).toBe(home);
    assertNoAppErrors(log);
  });

  test("13. navegacao A->B continua funcionando (imagens distintas)", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      nome: "Lâmina A",
      imagens: [IMG_A, IMG_B, IMG_C],
    });
    await mockLamina(page, {
      id: LAMINA_SINGLE_B,
      nome: "Lâmina B (antiga)",
      descricao: "Fallback imagem_url.",
      imagens: [],
      imagemUrl: IMG_B,
    });

    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);
    await expect(page.locator("#img-contador")).toHaveText("1 / 3");

    await page.goto(`/#lamina/${LAMINA_SINGLE_B}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);
    await expect(page.locator("#imagem-nav")).toBeHidden();

    expect(await page.locator(".openseadragon-container").count()).toBe(1);
    assertNoAppErrors(log);
  });

  test("14. renderToken: navegacao rapida nao acumula viewers", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await mockLamina(page, {
      id: LAMINA_MULTI,
      nome: "Lâmina A",
      imagens: [IMG_A, IMG_B, IMG_C],
    });
    await mockLamina(page, {
      id: LAMINA_SINGLE_B,
      nome: "Lâmina B",
      imagens: [],
      imagemUrl: IMG_B,
    });

    // navega para A e imediatamente para B antes de A concluir o fetch
    await page.goto(`/#lamina/${LAMINA_MULTI}`);
    await page.goto(`/#lamina/${LAMINA_SINGLE_B}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    expect(await page.locator(".openseadragon-container").count()).toBe(1);
    assertNoAppErrors(log);
  });
});
