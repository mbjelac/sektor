import { test, expect, setup } from "./test-utils";

setup();

const addBtn = "#add-shape-btn";
const textarea = "#editor textarea";

async function addShape(page) {
  await page.locator(addBtn).click();
}

async function expectEditorScreenshot(page, name: string) {
  // See expectScreenshot in test-utils: the caret in the editor outlines a body in white, which
  // these tests of the editor's own widgets are not about.
  await page.locator(textarea).blur();
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 2000 });
  await page.waitForTimeout(50);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: 0.01,
  });
}

test("create shape and change it to torus", async ({ page }) => {
  await addShape(page);
  // Click the shape button to open popup
  await page.locator("#editor-panel .shape-btn").click();
  // Select torus from the popup
  await page.locator("#shape-popup .shape-option", { hasText: "tor" }).click();
  await expectEditorScreenshot(page, "editor-change-to-torus");
});

test("create shape and rotate it", async ({ page }) => {
  await addShape(page);
  // Get the rotation sliders (first slider group with "R")
  const rotSliders = page.locator("#editor-panel .slider-group").filter({ hasText: "R" }).locator(".panel-slider");
  await rotSliders.nth(0).fill("120");
  await rotSliders.nth(1).fill("45");
  await expectEditorScreenshot(page, "editor-rotate");
});

test("create shape and translate it", async ({ page }) => {
  await addShape(page);
  const transSliders = page.locator("#editor-panel .slider-group").filter({ hasText: "T" }).locator(".panel-slider");
  await transSliders.nth(0).fill("50");
  await transSliders.nth(1).fill("-30");
  await transSliders.nth(2).fill("20");
  await expectEditorScreenshot(page, "editor-translate");
});

test("create shape and scale it", async ({ page }) => {
  await addShape(page);
  const scaleSliders = page.locator("#editor-panel .slider-group").filter({ hasText: "S" }).locator(".panel-slider");
  await scaleSliders.nth(0).fill("150");
  await scaleSliders.nth(1).fill("50");
  await scaleSliders.nth(2).fill("180");
  await expectEditorScreenshot(page, "editor-scale");
});

test("create shape and color it", async ({ page }) => {
  await addShape(page);
  const colorInput = page.locator("#editor-panel .color-input");
  await colorInput.evaluate((el: HTMLInputElement) => {
    el.value = "#e03030";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expectEditorScreenshot(page, "editor-color");
});

test("create shape and apply all functions", async ({ page }) => {
  await addShape(page);

  // Change to cone
  await page.locator("#editor-panel .shape-btn").click();
  await page.locator("#shape-popup .shape-option", { hasText: "con" }).click();

  // Rotate
  const rotSliders = page.locator("#editor-panel .slider-group").filter({ hasText: "R" }).locator(".panel-slider");
  await rotSliders.nth(0).fill("60");

  // Translate
  const transSliders = page.locator("#editor-panel .slider-group").filter({ hasText: "T" }).locator(".panel-slider");
  await transSliders.nth(0).fill("30");
  await transSliders.nth(2).fill("20");

  // Scale
  const scaleSliders = page.locator("#editor-panel .slider-group").filter({ hasText: "S" }).locator(".panel-slider");
  await scaleSliders.nth(0).fill("80");

  // Color
  const colorInput = page.locator("#editor-panel .color-input");
  await colorInput.evaluate((el: HTMLInputElement) => {
    el.value = "#30e050";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await expectEditorScreenshot(page, "editor-all-functions");
});

test("create multiple shapes and modify them", async ({ page }) => {
  // Add 3 shapes
  await addShape(page);
  await addShape(page);
  await addShape(page);

  // Change 2nd to sphere
  await page.locator("#editor-panel .shape-btn").nth(1).click();
  await page.locator("#shape-popup .shape-option", { hasText: "sph" }).click();

  // Change 3rd to prism
  await page.locator("#editor-panel .shape-btn").nth(2).click();
  await page.locator("#shape-popup .shape-option", { hasText: "pri5" }).click();

  // Translate each in different directions
  const subpanels = page.locator("#editor-panel .subpanel");

  const trans0 = subpanels.nth(0).locator(".slider-group").filter({ hasText: "T" }).locator(".panel-slider");
  await trans0.nth(0).fill("-40");

  const trans1 = subpanels.nth(1).locator(".slider-group").filter({ hasText: "T" }).locator(".panel-slider");
  await trans1.nth(0).fill("40");

  const trans2 = subpanels.nth(2).locator(".slider-group").filter({ hasText: "T" }).locator(".panel-slider");
  await trans2.nth(1).fill("40");

  // Color each differently
  for (const [idx, color] of [[0, "#e03030"], [1, "#3030e0"], [2, "#30e030"]] as [number, string][]) {
    const colorInput = subpanels.nth(idx).locator(".color-input");
    await colorInput.evaluate((el: HTMLInputElement, c: string) => {
      el.value = c;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, color);
  }

  await expectEditorScreenshot(page, "editor-multiple-shapes");
});

test("duplicate a shape", async ({ page }) => {
  await addShape(page);

  // Modify the shape: translate and color it
  const transSliders = page.locator("#editor-panel .slider-group").filter({ hasText: "T" }).locator(".panel-slider");
  await transSliders.nth(0).fill("-40");
  const colorInput = page.locator("#editor-panel .color-input").first();
  await colorInput.evaluate((el: HTMLInputElement) => {
    el.value = "#e03030";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // Click the duplicate button
  await page.locator("#editor-panel .dup-btn").first().click();

  // Move the duplicated shape to the right so both are visible
  const subpanels = page.locator("#editor-panel .subpanel");
  const trans1 = subpanels.nth(1).locator(".slider-group").filter({ hasText: "T" }).locator(".panel-slider");
  await trans1.nth(0).fill("40");

  await expectEditorScreenshot(page, "editor-duplicate");
});

test("delete a shape", async ({ page }) => {
  // Add 3 shapes
  await addShape(page);
  await addShape(page);
  await addShape(page);

  // Color each so they're distinguishable
  const subpanels = page.locator("#editor-panel .subpanel");
  for (const [idx, color] of [[0, "#e03030"], [1, "#3030e0"], [2, "#30e030"]] as [number, string][]) {
    const colorInput = subpanels.nth(idx).locator(".color-input");
    await colorInput.evaluate((el: HTMLInputElement, c: string) => {
      el.value = c;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, color);
  }

  // Translate them apart
  const trans0 = subpanels.nth(0).locator(".slider-group").filter({ hasText: "T" }).locator(".panel-slider");
  await trans0.nth(0).fill("-40");
  const trans2 = subpanels.nth(2).locator(".slider-group").filter({ hasText: "T" }).locator(".panel-slider");
  await trans2.nth(0).fill("40");

  // Delete the middle shape
  await subpanels.nth(1).locator(".del-btn").click();

  await expectEditorScreenshot(page, "editor-delete");
});

test("scroll through many shape subpanels", async ({ page }) => {
  // Add many shapes so they overflow
  for (let i = 0; i < 8; i++) {
    await addShape(page);
  }

  // Scroll the subpanels container to the bottom
  await page.locator("#subpanels").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  await expectEditorScreenshot(page, "editor-scroll-subpanels");
});

test("typing in textarea updates editor subpanels", async ({ page }) => {
  // Add a line with the editor
  await addShape(page);

  // Change the text so subpanel is updated
  await page.locator(textarea).fill("sph t(30,0,0) r(0,45,0) c(#e03030)\npri5 s(150,100,80) t(-30,0,0) c(#3030e0)");
  await expectEditorScreenshot(page, "editor-textarea-sync");
});

test("load last text on startup", async ({ page }) => {
  // Type text into the textarea
  await page.locator(textarea).fill("tor t(20,0,30) c(#e03030)\nsph s(150,150,150) c(#3030e0)");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 2000 });

  // Reload the page
  await page.reload();
  await page.waitForSelector("canvas");

  // Verify the text persisted and subpanels are synced
  await expectEditorScreenshot(page, "editor-persist-reload");
});
