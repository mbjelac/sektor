// Green while the player's sektors fulfil what it stands beside, red while they do not.
export function createCompletionDot(completed: boolean): HTMLElement {
  const completionDot = document.createElement("span");
  completionDot.className = completed ? "mandate-completion mandate-completed" : "mandate-completion";
  completionDot.title = completed ? "Complete" : "Not complete";
  return completionDot;
}
