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
