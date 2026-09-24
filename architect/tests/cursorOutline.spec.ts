import { test, setup, expectScreenshot, expectScreenshotWithCaret } from "./test-utils";
import { Page } from "@playwright/test";

setup();

const twoBodies = "sph c(#3050e0)\npri4 t(60,0,0) c(#30a030)";

test("outlines the body on the line the caret stands on", async ({ page }) => {
  await page.locator("#editor textarea").fill(twoBodies);
  await placeCaretOnLine(page, 0);
  await expectScreenshotWithCaret(page, "cursor-outlines-body-on-caret-line");
});

test("outlines the other body when the caret moves to its line", async ({ page }) => {
  await page.locator("#editor textarea").fill(twoBodies);
  await placeCaretOnLine(page, 1);
  await expectScreenshotWithCaret(page, "cursor-outlines-body-on-other-line");
});

test("outlines nothing when the caret stands on a line with no body", async ({ page }) => {
  await page.locator("#editor textarea").fill(`${twoBodies}\n`);
  await placeCaretOnLine(page, 2);
  await expectScreenshotWithCaret(page, "cursor-outlines-nothing-on-empty-line");
});

test("outlines nothing when the editor does not hold the caret", async ({ page }) => {
  await page.locator("#editor textarea").fill(twoBodies);
  await expectScreenshot(page, "cursor-outlines-nothing-without-caret");
});

async function placeCaretOnLine(page: Page, lineIndex: number) {
  await page.locator("#editor textarea").evaluate((textarea: HTMLTextAreaElement, lineIndex: number) => {
    const lines = textarea.value.split("\n");
    const offset = lines.slice(0, lineIndex).reduce((total, line) => total + line.length + 1, 0);
    textarea.focus();
    textarea.setSelectionRange(offset, offset);
  }, lineIndex);
}
