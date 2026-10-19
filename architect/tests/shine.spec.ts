import { test, setup, expectScreenshot } from "./test-utils";

setup();

// A dull white box beside shiny white ones, so the shine shows against the plain lighting.
test("white boxes from dull to fully shiny", async ({ page }) => {
  await page.locator("#editor textarea").fill([
    "pri4 s(40,40,30) t(-30,0,0) c(#ffffff)",
    "pri4 s(40,40,30) t(0,0,0) c(#ffffff) sh(50)",
    "pri4 s(40,40,30) t(30,0,0) c(#ffffff) sh(100)",
  ].join("\n"));
  await expectScreenshot(page, "shine-white");
});

test("shine on a colored sphere", async ({ page }) => {
  await page.locator("#editor textarea").fill("sph c(#3366cc) sh(100)");
  await expectScreenshot(page, "shine-sphere");
});

test("h() is not read out of sh()", async ({ page }) => {
  await page.locator("#editor textarea").fill("cyl sh(50)");
  await expectScreenshot(page, "shine-not-hollow");
});
