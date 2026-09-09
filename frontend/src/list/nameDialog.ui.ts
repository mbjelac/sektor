const MAXIMUM_NAME_LENGTH = 30;

// A sektor is named by its player when they claim it, which is asked for in a dialog over the
// sektor list.
export function showNameDialog({ name, takenNames, onNamed }: {
  name: string,
  takenNames: string[],
  onNamed: (name: string) => void
}) {
  const overlay = document.createElement("div");
  overlay.id = "name-dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = "name-dialog";
  overlay.appendChild(dialog);

  const label = document.createElement("label");
  label.className = "name-dialog-label";
  label.htmlFor = "sektor-name-input";
  label.textContent = "Name";
  dialog.appendChild(label);

  const nameInput = document.createElement("input");
  nameInput.id = "sektor-name-input";
  nameInput.className = "name-dialog-input";
  nameInput.type = "text";
  nameInput.maxLength = MAXIMUM_NAME_LENGTH;
  nameInput.value = name;
  dialog.appendChild(nameInput);

  const warning = document.createElement("div");
  warning.className = "name-dialog-warning";
  warning.textContent = "nameAlreadyExists";
  dialog.appendChild(warning);

  const okButton = document.createElement("button");
  okButton.id = "name-ok-button";
  okButton.className = "name-dialog-ok";
  okButton.textContent = "OK";
  okButton.addEventListener("click", () => onNamed(nameInput.value.trim()));
  dialog.appendChild(okButton);

  nameInput.addEventListener("input", showWhetherNameIsTaken);
  showWhetherNameIsTaken();

  // Two sektors cannot go by the same name, so a name which is already taken — as is a sektor
  // left without a name — is refused as the player types it.
  function showWhetherNameIsTaken() {
    const enteredName = nameInput.value.trim();
    const nameAlreadyExists = takenNames.includes(enteredName);
    warning.hidden = !nameAlreadyExists;
    okButton.disabled = nameAlreadyExists || enteredName === "";
  }

  document.body.appendChild(overlay);
  nameInput.focus();
}
