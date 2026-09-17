import { Page } from "@playwright/test";
import { test, expect, setup, expectScreenshot } from "./test-utils";

setup();

test("renders empty grid of floors", async ({ page }) => {
  await expectScreenshot(page, "empty-grid");
});

// A building a player has not climbed high enough for is kept out of their toolbar, while every
// building asking for no level at all stands in it from the start.
test("leaves out a building the player has not reached the level of", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  const toolbar = await page.evaluate(() => ({
    lockedBuildings: document.querySelectorAll('.building-item[data-building-name="TestTower"]').length,
    unlockedBuildings: document.querySelectorAll('.building-item[data-building-name="TestHouse"]').length,
  }));

  expect(toolbar).toEqual({ lockedBuildings: 0, unlockedBuildings: 1 });
});

test("highlights selected building in toolbar", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  await expectScreenshot(page, "building-selected", "#toolbar");
});

test("highlights the selected destruction tool in red", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="Destroy"]').click();
  await page.waitForTimeout(100);
  await expectScreenshot(page, "destruction-tool-selected", "#toolbar");
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

test("puts the tool down after placement, leaving the new building selected on the map", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "tool-put-down-after-placement", "body");
});

test("keeps the tool in hand while SHIFT is held, so several of the same building can be placed", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  const centerX = box!.width / 2;
  const centerY = box!.height / 2;

  // Place two buildings with a single toolbar selection
  await canvas.click({ position: { x: centerX - 60, y: centerY - 20 }, modifiers: ["Shift"] });
  await page.waitForTimeout(200);
  await canvas.click({ position: { x: centerX + 60, y: centerY - 20 }, modifiers: ["Shift"] });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "building-placed-twice-with-shift", "body");
});

// The stats of the sektor stand beside its name, so that a player building on it is told what the
// list tells them about it from outside.
test("shows the stats of the sektor beside its name", async ({ page }) => {
  await placeOneBuilding(page);

  await expectScreenshot(page, "sektor-stats", "#sektor-stats");
});

test("names every stat beside the sektor name by the same tooltip the list names it by", async ({ page }) => {
  await placeOneBuilding(page);

  const stats = await page.locator("#sektor-stats .sektor-stat").evaluateAll(stats => stats.map(stat => ({
    tooltip: stat.querySelector(".sektor-stat-icon")!.getAttribute("title"),
    value: stat.querySelector(".sektor-stat-value")!.textContent,
  })));

  expect(stats).toEqual([
    { tooltip: "Difficulty", value: "1" },
    { tooltip: "Buildings", value: "1" },
    { tooltip: "Imports", value: "4" },
    { tooltip: "Exports", value: "6" },
  ]);
});

async function placeOneBuilding(page: Page) {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);
}

// TestMine is the building which asks for no floor of its own. It goes up on the corner tile
// nearest the viewer, where the sides of its floor are in plain sight rather than hidden behind
// the floors in front of them.
test("draws only the wireframe of the floor under a building which shows no floor", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestMine"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height - 90 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "floor-wireframe-under-building", "body");
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

test("displays building panel with an output named after a location property", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "SolarFarm",
      code: "box s(30,30,30) t(0,0,0) c(#4488cc)",
      buildingFunctions: [{
        buildingFunction: {
          inputs: [{ name: "Work", value: 2 }],
          outputs: [{ name: "Energy", locationProperty: "insolation" }],
        },
        outputAmounts: [{ name: "Energy", value: 4 }],
        active: true,
      }],
      locationProperties: { soil: 2, groundwater: 3, ore: 0, insolation: 4, wind: 1 },
      floorColor: [200, 200, 100],
      location: { x: 0, y: 0 },
    });
  });

  await expectScreenshot(page, "building-panel-location-property-output", "#building-panel");
});

test("displays building panel with an output named after a location property the location has none of", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "SolarFarm",
      code: "box s(30,30,30) t(0,0,0) c(#4488cc)",
      buildingFunctions: [{
        buildingFunction: {
          inputs: [{ name: "Work", value: 2 }],
          outputs: [{ name: "Energy", locationProperty: "insolation" }],
        },
        outputAmounts: [{ name: "Energy", value: 0 }],
        active: true,
      }],
      locationProperties: { soil: 2, groundwater: 3, ore: 0, insolation: 0, wind: 1 },
      floorColor: [200, 200, 100],
      location: { x: 0, y: 0 },
    });
  });

  await expectScreenshot(page, "building-panel-empty-location-property-output", "#building-panel");
});

test("displays building panel with an output produced in a written amount", async ({ page }) => {
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
        outputAmounts: [{ name: "Goods", value: 4 }],
        active: true,
      }],
      locationProperties: { soil: 2, groundwater: 3, ore: 0, insolation: 4, wind: 1 },
      floorColor: [200, 200, 100],
      location: { x: 0, y: 0 },
    });
  });

  await expectScreenshot(page, "building-panel-written-amount-output", "#building-panel");
});

test("displays building panel with several building functions", async ({ page }) => {
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
          outputAmounts: [{ name: "Tools", value: 2 }],
          active: true,
        },
        {
          buildingFunction: {
            inputs: [{ name: "Wood", value: 3 }],
            outputs: [{ name: "Tools", value: 3 }],
          },
          outputAmounts: [{ name: "Tools", value: 3 }],
          active: false,
        },
      ],
      locationProperties: { soil: 2, groundwater: 3, ore: 0, insolation: 4, wind: 1 },
      floorColor: [200, 200, 100],
      location: { x: 0, y: 0 },
      onToggleFunction: () => {},
    });
  });

  await expectScreenshot(page, "building-panel-several-functions", "#building-panel");
});

async function placeWorkshop(page: Page) {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestWorkshop"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);
}

test("displays the first function of a placed building as active", async ({ page }) => {
  await placeWorkshop(page);

  await expectScreenshot(page, "building-function-initially-active", '#building-panel .bf-function-block[data-function-index="0"]');
});

test("displays the other functions of a placed building as inactive", async ({ page }) => {
  await placeWorkshop(page);

  await expectScreenshot(page, "building-function-initially-inactive", '#building-panel .bf-function-block[data-function-index="1"]');
});

test("activates a function when its toggle is clicked", async ({ page }) => {
  await placeWorkshop(page);

  await page.locator('#building-panel .bf-function-block[data-function-index="1"] .bf-toggle').click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "building-function-toggled-active", "body");
});

test("deactivates a function when its toggle is clicked", async ({ page }) => {
  await placeWorkshop(page);

  await page.locator('#building-panel .bf-function-block[data-function-index="0"] .bf-toggle').click();
  await page.waitForTimeout(200);

  await expectScreenshot(page, "building-function-toggled-inactive", "body");
});

test("marks a building starved of a local resource on the map", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  // TestClinic needs Care, a local resource which nothing in the sektor produces
  await page.locator('.building-item[data-building-name="TestClinic"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "starved-building-marked");
});

test("warns in the building panel about a function starved of a local resource", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestClinic"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "starved-function-warning", "#building-panel");
});

test("clears the starvation warning when the local resource is produced", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  const centerX = box!.width / 2;
  const centerY = box!.height / 2;

  await page.locator('.building-item[data-building-name="TestClinic"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: centerX - 60, y: centerY - 20 } });
  await page.waitForTimeout(200);

  // TestCarer produces the Care the clinic went without
  await page.locator('.building-item[data-building-name="TestCarer"]').click();
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: centerX + 60, y: centerY - 20 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "starvation-warning-cleared", "body");
});

test("displays no activity label or toggle for a function the building always does", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  // TestReactor's second function is marked "Active: always"
  await page.locator('.building-item[data-building-name="TestReactor"]').click();
  await page.waitForTimeout(100);
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "always-active-function", "#building-panel");
});

test("displays building panel for empty location", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).showBuildingPanel({
      name: "Empty",
      code: "",
      buildingFunctions: [],
      locationProperties: { soil: 2, groundwater: 3, ore: 0, insolation: 4, wind: 1 },
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

test("displays function panel with an output named after a location property", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();
  await page.waitForTimeout(100);
  const panel = page.locator("#toolbar-function-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveScreenshot("toolbar-function-panel-with-location-property.png", {
    maxDiffPixelRatio: 0,
    timeout: 10000,
  });
});

test("displays function panel with a location property per function", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  // TestWorkshop has two functions, each of its outputs named after a different property
  await page.locator('.building-item[data-building-name="TestWorkshop"]').click();
  await page.waitForTimeout(100);
  const panel = page.locator("#toolbar-function-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveScreenshot("toolbar-function-panel-per-function-location-properties.png", {
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

// What the sektor moves, resource by resource: a resource only brought in, one only sent out, and
// one which is both, so that each of the three reads right beside the others.
test("displays what the sektor imports and exports", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).updateSektorStatePanel({
      imports: [
        { name: "Water", value: 4, score: -8 },
        { name: "Energy", value: 5, score: -10 },
        { name: "Food", value: 2, score: -4 },
      ],
      exports: [
        { name: "Food", value: 5, score: 10 },
        { name: "Ore", value: 3, score: 6 },
        { name: "Work", value: 3, score: -6 },
      ],
      starvedFunctions: [],
    });
  });

  await expectScreenshot(page, "sektor-state-panel", "#sektor-state-panel");
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
