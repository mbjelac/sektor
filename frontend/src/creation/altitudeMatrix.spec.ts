import { describe, it, expect } from "vitest";
import { createAltitudeMatrix } from "./altitudeMatrix";
import { MAX_ALTITUDE, MIN_ALTITUDE } from "../../../shared/altitude";

const MAP_SIZES = [4, 6, 8, 10];
// Every level whose floor differs, and one beyond them all, which shares the lowest floor there is.
const LEVELS_AND_LEAST_FLAT_SHARES: [number, number][] = [[1, 0.7], [2, 0.6], [3, 0.5], [4, 0.4], [15, 0.4]];
const LEVELS = LEVELS_AND_LEAST_FLAT_SHARES.map(([level]) => level);
const RUNS = 50;

// The share of the map lying at the lowest altitude, which is what a sektor's difficulty is spent
// against: the harder the sektor, the less of it is flat.
function flatShareOf(altitudes: number[][]): number {
  const allAltitudes = altitudes.flat();
  return allAltitudes.filter(altitude => altitude === MIN_ALTITUDE).length / allAltitudes.length;
}

function runsAt(size: number, level: number): number[][][] {
  return Array.from({ length: RUNS }, () => createAltitudeMatrix(size, level, Math.random));
}

describe("createAltitudeMatrix", () => {
  // Every location of the sektor stands at some altitude, and no altitude describes ground the
  // sektor does not have.
  it("covers the sektor's map and no more of it", () => {
    expect(MAP_SIZES.map(size => {
      const altitudes = createAltitudeMatrix(size, 1, Math.random);
      return { size, rows: altitudes.length, rowLengths: [...new Set(altitudes.map(row => row.length))] };
    })).toEqual(MAP_SIZES.map(size => ({ size, rows: size, rowLengths: [size] })));
  });

  it("stands every location between the lowest ground and the highest there is", () => {
    const allAltitudes = MAP_SIZES.flatMap(size => LEVELS.flatMap(level => runsAt(size, level))).flat(2);

    expect({
      lowest: Math.min(...allAltitudes),
      highest: Math.max(...allAltitudes),
      whole: allAltitudes.every(altitude => Number.isInteger(altitude)),
    }).toEqual({ lowest: MIN_ALTITUDE, highest: MAX_ALTITUDE, whole: true });
  });

  // A sektor's difficulty says how much of its map may be buried under mountains, and the easier
  // the sektor the less that is. A sektor of any difficulty may turn out all plain, so there is a
  // floor and no ceiling.
  it("never buries more of a map than the sektor's difficulty allows", () => {
    const flattestAllowed = LEVELS_AND_LEAST_FLAT_SHARES.map(([level, leastFlatShare]) => ({
      level,
      staysAboveItsFloor: MAP_SIZES.every(size => runsAt(size, level).every(altitudes => flatShareOf(altitudes) >= leastFlatShare)),
    }));

    expect(flattestAllowed).toEqual(LEVELS_AND_LEAST_FLAT_SHARES.map(([level]) => ({ level, staysAboveItsFloor: true })));
  });

  // Mountains are what a sektor's difficulty buries the map under, so a hard sektor is left with
  // less to build on freely than an easy one of the same size.
  it("leaves a hard sektor less flat ground than an easy one", () => {
    const averageFlatShares = [1, 15].map(level =>
      runsAt(10, level).map(flatShareOf).reduce((total, share) => total + share, 0) / RUNS
    );

    expect(averageFlatShares[0] > averageFlatShares[1]).toEqual(true);
  });

  // A map of every size gets mountains on it, though not every map of that size does.
  it("raises mountains on maps of every size", () => {
    const mountainsSomewhere = MAP_SIZES.map(size => ({
      size,
      raised: LEVELS.flatMap(level => runsAt(size, level)).some(altitudes => altitudes.flat().some(altitude => altitude > MIN_ALTITUDE)),
    }));

    expect(mountainsSomewhere).toEqual(MAP_SIZES.map(size => ({ size, raised: true })));
  });
});
