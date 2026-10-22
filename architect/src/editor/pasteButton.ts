import { getTextarea } from "./editorWidgets";
import { parseCommandLines } from "../../../shared/parseCommands";

export function initPasteButton() {
  const pasteButton = document.getElementById("paste-btn")!;
  pasteButton.addEventListener("click", async () => {
    const clipboardText = await navigator.clipboard.readText();
    if (!isSgl(clipboardText)) return;

    const textarea = getTextarea();
    textarea.value = clipboardText;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

// SGL is text with at least one body in it, where every line which is not blank describes a body.
function isSgl(text: string): boolean {
  const nonBlankLines = text.split("\n").filter(line => line.trim() !== "");
  return nonBlankLines.length > 0 && parseCommandLines(nonBlankLines.join("\n")).every(body => body !== null);
}
