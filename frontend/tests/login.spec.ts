import { test, expect } from "@playwright/test";

test("routes the sektor list to the login page when no player is logged in", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login\.html$/);
});

test("routes a sektor map to the login page when no player is logged in", async ({ page }) => {
  await page.goto("/sektor.html?test=true");

  await expect(page).toHaveURL(/\/login\.html$/);
});

test("shows the sektor list to a logged in player", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("username", "Tester"));

  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
});

test("shows a sektor map to a logged in player", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("username", "Tester"));

  await page.goto("/sektor.html?test=true");

  await expect(page).toHaveURL(/\/sektor\.html\?test=true$/);
});

test("displays a username field and a log in button on the login page", async ({ page }) => {
  await page.goto("/login.html");

  await expect(page.locator("#login")).toHaveScreenshot("login-page.png", { maxDiffPixelRatio: 0 });
});

test("logs the player in and routes to the sektor list when the log in button is clicked", async ({ page }) => {
  await page.goto("/login.html");

  await page.locator("#username-input").fill("Marko");
  await page.locator("#log-in-button").click();
  await page.waitForURL(/\/$/);

  const storedUsername = await page.evaluate(() => localStorage.getItem("username"));
  expect({ path: new URL(page.url()).pathname, storedUsername })
    .toEqual({ path: "/", storedUsername: "Marko" });
});

test("logs the player in and routes to the sektor list when a username is entered", async ({ page }) => {
  await page.goto("/login.html");

  await page.locator("#username-input").fill("Marko");
  await page.locator("#username-input").press("Enter");
  await page.waitForURL(/\/$/);

  const storedUsername = await page.evaluate(() => localStorage.getItem("username"));
  expect({ path: new URL(page.url()).pathname, storedUsername })
    .toEqual({ path: "/", storedUsername: "Marko" });
});

test("displays the logged in player in the top right corner of the sektor list", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("username", "Marko"));

  await page.goto("/");

  await expect(page.locator("#user-display")).toHaveScreenshot("user-display.png", { maxDiffPixelRatio: 0 });
});

test("displays the logged in player in the top right corner of a sektor map", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("username", "Marko"));

  await page.goto("/sektor.html?test=true");

  await expect(page.locator("#user-display")).toHaveScreenshot("user-display.png", { maxDiffPixelRatio: 0 });
});
