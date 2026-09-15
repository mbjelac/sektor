import { getSektorList } from "./list/sektorList.api";
import { getSektorOwner } from "./sektor/sektorOwner.api";
import { getSektorSummary } from "./list/sektorSummary";
import { Player, playerScores } from "./playerScores";

export type { Player };

export function getPlayers(): Player[] {
  return playerScores(getSektorList().map(sektorListItem => {
    const summary = getSektorSummary(sektorListItem.name);
    return {
      owner: getSektorOwner(sektorListItem.name),
      status: summary.status,
      score: summary.score,
    };
  }));
}
