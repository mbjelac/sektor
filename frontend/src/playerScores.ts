import { SektorStatus } from "./sektor/Sektor";

export interface Player {
  name: string;
  score: number;
}

export interface OwnedSektor {
  owner: string | null;
  status: SektorStatus;
  score: number;
}

// Owning a sektor is what makes somebody a player, so they are scored from the moment they claim
// one, however long it takes them to finish it. What they are credited with is what they have
// delivered: a sektor still being worked on counts for nothing, so a half built one never counts
// against the player in the middle of building it. The best score comes first.
export function playerScores(ownedSektors: OwnedSektor[]): Player[] {
  const scoresByPlayerName = new Map<string, number>();

  for (const ownedSektor of ownedSektors) {
    if (!ownedSektor.owner) continue;
    const delivered = ownedSektor.status === "Done" ? ownedSektor.score : 0;
    scoresByPlayerName.set(ownedSektor.owner, (scoresByPlayerName.get(ownedSektor.owner) ?? 0) + delivered);
  }

  return [...scoresByPlayerName.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((player, otherPlayer) => otherPlayer.score - player.score);
}
