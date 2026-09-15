import { describe, it, expect } from "vitest";
import { LevelDefinition, levelForScore, parseLevels, pointsToNextLevel } from "./parseLevels";

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

describe("pointsToNextLevel", () => {
  // Every score from below the table to the top of it: in the red, on a minimum score exactly, one
  // short of the next one, and in between.
  it("counts what a player still has to score to reach the level above the one they are on", () => {
    expect([-20, -1, 0, 1, 9, 10, 11, 24].map(playerScore => ({
      playerScore,
      points: pointsToNextLevel(testLevels, playerScore),
    }))).toEqual([
      { playerScore: -20, points: 30 },
      { playerScore: -1, points: 11 },
      { playerScore: 0, points: 10 },
      { playerScore: 1, points: 9 },
      { playerScore: 9, points: 1 },
      { playerScore: 10, points: 15 },
      { playerScore: 11, points: 14 },
      { playerScore: 24, points: 1 },
    ]);
  });

  it("leaves a player who has reached the highest level with nothing to score towards", () => {
    expect([25, 26, 500].map(playerScore => pointsToNextLevel(testLevels, playerScore)))
      .toEqual([null, null, null]);
  });

  it("leaves every player of a table of one level with nothing to score towards", () => {
    expect([-5, 0, 100].map(playerScore => pointsToNextLevel([{ level: 1, minimumScore: 0 }], playerScore)))
      .toEqual([null, null, null]);
  });

  // A table need not start at nothing. A player below its first minimum score is on its first level
  // all the same, so what they climb to is the second level, not the first.
  it("counts a player below the first minimum score to the second level", () => {
    const levelsStartingAtFive: LevelDefinition[] = [
      { level: 1, minimumScore: 5 },
      { level: 2, minimumScore: 20 },
    ];

    expect([0, 4, 5, 19].map(playerScore => pointsToNextLevel(levelsStartingAtFive, playerScore)))
      .toEqual([20, 16, 15, 1]);
  });
});
