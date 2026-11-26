import { Mandate } from "./mandates.api";

// A mandate nobody owns is nobody's to complete, so it stands with an empty box.
export function createMandateCheckbox(mandate: Mandate): HTMLElement {
  return createCompletionCheckbox(mandate.owner !== null && mandate.completed);
}

// An empty box while the player's sektors do not complete what it stands beside, a checked one once
// they do.
export function createCompletionCheckbox(completed: boolean): HTMLElement {
  const completionCheckbox = document.createElement("span");
  completionCheckbox.className = completed ? "mandate-checkbox mandate-checkbox-checked" : "mandate-checkbox";
  completionCheckbox.textContent = completed ? "✅" : "⬜";
  completionCheckbox.dataset.title = completed ? "Complete" : "Incomplete";
  return completionCheckbox;
}
