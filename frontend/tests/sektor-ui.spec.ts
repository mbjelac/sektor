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

// What the sektor moves, resource by resource, and what each of those is worth as things stand on
// the planet: a resource brought in which the planet has over and one it is short of, a resource
// sent out of each, and Work, which does the planet harm and so turns the table around.
test("displays what the sektor imports and exports", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.evaluate(() => {
    (window as any).updateSektorStatePanel(
      {
        imports: [
          { name: "Water", value: 4 },
          { name: "Energy", value: 5 },
        ],
        exports: [
          { name: "Food", value: 5 },
          { name: "Ore", value: 3 },
          { name: "Work", value: 3 },
        ],
        starvedFunctions: [],
      },
      {
        imports: [{ name: "Energy", value: 20 }, { name: "Food", value: 8 }, { name: "Work", value: 6 }],
        exports: [{ name: "Water", value: 12 }, { name: "Ore", value: 9 }],
      },
    );
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

// A sektor is worth what it does for the planet, so the same Food brought in is worth different
// things on different planets: two points off where the planet is short of Food, and only one where
// another sektor already sends out more than enough of it.
test("scores what the sektor moves against what the rest of the planet moves", async ({ page }) => {
  await storeSektorSendingOutFood(page, "Beta");
  await page.goto("/sektor.html?id=Alpha&test=true");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await placeBuilding(page, "TestProcessor");

  expect(await getLocalThroughputRows(page)).toEqual([
    { resource: "Food 🥕", imported: "2", exported: "", score: "-1" },
    { resource: "Wood 🪵", imported: "", exported: "3", score: "1" },
  ]);
});

// The same sektor on a planet with nothing else on it: the Food it brings in is Food the planet is
// short of, which costs it twice as much.
test("scores what the sektor moves against itself while it is the whole planet", async ({ page }) => {
  await page.goto("/sektor.html?id=Alpha&test=true");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await placeBuilding(page, "TestProcessor");

  expect(await getLocalThroughputRows(page)).toEqual([
    { resource: "Food 🥕", imported: "2", exported: "", score: "-2" },
    { resource: "Wood 🪵", imported: "", exported: "3", score: "1" },
  ]);
});

// A sektor of one factory, which turns Water and Energy into as much Food as the ground it stands
// on is worth.
async function storeSektorSendingOutFood(page: Page, sektorId: string) {
  await page.evaluate(sektorId => {
    localStorage.setItem("sektors", JSON.stringify([
      { id: "Alpha", name: "Alpha", owner: "Tester" },
      { id: sektorId, name: sektorId, owner: "Tester" },
    ]));
    localStorage.setItem(`sektor_${sektorId}`, JSON.stringify({
      level: 1,
      locationProperties: { soil: [[10]] },
      buildings: [{ type: "TestFactory", location: { x: 0, y: 0 } }],
    }));
  }, sektorId);
}

async function placeBuilding(page: Page, buildingName: string) {
  await page.locator(`.building-item[data-building-name="${buildingName}"]`).click();
  const canvas = page.locator("#canvas-container > canvas");
  const canvasBox = await canvas.boundingBox();
  await canvas.click({ position: { x: canvasBox!.width / 2, y: canvasBox!.height / 2 } });
  await page.waitForTimeout(200);
}

// What every resource row of the sektor's own panel says, leaving out the header and the row which
// adds the scores up.
function getLocalThroughputRows(page: Page) {
  return page.locator("#sektor-state-panel .ss-row:not(.ss-header):not(.ss-total)").evaluateAll(rows =>
    rows.map(row => {
      const cells = row.querySelectorAll("span");
      return {
        resource: cells[0].textContent,
        imported: cells[1].textContent,
        exported: cells[2].textContent,
        score: cells[3].textContent,
      };
    })
  );
}

// What the whole planet brings in and sends out is what anything a sektor moves is worth measured
// against, so the player can call it up over the map without leaving what they are building.
test("shows what the whole planet moves when the globe beside the panel title is clicked", async ({ page }) => {
  await storeSektorSendingOutFood(page, "Beta");
  await page.goto("/sektor.html?id=Alpha&test=true");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await placeBuilding(page, "TestProcessor");

  await page.locator("#global-state-button").click();

  expect(await getGlobalDialogRows(page)).toEqual([
    { resource: "Energy ⚡", imported: "1", exported: "" },
    { resource: "Food 🥕", imported: "", exported: "8" },
    { resource: "Water 💧", imported: "3", exported: "" },
    { resource: "Wood 🪵", imported: "", exported: "3" },
  ]);
});

test("shows the planet's imports and exports over the map", async ({ page }) => {
  await storeSektorSendingOutFood(page, "Beta");
  await page.goto("/sektor.html?id=Alpha&test=true");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await placeBuilding(page, "TestProcessor");

  await page.locator("#global-state-button").click();

  await expectScreenshot(page, "global-state-dialog", "#global-state-dialog");
});

// The dialog stands at the size of the sektor's own panel, so that the one reads as the other seen
// for the whole planet rather than as something else again.
test("stands the planet's list at the size of the sektor's own panel", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await placeBuilding(page, "TestProcessor");
  const panelWidth = await page.locator("#sektor-state-panel").evaluate(panel => panel.offsetWidth);

  await page.locator("#global-state-button").click();

  expect(await page.locator("#global-state-dialog").evaluate(dialog => dialog.offsetWidth))
    .toEqual(panelWidth);
});

test("puts the planet's list away when the x in its corner is clicked", async ({ page }) => {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await placeBuilding(page, "TestProcessor");
  await page.locator("#global-state-button").click();

  await page.locator("#global-state-close-button").click();

  await expect(page.locator("#global-state-dialog")).toHaveCount(0);
});

// More resources than the dialog holds are scrolled through inside it, leaving the dialog the size
// it has, and no bar is drawn down the side of them.
test("scrolls the planet's resources without a bar when there are more than the dialog holds", async ({ page }) => {
  await storeSektorMovingManyResources(page, "Beta");
  await page.goto("/sektor.html?id=Alpha&test=true");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await placeBuilding(page, "TestProcessor");

  await page.locator("#global-state-button").click();

  const scrolling = await page.locator("#global-state-dialog .global-state-list").evaluate(list => {
    list.scrollTop = list.scrollHeight;
    return {
      taller: list.scrollHeight > list.clientHeight,
      scrolledPast: list.scrollTop > 0,
      barWidth: list.offsetWidth - list.clientWidth,
    };
  });

  expect(scrolling).toEqual({ taller: true, scrolledPast: true, barWidth: 0 });
});

// A sektor of a refinery, a house and a processor, which between them move more resources than any
// dialog shows at once.
async function storeSektorMovingManyResources(page: Page, sektorId: string) {
  await page.evaluate(sektorId => {
    localStorage.setItem("sektors", JSON.stringify([
      { id: "Alpha", name: "Alpha", owner: "Tester" },
      { id: sektorId, name: sektorId, owner: "Tester" },
    ]));
    localStorage.setItem(`sektor_${sektorId}`, JSON.stringify({
      level: 1,
      locationProperties: { ore: [[6], [6], [6]] },
      buildings: [
        { type: "TestRefinery", location: { x: 0, y: 0 } },
        { type: "TestHouse", location: { x: 1, y: 0 } },
        { type: "TestProcessor", location: { x: 2, y: 0 } },
      ],
    }));
  }, sektorId);
}

// What every resource row of the planet's list says while it stands over the map.
function getGlobalDialogRows(page: Page) {
  return page.locator("#global-state-dialog .global-state-item").evaluateAll(items =>
    items.map(item => {
      const cells = item.querySelectorAll("span");
      return {
        resource: cells[0].textContent,
        imported: cells[1].textContent,
        exported: cells[2].textContent,
      };
    })
  );
}

// The planet's list over the map is asked for its order the same way as the one beside the sektors:
// by clicking the column the player is looking down.
test("puts the most brought in first when the imported column of the planet's list is clicked", async ({ page }) => {
  await storeSektorMovingManyResources(page, "Beta");
  await page.goto("/sektor.html?id=Alpha&test=true");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await placeBuilding(page, "TestProcessor");
  await page.locator("#global-state-button").click();

  await page.locator('#global-state-dialog .global-state-sort[data-sort-order="imported"]').click();

  expect(await getGlobalDialogResourceNames(page))
    .toEqual(["Food 🥕", "Ore 🪨", "Water 💧", "Energy ⚡", "Stone 🧱", "Fuel 🛢️", "Work 🛠️", "Wood 🪵", "Metal ⚙️"]);
});

// The resources of the planet's list, in the order they stand in while it is over the map.
function getGlobalDialogResourceNames(page: Page) {
  return page.locator("#global-state-dialog .global-state-item .global-state-resource")
    .evaluateAll(cells => cells.map(cell => cell.textContent));
}

// Whatever the planet is shortest of is what a player can do most good by sending out, so they are
// told it as the map opens, before they have built anything at all.
test("tells the player what the planet is shortest of as the map opens", async ({ page }) => {
  await storeSektorMovingManyResources(page, "Beta");

  await page.goto("/sektor.html?id=Alpha&test=true");

  await expect(page.locator("#most-imported-message")).toHaveText("This planet needs: Ore 🪨, Water 💧, Food 🥕");
});

test("shows what the planet is shortest of over the map", async ({ page }) => {
  await storeSektorMovingManyResources(page, "Beta");
  await page.goto("/sektor.html?id=Alpha&test=true");

  await page.locator("#most-imported-message").waitFor();

  await expectScreenshot(page, "most-imported-message", "body");
});

// A building put up changes what the planet is short of, so the advice on the screen is written
// over rather than stood beside: the player is never told two of the same thing at once.
test("writes over what the player is told when what the planet is shortest of changes", async ({ page }) => {
  await storeSektorMovingManyResources(page, "Beta");
  await page.goto("/sektor.html?id=Alpha&test=true");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await placeBuilding(page, "TestProcessor");

  expect(await page.locator(".message").evaluateAll(messages => messages.map(message => message.textContent)))
    .toEqual(["This planet needs: Food 🥕, Ore 🪨, Water 💧"]);
});

// A planet short of nothing has nothing to advise, so nothing is said.
test("tells the player nothing while the planet is short of nothing", async ({ page }) => {
  await page.goto("/sektor.html?id=Alpha&test=true");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await expect(page.locator("#most-imported-message")).toHaveCount(0);
});
