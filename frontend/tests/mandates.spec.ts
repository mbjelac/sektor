import { test, expect, Page } from "@playwright/test";
import { makeSektorsByHand } from "./test-utils";

const CURRENT_PLAYER = "Tester";

test.beforeEach(async ({ page }) => {
  await makeSektorsByHand(page);
  // Stored from the login page, so that the storage is not put back on every later navigation.
  await page.goto("/login.html");
  await page.evaluate(currentPlayer => localStorage.setItem("username", currentPlayer), CURRENT_PLAYER);
});

// A mandate asking for some Wood exported and at most some Water imported, which nobody owns yet.
async function storeUnclaimedMandate(page: Page) {
  await page.evaluate(() => localStorage.setItem("mandates", JSON.stringify([
    {
      number: 3,
      owner: null,
      criteria: [
        { type: "minimumExport", resourceName: "Wood", amount: 12 },
        { type: "maximumImport", resourceName: "Water", amount: 7 },
      ],
    },
  ])));
}

test("offers every unclaimed mandate for claiming", async ({ page }) => {
  await storeUnclaimedMandate(page);

  await page.goto("/?test=true");

  expect(await page.locator("#mandate-panel .mandate-item").evaluateAll(items => items.map(item =>
    item.querySelector(".claim-button")?.textContent ?? null
  ))).toEqual(["Claim"]);
});

test("shows the mandate in a popup when Claim is clicked", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();

  expect(await page.locator("#mandate-dialog").evaluate(dialog => ({
    isVisible: dialog.checkVisibility(),
    mandateNumber: (dialog as HTMLElement).dataset.mandateNumber,
  }))).toEqual({ isVisible: true, mandateNumber: "3" });
});

test("titles the popup of a mandate Mandate", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();

  expect(await page.locator("#mandate-dialog .dialog-title").textContent()).toEqual("Mandate");
});

test("makes the player the owner of a mandate claimed from its popup and closes the popup", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();
  await page.locator("#mandate-claim-button").click();

  expect(await page.evaluate(() => ({
    owners: JSON.parse(localStorage.getItem("mandates")!).map((mandate: { owner: string | null }) => mandate.owner),
    isPopupShown: document.getElementById("mandate-dialog") !== null,
    listedMandates: document.querySelectorAll("#mandate-panel .mandate-item").length,
  }))).toEqual({ owners: [CURRENT_PLAYER], isPopupShown: false, listedMandates: 0 });
});

test("leaves the mandate unclaimed and closes the popup when Cancel is clicked", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();
  await page.locator("#mandate-cancel-button").click();

  expect(await page.evaluate(() => ({
    owners: JSON.parse(localStorage.getItem("mandates")!).map((mandate: { owner: string | null }) => mandate.owner),
    isPopupShown: document.getElementById("mandate-dialog") !== null,
  }))).toEqual({ owners: [null], isPopupShown: false });
});

test("shows Cancel on the left and Claim on the right along the bottom of the popup", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();

  await expect(page.locator("#mandate-dialog")).toHaveScreenshot("mandate-dialog.png", { maxDiffPixelRatio: 0 });
});

test("tells what the mandate asks for in full in its popup, a line for every criterion", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();

  expect(await page.locator("#mandate-dialog .mandate-description-line").allTextContents()).toEqual([
    "Export at least 12 🪵 Wood",
    "Import at most 7 💧 Water",
  ]);
});

test("makes the popup of a mandate 30% of the window high", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();

  const heights = await page.locator("#mandate-dialog").evaluate(dialog => ({
    popup: dialog.getBoundingClientRect().height,
    thirtyPercentOfWindow: window.innerHeight * 0.3,
  }));
  expect(heights.popup).toEqual(heights.thirtyPercentOfWindow);
});

// More criteria than the popup holds are scrolled through between its title and its buttons, with no
// bar drawn for doing it.
test("scrolls a long list of criteria in the popup without a bar", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("mandates", JSON.stringify([
    {
      number: 1,
      owner: null,
      criteria: Array.from({ length: 20 }, (_, index) => ({ type: "minimumExport", resourceName: "Wood", amount: index + 5 })),
    },
  ])));
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();

  const buttonsBottomBeforeScrolling = (await page.locator("#mandate-claim-button").boundingBox())!.y;
  const scrolling = await page.locator("#mandate-dialog .mandate-description").evaluate(description => {
    description.scrollTop = description.scrollHeight;
    return {
      taller: description.scrollHeight > description.clientHeight,
      scrolledPast: description.scrollTop > 0,
      barWidth: description.offsetWidth - description.clientWidth,
    };
  });
  const buttonsBottomAfterScrolling = (await page.locator("#mandate-claim-button").boundingBox())!.y;

  expect({ ...scrolling, buttonsMoved: buttonsBottomBeforeScrolling !== buttonsBottomAfterScrolling })
    .toEqual({ taller: true, scrolledPast: true, barWidth: 0, buttonsMoved: false });
});
