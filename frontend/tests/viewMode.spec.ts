import { test, expect, expectScreenshot } from "./test-utils";

const OTHER_PLAYER = "Ana";
const CURRENT_PLAYER = "Tester";

test.beforeEach(async ({ page }) => {
  // The login page is the one page open to a player who is not logged in yet, so it is where the
  // player of the test is logged in, before going on to the sektor being tested.
  await page.goto("/login.html");
  await page.evaluate(currentPlayer => localStorage.setItem("username", currentPlayer), CURRENT_PLAYER);
});

test("shows a sektor in view mode without the building toolbar", async ({ page }) => {
  await page.goto("/sektor.html?test=true&mode=view");

  await expectScreenshot(page, "view-mode", "body");
});

test("shows a building panel in view mode without the capacity buttons", async ({ page }) => {
  await page.goto("/sektor.html?test=true&mode=view");
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
      showCapacityButtons: false,
    });
  });

  await expectScreenshot(page, "view-mode-building-panel", "#building-panel");
});

test("opens a sektor claimed by the current player for building", async ({ page }) => {
  await storeSektor(page, "Alpha", CURRENT_PLAYER);

  await page.goto("/sektor.html?name=Alpha");

  await expect(page.locator("#construction-panel")).toHaveCount(1);
});

test("opens a sektor claimed by another player without the building toolbar", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);

  await page.goto("/sektor.html?name=Beta");

  await expect(page.locator("#construction-panel")).toHaveCount(0);
});

test("opens a sektor claimed by nobody without the building toolbar", async ({ page }) => {
  await storeSektor(page, "Gamma", null);

  await page.goto("/sektor.html?name=Gamma");

  await expect(page.locator("#construction-panel")).toHaveCount(0);
});

test("draws the buildings of a sektor shown in view mode", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER, [
    { type: "Habitats", location: { x: 4, y: 4 }, capacities: [1] },
    { type: "Agriplot", location: { x: 5, y: 5 }, capacities: [1] },
  ]);

  await page.goto("/sektor.html?name=Beta");

  await expectScreenshot(page, "view-mode-buildings");
});

async function storeSektor(page: import("@playwright/test").Page, sektorName: string, owner: string | null, buildings: object[] = []) {
  await page.evaluate(([sektorName, owner, buildings]) => {
    const emptyGrid = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0));
    localStorage.setItem(`sektor_${sektorName}`, JSON.stringify({
      locationProperties: { soil: emptyGrid, groundwater: emptyGrid, ore: emptyGrid, insolation: emptyGrid, wind: emptyGrid },
      importRestrictions: [],
      exportRequirements: [],
      buildings,
    }));
    localStorage.setItem("sektors", JSON.stringify([{ name: sektorName }]));
    localStorage.setItem("sektorOwners", JSON.stringify(owner ? { [sektorName as string]: owner } : {}));
  }, [sektorName, owner, buildings] as [string, string | null, object[]]);
}
