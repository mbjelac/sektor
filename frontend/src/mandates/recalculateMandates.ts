import { getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";
import { completedMandate, summedImportsAndExports } from "./mandateCompletion";
import { getMandates, replaceMandates } from "./mandates.api";

// Whether a player's mandates, and every criterion of them, are completed is worked out anew from every sektor they own, as they
// stand stored, whenever the player changes one of them.
export function recalculateMandates(playerName: string | null) {
  if (!playerName) return;

  const playerImportsAndExports = summedImportsAndExports(
    getSektorList()
      .filter(sektorListItem => sektorListItem.owner === playerName)
      .map(sektorListItem => getSektorSummary(sektorListItem.id)),
  );

  replaceMandates(
    getMandates()
      .filter(mandate => mandate.owner === playerName)
      .map(mandate => completedMandate(mandate, playerImportsAndExports)),
  );
}
