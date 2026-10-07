// Which way the river runs through a square of it. A river is drawn as straight sections and
// curves: a square with water on two opposite sides of it carries a straight section between them,
// and any other square of river carries a curve, turning between a side of it facing north or south
// and a side facing east or west. Water on a side is river or sea, and the rim of the map counts as
// water too, as the river runs on past it.

import { isRiver, SEA } from "../../../shared/terrain";

// A side of a square, as the step to take from it to the square lying on that side.
export interface RiverSide {
  x: number;
  z: number;
}

// The sides of a square the river runs between: the two ends of a straight section, or the two ends
// of a curve.
export function riverSides(terrain: number[][], x: number, z: number): RiverSide[] {
  const sidesWithWater = SIDES.filter(side => isWater(terrain, x + side.x, z + side.z));
  const straightSection = STRAIGHT_SECTIONS.find(section => section.every(side => sidesWithWater.includes(side)));
  if (straightSection) return straightSection;

  const sideTowardsNorthOrSouth = sidesWithWater.find(side => side === NORTH || side === SOUTH);
  const sideTowardsEastOrWest = sidesWithWater.find(side => side === EAST || side === WEST);
  return [sideTowardsNorthOrSouth, sideTowardsEastOrWest].filter(side => side !== undefined);
}

function isWater(terrain: number[][], x: number, z: number): boolean {
  const square = terrain[x]?.[z];
  return square === undefined || square === SEA || isRiver(square);
}

// North is towards the first square of a row and west towards the first row, as it is for the
// sides of rock.
const NORTH: RiverSide = { x: 0, z: -1 };
const SOUTH: RiverSide = { x: 0, z: 1 };
const WEST: RiverSide = { x: -1, z: 0 };
const EAST: RiverSide = { x: 1, z: 0 };

const SIDES = [NORTH, SOUTH, WEST, EAST];

const STRAIGHT_SECTIONS = [[NORTH, SOUTH], [WEST, EAST]];
