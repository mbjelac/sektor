import { test, expect, setup, expectScreenshot } from "./test-utils";

setup();

test("renders empty grid of floors", async ({ page }) => {
  await expectScreenshot(page, "empty-grid");
});

test("highlights selected building in toolbar", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  await expectScreenshot(page, "building-selected", "#toolbar");
});

test("removes highlight when selected building is clicked again", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  await expectScreenshot(page, "building-deselected", "#toolbar");
});

test("renders building on floor after placement", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  // Click on center of the canvas (should hit a floor tile near the middle of the grid)
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);
  await expectScreenshot(page, "building-placed");
});

test("displays building panel with few inputs", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestMine"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);
  await expectScreenshot(page, "building-panel-small", "#building-panel");
});

test("displays building panel with many inputs", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestRefinery"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);
  await expectScreenshot(page, "building-panel-large", "#building-panel");
});

test("displays building panel with boosted output modifier", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "SolarFarm",
      code: "box s(30,30,30) t(0,0,0) c(#4488cc)",
      buildingFunction: {
        inputs: [{ name: "Work", value: 2 }],
        outputs: [{ name: "Energy", value: 10 }],
      },
      modifiedOutputs: [{ name: "Energy", value: 15 }],
      locationProperties: { soil: 2, groundwater: -3, ore: -5, insolation: 4, wind: 1 },
      modifierProperties: ["insolation"],
      floorColor: [200, 200, 100],
      location: { x: 0, y: 0 },
    });
  });

  await expectScreenshot(page, "building-panel-boosted-output", "#building-panel");
});

test("displays building panel with reduced output modifier", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "SolarFarm",
      code: "box s(30,30,30) t(0,0,0) c(#4488cc)",
      buildingFunction: {
        inputs: [{ name: "Work", value: 2 }],
        outputs: [{ name: "Energy", value: 10 }],
      },
      modifiedOutputs: [{ name: "Energy", value: 3.5 }],
      locationProperties: { soil: 2, groundwater: -3, ore: -5, insolation: -4, wind: 1 },
      modifierProperties: ["insolation"],
      floorColor: [200, 200, 100],
      location: { x: 0, y: 0 },
    });
  });

  await expectScreenshot(page, "building-panel-reduced-output", "#building-panel");
});

test("displays building panel without output modifier", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "Warehouse",
      code: "box s(30,30,30) t(0,0,0) c(#888888)",
      buildingFunction: {
        inputs: [{ name: "Wood", value: 3 }],
        outputs: [{ name: "Goods", value: 4 }],
      },
      modifiedOutputs: [{ name: "Goods", value: 4 }],
      locationProperties: { soil: 2, groundwater: -3, ore: -5, insolation: 4, wind: 1 },
      modifierProperties: [],
      floorColor: [200, 200, 100],
      location: { x: 0, y: 0 },
    });
  });

  await expectScreenshot(page, "building-panel-no-modifier", "#building-panel");
});

test("displays building panel for empty location", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "Empty",
      code: "",
      buildingFunction: { inputs: [], outputs: [] },
      modifiedOutputs: [],
      locationProperties: { soil: 2, groundwater: -3, ore: -5, insolation: 4, wind: 1 },
      modifierProperties: [],
      floorColor: [200, 200, 100],
      location: { x: 3, y: 5 },
    });
  });

  await expectScreenshot(page, "building-panel-empty-location", "#building-panel");
});

test("building panel persists after rotating the view", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  // Place and click a building
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);
  // Drag to rotate the view
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 80, box!.y + box!.height / 2 - 40, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  // Building panel should still be visible
  await expectScreenshot(page, "building-panel-after-rotate", "body");
});

test("displays function panel when building tool is selected", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestHouse"]').click();
  await page.waitForTimeout(100);
  const panel = page.locator("#toolbar-function-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveScreenshot("toolbar-function-panel.png", {
    maxDiffPixelRatio: 0,
    timeout: 10000,
  });
});

test("displays function panel with modifier property", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const panel = page.locator("#toolbar-function-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveScreenshot("toolbar-function-panel-with-modifier.png", {
    maxDiffPixelRatio: 0,
    timeout: 10000,
  });
});

test("destroys building when trash icon is clicked", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  const centerX = box!.width / 2;
  const centerY = box!.height / 2;

  // Place a building
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: centerX, y: centerY } });
  await page.waitForTimeout(200);

  // Open panel
  await canvas.click({ position: { x: centerX, y: centerY } });
  await page.waitForTimeout(200);

  // Click destroy button
  await page.locator(".bf-destroy").click();
  await page.waitForTimeout(200);

  // Panel should be closed, building removed from map
  await expectScreenshot(page, "building-destroyed", "body");
});

test("displays sektor state panel with restrictions and requirements", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  // Imports (restrictions: Water=4, Energy=3, Ore=5):
  //   Food=2 — non-zero import without restriction
  //   Ore=0 — zero import with restriction (max 5)
  //   Water=4 — non-zero import equal to restriction (max 4)
  //   Energy=5 — non-zero import greater than restriction (max 3)
  // Exports (requirements: Food=4, Work=5, Metal=8):
  //   Ore=3 — non-zero export without requirement
  //   Metal=0 — zero export with requirement (min 8)
  //   Work=3 — non-zero export below requirement (min 5)
  //   Food=5 — non-zero export greater than requirement (min 4)
  await page.evaluate(() => {
    (window as any).updateSektorStatePanel({
      imports: [
        { name: "Water", value: 4 },
        { name: "Energy", value: 5 },
        { name: "Food", value: 2 },
      ],
      exports: [
        { name: "Food", value: 5 },
        { name: "Ore", value: 3 },
        { name: "Work", value: 3 },
      ],
      status: "RestrictionsExceeded",
      importRestrictions: [
        { name: "Water", value: 4 },
        { name: "Energy", value: 3 },
        { name: "Ore", value: 5 },
      ],
      exportRequirements: [
        { name: "Food", value: 4 },
        { name: "Work", value: 5 },
        { name: "Metal", value: 8 },
      ],
    });
  });

  await expectScreenshot(page, "sektor-state-panel", "#sektor-state-panel");
});

test("displays sektor state panel with Done status", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).updateSektorStatePanel({
      imports: [
        { name: "Water", value: 2 },
        { name: "Energy", value: 3 },
      ],
      exports: [
        { name: "Food", value: 6 },
        { name: "Work", value: 5 },
      ],
      status: "Done",
      importRestrictions: [
        { name: "Energy", value: 5 },
      ],
      exportRequirements: [
        { name: "Food", value: 4 },
        { name: "Work", value: 5 },
      ],
    });
  });

  await expectScreenshot(page, "sektor-state-panel-done", "#sektor-state-panel");
});

test("highlights buildings importing hovered resource", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  const centerX = box!.width / 2;
  const centerY = box!.height / 2;

  // Place TestFactory (imports Energy) and TestMine (imports Energy)
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: centerX - 60, y: centerY - 20 } });
  await page.waitForTimeout(200);

  await page.locator('.building-item[data-building-name="TestMine"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: centerX + 60, y: centerY - 20 } });
  await page.waitForTimeout(200);

  // Place TestHouse (does NOT import Energy)
  await page.locator('.building-item[data-building-name="TestHouse"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: centerX, y: centerY + 30 } });
  await page.waitForTimeout(200);

  // Deselect building by clicking empty area
  await canvas.click({ position: { x: centerX + 120, y: centerY + 60 } });
  await page.waitForTimeout(200);

  // Hover over Energy import row in sektor state panel
  const energyRow = page.locator(".ss-row", { hasText: "Energy" }).first();
  await energyRow.hover();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "import-hover-highlight", "body");
});

test("shows error when placing building on occupied location", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  const clickPos = { x: box!.width / 2, y: box!.height / 2 };
  // Place first building
  await canvas.click({ position: clickPos });
  await page.waitForTimeout(200);
  // Re-select the building tool (it gets deselected after successful placement)
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  // Try to place again on same spot
  await canvas.click({ position: clickPos });
  await page.waitForTimeout(200);
  await expectScreenshot(page, "building-error", "body");
});
