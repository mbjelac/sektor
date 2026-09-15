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

// What a player still has to score to climb a level. The level climbed to is the one above the
// level the player is on, which is not the same as the first level they have not scored enough for:
// a player in the red has not scored enough even for the level they are already on, and what they
// have to score is what carries them past it, not back up to it. A player on the highest level the
// table defines has nothing left to climb to, and so nothing to score towards.
export function pointsToNextLevel(levelDefinitions: LevelDefinition[], playerScore: number): number | null {
  const currentLevel = levelForScore(levelDefinitions, playerScore);
  const nextLevel = levelDefinitions.find(levelDefinition => levelDefinition.level > currentLevel);
  if (!nextLevel) return null;
  return nextLevel.minimumScore - playerScore;
}

// A player is on the last level whose minimum score they have reached, so a score which has not
// reached any of them leaves the player on the first level the table defines.
export function levelForScore(levelDefinitions: LevelDefinition[], playerScore: number): number {
  const reachedLevels = levelDefinitions.filter(levelDefinition => playerScore >= levelDefinition.minimumScore);
  if (reachedLevels.length === 0) return levelDefinitions[0].level;
  return reachedLevels[reachedLevels.length - 1].level;
}
