const USERNAME_STORAGE_KEY = "username";

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_STORAGE_KEY);
}

export function saveUsername(username: string): void {
  localStorage.setItem(USERNAME_STORAGE_KEY, username);
}
