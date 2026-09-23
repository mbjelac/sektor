import { describe, it, expect } from "vitest";
import { createSektor } from "./createSektor";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

// The ground of a sektor is made of every property there is: soil and groundwater are farmed and
// drawn from, rock is quarried, and wind and insolation are what stands over the ground.
const LOCATION_PROPERTIES = ["soil", "groundwater", "rock", "wind", "insolation"];

// Every draw lands in the middle of whatever it is choosing from, so the same sektor comes out
// every time and the test can say exactly what it expects.
function middleOfTheRange(): number {
  return 0.5;
}

describe("createSektor", () => {
  // Every location of the sektor holds a value of every property, so a property covers the map and
  // no more of it: a matrix wider than the sektor describes ground which is not there.
  it("lays every location property out over the whole of the sektor's map and no further", () => {
    const sektorData = createSektor(3, LOCATION_PROPERTIES, middleOfTheRange);

    expect(Object.entries(sektorData.locationProperties).map(([propertyName, matrix]) => ({
      property: propertyName,
      rows: matrix.length,
      rowLengths: [...new Set(matrix.map(row => row.length))],
    }))).toEqual(LOCATION_PROPERTIES.map(propertyName => (
      { property: propertyName, rows: SEKTOR_SIZE, rowLengths: [SEKTOR_SIZE] }
    )));
  });

  // A sektor is made with the terrain it stands on, so that what is dry land and what is sea is
  // settled once and is the same every time the sektor is opened.
  it("lays the terrain out over the whole of the sektor's map and no further", () => {
    const sektorData = createSektor(3, LOCATION_PROPERTIES, middleOfTheRange);

    expect({
      rows: sektorData.terrain?.length,
      rowLengths: [...new Set(sektorData.terrain?.map(row => row.length))],
    }).toEqual({ rows: SEKTOR_SIZE, rowLengths: [SEKTOR_SIZE] });
  });

  it("makes a sektor which has no buildings in it yet", () => {
    const sektorData = createSektor(2, LOCATION_PROPERTIES, middleOfTheRange);

    expect({ level: sektorData.level, buildings: sektorData.buildings }).toEqual({ level: 2, buildings: [] });
  });
});
