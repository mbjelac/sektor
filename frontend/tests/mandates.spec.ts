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

test("titles the popup of a mandate Mandate followed by its number", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();

  expect(await page.locator("#mandate-dialog .dialog-title").textContent()).toEqual("Mandate 3");
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

// A criterion the player's sektors already fulfil is left out of the row, which tells only what is
// still to do.
test("leaves the completed criteria out of the player's mandates in the list", async ({ page }) => {
  await page.evaluate(currentPlayer => localStorage.setItem("mandates", JSON.stringify([
    {
      number: 1,
      owner: currentPlayer,
      completed: false,
      criteria: [
        { type: "minimumExport", resourceName: "Wood", amount: 12, completed: true },
        { type: "maximumImport", resourceName: "Water", amount: 7, completed: false },
      ],
    },
  ])), CURRENT_PLAYER);
  await page.goto("/?test=true");

  await page.locator('.mandate-filter-button[data-mandate-filter="own"]').click();

  expect(await page.locator("#mandate-panel .mandate-criterion-resource").evaluateAll(resources =>
    resources.map(resource => (resource as HTMLElement).title)
  )).toEqual(["Water"]);
});

// A mandate of the player with one criterion completed and one not.
async function storeHalfCompletedMandate(page: Page) {
  await page.evaluate(currentPlayer => localStorage.setItem("mandates", JSON.stringify([
    {
      number: 5,
      owner: currentPlayer,
      completed: false,
      criteria: [
        { type: "minimumExport", resourceName: "Wood", amount: 12, completed: true },
        { type: "maximumImport", resourceName: "Water", amount: 7, completed: false },
      ],
    },
  ])), CURRENT_PLAYER);
}

async function openOwnMandates(page: Page) {
  await page.goto("/?test=true");
  await page.locator('.mandate-filter-button[data-mandate-filter="own"]').click();
}

test("greys a mandate of the list under the pointer", async ({ page }) => {
  await storeHalfCompletedMandate(page);
  await openOwnMandates(page);

  await page.locator("#mandate-panel .mandate-item").hover();

  expect(await page.locator("#mandate-panel .mandate-item").evaluate(item => getComputedStyle(item).backgroundColor))
    .toEqual("rgb(68, 68, 68)");
});

// Clicking a mandate anywhere opens it up in full: its number, and every criterion told in full with
// whether it is completed in front of it.
test("opens a mandate in full when it is clicked in the list", async ({ page }) => {
  await storeHalfCompletedMandate(page);
  await openOwnMandates(page);

  await page.locator("#mandate-panel .mandate-number").click();

  expect(await page.locator("#mandate-details-dialog").evaluate(dialog => ({
    title: dialog.querySelector(".dialog-title")!.textContent,
    criteria: [...dialog.querySelectorAll(".mandate-description-line")].map(line => ({
      text: line.textContent,
      completed: line.querySelector(".mandate-completion")!.classList.contains("mandate-completed"),
    })),
    buttons: [...dialog.querySelectorAll("button")].map(button => button.textContent),
  }))).toEqual({
    title: "Mandate 5",
    criteria: [
      { text: "Export at least 12 🪵 Wood", completed: true },
      { text: "Import at most 7 💧 Water", completed: false },
    ],
    buttons: ["Abandon", "Close"],
  });
});

test("closes the mandate opened in full when Close is clicked", async ({ page }) => {
  await storeHalfCompletedMandate(page);
  await openOwnMandates(page);
  await page.locator("#mandate-panel .mandate-item").click();

  await page.locator("#mandate-close-button").click();

  expect(await page.locator("#mandate-details-dialog").count()).toEqual(0);
});

// Claiming is asked about in its own popup, so clicking Claim opens only that one.
test("opens only the claiming popup when Claim is clicked on a mandate", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .claim-button").click();

  expect({
    claiming: await page.locator("#mandate-dialog").count(),
    details: await page.locator("#mandate-details-dialog").count(),
  }).toEqual({ claiming: 1, details: 0 });
});

// The half-completed mandate, and a second mandate of the player, so that the player still has a
// mandate of their own after giving the first up.
async function storeTwoOwnMandates(page: Page) {
  await page.evaluate(currentPlayer => localStorage.setItem("mandates", JSON.stringify([
    {
      number: 5,
      owner: currentPlayer,
      completed: false,
      criteria: [
        { type: "minimumExport", resourceName: "Wood", amount: 12, completed: true },
        { type: "maximumImport", resourceName: "Water", amount: 7, completed: false },
      ],
    },
    { number: 6, owner: currentPlayer, completed: false, criteria: [{ type: "minimumExport", resourceName: "Ore", amount: 9, completed: false }] },
  ])), CURRENT_PLAYER);
}

test("shows the player's own mandate in full, a dot in front of every criterion, Abandon in red in the bottom left and Close in the bottom right", async ({ page }) => {
  await storeHalfCompletedMandate(page);
  await openOwnMandates(page);

  await page.locator("#mandate-panel .mandate-item").click();

  await expect(page.locator("#mandate-details-dialog")).toHaveScreenshot("mandate-details-dialog-abandonable.png", { maxDiffPixelRatio: 0 });
});

// A mandate nobody owns is nobody's to give up.
test("offers no Abandon on a mandate free to claim opened in full", async ({ page }) => {
  await storeUnclaimedMandate(page);
  await page.goto("/?test=true");

  await page.locator("#mandate-panel .mandate-number").click();

  expect(await page.locator("#mandate-details-dialog button").allTextContents()).toEqual(["Close"]);
});

// A mandate given up is nobody's: it leaves the player's list, with nothing of it completed, and the
// popup goes.
test("gives a mandate up when Abandon is clicked in it opened in full", async ({ page }) => {
  await storeTwoOwnMandates(page);
  await openOwnMandates(page);
  await page.locator("#mandate-panel .mandate-item", { hasText: "5" }).click();

  await page.locator("#mandate-abandon-button").click();

  expect(await page.evaluate(() => ({
    stored: JSON.parse(localStorage.getItem("mandates")!).map((mandate: {
      number: number; owner: string | null; completed: boolean; criteria: { completed: boolean }[]
    }) => ({
      number: mandate.number,
      owner: mandate.owner,
      completed: mandate.completed,
      criteriaCompleted: mandate.criteria.map(criterion => criterion.completed),
    })),
    isPopupShown: document.getElementById("mandate-details-dialog") !== null,
    listed: [...document.querySelectorAll("#mandate-panel .mandate-number")].map(mandateNumber => mandateNumber.textContent),
  }))).toEqual({
    stored: [
      { number: 5, owner: null, completed: false, criteriaCompleted: [false, false] },
      { number: 6, owner: CURRENT_PLAYER, completed: false, criteriaCompleted: [false] },
    ],
    isPopupShown: false,
    listed: ["6"],
  });
});

// Given up, the mandate is free to claim again, by anybody.
test("lists a mandate given up among those free to claim", async ({ page }) => {
  await storeTwoOwnMandates(page);
  await openOwnMandates(page);
  await page.locator("#mandate-panel .mandate-item", { hasText: "5" }).click();
  await page.locator("#mandate-abandon-button").click();

  await page.locator('.mandate-filter-button[data-mandate-filter="unclaimed"]').click();

  expect(await page.locator("#mandate-panel .mandate-number").allTextContents()).toEqual(["5"]);
});
