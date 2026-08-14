import { test, expect, Page } from "@playwright/test";

export { test, expect };

export function setup() {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sektor.html?test=true");
    await page.waitForSelector("canvas");
  });
}

// Buildings are connected automatically when placed. Tests which connect buildings themselves
// first remove those connections, by lowering each one's amount to zero on its arc panel.
// Only the selected building's connections are shown, so select it before calling this.
export async function removeAutomaticConnections(page: Page) {
  const amountButtons = page.locator(".connection-amount-button");
  while (await amountButtons.count() > 0) {
    await amountButtons.last().click();
    await page.waitForTimeout(300);
  }
}

export async function expectScreenshot(page: Page, name: string, selector = "#canvas-container") {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.waitForTimeout(100);
  const element = page.locator(selector);
  await expect(element).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: 0,
  });
}
