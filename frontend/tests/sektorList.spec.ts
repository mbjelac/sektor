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

// A sektor nobody has claimed is nobody's work, so the list calls it idle instead of saying how far
// along it is. Alpha and Beta are owned, Gamma is not.
test("shows a sektor nobody has claimed as idle", async ({ page }) => {
  const statuses = await page.locator(".sektor-list-item .sektor-list-status").allTextContents();

  expect(statuses).toEqual(["In progress", "In progress", "Idle"]);
});

// Each of the four states a sektor can be in is said in a color of its own, so that a player picks
// the ones needing them out of a long list without reading it: one nobody has claimed, one still
// short of what it is asked for, one which has met it, and one taking in more than it is allowed.
test("shows every state a sektor can be in", async ({ page }) => {
  await storeSektorInEveryState(page);

  await page.goto("/?test=true");

  await expect(page.locator("#sektor-list")).toHaveScreenshot("sektor-list-statuses.png", { maxDiffPixelRatio: 0 });
});

// One mine on one piece of ore in every sektor, which takes in Energy 4 and puts out ore. What the
// sektor is asked for, and what it is allowed to take in, is what tells the four apart — the
// unclaimed one is asked for nothing and would be done, were it anybody's.
async function storeSektorInEveryState(page: Page) {
  await page.evaluate(currentPlayer => {
    const sektorsByState = {
      Unclaimed: { owner: null, importRestrictions: [], exportRequirements: [] },
      BuiltOn: { owner: currentPlayer, importRestrictions: [], exportRequirements: [{ name: "Ore", value: 999 }] },
      Finished: { owner: currentPlayer, importRestrictions: [], exportRequirements: [{ name: "Ore", value: 1 }] },
      Overtaking: { owner: currentPlayer, importRestrictions: [{ name: "Energy", value: 1 }], exportRequirements: [] },
    };
    localStorage.setItem("sektors", JSON.stringify(
      Object.entries(sektorsByState).map(([sektorName, sektor]) => ({ id: sektorName, name: sektorName, owner: sektor.owner }))
    ));
    for (const [sektorName, sektor] of Object.entries(sektorsByState)) {
      localStorage.setItem(`sektor_${sektorName}`, JSON.stringify({
        level: 1,
        locationProperties: { ore: [[20]] },
        importRestrictions: sektor.importRestrictions,
        exportRequirements: sektor.exportRequirements,
        buildings: [{ type: "TestMine", location: { x: 0, y: 0 } }],
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
        locationProperties: {},
        importRestrictions: [],
        exportRequirements: [],
        buildings: [],
      }));
    }
  }, [CURRENT_PLAYER, unfinishedSektorIds, doneSektorIds]);
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

test("gives every sektor it makes a level and something to deliver", async ({ page }) => {
  await page.goto("/?test=true");

  await createSektorNow(page);

  const sektorData = await page.evaluate(() => JSON.parse(localStorage.getItem("sektor_0")!));
  expect({
    hasLevel: Number.isInteger(sektorData.level),
    requires: sektorData.exportRequirements.length > 0,
    buildings: sektorData.buildings,
  }).toEqual({ hasLevel: true, requires: true, buildings: [] });
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
