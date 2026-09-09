const SEKTOR_OWNERS_STORAGE_KEY = "sektorOwners";

export function getSektorOwner(sektorName: string): string | null {
  return getSektorOwners()[sektorName] ?? null;
}

export function setSektorOwner(sektorName: string, owner: string): void {
  const sektorOwners = getSektorOwners();
  sektorOwners[sektorName] = owner;
  localStorage.setItem(SEKTOR_OWNERS_STORAGE_KEY, JSON.stringify(sektorOwners));
}

function getSektorOwners(): { [sektorName: string]: string } {
  const stored = localStorage.getItem(SEKTOR_OWNERS_STORAGE_KEY);
  if (!stored) return {};
  return JSON.parse(stored);
}
