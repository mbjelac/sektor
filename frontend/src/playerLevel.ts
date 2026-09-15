import levelsMd from "./assets/levels.md?raw";
import testLevelsMd from "./assets/levels.test.md?raw";
import { levelForScore, parseLevels, pointsToNextLevel as pointsToNextLevelOf } from "./parseLevels";

const isTestMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("test") === "true";
const source = isTestMode ? testLevelsMd : levelsMd;

const levelDefinitions = parseLevels(source.split("\n"));

// The first level the table defines, which is the lowest a player or a sektor can be on.
export const LOWEST_LEVEL = levelDefinitions[0].level;

export function playerLevel(playerScore: number): number {
  return levelForScore(levelDefinitions, playerScore);
}

export function pointsToNextLevel(playerScore: number): number | null {
  return pointsToNextLevelOf(levelDefinitions, playerScore);
}
