import { getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";
import { PlayerTotals } from "./mandateCompletion";
import { globalImportsAndExports } from "../globalImportsAndExports";
import { totalDeforestation } from "../sektor/deforestation";
import { totalPollution } from "../sektor/pollution";
import { totalPopulation } from "../sektor/population";
import { totalHapiness } from "../sektor/totalHapiness";

// Every sektor of the player counts towards every mandate of theirs. What one of them brings in of a
// resource is set against what another sends out of it, just as it is for the whole planet, so a
// resource counts as imported or exported only by what is left over. The sektors are deforested by
// all the support they started with less all they still give, are polluted by all of their
// pollution, house all of their people, and make all of their Hapiness. Somebody not logged in owns
// no sektor, so comes to nothing.
export function getPlayerTotals(playerName: string | null): PlayerTotals {
  const playerSektorSummaries = getSektorList()
    .filter(sektorListItem => playerName !== null && sektorListItem.owner === playerName)
    .map(sektorListItem => getSektorSummary(sektorListItem.id));
  return {
    importsAndExports: globalImportsAndExports(playerSektorSummaries),
    deforestation: totalDeforestation(playerSektorSummaries),
    pollution: totalPollution(playerSektorSummaries.map(sektorSummary => sektorSummary.pollution)),
    population: totalPopulation(playerSektorSummaries.map(sektorSummary => sektorSummary.population)),
    hapiness: totalHapiness(playerSektorSummaries.map(sektorSummary => sektorSummary.hapiness)),
  };
}
