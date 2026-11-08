import { abandonedMandate } from "./abandonedMandate";

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
// so much of a resource, or import at most so much of it. Whether they do is worked out anew along
// with the mandate it belongs to.
export interface MandateCriterion {
  type: "minimumExport" | "maximumImport";
  resourceName: string;
  amount: number;
  completed: boolean;
}

const MANDATES_STORAGE_KEY = "mandates";

export function getMandates(): Mandate[] {
  const stored = localStorage.getItem(MANDATES_STORAGE_KEY);
  if (!stored) return [];
  // A mandate or criterion stored before either could be completed was never completed.
  return (JSON.parse(stored) as Mandate[]).map(mandate => ({
    ...mandate,
    criteria: mandate.criteria.map(criterion => ({ ...criterion, completed: criterion.completed ?? false })),
    completed: mandate.completed ?? false,
  }));
}

export function addMandate(mandate: Mandate): void {
  saveMandates([...getMandates(), mandate]);
}

export function setMandateOwner(mandateNumber: number, owner: string): void {
  saveMandates(getMandates().map(mandate => mandate.number === mandateNumber ? { ...mandate, owner } : mandate));
}

// A mandate given up is nobody's, so it waits to be claimed by anybody, the player who gave it up
// included, and counts towards nobody's score.
export function abandonMandate(mandateNumber: number): void {
  replaceMandates(getMandates()
    .filter(mandate => mandate.number === mandateNumber)
    .map(abandonedMandate));
}

// Every mandate given is stored in place of the one of its number. The others are left as they were.
export function replaceMandates(replacingMandates: Mandate[]): void {
  saveMandates(getMandates().map(mandate =>
    replacingMandates.find(replacingMandate => replacingMandate.number === mandate.number) ?? mandate
  ));
}

export function clearMandates(): void {
  localStorage.removeItem(MANDATES_STORAGE_KEY);
}

function saveMandates(mandates: Mandate[]): void {
  localStorage.setItem(MANDATES_STORAGE_KEY, JSON.stringify(mandates));
}
