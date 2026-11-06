// A set of criteria a player can claim, and which brings them points while every sektor they own
// fulfils it. A mandate is made with nobody owning it, and is known by its number. Whether it is
// completed is worked out anew whenever its owner changes one of their sektors.
export interface Mandate {
  number: number;
  owner: string | null;
  criteria: MandateCriterion[];
  completed: boolean;
}

// What the player's sektors have to do, between them, for a mandate to be fulfilled: export at least
// so much of a resource, or import at most so much of it.
export interface MandateCriterion {
  type: "minimumExport" | "maximumImport";
  resourceName: string;
  amount: number;
}

const MANDATES_STORAGE_KEY = "mandates";

export function getMandates(): Mandate[] {
  const stored = localStorage.getItem(MANDATES_STORAGE_KEY);
  if (!stored) return [];
  // A mandate stored before mandates could be completed was never completed.
  return (JSON.parse(stored) as Mandate[]).map(mandate => ({ ...mandate, completed: mandate.completed ?? false }));
}

export function addMandate(mandate: Mandate): void {
  saveMandates([...getMandates(), mandate]);
}

export function setMandateOwner(mandateNumber: number, owner: string): void {
  saveMandates(getMandates().map(mandate => mandate.number === mandateNumber ? { ...mandate, owner } : mandate));
}

// Whether each of the mandates numbered is completed. A mandate not numbered is left as it was.
export function setMandatesCompleted(completedByMandateNumber: Map<number, boolean>): void {
  saveMandates(getMandates().map(mandate => ({
    ...mandate,
    completed: completedByMandateNumber.get(mandate.number) ?? mandate.completed,
  })));
}

export function clearMandates(): void {
  localStorage.removeItem(MANDATES_STORAGE_KEY);
}

function saveMandates(mandates: Mandate[]): void {
  localStorage.setItem(MANDATES_STORAGE_KEY, JSON.stringify(mandates));
}
