import { getSektorList } from "./list/sektorList.api";
import { getSektorSummary } from "./list/sektorSummary";
import { Player, playerScores } from "./playerScores";
import { globalImportsAndExports } from "./globalImportsAndExports";
import { currentScore } from "./currentScore";
import { getNegativeScoringResources } from "./resources";

export type { Player };

// A sektor is worth what it does for the planet, so what every sektor moves is added up into what
// the planet brings in and sends out before any of them is scored against it.
export function getPlayers(): Player[] {
  const sektorList = getSektorList();
  const summaries = sektorList.map(sektorListItem => getSektorSummary(sektorListItem.id));
  const planetImportsAndExports = globalImportsAndExports(summaries);

  return playerScores(sektorList.map((sektorListItem, sektorIndex) => ({
    owner: sektorListItem.owner,
    score: currentScore(summaries[sektorIndex], planetImportsAndExports, getNegativeScoringResources()),
  })));
}

// What a player has scored so far. Somebody who owns no sektor, and anybody at all before they have
// logged in, stands at nothing.
export function scoreOfPlayer(playerName: string | null): number {
  if (!playerName) return 0;
  return getPlayers().find(player => player.name === playerName)?.score ?? 0;
}
