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

test("names the sektor it is showing", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);
  await page.evaluate(() => localStorage.setItem("sektorNames", JSON.stringify({ Beta: "Sunset Flats" })));

  await page.goto("/sektor.html?name=Beta");

  await expect(page.locator("#sektor-name")).toHaveText("Sunset Flats");
});

test("names a sektor without a name of its own Unnamed", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);
  await page.evaluate(() => localStorage.setItem("sektorNames", JSON.stringify({ Beta: "" })));

  await page.goto("/sektor.html?name=Beta");

  await expect(page.locator("#sektor-name")).toHaveText("Unnamed");
});

test("goes back to the sektor list from the map", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);
  await page.goto("/sektor.html?name=Beta");

  await page.locator("#leave-button").click();

  await expect(page).toHaveURL(/\/$/);
});

test("tells what the button in front of the sektor name does", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);

  await page.goto("/sektor.html?name=Beta");

  await expect(page.locator("#leave-button")).toHaveAttribute("title", "Back to list");
});

test("names the player a sektor is owned by", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);

  await page.goto("/sektor.html?name=Beta");

  await expect(page.locator("#sektor-header")).toHaveScreenshot("map-owned-by-other-player.png", { maxDiffPixelRatio: 0 });
});

test("opens a sektor claimed by the current player for building", async ({ page }) => {
  await storeSektor(page, "Alpha", CURRENT_PLAYER);

  await page.goto("/sektor.html?name=Alpha");

  await expect(page.locator("#construction-panel")).toHaveCount(1);
});

test("opens a sektor claimed by another player without the building toolbar", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);

  await page.goto("/sektor.html?name=Beta");

  await expect(page.locator("#construction-panel")).toBeHidden();
});

test("names no owner on a sektor of the current player", async ({ page }) => {
  await storeSektor(page, "Alpha", CURRENT_PLAYER);

  await page.goto("/sektor.html?name=Alpha");

  await expect(page.locator("#sektor-owner")).toHaveCount(0);
});

test("opens a sektor claimed by nobody without the building toolbar", async ({ page }) => {
  await storeSektor(page, "Gamma", null);

  await page.goto("/sektor.html?name=Gamma");

  await expect(page.locator("#construction-panel")).toBeHidden();
});

test("offers an unclaimed sektor for claiming", async ({ page }) => {
  await storeSektor(page, "Gamma", null);

  await page.goto("/sektor.html?name=Gamma");

  await expect(page.locator("#sektor-header")).toHaveScreenshot("map-unclaimed.png", { maxDiffPixelRatio: 0 });
});

test("asks for a name when a sektor is claimed from the map", async ({ page }) => {
  await storeSektor(page, "Gamma", null);
  await page.goto("/sektor.html?name=Gamma");

  await page.locator("#map-claim-button").click();

  await expect(page.locator("#name-dialog")).toHaveScreenshot("name-dialog-from-map.png", { maxDiffPixelRatio: 0 });
});

test("makes the player the owner of a sektor claimed from the map", async ({ page }) => {
  await claimFromMap(page, "Gamma", "Sunset Flats");

  const claim = await page.evaluate(() => ({
    owners: JSON.parse(localStorage.getItem("sektorOwners")!),
    names: JSON.parse(localStorage.getItem("sektorNames")!),
  }));
  expect(claim).toEqual({ owners: { Gamma: CURRENT_PLAYER }, names: { Gamma: "Sunset Flats" } });
});

test("stays on the map with the building toolbar once the sektor is claimed", async ({ page }) => {
  await claimFromMap(page, "Gamma", "Sunset Flats");

  await expect(page.locator("#construction-panel")).toBeVisible();
});

test("shows the claimed sektor under its new name, with nothing left to claim", async ({ page }) => {
  await claimFromMap(page, "Gamma", "Sunset Flats");

  await expect(page.locator("#sektor-header")).toHaveScreenshot("map-claimed.png", { maxDiffPixelRatio: 0 });
});

async function claimFromMap(page: import("@playwright/test").Page, sektorName: string, givenName: string) {
  await storeSektor(page, sektorName, null);
  await page.goto(`/sektor.html?name=${sektorName}`);
  await page.locator("#map-claim-button").click();
  await page.locator("#sektor-name-input").fill(givenName);
  await page.locator("#name-ok-button").click();
  await page.locator("#name-dialog").waitFor({ state: "detached" });
}

test("draws the buildings of a sektor shown in view mode", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER, [
    { type: "Habitats", location: { x: 4, y: 4 } },
    { type: "Agriplot", location: { x: 5, y: 5 } },
  ]);

  await page.goto("/sektor.html?name=Beta");

  await expectScreenshot(page, "view-mode-buildings");
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
  await page.goto("/sektor.html?name=Alpha");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });

  await page.locator('.building-item[data-building-name="Habitats"]').click();
  const canvas = page.locator("#canvas-container > canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.locator("#done-dialog").waitFor();
}

async function storeSektor(page: import("@playwright/test").Page, sektorName: string, owner: string | null, buildings: object[] = [], exportRequirements: object[] = []) {
  await page.evaluate(([sektorName, owner, buildings, exportRequirements]) => {
    const emptyGrid = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0));
    localStorage.setItem(`sektor_${sektorName}`, JSON.stringify({
      locationProperties: { soil: emptyGrid, groundwater: emptyGrid, ore: emptyGrid, insolation: emptyGrid, wind: emptyGrid },
      importRestrictions: [],
      exportRequirements,
      buildings,
    }));
    localStorage.setItem("sektors", JSON.stringify([{ name: sektorName }]));
    localStorage.setItem("sektorOwners", JSON.stringify(owner ? { [sektorName as string]: owner } : {}));
  }, [sektorName, owner, buildings, exportRequirements] as [string, string | null, object[], object[]]);
}
