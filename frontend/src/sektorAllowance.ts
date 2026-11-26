import { Mandate } from "./mandates/mandates.api";
import { mandateCounts } from "./mandates/mandateCounts";

// Every so many mandates completed let the player own one sektor more.
export const MANDATES_PER_ALLOWED_SEKTOR = 5;

export interface SektorAllowance {
  canClaimSektors: boolean;
  mandatesToNextAllowance: number;
}

// A player may claim another sektor only while they own fewer than their completed mandates allow.
// A player whose completed mandate is no longer completed keeps the sektors they own, but claims no
// more until they are back within the allowance.
export function sektorAllowance(sektorOwnerNames: (string | null)[], mandates: Mandate[], playerName: string | null): SektorAllowance {
  const ownedSektorCount = sektorOwnerNames.filter(sektorOwnerName => sektorOwnerName !== null && sektorOwnerName === playerName).length;
  const completedMandateCount = mandateCounts(mandates, playerName).complete;
  return {
    canClaimSektors: ownedSektorCount < allowedSektorCount(completedMandateCount),
    mandatesToNextAllowance: mandatesToNextAllowance(completedMandateCount),
  };
}

// A new player, having completed nothing, may own one sektor, enough to complete their first mandates.
export function allowedSektorCount(completedMandateCount: number): number {
  return Math.floor(completedMandateCount / MANDATES_PER_ALLOWED_SEKTOR) + 1;
}

export function mandatesToNextAllowance(completedMandateCount: number): number {
  return MANDATES_PER_ALLOWED_SEKTOR - completedMandateCount % MANDATES_PER_ALLOWED_SEKTOR;
}
