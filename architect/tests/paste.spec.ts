import { test, expect, setup } from "./test-utils";

setup();

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const textarea = "#editor textarea";

async function pasteFromClipboard(page, clipboardText: string) {
  await page.evaluate((text: string) => navigator.clipboard.writeText(text), clipboardText);
  await page.locator("#paste-btn").click();
}

test("paste SGL replaces the editor text", async ({ page }) => {
  await page.locator(textarea).fill("cyl");
  await pasteFromClipboard(page, "sph t(30,0,0) c(#e03030)\n\npri5 t(-30,0,0)");
  await expect(page.locator(textarea)).toHaveValue("sph t(30,0,0) c(#e03030)\n\npri5 t(-30,0,0)");
});

test("paste of text which is not SGL leaves the editor text unchanged", async ({ page }) => {
  await page.locator(textarea).fill("cyl");
  await pasteFromClipboard(page, "sph t(30,0,0)\nhello world");
  await expect(page.locator(textarea)).toHaveValue("cyl");
});

test("paste of empty clipboard leaves the editor text unchanged", async ({ page }) => {
  await page.locator(textarea).fill("cyl");
  await pasteFromClipboard(page, "");
  await expect(page.locator(textarea)).toHaveValue("cyl");
});
