import { deleteUsername, getUsername } from "./login.api";
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

  const logOutButton = document.createElement("button");
  logOutButton.id = "log-out-button";
  logOutButton.className = "log-out-button";
  logOutButton.textContent = "Log out";
  logOutButton.addEventListener("click", logOut);
  userDisplay.appendChild(logOutButton);

  document.body.appendChild(userDisplay);
}

// Logging out forgets the player, which leaves every page routing back to the login page.
function logOut() {
  deleteUsername();
  window.location.href = "/login.html";
}
