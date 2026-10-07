import { test, expectMapScreenshot, makeSektorsByHand, MIDDLE_OF_MAP } from "./test-utils";

const CURRENT_PLAYER = "Tester";

test.beforeEach(async ({ page }) => {
  await makeSektorsByHand(page);
  await page.goto("/login.html");
  await page.evaluate(currentPlayer => localStorage.setItem("username", currentPlayer), CURRENT_PLAYER);
});

// A forest gives less of everything it gives on fouled ground, so the forest in the middle of the
// map, standing on ground fouled 40 %, is marked, and the one beside it, on clean ground, is not.
test("marks a forest standing on polluted ground on the map", async ({ page }) => {
  await page.evaluate(currentPlayer => {
    const groundOf = (value: number) => Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => value));
    const pollution = groundOf(0);
    pollution[5][5] = 40;
    localStorage.setItem("sektor_Alpha", JSON.stringify({
      level: 1,
      locationProperties: { soil: groundOf(6), groundwater: groundOf(6), pollution },
      buildings: [
        { type: "Forest", location: { x: 5, y: 5 } },
        { type: "Forest", location: { x: 4, y: 4 } },
      ],
    }));
    localStorage.setItem("sektors", JSON.stringify([{ id: "Alpha", name: "Alpha", owner: currentPlayer }]));
  }, CURRENT_PLAYER);

  await page.goto("/sektor.html?id=Alpha");

  await expectMapScreenshot(page, "forest-on-polluted-ground", MIDDLE_OF_MAP);
});
