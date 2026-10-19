import { describe, it, expect } from "vitest";
import { createSektor } from "./createSektor";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

// The ground of a sektor is made of every property there is: soil and groundwater are farmed and
// drawn from, rock is quarried, and wind and insolation are what stands over the ground.
const LOCATION_PROPERTIES = ["soil", "groundwater", "rock", "wind", "insolation"];

const LAND_GROUND = { isOnLand: true, isDesert: false, isForest: false };
const FOREST_GROUND = { isOnLand: true, isDesert: false, isForest: true };
const DESERT_GROUND = { isOnLand: true, isDesert: true, isForest: false };

// Every draw lands in the middle of whatever it is choosing from, so the same sektor comes out
// every time and the test can say exactly what it expects.
function middleOfTheRange(): number {
  return 0.5;
}

describe("createSektor", () => {
  // Every location of the sektor holds a value of every property, so a property covers the map and
  // no more of it: a matrix wider than the sektor describes ground which is not there.
  it("lays every location property out over the whole of the sektor's map and no further", () => {
    const sektorData = createSektor(3, LOCATION_PROPERTIES, LAND_GROUND, middleOfTheRange);

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
    const sektorData = createSektor(3, LOCATION_PROPERTIES, LAND_GROUND, middleOfTheRange);

    expect({
      rows: sektorData.terrain?.length,
      rowLengths: [...new Set(sektorData.terrain?.map(row => row.length))],
    }).toEqual({ rows: SEKTOR_SIZE, rowLengths: [SEKTOR_SIZE] });
  });

  // Nothing grows in the desert, so nothing at all stands in a sektor just made there.
  it("makes a sektor which has no buildings in it yet", () => {
    const sektorData = createSektor(2, LOCATION_PROPERTIES, DESERT_GROUND, middleOfTheRange);

    expect({ level: sektorData.level, buildings: sektorData.buildings }).toEqual({ level: 2, buildings: [] });
  });

  // Every draw falls at a quarter: the map is drawn with no river and no rock, forests are drawn to
  // cover 60% of a forest's ground, and every square of forest gives 5 EcosystemSupport.
  it("stores all the EcosystemSupport its forests give as the ecosystem's initial support", () => {
    const sektorData = createSektor(1, LOCATION_PROPERTIES, FOREST_GROUND, () => 0.25);
    const forestSquareCount = SEKTOR_SIZE * SEKTOR_SIZE * 0.6;

    expect({ forests: sektorData.buildings.length, initialEcosystemSupport: sektorData.initialEcosystemSupport })
      .toEqual({ forests: forestSquareCount, initialEcosystemSupport: forestSquareCount * 5 });
  });

  // Nothing grows in the desert: the same draws which cover a sektor elsewhere in forest plant
  // none there.
  it("plants no forests in a sektor in the desert", () => {
    const sektorData = createSektor(1, LOCATION_PROPERTIES, DESERT_GROUND, () => 0.25);

    expect({ buildings: sektorData.buildings, initialEcosystemSupport: sektorData.initialEcosystemSupport })
      .toEqual({ buildings: [], initialEcosystemSupport: 0 });
  });
});
