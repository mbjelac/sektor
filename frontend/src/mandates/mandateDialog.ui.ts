import { Mandate } from "./mandates.api";
import { createClaimButton } from "../claimButton.ui";
import { criterionDescription } from "./criterionDescription";
import { getResourceIcon } from "../resources";
import { createCompletionDot } from "./completionDot.ui";

// A mandate is looked over before it is claimed, and is claimed only once the player says so.
export function showMandateDialog({ mandate, onClaimed }: {
  mandate: Mandate,
  onClaimed: () => void
}) {
  const overlay = createMandatePopup("mandate-dialog", mandate, createDescription(mandate, false));
  overlay.firstElementChild!.appendChild(createClaimButtons(overlay, onClaimed));
  document.body.appendChild(overlay);
}

// A mandate is looked into to see which of its criteria the player's sektors already fulfil, each
// told with a dot in front of it, as the mandate as a whole is in the list.
export function showMandateDetailsDialog(mandate: Mandate) {
  const overlay = createMandatePopup("mandate-details-dialog", mandate, createDescription(mandate, true));
  overlay.firstElementChild!.appendChild(createCloseButton(overlay));
  document.body.appendChild(overlay);
}

// Every popup of a mandate is titled with its number and tells what it asks for under the title.
function createMandatePopup(dialogId: string, mandate: Mandate, description: HTMLElement): HTMLElement {
  const overlay = document.createElement("div");
  overlay.id = `${dialogId}-overlay`;
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = dialogId;
  dialog.className = "dialog mandate-dialog";
  dialog.dataset.mandateNumber = `${mandate.number}`;
  overlay.appendChild(dialog);

  const title = document.createElement("div");
  title.className = "dialog-title";
  title.textContent = `Mandate ${mandate.number}`;
  dialog.appendChild(title);

  dialog.appendChild(description);

  return overlay;
}

// What the mandate asks for, told in full, a line for every criterion, which may be told along with
// whether it is completed.
function createDescription(mandate: Mandate, showsCompletion: boolean): HTMLElement {
  const description = document.createElement("div");
  description.className = "mandate-description";

  for (const criterion of mandate.criteria) {
    const line = document.createElement("div");
    line.className = "mandate-description-line";
    if (showsCompletion) line.appendChild(createCompletionDot(criterion.completed));
    line.appendChild(document.createTextNode(criterionDescription(criterion, getResourceIcon(criterion.resourceName))));
    description.appendChild(line);
  }

  return description;
}

// Backing out stands on the left and claiming on the right, where it is offered everywhere else.
// Either way the popup goes.
function createClaimButtons(overlay: HTMLElement, onClaimed: () => void): HTMLElement {
  const buttons = document.createElement("div");
  buttons.className = "dialog-buttons mandate-dialog-buttons";

  const cancelButton = document.createElement("button");
  cancelButton.id = "mandate-cancel-button";
  cancelButton.className = "dialog-button dialog-button-plain";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => overlay.remove());
  buttons.appendChild(cancelButton);

  const claimButton = createClaimButton(() => {
    overlay.remove();
    onClaimed();
  });
  claimButton.id = "mandate-claim-button";
  buttons.appendChild(claimButton);

  return buttons;
}

// A popup only looked at has nothing to do but go, from the bottom right.
function createCloseButton(overlay: HTMLElement): HTMLElement {
  const buttons = document.createElement("div");
  buttons.className = "dialog-buttons mandate-details-buttons";

  const closeButton = document.createElement("button");
  closeButton.id = "mandate-close-button";
  closeButton.className = "dialog-button dialog-button-plain";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => overlay.remove());
  buttons.appendChild(closeButton);

  return buttons;
}
