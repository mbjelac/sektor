import { Page } from "@playwright/test";
import { test, expect, expectScreenshot, makeSektorsByHand } from "./test-utils";

const OTHER_PLAYER = "Ana";
const CURRENT_PLAYER = "Tester";

test.beforeEach(async ({ page }) => {
  // Leaving a finished sektor lands on the sektor list, which is kept from filling by itself.
  await makeSektorsByHand(page);
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

  await expect(page.locator("#notification")).toHaveText("noOwnership");
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

// A sektor is made with a name nobody chose, so the player building on it may put one of their own
// in its place.
test("offers the player a pencil for renaming their own sektor", async ({ page }) => {
  await openOwnSektor(page, "Sunset Flats");

  await expect(page.locator("#sektor-header")).toHaveScreenshot("map-rename-pencil.png", { maxDiffPixelRatio: 0 });
});

// Somebody else's sektor is only being looked at, and what it is called is not the looker's to say.
test("offers no pencil on a sektor the player does not build on", async ({ page }) => {
  await storeSektor(page, "Beta", OTHER_PLAYER);
  await nameStoredSektor(page, "Beta", "Sunset Flats");

  await page.goto("/sektor.html?id=Beta");

  await expect(page.locator("#rename-button")).toHaveCount(0);
});

test("asks for the new name under the one the sektor carries", async ({ page }) => {
  await openOwnSektor(page, "Sunset Flats");

  await page.locator("#rename-button").click();

  await expect(page.locator("#rename-dialog")).toHaveScreenshot("rename-dialog.png", { maxDiffPixelRatio: 0 });
});

test("renames the sektor, and shows it under its new name", async ({ page }) => {
  await openOwnSektor(page, "Sunset Flats");

  await page.locator("#rename-button").click();
  await page.locator("#sektor-name-input").fill("Marko's Place");
  await page.locator("#rename-ok-button").click();

  const storedName = await page.evaluate(() => JSON.parse(localStorage.getItem("sektors")!)[0].name);
  expect({ storedName, shownName: await page.locator("#sektor-name").textContent() })
    .toEqual({ storedName: "Marko's Place", shownName: "Marko's Place" });
});

test("leaves the sektor under its old name when renaming is cancelled", async ({ page }) => {
  await openOwnSektor(page, "Sunset Flats");

  await page.locator("#rename-button").click();
  await page.locator("#sektor-name-input").fill("Marko's Place");
  await page.locator("#rename-cancel-button").click();

  const storedName = await page.evaluate(() => JSON.parse(localStorage.getItem("sektors")!)[0].name);
  expect({ storedName, shownName: await page.locator("#sektor-name").textContent() })
    .toEqual({ storedName: "Sunset Flats", shownName: "Sunset Flats" });
});

// Two sektors cannot go by the same name, though the one being renamed may keep its own.
test("refuses a name another sektor already carries", async ({ page }) => {
  await openOwnSektor(page, "Sunset Flats");
  await addSektorToStoredList(page, "Beta", "Rocky Bottom");
  await page.reload();

  await page.locator("#rename-button").click();
  await page.locator("#sektor-name-input").fill("Rocky Bottom");

  await expect(page.locator("#rename-ok-button")).toBeDisabled();
});

// Another sektor of the list, which is there to have a name of its own and nothing else.
async function addSektorToStoredList(page: Page, sektorId: string, sektorName: string) {
  await page.evaluate(([sektorId, sektorName]) => {
    const sektors = JSON.parse(localStorage.getItem("sektors")!);
    localStorage.setItem("sektors", JSON.stringify([...sektors, { id: sektorId, name: sektorName, owner: null }]));
  }, [sektorId, sektorName]);
}

// The sektor of the player, opened for building on, which is where a sektor may be renamed.
async function openOwnSektor(page: Page, sektorName: string) {
  await storeSektor(page, "Alpha", CURRENT_PLAYER);
  await nameStoredSektor(page, "Alpha", sektorName);
  await page.goto("/sektor.html?id=Alpha");
  await page.locator("#sektor-name").waitFor();
}

// A sektor goes by whatever name the player gave it, which the panels under that name have nothing
// to do with: they are as wide as the building thumbnails they hold, short name or long.
test("keeps the panels under the sektor name as wide as what they hold, however long the name is", async ({ page }) => {
  await openOwnSektor(page, "The Sektor With The Longest Name Of Them All");

  const panelWidths = await page.evaluate(() => ({
    construction: document.getElementById("construction-panel")!.getBoundingClientRect().width,
    geography: document.getElementById("property-toggler")!.getBoundingClientRect().width,
  }));

  expect(panelWidths).toEqual({ construction: 138, geography: 138 });
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

async function storeSektor(page: import("@playwright/test").Page, sektorId: string, owner: string | null, buildings: object[] = []) {
  await page.evaluate(([sektorId, owner, buildings]) => {
    const emptyGrid = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0));
    localStorage.setItem(`sektor_${sektorId}`, JSON.stringify({
      level: 1,
      locationProperties: { soil: emptyGrid, groundwater: emptyGrid, ore: emptyGrid, insolation: emptyGrid, wind: emptyGrid },
      buildings,
    }));
    localStorage.setItem("sektors", JSON.stringify([{ id: sektorId, name: owner ? sektorId : null, owner }]));
  }, [sektorId, owner, buildings] as [string, string | null, object[]]);
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
