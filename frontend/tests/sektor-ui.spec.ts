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

test("keeps the building selected after placement so it can be placed again", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  const centerX = box!.width / 2;
  const centerY = box!.height / 2;

  // Place two buildings with a single toolbar selection
  await canvas.click({ position: { x: centerX - 60, y: centerY - 20 } });
  await page.waitForTimeout(200);
  await canvas.click({ position: { x: centerX + 60, y: centerY - 20 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "building-placed-twice", "body");
});

test("displays the location property overlay while a building affected by it is selected", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  // TestMine's output is affected by ore
  await page.locator('.building-item[data-building-name="TestMine"]').click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "property-overlay");
});

test("hides the location property overlay when the building is deselected", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestMine"]').click();
  await page.waitForTimeout(200);

  await page.locator('.building-item[data-building-name="TestMine"]').click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "property-overlay-hidden");
});

test("displays no location property overlay for a building affected by soil", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  // TestFactory's output is affected by soil, which the floors themselves already show
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "property-overlay-soil");
});

test("displays no location property overlay for a building without a location property", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  // TestHouse's output is not affected by any location property
  await page.locator('.building-item[data-building-name="TestHouse"]').click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "property-overlay-none");
});

test("displays the location property overlay for the property selected in the geography panel", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.locator('.property-toggle[data-property="insolation"]').click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "property-overlay-selected-in-panel");
});

test("displays no location property overlay when soil is selected in the geography panel", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.property-toggle[data-property="insolation"]').click();
  await page.waitForTimeout(200);

  await page.locator('.property-toggle[data-property="soil"]').click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "property-overlay-soil-selected-in-panel");
});

test("deselects the building in the toolbar when clicked outside of the map", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();

  // Click a canvas spot outside the grid of floors
  await canvas.click({ position: { x: box!.width - 20, y: box!.height - 20 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "building-deselected-outside-map", "body");
});

test("displays building panel with few inputs", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestMine"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
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
  await expectScreenshot(page, "building-panel-large", "#building-panel");
});

test("displays building panel with boosted output modifier", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "SolarFarm",
      code: "box s(30,30,30) t(0,0,0) c(#4488cc)",
      buildingFunctions: [{
        buildingFunction: {
          inputs: [{ name: "Work", value: 2 }],
          outputs: [{ name: "Energy", value: 10 }],
        },
        modifiedOutputs: [{ name: "Energy", value: 15 }],
        capacity: 0.4,
      }],
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
      buildingFunctions: [{
        buildingFunction: {
          inputs: [{ name: "Work", value: 2 }],
          outputs: [{ name: "Energy", value: 10 }],
        },
        modifiedOutputs: [{ name: "Energy", value: 3.5 }],
        capacity: 0.4,
      }],
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
      buildingFunctions: [{
        buildingFunction: {
          inputs: [{ name: "Wood", value: 3 }],
          outputs: [{ name: "Goods", value: 4 }],
        },
        modifiedOutputs: [{ name: "Goods", value: 4 }],
        capacity: 0.4,
      }],
      locationProperties: { soil: 2, groundwater: -3, ore: -5, insolation: 4, wind: 1 },
      modifierProperties: [],
      floorColor: [200, 200, 100],
      location: { x: 0, y: 0 },
    });
  });

  await expectScreenshot(page, "building-panel-no-modifier", "#building-panel");
});

test("displays building panel with a capacity for each of several building functions", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "Workshop",
      code: "box s(30,30,30) t(0,0,0) c(#888888)",
      buildingFunctions: [
        {
          buildingFunction: {
            name: "Tool making",
            inputs: [{ name: "Ore", value: 4 }],
            outputs: [{ name: "Tools", value: 2 }],
          },
          modifiedOutputs: [{ name: "Tools", value: 2 }],
          capacity: 0.3,
        },
        {
          buildingFunction: {
            inputs: [{ name: "Wood", value: 3 }],
            outputs: [{ name: "Tools", value: 3 }],
          },
          modifiedOutputs: [{ name: "Tools", value: 3 }],
          capacity: 0.8,
        },
      ],
      locationProperties: { soil: 2, groundwater: -3, ore: -5, insolation: 4, wind: 1 },
      modifierProperties: [],
      floorColor: [200, 200, 100],
      location: { x: 0, y: 0 },
    });
  });

  await expectScreenshot(page, "building-panel-several-functions", "#building-panel");
});

test("displays building panel for empty location", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "Empty",
      code: "",
      buildingFunctions: [],
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
  // Place a building — its panel opens on placement
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
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

test("increases building capacity when the increase button is clicked", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  // A placed building starts at capacity 0.1, so three increases bring it up to 0.4
  await page.locator(".bc-increase").click();
  await page.locator(".bc-increase").click();
  await page.locator(".bc-increase").click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "building-capacity-increased", "#building-panel");
});

test("decreases building capacity when the decrease button is clicked", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  // Capacity goes up from 0.1 to 0.8, then back down to 0.6
  for (let increase = 0; increase < 7; increase++) {
    await page.locator(".bc-increase").click();
  }
  await page.locator(".bc-decrease").click();
  await page.locator(".bc-decrease").click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "building-capacity-decreased", "#building-panel");
});

test("raises building capacity to the maximum when the double increase button is clicked", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  await page.locator(".bc-increase-completely").click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "building-capacity-maximum", "#building-panel");
});

test("lowers building capacity to zero when the double decrease button is clicked", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  await page.locator(".bc-increase-completely").click();
  await page.locator(".bc-decrease-completely").click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "building-capacity-minimum", "#building-panel");
});

test("destroys building when trash icon is clicked", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  const centerX = box!.width / 2;
  const centerY = box!.height / 2;

  // Place a building — its panel opens on placement
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: centerX, y: centerY } });
  await page.waitForTimeout(200);

  // Click destroy button
  await page.locator(".bf-destroy").click();
  await page.waitForTimeout(200);

  // Panel should be closed, building removed from map
  await expectScreenshot(page, "building-destroyed", "body");
});

test("destroys buildings when clicked with the destruction tool", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  const centerX = box!.width / 2;
  const centerY = box!.height / 2;

  // Place two buildings
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: centerX - 60, y: centerY - 20 } });
  await page.waitForTimeout(200);
  await canvas.click({ position: { x: centerX + 60, y: centerY - 20 } });
  await page.waitForTimeout(200);

  // Destroy both — the destruction tool stays selected after destroying
  await page.locator('.building-item[data-building-name="Destroy"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: centerX - 60, y: centerY - 20 } });
  await page.waitForTimeout(200);
  await canvas.click({ position: { x: centerX + 60, y: centerY - 20 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "buildings-destroyed-with-tool", "body");
});

test("shows error when destroying an empty location", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();

  await page.locator('.building-item[data-building-name="Destroy"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "destroy-empty-location-error", "body");
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
        { name: "Water", value: 4, score: -8 },
        { name: "Energy", value: 5, score: -10 },
        { name: "Food", value: 2, score: -4 },
      ],
      exports: [
        { name: "Food", value: 5, score: 14 },
        { name: "Ore", value: 3, score: 6 },
        { name: "Work", value: 3, score: -9 },
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
        { name: "Water", value: 2, score: -4 },
        { name: "Energy", value: 3, score: -6 },
      ],
      exports: [
        { name: "Food", value: 6, score: 16 },
        { name: "Work", value: 5, score: -15 },
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

  // Deselect the building tool, then clear the location panel by clicking an empty area
  await page.locator('.building-item[data-building-name="TestHouse"]').click();
  await page.waitForTimeout(100);
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
  // Try to place again on same spot — the tool stays selected after placement
  await canvas.click({ position: clickPos });
  await page.waitForTimeout(200);
  await expectScreenshot(page, "building-error", "body");
});
