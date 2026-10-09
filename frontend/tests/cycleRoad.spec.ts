import { Page } from "@playwright/test";
import { test, expect, setup, expectMapScreenshot, MIDDLE_OF_MAP } from "./test-utils";

setup();

// The middle of the screen looks at the corner the four middle squares of the map meet at. The
// edge between the square left of it at the top and the square right of it at the top runs up and
// to the right from there, and the middle of that edge sits this far from the middle of the screen.
const MIDDLE_OF_EDGE = { x: 29.5, y: -20.1 };

// The middle of the square above the corner the four middle squares meet at.
const MIDDLE_OF_SQUARE = { x: 0, y: -35 };

test("renders a cycle road along the edge between two squares", async ({ page }) => {
  await selectCycleRoad(page);

  await clickOnMap(page, MIDDLE_OF_EDGE);

  await expectMapScreenshot(page, "cycle-road-placed", MIDDLE_OF_MAP);
});

test("shows error when placing a cycle road on a square rather than between two", async ({ page }) => {
  await selectCycleRoad(page);

  await clickOnMap(page, MIDDLE_OF_SQUARE);

  await expect(page.locator("#notification")).toHaveText("roadsGoBetweenBuildings");
});

async function selectCycleRoad(page: Page) {
  await page.locator('#canvas-container[data-rendered="true"]').waitFor({ timeout: 5000 });
  await page.locator('.building-tag[data-building-tag="transport"]').click();
  await page.locator('.building-item[data-building-name="CycleRoad"]').click();
  await page.waitForTimeout(100);
}

// A point of the map, measured from the middle of the screen.
async function clickOnMap(page: Page, fromMiddle: { x: number; y: number }) {
  const canvas = page.locator("#canvas-container > canvas");
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width / 2 + fromMiddle.x, y: box.height / 2 + fromMiddle.y } });
  await page.waitForTimeout(200);
}
