import { getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";
import { completedMandate } from "./mandateCompletion";
import { globalImportsAndExports } from "../globalImportsAndExports";
import { getMandates, replaceMandates } from "./mandates.api";
import { totalDeforestation } from "../sektor/deforestation";
import { totalPollution } from "../sektor/pollution";

// Whether a player's mandates, and every criterion of them, are completed is worked out anew from every sektor they own, as they
// stand stored, whenever the player changes one of them.
export function recalculateMandates(playerName: string | null) {
  if (!playerName) return;

  // Every sektor of the player counts towards every mandate of theirs. What one of them brings in of a
  // resource is set against what another sends out of it, just as it is for the whole planet, so a
  // resource counts as imported or exported only by what is left over. The sektors are deforested by
  // all the support they started with less all they still give, and polluted by all of their
  // pollution.
  const playerSektorSummaries = getSektorList()
    .filter(sektorListItem => sektorListItem.owner === playerName)
    .map(sektorListItem => getSektorSummary(sektorListItem.id));
  const playerTotals = {
    importsAndExports: globalImportsAndExports(playerSektorSummaries),
    deforestation: totalDeforestation(playerSektorSummaries),
    pollution: totalPollution(playerSektorSummaries.map(sektorSummary => sektorSummary.pollution)),
  };

  replaceMandates(
    getMandates()
      .filter(mandate => mandate.owner === playerName)
      .map(mandate => completedMandate(mandate, playerTotals)),
  );
}
