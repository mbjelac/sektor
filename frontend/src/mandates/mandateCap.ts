import { Mandate } from "./mandates.api";
import { mandateCounts } from "./mandateCounts";

// A player works on at most so many mandates at once.
export const MAXIMUM_UNFULFILLED_MANDATES = 3;

// A player may claim another mandate only while they work on fewer than the most they may. A player
// over it, as one whose fulfilled mandate is no longer fulfilled may be, can claim none either.
export function canClaimMandates(mandates: Mandate[], playerName: string | null): boolean {
  return countMandatesTakingSlot(mandates, playerName) < MAXIMUM_UNFULFILLED_MANDATES;
}

// Only the mandates the player has claimed and not yet fulfilled take up a slot. A fulfilled mandate
// frees its slot, so the player can go on claiming and their score goes on growing.
export function countMandatesTakingSlot(mandates: Mandate[], playerName: string | null): number {
  return mandateCounts(mandates, playerName).incomplete;
}
