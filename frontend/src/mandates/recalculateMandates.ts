import { getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";
import { isMandateComplete, summedImportsAndExports } from "./mandateCompletion";
import { getMandates, setMandatesCompleted } from "./mandates.api";

// Whether a player's mandates are completed is worked out anew from every sektor they own, as they
// stand stored, whenever the player changes one of them.
export function recalculateMandates(playerName: string | null) {
  if (!playerName) return;

  const playerImportsAndExports = summedImportsAndExports(
    getSektorList()
      .filter(sektorListItem => sektorListItem.owner === playerName)
      .map(sektorListItem => getSektorSummary(sektorListItem.id)),
  );

  setMandatesCompleted(new Map(
    getMandates()
      .filter(mandate => mandate.owner === playerName)
      .map(mandate => [mandate.number, isMandateComplete(mandate, playerImportsAndExports)]),
  ));
}
