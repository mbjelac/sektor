// Everything known about a sektor apart from what stands in it: the id its data is stored under,
// the name a player gave it, and the player who owns it. A sektor has no name and no owner until
// somebody claims it, and keeps the name when abandoned.
export interface SektorListItem {
  id: string;
  name: string | null;
  owner: string | null;
}

const SEKTORS_STORAGE_KEY = "sektors";

export function getGivenSektorName(sektorId: string): string | null {
  return getSektor(sektorId)?.name ?? null;
}

export function setGivenSektorName(sektorId: string, givenName: string): void {
  updateSektor(sektorId, { name: givenName });
}

// The sektor being claimed is left out, so that a sektor can be claimed again under the name it
// already carries. A sektor never named goes by its id.
export function getTakenSektorNames(claimedSektorId: string): string[] {
  return getSektorList()
    .filter(sektor => sektor.id !== claimedSektorId)
    .map(sektor => sektor.name ?? sektor.id);
}

export function getSektorOwner(sektorId: string): string | null {
  return getSektor(sektorId)?.owner ?? null;
}

export function setSektorOwner(sektorId: string, owner: string): void {
  updateSektor(sektorId, { owner });
}

export function removeSektorOwner(sektorId: string): void {
  updateSektor(sektorId, { owner: null });
}

function getSektor(sektorId: string): SektorListItem | null {
  return getSektorList().find(sektor => sektor.id === sektorId) ?? null;
}

export function addSektorToList(sektorId: string): void {
  saveSektorList([...getSektorList(), { id: sektorId, name: null, owner: null }]);
}

export function clearSektorList(): void {
  localStorage.removeItem(SEKTORS_STORAGE_KEY);
}

function updateSektor(sektorId: string, changes: Partial<SektorListItem>): void {
  saveSektorList(getSektorList().map(sektor => sektor.id === sektorId ? { ...sektor, ...changes } : sektor));
}

export function getSektorList(): SektorListItem[] {
  const stored = localStorage.getItem(SEKTORS_STORAGE_KEY);
  if (!stored) return [];
  return (JSON.parse(stored) as SektorListItem[]).map(sektor => ({
    id: sektor.id,
    name: sektor.name ?? null,
    owner: sektor.owner ?? null,
  }));
}

function saveSektorList(sektorList: SektorListItem[]): void {
  localStorage.setItem(SEKTORS_STORAGE_KEY, JSON.stringify(sektorList));
}
