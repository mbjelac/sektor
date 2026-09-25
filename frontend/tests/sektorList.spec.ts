import { test, expect, Page } from "@playwright/test";
import { makeSektorsByHand, prepareSektorNames } from "./test-utils";

const CURRENT_PLAYER = "Tester";
const OTHER_PLAYER = "Ana";
// The name every sektor made by a test is given. It is laid out for the page to take, so that no
// test waits on the word service or is surprised by what it answers.
const PREPARED_SEKTOR_NAME = "quiet-harvest";

test.beforeEach(async ({ page }) => {
  await prepareSektorNames(page, [PREPARED_SEKTOR_NAME]);
  await makeSektorsByHand(page);
  // Stored from the login page, so that the storage is not put back to these sektors again on
  // every later navigation.
  await page.goto("/login.html");
  await page.evaluate(([currentPlayer, otherPlayer]) => {
    localStorage.setItem("username", currentPlayer!);
    localStorage.setItem("sektors", JSON.stringify([
      { id: "Alpha", name: "Alpha", owner: currentPlayer },
      { id: "Beta", name: "Beta", owner: otherPlayer },
      { id: "Gamma", name: null, owner: null },
    ]));
  }, [CURRENT_PLAYER, OTHER_PLAYER]);
  await page.goto("/");
});

test("shows the owner of every sektor", async ({ page }) => {
  await expect(page.locator("#sektor-list")).toHaveScreenshot("sektor-list-owners.png", { maxDiffPixelRatio: 0 });
});

test("makes the player the owner of a sektor they claim and opens it", async ({ page }) => {
  await nameStoredSektor(page, "Gamma", "quiet-harvest");
  await page.reload();

  await page.locator(".sektor-list-item", { hasText: "quiet-harvest" }).locator(".sektor-list-claim").click();
  await page.locator("#claim-yes-button").click();
  await page.waitForURL(/\/sektor\.html\?id=Gamma$/);

  expect({ sektors: await getStoredSektors(page), path: new URL(page.url()).pathname }).toEqual({
    sektors: [
      { id: "Alpha", name: "Alpha", owner: CURRENT_PLAYER },
      { id: "Beta", name: "Beta", owner: OTHER_PLAYER },
      { id: "Gamma", name: "quiet-harvest", owner: CURRENT_PLAYER },
    ],
    path: "/sektor.html",
  });
});

// A sektor already has a name when it is offered, so claiming it asks for nothing but a yes.
test("asks the player to confirm claiming a sektor", async ({ page }) => {
  await nameStoredSektor(page, "Gamma", "quiet-harvest");
  await page.reload();

  await page.locator(".sektor-list-item", { hasText: "quiet-harvest" }).locator(".sektor-list-claim").click();

  await expect(page.locator("#claim-dialog")).toHaveScreenshot("claim-dialog.png", { maxDiffPixelRatio: 0 });
});

test("leaves the sektor alone when claiming is cancelled", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await page.locator("#claim-no-button").click();

  await expect(page.locator("#claim-dialog")).toHaveCount(0);
});

test("keeps the sektor unclaimed when claiming is cancelled", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await page.locator("#claim-no-button").click();

  expect(await getStoredSektors(page)).toEqual([
    { id: "Alpha", name: "Alpha", owner: CURRENT_PLAYER },
    { id: "Beta", name: "Beta", owner: OTHER_PLAYER },
    { id: "Gamma", name: null, owner: null },
  ]);
});

test("shows an abandon button only on the sektors of the player", async ({ page }) => {
  await expect(page.locator("#sektor-list")).toHaveScreenshot("sektor-list-abandon.png", { maxDiffPixelRatio: 0 });
});

test("asks the player to confirm abandoning a sektor", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Alpha" }).locator(".sektor-list-abandon").click();

  await expect(page.locator("#abandon-dialog")).toHaveScreenshot("abandon-dialog.png", { maxDiffPixelRatio: 0 });
});

test("keeps the sektor when abandoning it is not confirmed", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Alpha" }).locator(".sektor-list-abandon").click();
  await page.locator("#abandon-no-button").click();

  expect(await getStoredSektors(page)).toEqual([
    { id: "Alpha", name: "Alpha", owner: CURRENT_PLAYER },
    { id: "Beta", name: "Beta", owner: OTHER_PLAYER },
    { id: "Gamma", name: null, owner: null },
  ]);
});

test("leaves an abandoned sektor without an owner", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Alpha" }).locator(".sektor-list-abandon").click();
  await page.locator("#abandon-yes-button").click();
  await page.locator(".sektor-list-item", { hasText: "Alpha" }).locator(".sektor-list-claim").waitFor();

  expect(await getStoredSektors(page)).toEqual([
    { id: "Alpha", name: "Alpha", owner: null },
    { id: "Beta", name: "Beta", owner: OTHER_PLAYER },
    { id: "Gamma", name: null, owner: null },
  ]);
});

// Everything known about a sektor apart from what stands in it: its id, the name it was given, and
// the player who owns it.
function getStoredSektors(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("sektors")!));
}

// A sektor named by a player who has since given it up, as it stands before the test begins.
async function nameStoredSektor(page: Page, sektorId: string, givenName: string) {
  await page.evaluate(([sektorId, givenName]) => {
    const sektors = JSON.parse(localStorage.getItem("sektors")!);
    localStorage.setItem("sektors", JSON.stringify(sektors.map((sektor: { id: string }) =>
      sektor.id === sektorId ? { ...sektor, name: givenName } : sektor
    )));
  }, [sektorId, givenName]);
}

test("offers an abandoned sektor for claiming under the name it was left with", async ({ page }) => {
  // The whole life of a name: the sektor is claimed, then given up, then offered again, carrying
  // the same name throughout.
  await nameStoredSektor(page, "Gamma", "Sunset Flats");
  await page.reload();
  await page.locator(".sektor-list-item", { hasText: "Sunset Flats" }).locator(".sektor-list-claim").click();
  await page.locator("#claim-yes-button").click();
  await page.waitForURL(/\/sektor\.html\?id=Gamma$/);

  await page.goto("/");
  await page.locator(".sektor-list-item", { hasText: "Sunset Flats" }).locator(".sektor-list-abandon").click();
  await page.locator("#abandon-yes-button").click();

  await page.locator(".sektor-list-item", { hasText: "Sunset Flats" }).locator(".sektor-list-claim").click();

  await expect(page.locator("#claim-dialog .dialog-title")).toHaveText("Sunset Flats");
});

test("shows an abandoned sektor as owned by nobody", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Alpha" }).locator(".sektor-list-abandon").click();
  await page.locator("#abandon-yes-button").click();
  await page.locator(".sektor-list-item", { hasText: "Alpha" }).locator(".sektor-list-claim").waitFor();

  await expect(page.locator("#sektor-list")).toHaveScreenshot("sektor-list-abandoned.png", { maxDiffPixelRatio: 0 });
});

// A player may hold any number of sektors and still claim another.
test("lets the player claim however many sektors they hold", async ({ page }) => {
  await storeSektors(page, ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"]);

  await page.goto("/");

  await expect(page.locator(".sektor-list-claim")).toBeEnabled();
});

// The player owns every sektor named here, plus an unclaimed "Free" one to claim.
async function storeSektors(page: Page, ownedSektorIds: string[]) {
  await page.evaluate(([currentPlayer, ownedSektorIds]) => {
    localStorage.setItem("sektors", JSON.stringify([
      ...(ownedSektorIds as string[]).map(sektorId => ({ id: sektorId, name: sektorId, owner: currentPlayer })),
      { id: "Free", name: null, owner: null },
    ]));
  }, [CURRENT_PLAYER, ownedSektorIds]);
}

// More sektors than the window holds are scrolled through on their own: the standings beside them
// stay put, and no bar is drawn down the side of them.
test("scrolls the sektors on their own, without a bar and without moving the standings", async ({ page }) => {
  await storeManySektors(page, 40);

  await page.goto("/");

  const standingsBeforeScrolling = await page.locator("#leaderboard").boundingBox();
  const scrolling = await page.locator("#sektor-list").evaluate(sektorList => {
    sektorList.scrollTop = sektorList.scrollHeight;
    return {
      scrolledPast: sektorList.scrollTop > 0,
      taller: sektorList.scrollHeight > sektorList.clientHeight,
      // A bar takes room from the sektors beside it, so a list which is not narrower than it is
      // wide has none drawn.
      barWidth: sektorList.offsetWidth - sektorList.clientWidth,
    };
  });
  const standingsAfterScrolling = await page.locator("#leaderboard").boundingBox();

  expect({ ...scrolling, standingsMoved: standingsBeforeScrolling!.y !== standingsAfterScrolling!.y })
    .toEqual({ scrolledPast: true, taller: true, barWidth: 0, standingsMoved: false });
});

// The header says what each column of a sektor holds, so it stays at the top of the list while the
// sektors are scrolled past it rather than going out of sight with the first of them.
test("keeps the header in sight while the sektors are scrolled past it", async ({ page }) => {
  await storeManySektors(page, 40);

  await page.goto("/");

  const listTop = (await page.locator("#sektor-list").boundingBox())!.y;
  const headerTopBeforeScrolling = (await page.locator(".sektor-list-header").boundingBox())!.y;
  await page.locator("#sektor-list").evaluate(sektorList => {
    sektorList.scrollTop = sektorList.scrollHeight;
  });
  const headerTopAfterScrolling = (await page.locator(".sektor-list-header").boundingBox())!.y;

  expect({ headerTopBeforeScrolling, headerTopAfterScrolling })
    .toEqual({ headerTopBeforeScrolling: listTop, headerTopAfterScrolling: listTop });
});

// More sektors than any window shows at once, every one of them the player's own.
async function storeManySektors(page: Page, sektorCount: number) {
  await page.evaluate(([currentPlayer, sektorCount]) => {
    localStorage.setItem("sektors", JSON.stringify(
      Array.from({ length: sektorCount as number }, (_, sektorIndex) => ({
        id: `sektor${sektorIndex}`, name: `sektor-${sektorIndex}`, owner: currentPlayer,
      }))
    ));
  }, [CURRENT_PLAYER, sektorCount] as [string, number]);
}

test("shows every player on the leaderboard", async ({ page }) => {
  await storeMiningSektor(page, "Alpha", [20, 30, 40]);
  await storeMiningSektor(page, "Beta", [10]);

  await page.goto("/?test=true");

  await expect(page.locator("#leaderboard")).toHaveScreenshot("leaderboard.png", { maxDiffPixelRatio: 0 });
});

test("shows the whole list page with the leaderboard beside the sektors", async ({ page }) => {
  await expect(page.locator("#list-page")).toHaveScreenshot("list-page.png", { maxDiffPixelRatio: 0 });
});

// A sektor of mines, one on every piece of ore given, which the mines turn into an export the
// sektor scores for — the more ore, the higher the score its player brings to the leaderboard.
async function storeMiningSektor(page: Page, sektorName: string, oreAmounts: number[]) {
  await page.evaluate(([sektorName, oreAmounts]) => {
    localStorage.setItem(`sektor_${sektorName}`, JSON.stringify({
      level: 1,
      locationProperties: { ore: (oreAmounts as number[]).map(oreAmount => [oreAmount]) },
      buildings: (oreAmounts as number[]).map((oreAmount, oreIndex) => ({
        type: "TestMine",
        location: { x: oreIndex, y: 0 },
      })),
    }));
  }, [sektorName, oreAmounts] as [string, number[]]);
}

// What every sektor brings in and sends out, added up into what the whole planet moves, stands in
// the corner of the list of sektors.
test("shows what the whole planet brings in and sends out", async ({ page }) => {
  await storeSektorWithBuildings(page, "Alpha", ["TestMine"], 6);
  await storeSektorWithBuildings(page, "Beta", ["TestProcessor"]);
  await storeSektorWithBuildings(page, "Gamma", ["TestHouse"]);

  await page.goto("/?test=true");

  await expect(page.locator("#global-state-panel"))
    .toHaveScreenshot("global-imports-and-exports.png", { maxDiffPixelRatio: 0 });
});

// A sektor counts towards what the planet moves whoever owns it: Alpha is the player's own, Beta is
// somebody else's, and Gamma is nobody's, and the Food the house on Gamma eats is short on the
// planet all the same.
test("counts every sektor into what the planet moves, whoever owns it", async ({ page }) => {
  await storeSektorWithBuildings(page, "Alpha", ["TestMine"], 6);
  await storeSektorWithBuildings(page, "Beta", ["TestProcessor"]);
  await storeSektorWithBuildings(page, "Gamma", ["TestHouse"]);

  await page.goto("/?test=true");

  expect(await getGlobalThroughputRows(page)).toEqual([
    { resource: "Energy ⚡", imported: "4", exported: "" },
    { resource: "Food 🥕", imported: "4", exported: "" },
    { resource: "Water 💧", imported: "1", exported: "" },
    { resource: "Wood 🪵", imported: "", exported: "3" },
    { resource: "Work 🛠️", imported: "", exported: "3" },
    { resource: "Ore 🪨", imported: "", exported: "6" },
  ]);
});

// What one sektor sends out covers what another brings in, leaving the planet the difference. A
// resource covered exactly is left out of both columns: the reactor on Beta sends out the four
// Energy the mine on Alpha brings in, so the planet is neither short of Energy nor has any over.
test("sets what one sektor sends out against what another brings in", async ({ page }) => {
  await storeSektorWithBuildings(page, "Alpha", ["TestMine"], 6);
  await storeSektorWithBuildings(page, "Beta", ["TestReactor"]);

  await page.goto("/?test=true");

  expect(await getGlobalThroughputRows(page)).toEqual([
    { resource: "Water 💧", imported: "1", exported: "" },
    { resource: "Ore 🪨", imported: "", exported: "6" },
  ]);
});

test("lists nothing while the sektors move nothing", async ({ page }) => {
  await page.goto("/?test=true");

  expect(await getGlobalThroughputRows(page)).toEqual([]);
});

// The panel stands in the corner at the size it has whatever it holds, so that the corner it stands
// in never moves.
test("stands at the same size whatever it holds", async ({ page }) => {
  await page.goto("/?test=true");
  const sizeWhileMovingNothing = await getGlobalPanelSize(page);
  await storeSektorWithBuildings(page, "Alpha", ["TestRefinery", "TestHouse", "TestProcessor"], 6);

  await page.goto("/?test=true");

  expect(await getGlobalPanelSize(page)).toEqual(sizeWhileMovingNothing);
});

// More resources than the page holds are scrolled through in the list itself, so that the page and
// the two lists beside it stay where the player last saw them. The bar for doing it is left
// undrawn: the amounts are what the player is looking at, and a bar down the side of them is not.
test("scrolls the resources on its own, without a bar and without moving the standings", async ({ page }) => {
  await storeSektorWithBuildings(page, "Alpha", ["TestRefinery", "TestHouse", "TestProcessor"], 6);
  await page.setViewportSize({ width: 1280, height: 400 });

  await page.goto("/?test=true");

  const standingsBeforeScrolling = await page.locator("#leaderboard").boundingBox();
  const scrolling = await page.locator("#global-state-panel").evaluate(globalStatePanel => {
    globalStatePanel.scrollTop = globalStatePanel.scrollHeight;
    return {
      taller: globalStatePanel.scrollHeight > globalStatePanel.clientHeight,
      scrolledPast: globalStatePanel.scrollTop > 0,
      barWidth: globalStatePanel.offsetWidth - globalStatePanel.clientWidth,
    };
  });
  const standingsAfterScrolling = await page.locator("#leaderboard").boundingBox();

  expect({ ...scrolling, standingsMoved: standingsBeforeScrolling!.y !== standingsAfterScrolling!.y })
    .toEqual({ taller: true, scrolledPast: true, barWidth: 0, standingsMoved: false });
});

// The header names the list and its columns, so it stays at the top of the resources while they are
// scrolled past it rather than going out of sight with the first of them.
test("keeps the header of the planet's resources in sight while they are scrolled past it", async ({ page }) => {
  await storeSektorWithBuildings(page, "Alpha", ["TestRefinery", "TestHouse", "TestProcessor"], 6);
  await page.setViewportSize({ width: 1280, height: 400 });

  await page.goto("/?test=true");

  const listTop = (await page.locator("#global-state-panel").boundingBox())!.y;
  const headerTopBeforeScrolling = (await page.locator(".global-state-header").boundingBox())!.y;
  await page.locator("#global-state-panel").evaluate(globalStatePanel => {
    globalStatePanel.scrollTop = globalStatePanel.scrollHeight;
  });
  const headerTopAfterScrolling = (await page.locator(".global-state-header").boundingBox())!.y;

  expect({ headerTopBeforeScrolling, headerTopAfterScrolling })
    .toEqual({ headerTopBeforeScrolling: listTop, headerTopAfterScrolling: listTop });
});

// What a sektor moves is what the planet moves, so a building put up on the map is felt on the list
// the player goes back to: the processor eats Food the planet has none of and makes Wood nobody was
// making.
test("shows what a building put up in a sektor does to what the planet moves", async ({ page }) => {
  await page.goto("/sektor.html?id=Alpha&test=true");
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-item[data-building-name="TestProcessor"]').click();
  const canvas = page.locator("#canvas-container > canvas");
  const canvasBox = await canvas.boundingBox();
  await canvas.click({ position: { x: canvasBox!.width / 2, y: canvasBox!.height / 2 } });

  await page.goto("/?test=true");

  expect(await getGlobalThroughputRows(page)).toEqual([
    { resource: "Food 🥕", imported: "2", exported: "" },
    { resource: "Wood 🪵", imported: "", exported: "3" },
  ]);
});

// A player looking for what the planet is shortest of, or has most of over, asks for it by clicking
// the column it stands in. The resources stand with the most brought in first until they do.
test("puts the planet's most brought in resources first to begin with", async ({ page }) => {
  await storeSektorWithBuildings(page, "Alpha", ["TestRefinery", "TestHouse", "TestProcessor"], 6);

  await page.goto("/?test=true");

  expect(await getGlobalResourceNames(page))
    .toEqual(["Ore 🪨", "Water 💧", "Food 🥕", "Energy ⚡", "Stone 🧱", "Wood 🪵", "Fuel 🛢️", "Work 🛠️", "Metal ⚙️"]);
});

// The column the resources stand in the order of is named in white, so the player sees what order
// they are looking at.
test("names the column the planet's resources are in the order of in white", async ({ page }) => {
  await storeSektorWithBuildings(page, "Alpha", ["TestRefinery", "TestHouse", "TestProcessor"], 6);
  await page.goto("/?test=true");

  await page.locator('#global-state-panel .global-state-sort[data-sort-order="exported"]').click();

  expect(await getGlobalSortColors(page)).toEqual({
    resource: "rgb(153, 153, 153)",
    imported: "rgb(153, 153, 153)",
    exported: "rgb(255, 255, 255)",
  });
});

test("puts the most sent out first when the exported column is clicked", async ({ page }) => {
  await storeSektorWithBuildings(page, "Alpha", ["TestRefinery", "TestHouse", "TestProcessor"], 6);
  await page.goto("/?test=true");

  await page.locator('#global-state-panel .global-state-sort[data-sort-order="exported"]').click();

  expect(await getGlobalResourceNames(page))
    .toEqual(["Metal ⚙️", "Fuel 🛢️", "Work 🛠️", "Wood 🪵", "Stone 🧱", "Energy ⚡", "Food 🥕", "Ore 🪨", "Water 💧"]);
});

test("puts the planet's resources in the order of their names when the resource column is clicked", async ({ page }) => {
  await storeSektorWithBuildings(page, "Alpha", ["TestRefinery", "TestHouse", "TestProcessor"], 6);
  await page.goto("/?test=true");

  await page.locator('#global-state-panel .global-state-sort[data-sort-order="resource"]').click();

  expect(await getGlobalResourceNames(page))
    .toEqual(["Energy ⚡", "Food 🥕", "Fuel 🛢️", "Metal ⚙️", "Ore 🪨", "Stone 🧱", "Water 💧", "Wood 🪵", "Work 🛠️"]);
});

// The resources of the planet's list, in the order they stand in.
function getGlobalResourceNames(page: Page) {
  return page.locator("#global-state-panel .global-state-item .global-state-resource")
    .evaluateAll(cells => cells.map(cell => cell.textContent));
}

// The colour each column of the planet's list is named in, with the mouse away from all of them.
async function getGlobalSortColors(page: Page) {
  await page.mouse.move(0, 0);
  return page.locator("#global-state-panel .global-state-sort").evaluateAll(sortButtons =>
    Object.fromEntries(sortButtons.map(sortButton =>
      [(sortButton as HTMLElement).dataset.sortOrder, getComputedStyle(sortButton).color]))
  );
}

// A sektor of buildings standing in a row, one to a location, with the same ore under every one of
// them for whatever mines stand there to dig up.
async function storeSektorWithBuildings(page: Page, sektorId: string, buildingTypes: string[], orePerLocation = 0) {
  await page.evaluate(([sektorId, buildingTypes, orePerLocation]) => {
    localStorage.setItem(`sektor_${sektorId}`, JSON.stringify({
      level: 1,
      locationProperties: { ore: (buildingTypes as string[]).map(() => [orePerLocation]) },
      buildings: (buildingTypes as string[]).map((buildingType, buildingIndex) => ({
        type: buildingType,
        location: { x: buildingIndex, y: 0 },
      })),
    }));
  }, [sektorId, buildingTypes, orePerLocation] as [string, string[], number]);
}

// What every resource row of the global panel says: the resource, what the planet brings in of it,
// and what it sends out. A column a resource says nothing in stands empty.
function getGlobalThroughputRows(page: Page) {
  return page.locator(".global-state-item").evaluateAll(items => items.map(item => {
    const cells = item.querySelectorAll("span");
    return {
      resource: cells[0].textContent,
      imported: cells[1].textContent,
      exported: cells[2].textContent,
    };
  }));
}

function getGlobalPanelSize(page: Page) {
  return page.locator("#global-state-panel").evaluate(panel => ({
    width: panel.offsetWidth,
    height: panel.offsetHeight,
  }));
}

// The sektors of a player's own level are made in the background as they are claimed. A test calls
// the making of them itself, rather than sitting out the ten seconds between one round and the next.
function createSektorNow(page: Page) {
  return page.evaluate(() => (window as unknown as { createSektorIfNeeded: () => Promise<boolean> }).createSektorIfNeeded());
}

test("makes a new sektor and puts it on the list", async ({ page }) => {
  await page.goto("/?test=true");

  const created = await createSektorNow(page);

  const sektors = await getStoredSektors(page);
  expect({ created, sektorIds: sektors.map((sektor: { id: string }) => sektor.id) })
    .toEqual({ created: true, sektorIds: ["Alpha", "Beta", "Gamma", "0"] });
});

// A sektor is made with a name of its own, so that a player never has to think one up.
test("names every sektor it makes", async ({ page }) => {
  await page.goto("/?test=true");

  await createSektorNow(page);

  const sektors = await getStoredSektors(page);
  expect(sektors.map((sektor: { id: string; name: string | null }) => ({ id: sektor.id, name: sektor.name })))
    .toEqual([
      { id: "Alpha", name: "Alpha" },
      { id: "Beta", name: "Beta" },
      { id: "Gamma", name: null },
      { id: "0", name: PREPARED_SEKTOR_NAME },
    ]);
});

// The one test which goes the way the game itself goes: no name is laid out for the page, so the
// word service is asked for two words, which the test answers in place of the network.
test("names a sektor after two words of the word service", async ({ page }) => {
  await prepareSektorNames(page, []);
  await page.route("https://random-word-api.herokuapp.com/**", route => route.fulfill({ json: ["quiet", "harvest"] }));
  await page.goto("/?test=true");

  await createSektorNow(page);

  const sektors = await getStoredSektors(page);
  expect(sektors.map((sektor: { id: string; name: string | null }) => sektor.name))
    .toEqual(["Alpha", "Beta", null, "quiet-harvest"]);
});

test("numbers every sektor it makes above the last one", async ({ page }) => {
  await page.goto("/?test=true");

  await createSektorNow(page);
  await createSektorNow(page);
  await createSektorNow(page);

  const sektors = await getStoredSektors(page);
  expect(sektors.map((sektor: { id: string }) => sektor.id)).toEqual(["Alpha", "Beta", "Gamma", "0", "1", "2"]);
});

test("gives every sektor it makes a level and empty ground to build on", async ({ page }) => {
  await page.goto("/?test=true");

  await createSektorNow(page);

  const sektorData = await page.evaluate(() => JSON.parse(localStorage.getItem("sektor_0")!));
  expect({
    hasLevel: Number.isInteger(sektorData.level),
    hasGround: Object.keys(sektorData.locationProperties).length > 0,
    buildings: sektorData.buildings,
  }).toEqual({ hasLevel: true, hasGround: true, buildings: [] });
});

test("stops making sektors while ten unclaimed empty ones are waiting", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem(
    "sektors", JSON.stringify(Array.from({ length: 10 }, (_, index) => ({ id: `waiting${index}`, name: null, owner: null })))
  ));
  await page.goto("/?test=true");

  expect(await createSektorNow(page)).toEqual(false);
});

test("purges every sektor there is when PURGE is clicked", async ({ page }) => {
  await page.goto("/?test=true");
  await createSektorNow(page);

  await Promise.all([
    page.waitForEvent("load"),
    page.locator("#purge-button").click(),
  ]);

  const storage = await page.evaluate(() => ({
    sektors: localStorage.getItem("sektors"),
    sektorDataKeys: Object.keys(localStorage).filter(key => key.startsWith("sektor_")),
    rows: document.querySelectorAll(".sektor-list-item").length,
    players: document.querySelectorAll(".leaderboard-item").length,
  }));

  expect(storage).toEqual({ sektors: null, sektorDataKeys: [], rows: 0, players: 0 });
});

test("shows the purge button on the list page", async ({ page }) => {
  await page.goto("/?test=true");

  await expect(page.locator("#purge-button")).toHaveScreenshot("purge-button.png", { maxDiffPixelRatio: 0 });
});
