import { getSektorList } from "../list/sektorList.api";

const SEKTOR_NAMES_STORAGE_KEY = "sektorNames";

// A sektor only has a name of its own once a player has claimed and named it, which it keeps
// when abandoned.
export function getGivenSektorName(sektorName: string): string | null {
  return getGivenSektorNames()[sektorName] ?? null;
}

export function setGivenSektorName(sektorName: string, givenName: string): void {
  const givenSektorNames = getGivenSektorNames();
  givenSektorNames[sektorName] = givenName;
  localStorage.setItem(SEKTOR_NAMES_STORAGE_KEY, JSON.stringify(givenSektorNames));
}

// The sektor being claimed is left out, so that a sektor can be claimed again under the name it
// already carries.
export function getTakenSektorNames(claimedSektorName: string): string[] {
  return getSektorList()
    .filter(sektor => sektor.name !== claimedSektorName)
    .map(sektor => getGivenSektorName(sektor.name) ?? sektor.name);
}

function getGivenSektorNames(): { [sektorName: string]: string } {
  const stored = localStorage.getItem(SEKTOR_NAMES_STORAGE_KEY);
  if (!stored) return {};
  return JSON.parse(stored);
}
