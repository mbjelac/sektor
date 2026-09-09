import { getUsername } from "./login.api";

// Every page but the login page itself is only for logged in players, so each page asks for a
// login before showing anything of its own.
export function requireLogin(): void {
  if (!getUsername()) {
    window.location.href = "/login.html";
  }
}
