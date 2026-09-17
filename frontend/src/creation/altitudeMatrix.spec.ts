import { describe, it, expect } from "vitest";
import { createAltitudeMatrix } from "./altitudeMatrix";
import { CLIFF_ALTITUDE_DIFFERENCE, MAX_ALTITUDE, MIN_ALTITUDE } from "../../../shared/altitude";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

const RUNS = 250;

// How far the ground steps up or down between locations lying side by side, counted along both
// directions a map runs. Ground meeting only at a corner is not ground anybody walks between.
function neighbouringAltitudeDifferences(altitudes: number[][]): number[] {
  const differences: number[] = [];

  altitudes.forEach((row, x) => row.forEach((altitude, z) => {
    if (x + 1 < SEKTOR_SIZE) differences.push(Math.abs(altitude - altitudes[x + 1][z]));
    if (z + 1 < SEKTOR_SIZE) differences.push(Math.abs(altitude - altitudes[x][z + 1]));
  }));

  return differences;
}

function manyRuns(): number[][][] {
  return Array.from({ length: RUNS }, () => createAltitudeMatrix(Math.random));
}

describe("createAltitudeMatrix", () => {
  // Every location of the sektor stands at some altitude, and no altitude describes ground the
  // sektor does not have.
  it("covers the sektor's map and no more of it", () => {
    const altitudes = createAltitudeMatrix(Math.random);

    expect({ rows: altitudes.length, rowLengths: [...new Set(altitudes.map(row => row.length))] })
      .toEqual({ rows: SEKTOR_SIZE, rowLengths: [SEKTOR_SIZE] });
  });

  it("stands every location between the lowest ground and the highest there is", () => {
    const allAltitudes = manyRuns().flat(2);

    expect({
      lowest: Math.min(...allAltitudes),
      noHigherThanTheHighestThereIs: Math.max(...allAltitudes) <= MAX_ALTITUDE,
      whole: allAltitudes.every(altitude => Number.isInteger(altitude)),
    }).toEqual({ lowest: MIN_ALTITUDE, noHigherThanTheHighestThereIs: true, whole: true });
  });

  // Ground grown from a peak comes back down a step at a time almost everywhere, so that a map is
  // made of hillsides rather than of walls. A bigger step is still drawn now and then, and where it
  // falls the ground stands as a cliff.
  it("lets the ground climb a step at a time, cliffs being the exception", () => {
    const steps = manyRuns().flatMap(neighbouringAltitudeDifferences);

    expect({
      someCliffs: steps.some(step => step > CLIFF_ALTITUDE_DIFFERENCE),
      cliffShareUnderATenth: steps.filter(step => step > CLIFF_ALTITUDE_DIFFERENCE).length / steps.length < 0.1,
    }).toEqual({ someCliffs: true, cliffShareUnderATenth: true });
  });

  // The taller a peak, the seldomer it is drawn, so ground high up is ground a map rarely has.
  it("raises low ground far more often than high", () => {
    const allAltitudes = manyRuns().flat(2);
    const locationsBetween = (lowest: number, highest: number) =>
      allAltitudes.filter(altitude => altitude >= lowest && altitude <= highest).length;

    expect(locationsBetween(1, 3) > locationsBetween(4, MAX_ALTITUDE)).toEqual(true);
  });

  // Every map is given a mountain, so there is always ground standing above the lowest there is.
  it("raises a mountain on every map", () => {
    const mapsWithAMountain = manyRuns()
      .filter(altitudes => altitudes.flat().some(altitude => altitude > MIN_ALTITUDE)).length;

    expect(mapsWithAMountain).toEqual(RUNS);
  });
});
