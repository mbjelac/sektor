import { test, expect, Page } from "@playwright/test";

export { test, expect };

export function setup() {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sektor.html?test=true");
    await page.waitForSelector("canvas");
  });
}

export async function expectScreenshot(page: Page, name: string, selector = "#canvas-container") {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.waitForTimeout(100);
  const element = page.locator(selector);
  await expect(element).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: 0,
  });
}
