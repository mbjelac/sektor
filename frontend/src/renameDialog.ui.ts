const MAXIMUM_NAME_LENGTH = 30;

// A sektor is made with a name of its own, which the player building on it may change for one they
// like better.
export function showRenameDialog({ name, takenNames, onRenamed }: {
  name: string,
  takenNames: string[],
  onRenamed: (name: string) => void
}) {
  const overlay = document.createElement("div");
  overlay.id = "rename-dialog-overlay";
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = "rename-dialog";
  dialog.className = "dialog";
  overlay.appendChild(dialog);

  const title = document.createElement("div");
  title.className = "dialog-title";
  title.textContent = "Enter new sektor name";
  dialog.appendChild(title);

  // The name the sektor goes by now is what the player starts from, so that changing part of it
  // does not mean typing the whole of it again.
  const nameInput = document.createElement("input");
  nameInput.id = "sektor-name-input";
  nameInput.className = "rename-dialog-input";
  nameInput.type = "text";
  nameInput.maxLength = MAXIMUM_NAME_LENGTH;
  nameInput.value = name;
  dialog.appendChild(nameInput);

  const warning = document.createElement("div");
  warning.className = "rename-dialog-warning";
  warning.textContent = "nameAlreadyExists";
  dialog.appendChild(warning);

  const buttons = document.createElement("div");
  buttons.className = "dialog-buttons";
  dialog.appendChild(buttons);

  const renameButton = document.createElement("button");
  renameButton.id = "rename-ok-button";
  renameButton.className = "dialog-button";
  renameButton.textContent = "Rename";
  renameButton.addEventListener("click", () => {
    overlay.remove();
    onRenamed(nameInput.value.trim());
  });
  buttons.appendChild(renameButton);

  // A player who thinks better of it leaves the sektor under the name it already carries.
  const cancelButton = document.createElement("button");
  cancelButton.id = "rename-cancel-button";
  cancelButton.className = "dialog-button dialog-button-plain";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => overlay.remove());
  buttons.appendChild(cancelButton);

  nameInput.addEventListener("input", showWhetherNameIsTaken);
  showWhetherNameIsTaken();

  // Two sektors cannot go by the same name, so a name which is already taken — as is a sektor left
  // without a name — is refused as the player types it.
  function showWhetherNameIsTaken() {
    const enteredName = nameInput.value.trim();
    const nameAlreadyExists = takenNames.includes(enteredName);
    warning.hidden = !nameAlreadyExists;
    renameButton.disabled = nameAlreadyExists || enteredName === "";
  }

  document.body.appendChild(overlay);
  nameInput.focus();
}
