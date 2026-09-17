import { getSektorList } from "./list/sektorList.api";
import { getSektorSummary } from "./list/sektorSummary";
import { Player, playerScores } from "./playerScores";

export type { Player };

export function getPlayers(): Player[] {
  return playerScores(getSektorList().map(sektorListItem => {
    const summary = getSektorSummary(sektorListItem.id);
    return {
      owner: sektorListItem.owner,
      status: summary.status,
      score: summary.score,
    };
  }));
}

// What a player has scored so far. Somebody who owns no sektor, and anybody at all before they have
// logged in, stands at nothing.
export function scoreOfPlayer(playerName: string | null): number {
  if (!playerName) return 0;
  return getPlayers().find(player => player.name === playerName)?.score ?? 0;
}
