import { Mandate } from "./mandates.api";

// The list of mandates shows either those waiting to be claimed or those the player has claimed.
export type MandateFilter = "unclaimed" | "own";

export function filterMandates(mandates: Mandate[], mandateFilter: MandateFilter, playerName: string | null): Mandate[] {
  if (mandateFilter === "unclaimed") return mandates.filter(mandate => mandate.owner === null);
  return mandates.filter(mandate => mandate.owner !== null && mandate.owner === playerName);
}
