import p5 from "p5";
import {CreateBody, parseCommandLines} from "../../shared/parseCommands";
import {drawBodies, withoutDepthWrites} from "../../shared/applyCommands";
import {getTextarea} from "./editor/editorWidgets";

// The body written on the line the caret stands on is outlined in white, so that a line of text
// can be told apart from the body it makes without counting bodies in the picture. The outline is
// only there while the editor holds the caret: leaving the editor leaves the shape as it is drawn.
export function drawCursorBodyOutline(p: p5, elapsedMilliseconds: number) {
  const body = cursorBody();
  if (!body) return;

  p.push();
  p.stroke(255);
  // The body is already standing in the picture, drawn from the baked geometry, and this second
  // drawing of it is only there to lay the white edges over it. Writing depth again would gain
  // nothing and would hide whatever stands behind a body which is seen through.
  withoutDepthWrites(p, () => drawBodies(p, [body], elapsedMilliseconds));
  p.pop();
}

// Nothing is outlined while the caret is elsewhere, and nothing while it stands on a line which
// describes no body — a blank line, or one holding anything but a body command.
function cursorBody(): CreateBody | null {
  const textarea = getTextarea();
  if (document.activeElement !== textarea) return null;
  return parseCommandLines(textarea.value)[cursorLineIndex(textarea)] ?? null;
}

// Which line of the editor the caret stands on, counted from zero.
function cursorLineIndex(textarea: HTMLTextAreaElement): number {
  return textarea.value.slice(0, textarea.selectionStart).split("\n").length - 1;
}
