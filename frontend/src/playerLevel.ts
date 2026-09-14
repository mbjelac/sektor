// A player climbs a level every time they double what they have scored so far, which keeps the
// early levels quick to reach and the later ones worth working for. A player who has scored
// nothing — or who is in the red — is still on the first level.
export function playerLevel(playerScore: number): number {
  if (playerScore <= 0) return 1;
  return Math.max(1, Math.floor(Math.log2(playerScore + 1)));
}
