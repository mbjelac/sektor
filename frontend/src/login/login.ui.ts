import { saveUsername } from "./login.api";

function renderLogin() {
  const container = document.getElementById("login")!;

  const label = document.createElement("label");
  label.className = "login-label";
  label.htmlFor = "username-input";
  label.textContent = "Username";
  container.appendChild(label);

  const usernameInput = document.createElement("input");
  usernameInput.id = "username-input";
  usernameInput.className = "login-input";
  usernameInput.type = "text";
  container.appendChild(usernameInput);

  usernameInput.addEventListener("keydown", keyboardEvent => {
    if (keyboardEvent.key === "Enter") logIn(usernameInput.value);
  });

  const logInButton = document.createElement("button");
  logInButton.id = "log-in-button";
  logInButton.className = "login-button";
  logInButton.textContent = "Log in";
  logInButton.addEventListener("click", () => logIn(usernameInput.value));
  container.appendChild(logInButton);

  usernameInput.focus();
}

// A player is logged in as soon as they have entered their username — no password needed yet.
function logIn(username: string) {
  const enteredUsername = username.trim();
  if (!enteredUsername) return;
  saveUsername(enteredUsername);
  window.location.href = "/";
}

renderLogin();
