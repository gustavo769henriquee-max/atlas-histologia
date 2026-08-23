import { defineConfig } from "@playwright/test";

const PORT = 5173;

export default defineConfig({
  testDir: "tests",
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
    video: "off",
  },
  webServer: {
    command: "cmd /c npx vite",
    url: `http://localhost:${PORT}`,
    timeout: 60000,
    reuseExistingServer: true,
    cwd: process.cwd(),
  },
});
