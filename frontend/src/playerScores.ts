export interface Player {
  name: string;
  score: number;
}

// Owning a sektor is what makes somebody a player, so they stand on the board from the moment they
// claim one. A player's score comes of the mandates they have completed, not of what their sektors
// do, and no mandate can be completed yet, so every player stands at nothing. Each player stands
// there once, however many sektors they own, in the order they first come up.
export function playerScores(sektorOwnerNames: (string | null)[]): Player[] {
  const playerNames = new Set<string>();

  for (const sektorOwnerName of sektorOwnerNames) {
    if (!sektorOwnerName) continue;
    playerNames.add(sektorOwnerName);
  }

  return [...playerNames].map(name => ({ name, score: 0 }));
}
