import { describe, it, expect } from "vitest";
import { createSektor } from "./createSektor";
import { SektorData } from "../../../shared/sektorData";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { MODIFIER_MAX, MODIFIER_MIN } from "../../../shared/modifierLimits";
import { DIMMEST_SUNLIGHT } from "./locationPropertyMatrices";

// The ground of a sektor is made of every property there is: soil and groundwater are farmed and
// drawn from, rock is quarried, and wind and insolation are what the height of the ground tells on.
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
    }))).toEqual([...LOCATION_PROPERTIES, "altitude"].map(propertyName => (
      { property: propertyName, rows: SEKTOR_SIZE, rowLengths: [SEKTOR_SIZE] }
    )));
  });

  // A sektor's properties are laid out over flat ground and only then made to answer to the height
  // the ground stands at, so every location of a made sektor holds what its height leaves it: soil
  // thinned by two for every step up, wind strengthened by two, insolation dimmed by two for every
  // neighbour standing over it, none of them passing the bounds a property is held between.
  it("shapes the properties of a made sektor by the height of its ground", () => {
    const sektorData = createSektor(3, LOCATION_PROPERTIES, middleOfTheRange);

    expect(locationsHeightHasNotToldOn(sektorData)).toEqual([]);
  });

  it("makes a sektor which has no buildings in it yet", () => {
    const sektorData = createSektor(2, LOCATION_PROPERTIES, middleOfTheRange);

    expect({ level: sektorData.level, buildings: sektorData.buildings }).toEqual({ level: 2, buildings: [] });
  });
});

// Every location of a sektor whose properties do not answer to the height it stands at. Soil is
// laid out no higher than the richest ground there is, so after thinning it stands no higher than
// that less two for every step up; wind is laid out no lower than the poorest, so after
// strengthening it stands no lower than two for every step up; and insolation is laid out between
// the dimmest sunlight and the brightest, so after dimming it lies between the two of them less two
// for every neighbour standing over the location. None of them leaves the bounds a property is
// held between.
function locationsHeightHasNotToldOn(sektorData: SektorData): object[] {
  const { soil, wind, insolation, altitude } = sektorData.locationProperties;

  return altitude.flatMap((row, x) => row.flatMap((locationAltitude, z) => {
    const dimming = INSOLATION_LOST_PER_HIGHER_NEIGHBOUR * higherNeighbourCount(x, z, altitude);
    const asItShouldBe = {
      soil: soil[x][z] <= withinBounds(MODIFIER_MAX - SOIL_LOST_PER_ALTITUDE * locationAltitude),
      wind: wind[x][z] >= withinBounds(WIND_GAINED_PER_ALTITUDE * locationAltitude),
      insolation: insolation[x][z] <= withinBounds(MODIFIER_MAX - dimming)
        && insolation[x][z] >= withinBounds(DIMMEST_SUNLIGHT - dimming),
    };

    return Object.values(asItShouldBe).every(isAsItShouldBe => isAsItShouldBe)
      ? []
      : [{ x, z, altitude: locationAltitude, soil: soil[x][z], wind: wind[x][z], insolation: insolation[x][z] }];
  }));
}

// How many of the four sides of a location have ground standing over it, which is what dims the
// day it sees. Ground off the map stands over nothing.
function higherNeighbourCount(x: number, z: number, altitude: number[][]): number {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .filter(([alongX, alongZ]) => (altitude[x + alongX]?.[z + alongZ] ?? MODIFIER_MIN) > altitude[x][z])
    .length;
}

function withinBounds(value: number): number {
  return Math.min(MODIFIER_MAX, Math.max(MODIFIER_MIN, value));
}

// What the height of the ground does to what it holds, which the properties of a made sektor have
// to show.
const SOIL_LOST_PER_ALTITUDE = 2;
const WIND_GAINED_PER_ALTITUDE = 2;
const INSOLATION_LOST_PER_HIGHER_NEIGHBOUR = 2;
