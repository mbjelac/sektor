// What the ground holds depends on how high it stands. Soil is thin on a mountainside and gone
// near the top of one; wind has less and less to break it the higher it blows; and a location
// hemmed in by cliffs lies in their shade for part of the day. Every other property is what it
// was: height says nothing about what lies under it.

import { CLIFF_ALTITUDE_DIFFERENCE } from "../../../shared/altitude";
import { MODIFIER_MAX, MODIFIER_MIN } from "../../../shared/modifierLimits";

const SOIL_LOST_PER_ALTITUDE = 2;
const WIND_GAINED_PER_ALTITUDE = 2;
const INSOLATION_LOST_PER_CLIFF = 2;

// A location is walled in by the ground to the north, south, east and west of it. Corners do not
// count: ground lying away on the diagonal walls in nothing.
const NEIGHBOURS = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];

export function propertiesShapedByAltitude(
  locationProperties: { [key: string]: number[][] },
  altitudes: number[][],
): { [key: string]: number[][] } {
  return Object.fromEntries(
    Object.entries(locationProperties).map(([propertyName, matrix]) => [
      propertyName,
      shapedMatrix(propertyName, matrix, altitudes),
    ])
  );
}

// A property the height of the ground says nothing about is handed back untouched.
function shapedMatrix(propertyName: string, matrix: number[][], altitudes: number[][]): number[][] {
  const shapeValue = PROPERTY_SHAPERS[propertyName];
  if (!shapeValue) return matrix;

  return matrix.map((row, x) => row.map((value, z) => withinLimits(shapeValue(value, x, z, altitudes))));
}

type PropertyShaper = (value: number, x: number, z: number, altitudes: number[][]) => number;

const PROPERTY_SHAPERS: { [propertyName: string]: PropertyShaper } = {
  soil: thinnerTheHigherItLies,
  wind: strongerTheHigherItBlows,
  insolation: dimmerInTheShadeOfCliffs,
};

function thinnerTheHigherItLies(value: number, x: number, z: number, altitudes: number[][]): number {
  return value - SOIL_LOST_PER_ALTITUDE * altitudes[x][z];
}

function strongerTheHigherItBlows(value: number, x: number, z: number, altitudes: number[][]): number {
  return value + WIND_GAINED_PER_ALTITUDE * altitudes[x][z];
}

function dimmerInTheShadeOfCliffs(value: number, x: number, z: number, altitudes: number[][]): number {
  return value - INSOLATION_LOST_PER_CLIFF * cliffCount(x, z, altitudes);
}

// How many of the four sides of a location drop or climb sharply enough to stand as a cliff. Ground
// off the edge of the map is no cliff, so a location on the rim is counted only by the neighbours
// it actually has.
function cliffCount(x: number, z: number, altitudes: number[][]): number {
  return NEIGHBOURS.filter(neighbour => {
    const neighbourAltitude = altitudes[x + neighbour.x]?.[z + neighbour.z];
    if (neighbourAltitude === undefined) return false;
    return Math.abs(neighbourAltitude - altitudes[x][z]) > CLIFF_ALTITUDE_DIFFERENCE;
  }).length;
}

// However much height gives or takes away, a location still holds no less of a property than the
// poorest ground there is and no more than the richest.
function withinLimits(value: number): number {
  return Math.min(MODIFIER_MAX, Math.max(MODIFIER_MIN, value));
}
