import { test, setup, expectScreenshot } from "./test-utils";

setup();

for (const sides of [3, 4, 5, 6, 7, 8, 9]) {
  test(`pyr${sides} with frustum`, async ({ page }) => {
    await page.locator("#editor textarea").fill(`pyr${sides} f(50)`);
    await expectScreenshot(page, `pyr${sides}-frustum`);
  });
}

test("pyramid with no frustum", async ({ page }) => {
  await page.locator("#editor textarea").fill("pyr4 f(0)");
  await expectScreenshot(page, "pyr4-frustum-none");
});

test("pyramid with full frustum", async ({ page }) => {
  await page.locator("#editor textarea").fill("pyr4 f(100)");
  await expectScreenshot(page, "pyr4-frustum-full");
});

// The cut reaches below the tip of the pyramid hollowing this one out, so it is open at the
// top as well as at its base.
test("hollow pyramid cut open by the frustum", async ({ page }) => {
  await page.locator("#editor textarea").fill("pyr4 h(80) f(50)");
  await expectScreenshot(page, "pyr4-frustum-hollow-open");
});

// The cut stays above the tip of the pyramid hollowing this one out, so it keeps a solid top.
test("hollow pyramid cut above its hollow", async ({ page }) => {
  await page.locator("#editor textarea").fill("pyr4 h(30) f(50)");
  await expectScreenshot(page, "pyr4-frustum-hollow-closed");
});

// Turned upside down to show that the hollow still opens at the base of a cut off pyramid.
test("hollow pyramid with frustum seen from its base", async ({ page }) => {
  await page.locator("#editor textarea").fill("pyr4 h(80) f(50) r(0,180,0)");
  await expectScreenshot(page, "pyr4-frustum-hollow-base");
});

for (const value of [50, 0, 100]) {
  test(`cone with frustum ${value}`, async ({ page }) => {
    await page.locator("#editor textarea").fill(`con f(${value})`);
    await expectScreenshot(page, `con-frustum-${value}`);
  });
}

// The cut reaches below the tip of the cone hollowing this one out, so it is open at the top
// as well as at its base.
test("hollow cone cut open by the frustum", async ({ page }) => {
  await page.locator("#editor textarea").fill("con h(80) f(50)");
  await expectScreenshot(page, "con-frustum-hollow-open");
});

// The cut stays above the tip of the cone hollowing this one out, so it keeps a solid top.
test("hollow cone cut above its hollow", async ({ page }) => {
  await page.locator("#editor textarea").fill("con h(30) f(50)");
  await expectScreenshot(page, "con-frustum-hollow-closed");
});

// Turned upside down to show that the hollow still opens at the base of a cut off cone.
test("hollow cone with frustum seen from its base", async ({ page }) => {
  await page.locator("#editor textarea").fill("con h(80) f(50) r(0,180,0)");
  await expectScreenshot(page, "con-frustum-hollow-base");
});

for (const value of [50, 0, 100]) {
  test(`cylinder with frustum ${value}`, async ({ page }) => {
    await page.locator("#editor textarea").fill(`cyl f(${value})`);
    await expectScreenshot(page, `cyl-frustum-${value}`);
  });
}

// Laid on its side to show that the cut stays parallel to the axis however the cylinder is turned.
test("cylinder with frustum laid on its side", async ({ page }) => {
  await page.locator("#editor textarea").fill("cyl f(50) r(0,90,0)");
  await expectScreenshot(page, "cyl-frustum-rotated");
});

// The cut reaches into the hole of the hollow cylinder, so it opens the hole up along its side.
test("hollow cylinder cut open by the frustum", async ({ page }) => {
  await page.locator("#editor textarea").fill("cyl h(60) f(50)");
  await expectScreenshot(page, "cyl-frustum-hollow-open");
});

// The cut stays short of the hole of the hollow cylinder, so the hole is left whole.
test("hollow cylinder cut short of its hole", async ({ page }) => {
  await page.locator("#editor textarea").fill("cyl h(30) f(20)");
  await expectScreenshot(page, "cyl-frustum-hollow-closed");
});

// The cut lies past the far side of the hole of the hollow cylinder, so no hole is left.
test("hollow cylinder cut past its hole", async ({ page }) => {
  await page.locator("#editor textarea").fill("cyl h(30) f(90)");
  await expectScreenshot(page, "cyl-frustum-hollow-gone");
});

for (const value of [50, 0, 100, 25]) {
  test(`sphere with frustum ${value}`, async ({ page }) => {
    await page.locator("#editor textarea").fill(`sph f(${value})`);
    await expectScreenshot(page, `sph-frustum-${value}`);
  });
}

// Turned on its side to show that the cut sphere turns about its own centre, halfway up to the cut.
test("sphere with frustum turned on its side", async ({ page }) => {
  await page.locator("#editor textarea").fill("sph f(50) r(0,90,0)");
  await expectScreenshot(page, "sph-frustum-rotated");
});
