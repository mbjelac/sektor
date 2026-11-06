import { Mandate } from "./mandates.api";
import { createClaimButton } from "../claimButton.ui";
import { criterionDescription } from "./criterionDescription";
import { getResourceIcon } from "../resources";

// A mandate is looked over before it is claimed, and is claimed only once the player says so.
export function showMandateDialog({ mandate, onClaimed }: {
  mandate: Mandate,
  onClaimed: () => void
}) {
  const overlay = document.createElement("div");
  overlay.id = "mandate-dialog-overlay";
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = "mandate-dialog";
  dialog.className = "dialog mandate-dialog";
  dialog.dataset.mandateNumber = `${mandate.number}`;
  overlay.appendChild(dialog);

  const title = document.createElement("div");
  title.className = "dialog-title";
  title.textContent = `Mandate ${mandate.number}`;
  dialog.appendChild(title);

  dialog.appendChild(createDescription(mandate));

  dialog.appendChild(createButtons(overlay, onClaimed));

  document.body.appendChild(overlay);
}

// What the mandate asks for, told in full, a line for every criterion.
function createDescription(mandate: Mandate): HTMLElement {
  const description = document.createElement("div");
  description.className = "mandate-description";

  for (const criterion of mandate.criteria) {
    const line = document.createElement("div");
    line.className = "mandate-description-line";
    line.textContent = criterionDescription(criterion, getResourceIcon(criterion.resourceName));
    description.appendChild(line);
  }

  return description;
}

// Backing out stands on the left and claiming on the right, where it is offered everywhere else.
// Either way the popup goes.
function createButtons(overlay: HTMLElement, onClaimed: () => void): HTMLElement {
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
