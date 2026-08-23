/**
 * Playwright E2E harness helpers: capture unhandled exceptions and
 * console errors so tests can fail on real JS breakage without tripping
 * on expected/innocuous warnings.
 */
import type { Locator, Page } from "@playwright/test";

export type ErrorLog = {
  pageerror: string[];
  consoleError: string[];
  failedRequests: { url: string; status: number | string; method: string }[];
};

export function createErrorLog(): ErrorLog {
  return { pageerror: [], consoleError: [], failedRequests: [] };
}

export function attachErrorCapture(page: Page, log: ErrorLog) {
  page.on("pageerror", (err) => {
    log.pageerror.push(String(err && err.stack ? err.stack : err));
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      log.consoleError.push(`[${msg.location().url}] ${msg.text()}`);
    }
  });
  page.on("requestfailed", (req) => {
    const res = req.response();
    log.failedRequests.push({
      method: req.method(),
      url: req.url(),
      status: res ? res.status() : req.failure()?.errorText || "no-response",
    });
  });
}

export function assertNoAppErrors(log: ErrorLog) {
  // Filtra erros que NÃO indicam bug da aplicação:
  //  - ícones de navegação externos do OpenSeadragon (openseadragon.github.io)
  //  - falhas de carregamento de recursos externos (imagem CDN/OSD)
  //  - "Failed to load resource: the server responded with a status of 4xx"
  //    emitido pelo navegador para chamadas de autenticação com credenciais
  //    inválidas (comportamento esperado: o app mostra "incorretos" em tela).
  const isExpectedBrowserNetworkMsg = (s: string) =>
    /Failed to load resource: the server responded with a status of 4\d\d\(\)/.test(s) ||
    s.includes("Failed to load resource") && s.includes("status of 4");
  const realPageErrors = log.pageerror.filter((s) => !isExpectedBrowserNetworkMsg(s));
  const realConsoleErrors = log.consoleError.filter(
    (e) =>
      !e.includes("openseadragon.github.io") && !isExpectedBrowserNetworkMsg(e),
  );
  const realNetworkFailures = log.failedRequests.filter(
    (f) =>
      !new URL(f.url).hostname.includes("openseadragon.github.io") &&
      !f.url.includes("/auth/v1/token"),
  );
  if (realPageErrors.length) {
    throw new Error("pageerror:\n" + realPageErrors.join("\n"));
  }
  if (realConsoleErrors.length) {
    throw new Error("console.error:\n" + realConsoleErrors.join("\n"));
  }
  if (realNetworkFailures.length) {
    throw new Error(
      "failed requests:\n" +
        realNetworkFailures.map((f) => `${f.method} ${f.status} ${f.url}`).join("\n"),
    );
  }
}

export async function waitForViewer(page: Page) {
  // 1) a lâmina foi encontrada e renderizada (div #openseadragon existe)
  await page.waitForSelector("#openseadragon", {
    state: "attached",
    timeout: 30000,
  });
  // 2) OpenSeadragon inicializou o container
  await page.waitForSelector("#openseadragon .openseadragon-container", {
    state: "visible",
    timeout: 30000,
  });
  // App usa drawer:"canvas": a imagem é pintada no <canvas> (não há .openseadragon-tile).
  await page.waitForSelector("#openseadragon .openseadragon-canvas", {
    state: "attached",
    timeout: 30000,
  });
}

export async function waitForEstruturas(page: Page, n: number) {
  await page.waitForFunction(
    (cnt) => document.querySelectorAll(".estrutura-overlay").length >= cnt,
    n,
    { timeout: 25000 },
  );
}

export async function zoomValueText(page: Page): Promise<string> {
  return (await page.textContent("#zoom-value")) || "";
}

export async function zoomValueNumber(page: Page): Promise<number> {
  const t = await zoomValueText(page);
  const n = Number(String(t).replace("%", ""));
  return Number.isFinite(n) ? n : NaN;
}

export async function structureOverlayCount(page: Page): Promise<number> {
  return page.locator(".estrutura-overlay").count();
}

export async function structureButtonCount(page: Page): Promise<number> {
  return page.locator(".structure[data-estrutura-index]").count();
}
