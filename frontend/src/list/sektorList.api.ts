import { TriangleCoordinate } from "./planetGrid";

// Everything known about a sektor apart from what stands in it: the id its data is stored under,
// the name it carries, the player who owns it, and the triangle of the planet it lies on. A sektor
// is made with a name and keeps it when abandoned, but has no owner until somebody claims it. A
// sektor made before sektors were put on the planet lies nowhere on it.
export interface SektorListItem {
  id: string;
  name: string | null;
  owner: string | null;
  location?: TriangleCoordinate;
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

// The triangle of the planet a sektor lies on, or null for a sektor made before sektors were put
// on the planet.
export function getSektorLocation(sektorId: string): TriangleCoordinate | null {
  return getSektor(sektorId)?.location ?? null;
}

export function setSektorOwner(sektorId: string, owner: string): void {
  updateSektor(sektorId, { owner });
}

function getSektor(sektorId: string): SektorListItem | null {
  return getSektorList().find(sektor => sektor.id === sektorId) ?? null;
}

export function addSektorToList(sektorId: string, name: string | null, location: TriangleCoordinate): void {
  saveSektorList([...getSektorList(), { id: sektorId, name, owner: null, location }]);
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
    ...(sektor.location ? { location: sektor.location } : {}),
  }));
}

function saveSektorList(sektorList: SektorListItem[]): void {
  localStorage.setItem(SEKTORS_STORAGE_KEY, JSON.stringify(sektorList));
}
