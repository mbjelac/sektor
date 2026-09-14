import { describe, it, expect } from "vitest";
import { LevelDefinition, levelForScore, parseLevels } from "./parseLevels";

const testLevels: LevelDefinition[] = [
  { level: 1, minimumScore: 0 },
  { level: 2, minimumScore: 10 },
  { level: 3, minimumScore: 25 },
];

describe("parseLevels", () => {
  it("reads a level and its minimum score from every line", () => {
    expect(parseLevels(["1 0", "2 10", "3 25"])).toEqual(testLevels);
  });

  it("skips lines which do not hold a level and a minimum score", () => {
    expect(parseLevels(["", "1 0", "   ", "2 10"])).toEqual([
      { level: 1, minimumScore: 0 },
      { level: 2, minimumScore: 10 },
    ]);
  });
});

describe("levelForScore", () => {
  it("puts a player on the last level whose minimum score they have reached", () => {
    expect([0, 9, 10, 24, 25, 500].map(playerScore => levelForScore(testLevels, playerScore)))
      .toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("puts a player who has not reached any minimum score on the first level", () => {
    expect(levelForScore([{ level: 1, minimumScore: 5 }, { level: 2, minimumScore: 10 }], -20)).toEqual(1);
  });
});
