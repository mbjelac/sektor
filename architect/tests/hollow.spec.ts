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

// A pyramid is hollow from its base, so it is lifted above the floor and turned upside down
// to show the hollow.
for (const sides of [3, 4, 5, 6, 7, 8, 9]) {
  test(`pyr${sides} with hollow`, async ({ page }) => {
    await page.locator("#editor textarea").fill(`pyr${sides} h(50) t(0,0,100) r(0,180,0)`);
    await expectScreenshot(page, `pyr${sides}-hollow`);
  });
}

test("pyramid with full hollow", async ({ page }) => {
  await page.locator("#editor textarea").fill("pyr4 h(100) t(0,0,100) r(0,180,0)");
  await expectScreenshot(page, "pyr4-hollow-full");
});

test("pyramid with no hollow", async ({ page }) => {
  await page.locator("#editor textarea").fill("pyr4 h(0) t(0,0,100) r(0,180,0)");
  await expectScreenshot(page, "pyr4-hollow-none");
});
