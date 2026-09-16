import { test, expect, Page } from "@playwright/test";

const CURRENT_PLAYER = "Tester";
const OTHER_PLAYER = "Ana";
// The name every sektor made by a test is given. It is laid out for the page to take, so that no
// test waits on the word service or is surprised by what it answers.
const PREPARED_SEKTOR_NAME = "quiet-harvest";

test.beforeEach(async ({ page }) => {
  await prepareSektorNames(page, [PREPARED_SEKTOR_NAME]);
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

// The names a page makes sektors with, laid out before anything of it loads, as only a name put
// there before the page runs can be taken by the first sektor it makes.
function prepareSektorNames(page: Page, sektorNames: string[]) {
  return page.addInitScript(
    sektorNames => { (window as unknown as { preparedSektorNames: string[] }).preparedSektorNames = sektorNames; },
    sektorNames,
  );
}

test("shows the owner of every sektor", async ({ page }) => {
  await expect(page.locator("#sektor-list")).toHaveScreenshot("sektor-list-owners.png", { maxDiffPixelRatio: 0 });
});

// A sektor is as big as it was made, and the list says which of the four sizes that is, so that a
// player can tell a handful of tiles from the whole hundred before opening anything.
test("names the size of the map of every sektor", async ({ page }) => {
  await storeSektorOfEverySize(page);

  await page.goto("/");

  await expect(page.locator("#sektor-list")).toHaveScreenshot("sektor-list-sizes.png", { maxDiffPixelRatio: 0 });
});

// The sektors are named after nothing in particular, so that what the list shows of their size can
// only have come from the size they were stored with.
async function storeSektorOfEverySize(page: Page) {
  await page.evaluate(currentPlayer => {
    const sektorSizes = { Alpha: 4, Beta: 6, Gamma: 8, Delta: 10 };
    localStorage.setItem("sektors", JSON.stringify(
      Object.keys(sektorSizes).map(sektorName => ({ id: sektorName, name: sektorName, owner: currentPlayer }))
    ));
    for (const [sektorName, size] of Object.entries(sektorSizes)) {
      localStorage.setItem(`sektor_${sektorName}`, JSON.stringify({
        level: 1,
        size,
        allowedBuildings: [],
        locationProperties: {},
        importRestrictions: [],
        exportRequirements: [],
        buildings: [],
      }));
    }
  }, CURRENT_PLAYER);
}

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

test("stops the player from claiming more than five unfinished sektors", async ({ page }) => {
  await storeSektors(page, ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"], []);

  await page.goto("/");

  await expect(page.locator(".sektor-list-claim")).toBeDisabled();
});

test("shows the disabled claim button of a player with five unfinished sektors", async ({ page }) => {
  await storeSektors(page, ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"], []);

  await page.goto("/");

  await expect(page.locator("#sektor-list")).toHaveScreenshot("sektor-list-claiming-disabled.png", { maxDiffPixelRatio: 0 });
});

test("lets the player claim again once one of their five sektors is done", async ({ page }) => {
  await storeSektors(page, ["Alpha", "Beta", "Gamma", "Delta"], ["Epsilon"]);

  await page.goto("/");

  await expect(page.locator(".sektor-list-claim")).toBeEnabled();
});

// The player owns every sektor named here, plus an unclaimed "Free" one to claim. A sektor with
// no requirements left to meet is done, one without any stored data is still in progress.
async function storeSektors(page: Page, unfinishedSektorIds: string[], doneSektorIds: string[]) {
  await page.evaluate(([currentPlayer, unfinishedSektorIds, doneSektorIds]) => {
    const ownedSektorIds = [...unfinishedSektorIds as string[], ...doneSektorIds as string[]];
    localStorage.setItem("sektors", JSON.stringify([
      ...ownedSektorIds.map(sektorId => ({ id: sektorId, name: sektorId, owner: currentPlayer })),
      { id: "Free", name: null, owner: null },
    ]));
    for (const doneSektorId of doneSektorIds as string[]) {
      localStorage.setItem(`sektor_${doneSektorId}`, JSON.stringify({
        level: 1,
        allowedBuildings: [],
        locationProperties: {},
        importRestrictions: [],
        exportRequirements: [],
        buildings: [],
      }));
    }
  }, [CURRENT_PLAYER, unfinishedSektorIds, doneSektorIds]);
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
      allowedBuildings: ["TestMine"],
      locationProperties: { ore: (oreAmounts as number[]).map(oreAmount => [oreAmount]) },
      importRestrictions: [],
      exportRequirements: [],
      buildings: (oreAmounts as number[]).map((oreAmount, oreIndex) => ({
        type: "TestMine",
        location: { x: oreIndex, y: 0 },
      })),
    }));
  }, [sektorName, oreAmounts] as [string, number[]]);
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

test("gives every sektor it makes a level and a palette of buildings", async ({ page }) => {
  await page.goto("/?test=true");

  await createSektorNow(page);

  const sektorData = await page.evaluate(() => JSON.parse(localStorage.getItem("sektor_0")!));
  expect({
    hasLevel: Number.isInteger(sektorData.level),
    allowsBuildings: sektorData.allowedBuildings.length > 0,
    requires: sektorData.exportRequirements.length > 0,
    buildings: sektorData.buildings,
  }).toEqual({ hasLevel: true, allowsBuildings: true, requires: true, buildings: [] });
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

  await page.locator("#purge-button").click();

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
