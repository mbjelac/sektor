import { test, expect, Page } from "@playwright/test";

export { test, expect };

export type TestCaseTemplate = (value: number) => string;

export function setup() {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("canvas");
  });
}

// Filling the editor leaves the caret standing in it, and the body written on the line the caret
// stands on is outlined in white. A test of how a body is drawn is not a test of that outline, so
// the editor gives the caret up before the picture is taken.
export async function expectScreenshot(page: Page, name: string) {
  await page.locator("#editor textarea").blur();
  await expectScreenshotWithCaret(page, name);
}

export async function expectScreenshotWithCaret(page: Page, name: string) {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 2000 });
  await page.waitForTimeout(50);
  const canvas = page.locator("#canvas-container");
  await expect(canvas).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: 0.01,
  });
}
