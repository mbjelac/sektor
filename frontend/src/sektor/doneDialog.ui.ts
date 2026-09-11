// Finishing the assignment of a sektor is worth telling the player about, and leaves them the
// choice of stopping there or carrying on building.
export function showDoneDialog({ username, sektorName, onLeave }: {
  username: string,
  sektorName: string,
  onLeave: () => void
}) {
  const overlay = document.createElement("div");
  overlay.id = "done-dialog-overlay";
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = "done-dialog";
  dialog.className = "dialog";
  overlay.appendChild(dialog);

  const message = document.createElement("div");
  message.className = "dialog-question done-dialog-message";
  message.appendChild(createBoldMessageLine(`Congratulations, ${username}!`));
  message.appendChild(createMessageLine("You have completed your assignment in ", createBoldText(sektorName), "!"));
  message.appendChild(createMessageLine("Do you want to continue working on this sektor?"));
  dialog.appendChild(message);

  const buttons = document.createElement("div");
  buttons.className = "dialog-buttons";
  dialog.appendChild(buttons);

  const leaveButton = document.createElement("button");
  leaveButton.id = "done-leave-button";
  leaveButton.className = "dialog-button";
  leaveButton.textContent = "Leave";
  leaveButton.addEventListener("click", onLeave);
  buttons.appendChild(leaveButton);

  const continueButton = document.createElement("button");
  continueButton.id = "done-continue-button";
  continueButton.className = "dialog-button dialog-button-plain";
  continueButton.textContent = "Continue";
  continueButton.addEventListener("click", () => overlay.remove());
  buttons.appendChild(continueButton);

  document.body.appendChild(overlay);
}

function createBoldMessageLine(text: string): HTMLElement {
  const line = document.createElement("div");
  line.className = "done-dialog-bold";
  line.textContent = text;
  return line;
}

function createMessageLine(...parts: (string | HTMLElement)[]): HTMLElement {
  const line = document.createElement("div");
  parts.forEach(part => line.append(part));
  return line;
}

function createBoldText(text: string): HTMLElement {
  const boldText = document.createElement("span");
  boldText.className = "done-dialog-bold";
  boldText.textContent = text;
  return boldText;
}
