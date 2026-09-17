# Architect

Editor for designing 3D shapes using text instructions (one line per shape) with visual UI controls (sliders, color picker). Shapes are rendered in real-time using p5.js WebGL.

- p5.js app served with Vite
- Entry point: `index.html` + `src/sketch.ts`
- Run dev server: `npm run dev` (port 5173)
- Run tests: `npx playwright test` — Playwright starts its own Vite server on port 5273 and stops it afterwards, so a dev server on 5173 can stay running and is never reused
- Update snapshots: `npx playwright test --update-snapshots`
