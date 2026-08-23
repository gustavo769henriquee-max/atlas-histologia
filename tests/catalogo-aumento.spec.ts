import { test, expect } from "@playwright/test";
import {
  attachErrorCapture,
  assertNoAppErrors,
  createErrorLog,
} from "./helpers";

/*
 * Fase 23 — regressão do "Aumento" no catálogo.
 *
 * O campo `aumento` (aumento óptico real, ex.: "400×") deve aparecer
 * nos cards do catálogo público, além do slider-meta do visualizador.
 * Sem credenciais de admin, interceptamos a consulta do catálogo
 * (GET /rest/v1/laminas?publicado=eq.true) e injetamos uma lâmina
 * publicada com `aumento` preenchido.
 */

test.describe.configure({ retries: 1 });

const LAMINA_COM_AUMENTO = "44444444-4444-4444-a444-444444444444";

test.beforeEach(async ({ page }) => {
  await page.route(
    /rest\/v1\/laminas\?.*publicado=eq\.true/,
    async (route) => {
      if (route.request().method() !== "GET") return route.continue();

      const body = JSON.stringify([
        {
          id: LAMINA_COM_AUMENTO,
          nome: "Lâmina com aumento",
          categoria: "Teste",
          descricao: "Descrição de teste.",
          tecnica: "Microscopia óptica",
          coloracao: "H&E",
          aumento: "400×",
          imagem_url: null,
          publicado: true,
          estruturas: [],
          created_at: "2026-08-23T00:00:00+00:00",
          updated_at: "2026-08-23T00:00:00+00:00",
        },
      ]);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": "0-0/1" },
        body,
      });
    },
  );
});

test.describe("Catálogo — exibição do aumento óptico", () => {
  test("card exibe 'Aumento: 400×' sem confundir com zoom digital", async ({
    page,
  }) => {
    const log = createErrorLog();
    attachErrorCapture(page, log);

    await page.goto("/#laminas");
    await page.waitForSelector("#catalog-grid", { state: "visible" });
    const card = page.locator(".lamina-card").first();
    await expect(card).toBeVisible({ timeout: 15000 });

    // O rótulo do aumento óptico deve estar presente nos tags do card
    await expect(card.locator(".lamina-tags")).toContainText("Aumento: 400×");

    assertNoAppErrors(log);
  });
});
