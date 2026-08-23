import { test, expect } from "@playwright/test";
import {
  attachErrorCapture,
  assertNoAppErrors,
  createErrorLog,
  structureButtonCount,
  structureOverlayCount,
  waitForEstruturas,
  waitForViewer,
  zoomValueNumber,
  zoomValueText,
} from "./helpers";

// Single retry absorbs transient load against the live Supabase + Vite dev
// server during a long local run. Each retry must fully pass the assertions.
test.describe.configure({ retries: 1 });

const LAMINA_3_ESTRUTURAS = "d43b72aa-3a0a-4ab7-a9dd-d3ef6cffb1ef";
const LAMINA_2_ESTRUTURAS = "32fa973a-545e-4dbf-aea6-a53284edf903";

test.describe("Rotas e navegação base", () => {
  test("página inicial carrega sem erro JS", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto("/");
    await page.waitForSelector("header.header", { state: "visible" });
    await page.waitForSelector(".hero", { state: "visible" });
    // navegação do header
    await expect(page.locator('header a[href="#laminas"]')).toBeVisible();
    await expect(page.locator('a[href="#login"]')).toBeVisible();
    assertNoAppErrors(log);
  });

  test("catálogo lista lâminas publicadas", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto("/#laminas");
    await page.waitForSelector("#catalog-grid", { state: "visible" });
    const cards = page.locator(".lamina-card");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    await expect(page.locator("#catalog-status")).toHaveText(/encontrada/);
    assertNoAppErrors(log);
  });

  test("acesso a #admin sem autenticação redireciona para #login", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto("/#admin");
    await page.waitForSelector("#login-form", { state: "visible" });
    await expect(page).toHaveURL(/#login$/);
    assertNoAppErrors(log);
  });

  test("acesso a #nova-lamina sem autenticação redireciona para #login", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto("/#nova-lamina");
    await page.waitForSelector("#login-form", { state: "visible" });
    await expect(page).toHaveURL(/#login$/);
    assertNoAppErrors(log);
  });

  test("login com credenciais inválidas mostra erro amigável (sem JS error)", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto("/#login");
    await page.waitForSelector("#login-form", { state: "visible" });
    await page.fill("#email", "nao-existente@example.com");
    await page.fill("#password", "senha-errada");
    await page.click('#login-form button[type="submit"]');
    await page.waitForSelector("#login-error", { state: "visible" });
    const errText = ((await page.textContent("#login-error")) || "").toLowerCase();
    expect(errText).toMatch(/incorretos|inválidos|falha|erro/);
    assertNoAppErrors(log);
  });
});

test.describe("Visualizador OpenSeadragon (lâmina com 3 estruturas)", () => {
  test("viewer abre, imagem carrega e controles existem", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    // canvas = imagem aberta; overlays só são desenhados após o evento "open"
    await expect(page.locator(".openseadragon-canvas")).toBeVisible({
      timeout: 20000,
    });
    await waitForEstruturas(page, 3);

    expect(await structureOverlayCount(page)).toBe(3);
    expect(await page.locator(".estrutura-numero-badge").count()).toBe(3);
    expect(await structureButtonCount(page)).toBe(3);

    for (const c of ["#zoom-in", "#zoom-out", "#zoom-home", "#zoom-fullscreen"]) {
      const btn = page.locator(c);
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute("aria-label");
    }
    await expect(page.locator("#zoom-value")).toBeVisible();

    assertNoAppErrors(log);
  });

  test("zoom in/out/home atualizam zoom-value", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    const initial = await zoomValueText(page);
    expect(initial).toBe("100%");

    await page.click("#zoom-in");
    await page.waitForTimeout(1200);
    const afterIn = await zoomValueNumber(page);
    expect(afterIn).toBeGreaterThan(100);

    await page.click("#zoom-out");
    await page.waitForTimeout(1200);
    const afterOut = await zoomValueNumber(page);
    expect(afterOut).toBeLessThan(afterIn);

    await page.click("#zoom-home");
    await page.waitForTimeout(1200);
    expect(await zoomValueText(page)).toBe("100%");

    assertNoAppErrors(log);
  });

  test("minZoomImageRatio impede zoom abaixo do home (zoom-out clamp)", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await page.click("#zoom-home");
    await page.waitForTimeout(1200);
    const homeLabel = await zoomValueNumber(page);
    expect(homeLabel).toBe(100);

    // clique várias vezes em zoom-out — não deve afastar a lâmina inteira
    for (let i = 0; i < 5; i++) {
      await page.click("#zoom-out");
      await page.waitForTimeout(1200);
    }
    const after = await zoomValueNumber(page);
    expect(after).toBeGreaterThanOrEqual(homeLabel);
    expect(after).toBe(homeLabel);
    assertNoAppErrors(log);
  });

  test("seleção de estrutura abre painel, Escape e teclado sincronizam", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    const panel = page.locator("#estrutura-estudo-panel");
    expect((await panel.getAttribute("hidden"))).not.toBeNull();

    // abrir via lista lateral (sidebar) — UI canônica
    await page.locator(".structure[data-estrutura-index='0']").click();
    await page.waitForTimeout(200);
    expect((await panel.getAttribute("hidden"))).toBeNull();
    await expect(page.locator("#estrutura-estudo-contador")).toHaveText(/1 de 3/);
    // seleção sincroniza: 1 overlay + 1 botão da sidebar = 2 elementos marcados
    expect(
      await page.locator(".estrutura-overlay.estrutura-selecionada").count(),
    ).toBe(1);
    expect(await page.locator(".structure.estrutura-selecionada").count()).toBe(1);

    // Escape fecha painel e limpa seleção
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    expect((await panel.getAttribute("hidden"))).not.toBeNull();
    expect(await page.locator(".estrutura-selecionada").count()).toBe(0);

    // reabrir via overlay (click programático, contorna o "intercept" da
    // overlay-wrapper do OpenSeadragon — limitação de Playwright, não do app)
    await page.dispatchEvent(
      ".estrutura-overlay[data-estrutura-index='1']",
      "click",
    );
    await page.waitForTimeout(200);
    expect((await panel.getAttribute("hidden"))).toBeNull();
    await expect(page.locator("#estrutura-estudo-contador")).toHaveText(/2 de 3/);
    await expect(
      page.locator(".estrutura-overlay.estrutura-selecionada"),
    ).toHaveCount(1);

    // navegar com setas
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    await expect(page.locator("#estrutura-estudo-contador")).toHaveText(/3 de 3/);

    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(200);
    await expect(page.locator("#estrutura-estudo-contador")).toHaveText(/2 de 3/);

    assertNoAppErrors(log);
  });

  test("fechar painel via botão X", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);
    await page.locator(".structure[data-estrutura-index='0']").click();
    await page.waitForTimeout(200);
    expect(
      await page.locator("#estrutura-estudo-panel").getAttribute("hidden"),
    ).toBeNull();
    await page.click("#estrutura-estudo-fechar");
    await page.waitForTimeout(200);
    expect(
      await page.locator("#estrutura-estudo-panel").getAttribute("hidden"),
    ).not.toBeNull();
    assertNoAppErrors(log);
  });

  test("centralizar estrutura aplica zoom além de 100% e navega", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await page.click("#zoom-home");
    await page.waitForTimeout(1200);
    expect(await zoomValueText(page)).toBe("100%");

    // clicar na segunda estrutura centraliza e aplica zoom adaptativo (>100%)
    await page.locator(".structure[data-estrutura-index='1']").click();
    await page.waitForTimeout(1200);
    const zAfter = await zoomValueNumber(page);
    expect(zAfter).toBeGreaterThan(100);
    await expect(page.locator("#estrutura-estudo-contador")).toHaveText(/2 de 3/);

    assertNoAppErrors(log);
  });
});

test.describe("Ciclo de vida do viewer / renderToken", () => {
  test("catálogo → lâmina → catálogo não deixa viewer antigo", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await page.goto("/#laminas");
    await page.waitForSelector("#catalog-grid", { state: "visible" });
    await page.click(`.explore-button[href="#lamina/${LAMINA_3_ESTRUTURAS}"]`, {
      timeout: 15000,
    });
    await waitForViewer(page);
    await waitForEstruturas(page, 3);
    expect(await page.locator(".openseadragon-container").count()).toBe(1);
    expect(await page.locator(".estrutura-overlay").count()).toBe(3);

    // volta para catálogo — render() chama destruirViewer()
    await page.click('a[href="#laminas"]', { timeout: 10000 });
    await page.waitForSelector("#catalog-grid", { state: "visible" });
    expect(await page.locator("#openseadragon").count()).toBe(0);
    expect(await page.locator(".estrutura-overlay").count()).toBe(0);

    assertNoAppErrors(log);
  });

  test("navegação A → B → A mantém apenas um viewer e sem stale data", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);
    expect(await page.locator(".openseadragon-container").count()).toBe(1);
    expect(await structureOverlayCount(page)).toBe(3);

    await page.goto(`/#lamina/${LAMINA_2_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 2);
    expect(await page.locator(".openseadragon-container").count()).toBe(1);
    expect(await structureOverlayCount(page)).toBe(2);

    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);
    expect(await page.locator(".openseadragon-container").count()).toBe(1);
    expect(await structureOverlayCount(page)).toBe(3);

    assertNoAppErrors(log);
  });

  test("back/forward do navegador preserva estado e não acumula viewers", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await page.goto("/#laminas");
    await page.waitForSelector("#catalog-grid");
    await page.click(`.explore-button[href="#lamina/${LAMINA_3_ESTRUTURAS}"]`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);

    await page.goBack();
    await page.waitForSelector("#catalog-grid");
    await page.goForward();
    await waitForViewer(page);
    expect(await page.locator(".openseadragon-container").count()).toBe(1);

    assertNoAppErrors(log);
  });

  test("acesso direto por URL (full reload) na lâmina A", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    await waitForEstruturas(page, 3);
    assertNoAppErrors(log);
  });
});

test.describe("Responsividade", () => {
  test("catálogo em mobile (390x844)", async ({ page }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#laminas");
    await page.waitForSelector("#catalog-grid");
    const cards = page.locator(".lamina-card");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    assertNoAppErrors(log);
  });

  test("visualizador em mobile (412x915) e controles visíveis", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto(`/#lamina/${LAMINA_3_ESTRUTURAS}`);
    await waitForViewer(page);
    await expect(page.locator("#zoom-in")).toBeVisible();
    await expect(page.locator("#zoom-fullscreen")).toBeVisible();
    await expect(page.locator(".openseadragon-canvas")).toBeVisible();
    assertNoAppErrors(log);
  });
});

test.describe("Fluxos não cobertos (limitações)", () => {
  test("documenta ausência de credenciais de teste", async () => {
    // Não há credenciais de teste no ambiente (apenas VITE_SUPABASE_URL +
    // VITE_SUPABASE_PUBLISHABLE_KEY). Fluxos autenticados abaixo são
    // explicitamente fora de escopo desta fase:
    //   - admin: publicar/ocultar/excluir/editar/visualizar lâmina
    //   - admin: CRUD de categorias, duplicata
    //   - nova-lamina: salvar, duplo clique, Enter repetido, reabilitação de botão
    //   - nova-lamina: preview/troca/remover imagem, criação de estruturas
    //   - aparência: salvar duas vezes, cancelar
    // Regra da fase: NÃO inventar credenciais.
    expect(true).toBe(true);
  });
});
