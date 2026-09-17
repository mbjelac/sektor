export interface Player {
  name: string;
  score: number;
}

export interface OwnedSektor {
  owner: string | null;
  score: number;
}

// Owning a sektor is what makes somebody a player, so they are scored from the moment they claim
// one. What they are credited with is what their sektors are worth as they stand, whether or not
// they are still building in them. The best score comes first.
export function playerScores(ownedSektors: OwnedSektor[]): Player[] {
  const scoresByPlayerName = new Map<string, number>();

  for (const ownedSektor of ownedSektors) {
    if (!ownedSektor.owner) continue;
    scoresByPlayerName.set(ownedSektor.owner, (scoresByPlayerName.get(ownedSektor.owner) ?? 0) + ownedSektor.score);
  }

  return [...scoresByPlayerName.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((player, otherPlayer) => otherPlayer.score - player.score);
}
