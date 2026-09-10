import { flagIcon } from "./icons";

// Claiming a sektor plants the player's flag on it, wherever the sektor is offered from.
export function createClaimButton(onClaim: () => void): HTMLButtonElement {
  const claimButton = document.createElement("button");
  claimButton.className = "claim-button";

  const icon = document.createElement("span");
  icon.className = "claim-icon";
  icon.innerHTML = flagIcon;
  claimButton.appendChild(icon);

  const label = document.createElement("span");
  label.textContent = "Claim";
  claimButton.appendChild(label);

  claimButton.addEventListener("click", onClaim);

  return claimButton;
}
