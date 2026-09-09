// Abandoning a sektor gives up everything built on it, so the player is asked to confirm it.
export function showAbandonDialog({ sektorName, onConfirmed }: {
  sektorName: string,
  onConfirmed: () => void
}) {
  const overlay = document.createElement("div");
  overlay.id = "abandon-dialog-overlay";
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = "abandon-dialog";
  dialog.className = "dialog";
  overlay.appendChild(dialog);

  const question = document.createElement("div");
  question.className = "dialog-question";
  question.textContent = `Are you sure you want to abandon ${sektorName}?`;
  dialog.appendChild(question);

  const buttons = document.createElement("div");
  buttons.className = "dialog-buttons";
  dialog.appendChild(buttons);

  const yesButton = document.createElement("button");
  yesButton.id = "abandon-yes-button";
  yesButton.className = "dialog-button";
  yesButton.textContent = "Yes";
  yesButton.addEventListener("click", () => {
    overlay.remove();
    onConfirmed();
  });
  buttons.appendChild(yesButton);

  const noButton = document.createElement("button");
  noButton.id = "abandon-no-button";
  noButton.className = "dialog-button dialog-button-plain";
  noButton.textContent = "No";
  noButton.addEventListener("click", () => overlay.remove());
  buttons.appendChild(noButton);

  document.body.appendChild(overlay);
}
