import { getSektorList } from "./list/sektorList.api";
import { getSektorOwner } from "./sektor/sektorOwner.api";
import { getSektorSummary } from "./list/sektorSummary";

export interface Player {
  name: string;
  score: number;
}

// Everyone who owns a sektor is a player, and what all of their sektors score together is what
// they are ranked by, the best standing first.
export function getPlayers(): Player[] {
  const scoresByPlayerName = new Map<string, number>();

  for (const sektorListItem of getSektorList()) {
    const owner = getSektorOwner(sektorListItem.name);
    if (!owner) continue;
    const score = getSektorSummary(sektorListItem.name).score;
    scoresByPlayerName.set(owner, (scoresByPlayerName.get(owner) ?? 0) + score);
  }

  return [...scoresByPlayerName.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((player, otherPlayer) => otherPlayer.score - player.score);
}
