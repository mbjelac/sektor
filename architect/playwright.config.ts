import { defineConfig } from "@playwright/test";

// Tests get their own Vite server on their own port, separate from the dev server on 5173. A
// reused dev server serves modules it transformed before the edit under test, which shows up as a
// snapshot that passes with a zero-pixel diff — the most misleading result a visual test can give.
// Playwright boots this one fresh from disk for every run and shuts it down afterwards, so the dev
// server on 5173 is never touched.
const testServerPort = 5273;

export default defineConfig({
  fullyParallel: true,
  testDir: "./tests",
  snapshotPathTemplate: "{testDir}/snapshots/{arg}{ext}",
  use: {
    baseURL: `http://localhost:${testServerPort}`,
  },
  webServer: {
    command: `npm run dev:test -- --port ${testServerPort}`,
    url: `http://localhost:${testServerPort}`,
    reuseExistingServer: false,
  },
});
