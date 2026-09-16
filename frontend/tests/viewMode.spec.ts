import { test, expect, expectScreenshot } from "./test-utils";

const OTHER_PLAYER = "Ana";
const CURRENT_PLAYER = "Tester";

test.beforeEach(async ({ page }) => {
  // The login page is the one page open to a player who is not logged in yet, so it is where the
  // player of the test is logged in, before going on to the sektor being tested.
  await page.goto("/login.html");
  await page.evaluate(currentPlayer => localStorage.setItem("username", currentPlayer), CURRENT_PLAYER);
});

test("shows a sektor in view mode with the building toolbar", async ({ page }) => {
  await page.goto("/sektor.html?test=true&mode=view");

  await expectScreenshot(page, "view-mode", "body");
});

test("shows what a building of a viewed sektor does when it is selected in the toolbar", async ({ page }) => {
  await page.goto("/sektor.html?test=true&mode=view");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.locator('.building-item[data-building-name="TestHouse"]').click();

  await expect(page.locator("#toolbar-function-panel")).toBeVisible();
});

test("does not select the destruction tool in a viewed sektor", async ({ page }) => {
  await page.goto("/sektor.html?test=true&mode=view");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  const destructionTool = page.locator('.building-item[data-building-name="Destroy"]');

  await destructionTool.click();

  await expect(destructionTool).not.toHaveClass(/selected/);
});

test("tells the player a viewed sektor is not theirs to build on", async ({ page }) => {
  await page.goto("/sektor.html?test=true&mode=view");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();

  const canvas = page.locator("#canvas-container > canvas");
  const canvasBox = await canvas.boundingBox();
  await canvas.click({ position: { x: canvasBox!.width / 2, y: canvasBox!.height / 2 } });

  await expect(page.locator("#error-message")).toHaveText("noOwnership");
});

test("builds nothing when the player clicks the map of a viewed sektor", async ({ page }) => {
  await page.goto("/sektor.html?test=true&mode=view");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestFactory"]').click();

  const canvas = page.locator("#canvas-container > canvas");
  const canvasBox = await canvas.boundingBox();
  await canvas.click({ position: { x: canvasBox!.width / 2, y: canvasBox!.height / 2 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "view-mode-nothing-built");
});

test("names the sektor it is showing", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);
  await nameStoredSektor(page, "Beta", "Sunset Flats");

  await page.goto("/sektor.html?id=Beta");

  await expect(page.locator("#sektor-name")).toHaveText("Sunset Flats");
});

test("names a sektor without a name of its own No name", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);
  await nameStoredSektor(page, "Beta", "");

  await page.goto("/sektor.html?id=Beta");

  await expect(page.locator("#sektor-name")).toHaveText("No name");
});

test("goes back to the sektor list from the map", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);
  await page.goto("/sektor.html?id=Beta");

  await page.locator("#leave-button").click();

  await expect(page).toHaveURL(/\/$/);
});

test("tells what the button in front of the sektor name does", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);

  await page.goto("/sektor.html?id=Beta");

  await expect(page.locator("#leave-button")).toHaveAttribute("title", "Back to list");
});

test("names the player a sektor is owned by", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);

  await page.goto("/sektor.html?id=Beta");

  await expect(page.locator("#sektor-header")).toHaveScreenshot("map-owned-by-other-player.png", { maxDiffPixelRatio: 0 });
});

// The palette of a sektor is what makes it hard, so the toolbar has to offer the buildings it names
// and nothing else — except the destruction tool, which belongs to no palette.
test("offers only the buildings the sektor allows, and the destruction tool", async ({ page }) => {
  await storeSektor(page, "Alpha", CURRENT_PLAYER, [], [], ["WaterWells", "Agriplot"]);

  await page.goto("/sektor.html?id=Alpha");

  await expectScreenshot(page, "toolbar-allowed-buildings", "#toolbar");
});

test("opens a sektor claimed by the current player for building", async ({ page }) => {
  await storeSektor(page, "Alpha", CURRENT_PLAYER);

  await page.goto("/sektor.html?id=Alpha");

  await expect(page.locator("#construction-panel")).toHaveCount(1);
});

test("shows the buildings of a sektor claimed by another player", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);

  await page.goto("/sektor.html?id=Beta");

  await expect(page.locator("#construction-panel")).toBeVisible();
});

test("names no owner on a sektor of the current player", async ({ page }) => {
  await storeSektor(page, "Alpha", CURRENT_PLAYER);

  await page.goto("/sektor.html?id=Alpha");

  await expect(page.locator("#sektor-owner")).toHaveCount(0);
});

test("shows the buildings of a sektor claimed by nobody", async ({ page }) => {
  await storeSektor(page, "Gamma", null);

  await page.goto("/sektor.html?id=Gamma");

  await expect(page.locator("#construction-panel")).toBeVisible();
});

test("offers an unclaimed sektor for claiming", async ({ page }) => {
  await storeSektor(page, "Gamma", null);

  await page.goto("/sektor.html?id=Gamma");

  await expect(page.locator("#sektor-header")).toHaveScreenshot("map-unclaimed.png", { maxDiffPixelRatio: 0 });
});

// A sektor already has a name when it is offered, so claiming it asks for nothing but a yes.
test("asks the player to confirm claiming a sektor from the map", async ({ page }) => {
  await storeSektor(page, "Gamma", null);
  await nameStoredSektor(page, "Gamma", "Sunset Flats");
  await page.goto("/sektor.html?id=Gamma");

  await page.locator("#map-claim-button").click();

  await expect(page.locator("#claim-dialog")).toHaveScreenshot("claim-dialog-from-map.png", { maxDiffPixelRatio: 0 });
});

test("makes the player the owner of a sektor claimed from the map", async ({ page }) => {
  await claimFromMap(page, "Gamma");

  const sektors = await page.evaluate(() => JSON.parse(localStorage.getItem("sektors")!));
  expect(sektors).toEqual([{ id: "Gamma", name: "Sunset Flats", owner: CURRENT_PLAYER }]);
});

test("leaves the sektor unclaimed when claiming from the map is cancelled", async ({ page }) => {
  await storeSektor(page, "Gamma", null);
  await nameStoredSektor(page, "Gamma", "Sunset Flats");
  await page.goto("/sektor.html?id=Gamma");
  await page.locator("#map-claim-button").click();

  await page.locator("#claim-no-button").click();

  const sektors = await page.evaluate(() => JSON.parse(localStorage.getItem("sektors")!));
  expect(sektors).toEqual([{ id: "Gamma", name: "Sunset Flats", owner: null }]);
});

test("offers the whole toolbar for building once the sektor is claimed", async ({ page }) => {
  await claimFromMap(page, "Gamma");

  const toolbar = await page.evaluate(() => ({
    destructionTools: document.querySelectorAll('.building-item[data-building-name="Destroy"]').length,
    toolsWhichCannotBeSelected: document.querySelectorAll(".building-item.not-selectable").length,
  }));

  expect(toolbar).toEqual({ destructionTools: 1, toolsWhichCannotBeSelected: 0 });
});

test("shows the claimed sektor under the name it carries, with nothing left to claim", async ({ page }) => {
  await claimFromMap(page, "Gamma");

  await expect(page.locator("#sektor-header")).toHaveScreenshot("map-claimed.png", { maxDiffPixelRatio: 0 });
});

async function claimFromMap(page: import("@playwright/test").Page, sektorId: string) {
  await storeSektor(page, sektorId, null);
  await nameStoredSektor(page, sektorId, "Sunset Flats");
  await page.goto(`/sektor.html?id=${sektorId}`);
  await page.locator("#map-claim-button").click();
  await page.locator("#claim-yes-button").click();
  await page.locator("#claim-dialog").waitFor({ state: "detached" });
}

test("draws the buildings of a sektor shown in view mode", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER, [
    { type: "Habitats", location: { x: 4, y: 4 } },
    { type: "Agriplot", location: { x: 5, y: 5 } },
  ]);

  await page.goto("/sektor.html?id=Beta");

  await expectScreenshot(page, "view-mode-buildings");
});

test("shows a building of a sektor in view mode without the controls which would change it", async ({ page }) => {
  // Polytechnic has several functions, so its panel is the one which would carry the toggles.
  await storeSektor(page, "Beta", OTHER_PLAYER, [{ type: "Polytechnic", location: { x: 5, y: 5 } }]);
  await page.goto("/sektor.html?id=Beta");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(200);

  await expectScreenshot(page, "view-mode-building-panel", "#building-panel");
});

test("congratulates the player when the sektor becomes done", async ({ page }) => {
  await placeTheBuildingWhichFinishesTheSektor(page);

  await expect(page.locator("#done-dialog")).toHaveScreenshot("done-dialog.png", { maxDiffPixelRatio: 0 });
});

test("stays on the sektor when the player continues working on it", async ({ page }) => {
  await placeTheBuildingWhichFinishesTheSektor(page);

  await page.locator("#done-continue-button").click();

  await expect(page.locator("#done-dialog")).toHaveCount(0);
});

test("goes back to the list when the player leaves the finished sektor", async ({ page }) => {
  await placeTheBuildingWhichFinishesTheSektor(page);

  await page.locator("#done-leave-button").click();

  await expect(page).toHaveURL(/\/$/);
});

// Habitats puts out Work, which is the whole assignment of this sektor, so placing one finishes it.
async function placeTheBuildingWhichFinishesTheSektor(page: import("@playwright/test").Page) {
  await storeSektor(page, "Alpha", CURRENT_PLAYER, [], [{ name: "Work", value: 0.5 }]);
  await page.goto("/sektor.html?id=Alpha");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.locator('.building-item[data-building-name="Habitats"]').click();
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.locator("#done-dialog").waitFor();
}

async function storeSektor(page: import("@playwright/test").Page, sektorId: string, owner: string | null, buildings: object[] = [], exportRequirements: object[] = [], allowedBuildings: string[] = ["Habitats", "Agriplot", "Polytechnic"]) {
  await page.evaluate(([sektorId, owner, buildings, exportRequirements, allowedBuildings]) => {
    const emptyGrid = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0));
    localStorage.setItem(`sektor_${sektorId}`, JSON.stringify({
      level: 1,
      allowedBuildings,
      locationProperties: { soil: emptyGrid, groundwater: emptyGrid, ore: emptyGrid, insolation: emptyGrid, wind: emptyGrid },
      importRestrictions: [],
      exportRequirements,
      buildings,
    }));
    localStorage.setItem("sektors", JSON.stringify([{ id: sektorId, name: owner ? sektorId : null, owner }]));
  }, [sektorId, owner, buildings, exportRequirements, allowedBuildings] as [string, string | null, object[], object[], string[]]);
}

// The name a player gave the sektor before the test begins, which it carries beside its id.
async function nameStoredSektor(page: import("@playwright/test").Page, sektorId: string, givenName: string) {
  await page.evaluate(([sektorId, givenName]) => {
    const sektors = JSON.parse(localStorage.getItem("sektors")!);
    localStorage.setItem("sektors", JSON.stringify(sektors.map((sektor: { id: string }) =>
      sektor.id === sektorId ? { ...sektor, name: givenName } : sektor
    )));
  }, [sektorId, givenName]);
}
