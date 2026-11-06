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

// Free-to-claim mandates are listed when the page opens, so their button is underlined.
test("shows the buttons choosing which mandates are listed beside the title", async ({ page }) => {
  await storeMandatesOfEveryOwner(page);
  await page.goto("/?test=true");

  await expect(page.locator("#mandate-panel .mandate-header")).toHaveScreenshot("mandate-header.png", { maxDiffPixelRatio: 0 });
});

// Ada's mandate is neither free to claim nor the player's own, so it is never listed.
async function storeMandatesOfEveryOwner(page: Page) {
  await page.evaluate(currentPlayer => localStorage.setItem("mandates", JSON.stringify([
    { number: 1, owner: null, criteria: [] },
    { number: 2, owner: currentPlayer, criteria: [] },
    { number: 3, owner: "Ada", criteria: [] },
  ])), CURRENT_PLAYER);
}

function getListing(page: Page) {
  return page.evaluate(() => ({
    title: document.querySelector("#mandate-panel .list-title")!.textContent,
    mandates: [...document.querySelectorAll("#mandate-panel .mandate-number")].map(mandateNumber => mandateNumber.textContent),
    selectedFilter: document.querySelector<HTMLElement>("#mandate-panel .mandate-filter-button.selected")!.dataset.mandateFilter,
  }));
}

test("opens on the mandates free to claim, titled Available mandates", async ({ page }) => {
  await storeMandatesOfEveryOwner(page);

  await page.goto("/?test=true");

  expect(await getListing(page)).toEqual({ title: "Available mandates", mandates: ["1"], selectedFilter: "unclaimed" });
});

test("lists the player's own mandates when their button is clicked", async ({ page }) => {
  await storeMandatesOfEveryOwner(page);
  await page.goto("/?test=true");

  await page.locator('.mandate-filter-button[data-mandate-filter="own"]').click();

  expect(await getListing(page)).toEqual({ title: "My mandates", mandates: ["2"], selectedFilter: "own" });
});

test("lists the mandates free to claim again when their button is clicked", async ({ page }) => {
  await storeMandatesOfEveryOwner(page);
  await page.goto("/?test=true");

  await page.locator('.mandate-filter-button[data-mandate-filter="own"]').click();
  await page.locator('.mandate-filter-button[data-mandate-filter="unclaimed"]').click();

  expect(await getListing(page)).toEqual({ title: "Available mandates", mandates: ["1"], selectedFilter: "unclaimed" });
});

// A mandate the player owns is theirs already, so it offers nothing to claim.
test("shows the player's own mandate without a Claim button", async ({ page }) => {
  await storeMandatesOfEveryOwner(page);
  await page.goto("/?test=true");

  await page.locator('.mandate-filter-button[data-mandate-filter="own"]').click();

  expect(await page.locator("#mandate-panel .mandate-item .claim-button").count()).toEqual(0);
});

// A player without a mandate of their own has nothing to choose between.
test("shows a player with no mandates of their own the mandates free to claim and no buttons", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("mandates", JSON.stringify([
    { number: 1, owner: null, criteria: [] },
    { number: 3, owner: "Ada", criteria: [] },
  ])));

  await page.goto("/?test=true");

  expect(await page.evaluate(() => ({
    title: document.querySelector("#mandate-panel .list-title")!.textContent,
    mandates: [...document.querySelectorAll("#mandate-panel .mandate-number")].map(mandateNumber => mandateNumber.textContent),
    filterButtons: document.querySelectorAll("#mandate-panel .mandate-filter-button").length,
  }))).toEqual({ title: "Available mandates", mandates: ["1"], filterButtons: 0 });
});

// Claiming a first mandate gives the player something of their own to look at.
test("shows the buttons once the player has claimed a mandate", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();
  await page.locator("#mandate-claim-button").click();

  expect(await page.locator("#mandate-panel .mandate-filter-button").count()).toEqual(2);
});

// The player's own mandates say at the end of their rows whether they are completed.
test("marks the player's completed mandates green and the others red", async ({ page }) => {
  await page.evaluate(currentPlayer => localStorage.setItem("mandates", JSON.stringify([
    { number: 1, owner: currentPlayer, completed: true, criteria: [{ type: "minimumExport", resourceName: "Wood", amount: 12 }] },
    { number: 2, owner: currentPlayer, completed: false, criteria: [{ type: "maximumImport", resourceName: "Water", amount: 7 }] },
  ])), CURRENT_PLAYER);
  await page.goto("/?test=true");

  await page.locator('.mandate-filter-button[data-mandate-filter="own"]').click();

  await expect(page.locator("#mandate-panel")).toHaveScreenshot("own-mandates.png", { maxDiffPixelRatio: 0 });
});
