import levelsMd from "./assets/levels.md?raw";
import testLevelsMd from "./assets/levels.test.md?raw";
import { levelForScore, parseLevels } from "./parseLevels";

const isTestMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("test") === "true";
const source = isTestMode ? testLevelsMd : levelsMd;

const levelDefinitions = parseLevels(source.split("\n"));

export function playerLevel(playerScore: number): number {
  return levelForScore(levelDefinitions, playerScore);
}
