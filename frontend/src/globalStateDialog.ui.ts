import { fillGlobalStateList, GlobalAndPlayerImportsAndExports } from "./globalStatePanel.ui";
import { xMarkIcon } from "./icons";

const DIALOG_ID = "global-state-dialog";

// What the whole planet, or the player's own sektors, bring in and send out, called up over the map of
// a sektor so that a player sees what the planet is short of without leaving what they are building. It is the same list as
// the one beside the sektors, at the same size as the sektor's own panel, in the middle of the
// screen instead of at the side of it.
export function showGlobalStateDialog(globalAndPlayerImportsAndExports: GlobalAndPlayerImportsAndExports) {
  // Asking for the list again while it is up leaves the one already there rather than laying a
  // second over it.
  if (document.getElementById(DIALOG_ID)) return;

  const overlay = document.createElement("div");
  overlay.id = "global-state-dialog-overlay";
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = DIALOG_ID;
  dialog.className = "dialog global-state-dialog";
  overlay.appendChild(dialog);

  dialog.appendChild(createCloseButton(() => overlay.remove()));

  const list = document.createElement("div");
  list.className = "global-state-list";
  fillGlobalStateList(list, globalAndPlayerImportsAndExports);
  dialog.appendChild(list);

  document.body.appendChild(overlay);
}

// The way back to the map, in the corner of the dialog where there is nothing for it to stand in
// the way of.
function createCloseButton(onClosed: () => void): HTMLElement {
  const closeButton = document.createElement("button");
  closeButton.id = "global-state-close-button";
  closeButton.className = "global-state-close";
  closeButton.title = "Hide";
  closeButton.innerHTML = xMarkIcon;
  closeButton.addEventListener("click", onClosed);
  return closeButton;
}
