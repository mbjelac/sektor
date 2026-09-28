import { defineConfig } from "@playwright/test";

// Tests get their own Vite server on their own port, separate from the dev server on 5174. A
// reused dev server serves modules it transformed before the edit under test, which shows up as a
// snapshot that passes with a zero-pixel diff — the most misleading result a visual test can give.
// Playwright boots this one fresh from disk for every run and shuts it down afterwards, so the dev
// server on 5174 is never touched.
const testServerPort = 5274;

export default defineConfig({
  // Every test has a browser context of its own, and with it a storage of its own, so no test sees
  // what another one saved and all of them run side by side.
  fullyParallel: true,
  testDir: "./tests",
  snapshotPathTemplate: "{testDir}/snapshots/{arg}{ext}",
  use: {
    baseURL: `http://localhost:${testServerPort}`,
    launchOptions: {
      args: ["--use-angle=default"],
    },
  },
  webServer: {
    command: `npm run dev:test -- --port ${testServerPort}`,
    url: `http://localhost:${testServerPort}`,
    reuseExistingServer: false,
  },
});
