import { Mandate } from "./mandates/mandates.api";
import { mandateCounts } from "./mandates/mandateCounts";

// Every so many mandates fulfilled let the player own one sektor more.
export const MANDATES_PER_ALLOWED_SEKTOR = 5;

export interface SektorAllowance {
  canClaimSektors: boolean;
  mandatesToNextAllowance: number;
}

// A player may claim another sektor only while they own fewer than their fulfilled mandates allow.
// A player whose fulfilled mandate is no longer fulfilled keeps the sektors they own, but claims no
// more until they are back within the allowance.
export function sektorAllowance(sektorOwnerNames: (string | null)[], mandates: Mandate[], playerName: string | null): SektorAllowance {
  const ownedSektorCount = sektorOwnerNames.filter(sektorOwnerName => sektorOwnerName !== null && sektorOwnerName === playerName).length;
  const fulfilledMandateCount = mandateCounts(mandates, playerName).complete;
  return {
    canClaimSektors: ownedSektorCount < allowedSektorCount(fulfilledMandateCount),
    mandatesToNextAllowance: mandatesToNextAllowance(fulfilledMandateCount),
  };
}

// A new player, having fulfilled nothing, may own one sektor, enough to fulfill their first mandates.
export function allowedSektorCount(fulfilledMandateCount: number): number {
  return Math.floor(fulfilledMandateCount / MANDATES_PER_ALLOWED_SEKTOR) + 1;
}

export function mandatesToNextAllowance(fulfilledMandateCount: number): number {
  return MANDATES_PER_ALLOWED_SEKTOR - fulfilledMandateCount % MANDATES_PER_ALLOWED_SEKTOR;
}
