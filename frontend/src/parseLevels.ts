export interface LevelDefinition {
  level: number;
  minimumScore: number;
}

export function parseLevels(lines: string[]): LevelDefinition[] {
  const levelDefinitions: LevelDefinition[] = [];

  for (const line of lines) {
    const parts = line.trim().split(" ");
    if (parts.length < 2) continue;
    levelDefinitions.push({
      level: Number(parts[0]),
      minimumScore: Number(parts[1]),
    });
  }

  return levelDefinitions;
}

// A player is on the last level whose minimum score they have reached, so a score which has not
// reached any of them leaves the player on the first level the table defines.
export function levelForScore(levelDefinitions: LevelDefinition[], playerScore: number): number {
  const reachedLevels = levelDefinitions.filter(levelDefinition => playerScore >= levelDefinition.minimumScore);
  if (reachedLevels.length === 0) return levelDefinitions[0].level;
  return reachedLevels[reachedLevels.length - 1].level;
}
