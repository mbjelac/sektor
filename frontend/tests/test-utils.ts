import { test, expect, Page } from "@playwright/test";

export { test, expect };

export function setup() {
  test.beforeEach(async ({ page }) => {
    // Every page is only shown to a logged in player, so the tests start out logged in.
    await page.addInitScript(() => localStorage.setItem("username", "Tester"));
    await page.goto("/sektor.html?test=true");
    await page.waitForSelector("canvas");
  });
}

// A sektor list fills with sektors of its own while it is open, each of them named off a word
// service. A list which does that cannot be looked at, as a sektor may appear on it in the middle
// of a test, so a test lays this out before the page loads and makes the sektors it wants itself,
// by calling for them. Nothing in the game lays it out, so a player's list goes on filling on its
// own.
export function makeSektorsByHand(page: Page) {
  return page.addInitScript(() => {
    (window as unknown as { makeSektorsByHand: boolean }).makeSektorsByHand = true;
  });
}

// The names a page makes sektors with, laid out before anything of it loads, as only a name put
// there before the page runs can be taken by the first sektor it makes. A page with names laid out
// never asks the word service for any.
export function prepareSektorNames(page: Page, sektorNames: string[]) {
  return page.addInitScript(
    sektorNames => { (window as unknown as { preparedSektorNames: string[] }).preparedSektorNames = sektorNames; },
    sektorNames,
  );
}

export async function expectScreenshot(page: Page, name: string, selector = "#canvas-container") {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.waitForTimeout(100);
  const element = page.locator(selector);
  await expect(element).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: 0,
  });
}
