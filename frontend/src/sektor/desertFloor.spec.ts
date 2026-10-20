import { describe, it, expect } from "vitest";
import { desertFloorFraction } from "./desertFloor";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

function everySquareOfTheMap(): { x: number, z: number }[] {
  return Array.from({ length: SEKTOR_SIZE }, (_unused, x) =>
    Array.from({ length: SEKTOR_SIZE }, (_alsoUnused, z) => ({ x, z })))
    .flat();
}

describe("desertFloorFraction", () => {
  // Every square takes a color somewhere between the poorest and the richest of the desert's, and
  // the squares spread over the whole of that range rather than bunching up at one end of it.
  it("gives the squares of a map colors from all over the desert's range", () => {
    const fractions = everySquareOfTheMap().map(({ x, z }) => desertFloorFraction(x, z));

    expect({
      outOfRange: fractions.filter(fraction => fraction < 0 || fraction > 1),
      inEveryQuarter: [0, 1, 2, 3].map(quarter =>
        fractions.some(fraction => fraction >= quarter / 4 && fraction <= (quarter + 1) / 4)),
    }).toEqual({ outOfRange: [], inEveryQuarter: [true, true, true, true] });
  });

  it("gives the same square the same color every time", () => {
    expect(desertFloorFraction(3, 7)).toEqual(desertFloorFraction(3, 7));
  });
});
