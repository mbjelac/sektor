// What the ground holds depends on how high it stands. Soil is thin on a mountainside and gone
// near the top of one; wind has less and less to break it the higher it blows; and sunlight is cut
// off by whatever stands over a location, so ground in the shadow of its neighbours sees less of
// the day. Every other property is what it was: height says nothing about what lies under it.

import { MIN_ALTITUDE } from "../../../shared/altitude";
import { MODIFIER_MAX, MODIFIER_MIN } from "../../../shared/modifierLimits";

const SOIL_LOST_PER_ALTITUDE = 2;
const WIND_GAINED_PER_ALTITUDE = 2;
const INSOLATION_LOST_PER_HIGHER_NEIGHBOUR = 2;

// A location is shadowed by the ground to the north, south, east and west of it. Corners do not
// count: ground lying away on the diagonal stands over nothing.
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
  insolation: dimmerInTheShadowOfNeighbours,
};

function thinnerTheHigherItLies(value: number, x: number, z: number, altitudes: number[][]): number {
  return value - SOIL_LOST_PER_ALTITUDE * altitudes[x][z];
}

function strongerTheHigherItBlows(value: number, x: number, z: number, altitudes: number[][]): number {
  return value + WIND_GAINED_PER_ALTITUDE * altitudes[x][z];
}

function dimmerInTheShadowOfNeighbours(value: number, x: number, z: number, altitudes: number[][]): number {
  return value - INSOLATION_LOST_PER_HIGHER_NEIGHBOUR * higherNeighbourCount(x, z, altitudes);
}

// How many of the four sides of a location have ground standing over it, a single step up being
// enough. Ground off the edge of the map stands over nothing, so a location on the rim is counted
// only by the neighbours it actually has.
function higherNeighbourCount(x: number, z: number, altitudes: number[][]): number {
  return NEIGHBOURS.filter(
    neighbour => (altitudes[x + neighbour.x]?.[z + neighbour.z] ?? MIN_ALTITUDE) > altitudes[x][z]
  ).length;
}

// However much height gives or takes away, a location still holds no less of a property than the
// poorest ground there is and no more than the richest.
function withinLimits(value: number): number {
  return Math.min(MODIFIER_MAX, Math.max(MODIFIER_MIN, value));
}
