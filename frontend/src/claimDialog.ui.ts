// A sektor is made with a name of its own, so taking one up asks the player nothing but whether
// they want it.
export function showClaimDialog({ sektorName, onConfirmed }: {
  sektorName: string,
  onConfirmed: () => void
}) {
  const overlay = document.createElement("div");
  overlay.id = "claim-dialog-overlay";
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = "claim-dialog";
  dialog.className = "dialog";
  overlay.appendChild(dialog);

  // The sektor is named above the question, so that the player reads which one they are taking up
  // before being asked whether they want it.
  const title = document.createElement("div");
  title.className = "dialog-title claim-dialog-title";
  title.textContent = sektorName;
  dialog.appendChild(title);

  const question = document.createElement("div");
  question.className = "dialog-question claim-dialog-question";
  question.textContent = "Claim this sektor?";
  dialog.appendChild(question);

  const buttons = document.createElement("div");
  buttons.className = "dialog-buttons dialog-buttons-centered";
  dialog.appendChild(buttons);

  const yesButton = document.createElement("button");
  yesButton.id = "claim-yes-button";
  yesButton.className = "dialog-button";
  yesButton.textContent = "Yes";
  yesButton.addEventListener("click", () => {
    overlay.remove();
    onConfirmed();
  });
  buttons.appendChild(yesButton);

  // A player who thinks better of taking the sektor up leaves it as it was.
  const noButton = document.createElement("button");
  noButton.id = "claim-no-button";
  noButton.className = "dialog-button dialog-button-plain";
  noButton.textContent = "No";
  noButton.addEventListener("click", () => overlay.remove());
  buttons.appendChild(noButton);

  document.body.appendChild(overlay);
}
