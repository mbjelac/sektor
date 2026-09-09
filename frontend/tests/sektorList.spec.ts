import { test, expect, Page } from "@playwright/test";

const CURRENT_PLAYER = "Tester";
const OTHER_PLAYER = "Ana";

test.beforeEach(async ({ page }) => {
  // Stored from the login page, so that the storage is not put back to these sektors again on
  // every later navigation.
  await page.goto("/login.html");
  await page.evaluate(([currentPlayer, otherPlayer]) => {
    localStorage.setItem("username", currentPlayer!);
    localStorage.setItem("sektors", JSON.stringify([{ name: "Alpha" }, { name: "Beta" }, { name: "Gamma" }]));
    localStorage.setItem("sektorOwners", JSON.stringify({ Alpha: currentPlayer, Beta: otherPlayer }));
  }, [CURRENT_PLAYER, OTHER_PLAYER]);
  await page.goto("/");
});

test("shows the owner of every sektor", async ({ page }) => {
  await expect(page.locator("#sektor-list")).toHaveScreenshot("sektor-list-owners.png", { maxDiffPixelRatio: 0 });
});

test("makes the player the owner of a sektor they claim and opens it", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Gamma" }).locator(".sektor-list-claim").click();
  await page.locator("#sektor-name-input").fill("Gamma");
  await page.locator("#name-ok-button").click();
  await page.waitForURL(/\/sektor\.html\?name=Gamma$/);

  const owners = await page.evaluate(() => JSON.parse(localStorage.getItem("sektorOwners")!));
  expect({ owners, path: new URL(page.url()).pathname })
    .toEqual({ owners: { Alpha: CURRENT_PLAYER, Beta: OTHER_PLAYER, Gamma: CURRENT_PLAYER }, path: "/sektor.html" });
});

test("asks for a name when a sektor is claimed", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Gamma" }).locator(".sektor-list-claim").click();

  await expect(page.locator("#name-dialog")).toHaveScreenshot("name-dialog.png", { maxDiffPixelRatio: 0 });
});

test("offers the name it was left with when a named sektor is claimed again", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("sektorNames", JSON.stringify({ Gamma: "Old Gamma" })));
  await page.reload();

  await page.locator(".sektor-list-item", { hasText: "Old Gamma" }).locator(".sektor-list-claim").click();

  await expect(page.locator("#sektor-name-input")).toHaveValue("Old Gamma");
});

test("names the sektor the player claims", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Gamma" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").fill("Marko's Place");
  await page.locator("#name-ok-button").click();
  await page.waitForURL(/\/sektor\.html\?name=Gamma$/);

  const givenNames = await page.evaluate(() => JSON.parse(localStorage.getItem("sektorNames")!));
  expect(givenNames).toEqual({ Gamma: "Marko's Place" });
});

test("takes no more than thirty characters of a name", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Gamma" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").pressSequentially("123456789012345678901234567890TOOMUCH");

  await expect(page.locator("#sektor-name-input")).toHaveValue("123456789012345678901234567890");
});

test("warns that a name is taken by another sektor", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Gamma" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").fill("Alpha");

  await expect(page.locator("#name-dialog")).toHaveScreenshot("name-dialog-name-taken.png", { maxDiffPixelRatio: 0 });
});

test("refuses a name taken by another sektor", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Gamma" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").fill("Alpha");

  await expect(page.locator("#name-ok-button")).toBeDisabled();
});

test("takes a name again once it is no longer the taken one", async ({ page }) => {
  await page.locator(".sektor-list-item", { hasText: "Gamma" }).locator(".sektor-list-claim").click();

  await page.locator("#sektor-name-input").fill("Alpha");
  await page.locator("#sektor-name-input").fill("Alphabet");

  await expect(page.locator("#name-ok-button")).toBeEnabled();
});

test("keeps the name a sektor already carries when it is claimed again", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("sektorNames", JSON.stringify({ Gamma: "Old Gamma" })));
  await page.reload();

  await page.locator(".sektor-list-item", { hasText: "Old Gamma" }).locator(".sektor-list-claim").click();

  await expect(page.locator("#name-ok-button")).toBeEnabled();
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
async function storeSektors(page: Page, unfinishedSektorNames: string[], doneSektorNames: string[]) {
  await page.evaluate(([currentPlayer, unfinishedSektorNames, doneSektorNames]) => {
    const ownedSektorNames = [...unfinishedSektorNames as string[], ...doneSektorNames as string[]];
    localStorage.setItem("sektors", JSON.stringify([...ownedSektorNames, "Free"].map(name => ({ name }))));
    localStorage.setItem("sektorOwners", JSON.stringify(
      Object.fromEntries(ownedSektorNames.map(name => [name, currentPlayer]))
    ));
    for (const doneSektorName of doneSektorNames as string[]) {
      localStorage.setItem(`sektor_${doneSektorName}`, JSON.stringify({
        locationProperties: {},
        importRestrictions: [],
        exportRequirements: [],
        buildings: [],
      }));
    }
  }, [CURRENT_PLAYER, unfinishedSektorNames, doneSektorNames]);
}
