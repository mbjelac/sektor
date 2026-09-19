import { describe, it, expect } from "vitest";
import { currentResourceScore, currentScore } from "./currentScore";
import { ImportsAndExports } from "./globalImportsAndExports";

function moving(imports: [string, number][], exports: [string, number][]): ImportsAndExports {
  return {
    imports: imports.map(([name, value]) => ({ name, value })),
    exports: exports.map(([name, value]) => ({ name, value })),
  };
}

const NOTHING_SCORES_NEGATIVELY: string[] = [];

function scoreOf(
  resourceName: string,
  sektor: ImportsAndExports,
  planet: ImportsAndExports,
  negativeScoringResources = NOTHING_SCORES_NEGATIVELY,
): number {
  return currentResourceScore(resourceName, sektor, planet, negativeScoringResources);
}

describe("currentResourceScore", () => {
  it("takes a point off for bringing in what the planet has over", () => {
    expect(scoreOf("Water", moving([["Water", 3]], []), moving([], [["Water", 10]]))).toEqual(-1);
  });

  it("takes two points off for bringing in what the planet is short of", () => {
    expect(scoreOf("Water", moving([["Water", 3]], []), moving([["Water", 10]], []))).toEqual(-2);
  });

  it("gives a point for sending out what the planet has over", () => {
    expect(scoreOf("Water", moving([], [["Water", 3]]), moving([], [["Water", 10]]))).toEqual(1);
  });

  it("gives two points for sending out what the planet is short of", () => {
    expect(scoreOf("Water", moving([], [["Water", 3]]), moving([["Water", 10]], []))).toEqual(2);
  });

  // The planet sends out exactly as much of the resource as it brings in, so a sektor moving it
  // neither helps nor harms.
  it("scores nothing for a resource the planet neither is short of nor has over", () => {
    expect(scoreOf("Water", moving([["Water", 3]], []), moving([], []))).toEqual(0);
  });

  it("scores nothing for a resource the sektor does not move", () => {
    expect(scoreOf("Water", moving([["Water", 0]], [["Water", 0]]), moving([["Water", 10]], []))).toEqual(0);
  });

  it("scores nothing for a resource the sektor has nothing to say about", () => {
    expect(scoreOf("Water", moving([], []), moving([["Water", 10]], []))).toEqual(0);
  });

  // A resource which does the planet harm rather than good turns the whole table around: taking a
  // share of what the planet is drowning in is the best a sektor can do with it, and adding to it
  // the worst.
  it("turns the table around for a resource which does harm", () => {
    const waste = moving([], [["Waste", 3]]);
    const planetIsShortOfWaste = moving([["Waste", 10]], []);

    expect(scoreOf("Waste", waste, planetIsShortOfWaste, ["Waste"])).toEqual(-2);
  });

  it("gives points for taking in a resource which does harm", () => {
    const takesInWaste = moving([["Waste", 3]], []);
    const planetHasWasteOver = moving([], [["Waste", 10]]);

    expect(scoreOf("Waste", takesInWaste, planetHasWasteOver, ["Waste"])).toEqual(1);
  });
});

describe("currentScore", () => {
  // The plan's own example: Wheat brought in which the planet has over, Water sent out which the
  // planet has over, and Food brought in which the planet is short of.
  it("adds up what every resource the sektor moves is worth", () => {
    const sektor = moving([["Wheat", 4], ["Food", 2]], [["Water", 6]]);
    const planet = moving([["Food", 15]], [["Wheat", 10], ["Water", 3]]);

    expect(currentScore(sektor, planet, NOTHING_SCORES_NEGATIVELY)).toEqual(-2);
  });

  it("scores a sektor which moves nothing at nothing", () => {
    expect(currentScore(moving([], []), moving([["Water", 10]], []), NOTHING_SCORES_NEGATIVELY)).toEqual(0);
  });
});
