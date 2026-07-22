import { test, setup, expectScreenshot } from "./test-utils";

setup();

test("cylinder with hollow", async ({ page }) => {
  await page.locator("#editor textarea").fill("cyl h(50)");
  await expectScreenshot(page, "cyl-hollow");
});

test("cylinder with full hollow", async ({ page }) => {
  await page.locator("#editor textarea").fill("cyl h(100)");
  await expectScreenshot(page, "cyl-hollow-full");
});

for (const sides of [3, 4, 5, 6, 7, 8, 9]) {
  test(`pri${sides} with hollow`, async ({ page }) => {
    await page.locator("#editor textarea").fill(`pri${sides} h(50)`);
    await expectScreenshot(page, `pri${sides}-hollow`);
  });
}

test("prism with full hollow", async ({ page }) => {
  await page.locator("#editor textarea").fill("pri4 h(100)");
  await expectScreenshot(page, "pri4-hollow-full");
});
