import { test, expect, Page } from "@playwright/test";

const CURRENT_PLAYER = "Tester";
const OTHER_PLAYER = "Ana";

test.beforeEach(async ({ page }) => {
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
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();
  await page.locator("#sektor-name-input").fill("Gamma");
  await page.locator("#name-ok-button").click();
  await page.waitForURL(/\/sektor\.html\?id=Gamma$/);

  expect({ sektors: await getStoredSektors(page), path: new URL(page.url()).pathname }).toEqual({
    sektors: [
      { id: "Alpha", name: "Alpha", owner: CURRENT_PLAYER },
      { id: "Beta", name: "Beta", owner: OTHER_PLAYER },
      { id: "Gamma", name: "Gamma", owner: CURRENT_PLAYER },
    ],
    path: "/sektor.html",
  });
});

test("asks for a name when a sektor is claimed", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await expect(page.locator("#name-dialog")).toHaveScreenshot("name-dialog.png", { maxDiffPixelRatio: 0 });
});

test("offers the name it was left with when a named sektor is claimed again", async ({ page }) => {
  await nameStoredSektor(page, "Gamma", "Old Gamma");
  await page.reload();

  await page.locator(".sektor-list-item", { hasText: "Old Gamma" }).locator(".sektor-list-claim").click();

  await expect(page.locator("#sektor-name-input")).toHaveValue("Old Gamma");
});

test("names the sektor the player claims", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").fill("Marko's Place");
  await page.locator("#name-ok-button").click();
  await page.waitForURL(/\/sektor\.html\?id=Gamma$/);

  expect(await getStoredSektors(page)).toEqual([
    { id: "Alpha", name: "Alpha", owner: CURRENT_PLAYER },
    { id: "Beta", name: "Beta", owner: OTHER_PLAYER },
    { id: "Gamma", name: "Marko's Place", owner: CURRENT_PLAYER },
  ]);
});

test("leaves the sektor alone when claiming is cancelled", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await page.locator("#name-cancel-button").click();

  await expect(page.locator("#name-dialog")).toHaveCount(0);
});

test("keeps the sektor unclaimed when claiming is cancelled", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await page.locator("#name-cancel-button").click();

  expect(await getStoredSektors(page)).toEqual([
    { id: "Alpha", name: "Alpha", owner: CURRENT_PLAYER },
    { id: "Beta", name: "Beta", owner: OTHER_PLAYER },
    { id: "Gamma", name: null, owner: null },
  ]);
});

test("takes no more than thirty characters of a name", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").pressSequentially("123456789012345678901234567890TOOMUCH");

  await expect(page.locator("#sektor-name-input")).toHaveValue("123456789012345678901234567890");
});

test("warns that a name is taken by another sektor", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").fill("Alpha");

  await expect(page.locator("#name-dialog")).toHaveScreenshot("name-dialog-name-taken.png", { maxDiffPixelRatio: 0 });
});

test("refuses a name taken by another sektor", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").fill("Alpha");

  await expect(page.locator("#name-ok-button")).toBeDisabled();
});

test("takes a name again once it is no longer the taken one", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").fill("Alpha");
  await page.locator("#sektor-name-input").fill("Alphabet");

  await expect(page.locator("#name-ok-button")).toBeEnabled();
});

test("keeps the name a sektor already carries when it is claimed again", async ({ page }) => {
  await nameStoredSektor(page, "Gamma", "Old Gamma");
  await page.reload();

  await page.locator(".sektor-list-item", { hasText: "Old Gamma" }).locator(".sektor-list-claim").click();

  await expect(page.locator("#name-ok-button")).toBeEnabled();
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
  // The whole life of a name: the sektor is claimed and named, then given up, then claimed again.
  await page.locator(".sektor-list-item", { hasText: "No name" }).locator(".sektor-list-claim").click();
  await page.locator("#sektor-name-input").fill("Sunset Flats");
  await page.locator("#name-ok-button").click();
  await page.waitForURL(/\/sektor\.html\?id=Gamma$/);

  await page.goto("/");
  await page.locator(".sektor-list-item", { hasText: "Sunset Flats" }).locator(".sektor-list-abandon").click();
  await page.locator("#abandon-yes-button").click();

  await page.locator(".sektor-list-item", { hasText: "Sunset Flats" }).locator(".sektor-list-claim").click();

  await expect(page.locator("#sektor-name-input")).toHaveValue("Sunset Flats");
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
  return page.evaluate(() => (window as unknown as { createSektorIfNeeded: () => boolean }).createSektorIfNeeded());
}

test("makes a new sektor and puts it on the list", async ({ page }) => {
  await page.goto("/?test=true");

  const created = await createSektorNow(page);

  const sektors = await getStoredSektors(page);
  expect({ created, sektorIds: sektors.map((sektor: { id: string }) => sektor.id) })
    .toEqual({ created: true, sektorIds: ["Alpha", "Beta", "Gamma", "0"] });
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
