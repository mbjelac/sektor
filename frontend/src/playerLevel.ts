import levelsMd from "./assets/levels.md?raw";
import testLevelsMd from "./assets/levels.test.md?raw";
import { levelForScore, parseLevels, pointsToNextLevel as pointsToNextLevelOf } from "./parseLevels";
import { isTestMode } from "./testMode";

const source = isTestMode ? testLevelsMd : levelsMd;

const levelDefinitions = parseLevels(source.split("\n"));

export function playerLevel(playerScore: number): number {
  return levelForScore(levelDefinitions, playerScore);
}

export function pointsToNextLevel(playerScore: number): number | null {
  return pointsToNextLevelOf(levelDefinitions, playerScore);
}
