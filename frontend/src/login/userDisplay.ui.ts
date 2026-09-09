import { getUsername } from "./login.api";
import { userIcon } from "../icons";

// The logged in player is shown in the top right corner of every page.
export function showUser(): void {
  const username = getUsername();
  if (!username) return;

  const userDisplay = document.createElement("div");
  userDisplay.id = "user-display";

  const icon = document.createElement("span");
  icon.className = "user-icon";
  icon.innerHTML = userIcon;
  userDisplay.appendChild(icon);

  const usernameElement = document.createElement("span");
  usernameElement.className = "user-name";
  usernameElement.textContent = username;
  userDisplay.appendChild(usernameElement);

  document.body.appendChild(userDisplay);
}
