import { Mandate } from "./mandates.api";

export interface MandateCounts {
  incomplete: number;
  complete: number;
  claimed: number;
}

// How many mandates the player has claimed, and how many of those are completed and not yet.
export function mandateCounts(mandates: Mandate[], playerName: string | null): MandateCounts {
  const claimedMandates = mandates.filter(mandate => mandate.owner !== null && mandate.owner === playerName);
  const complete = claimedMandates.filter(mandate => mandate.completed).length;
  return { incomplete: claimedMandates.length - complete, complete, claimed: claimedMandates.length };
}
