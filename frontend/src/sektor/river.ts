// Which way the river runs through a square of it. A river is drawn as straight sections and
// curves: a square with water on two opposite sides of it carries a straight section between them,
// and any other square of river carries a curve, turning between a side of it facing north or south
// and a side facing east or west. Water on a side is river or sea, and the rim of the map counts as
// water too, as the river runs on past it.

import { isRiver, RIVER_FROM_EAST, RIVER_FROM_NORTH, RIVER_FROM_SOUTH, RIVER_FROM_WEST, SEA } from "../../../shared/terrain";

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

// The side of a square the river flowed into it from, as its square of the map says.
export function riverSideFlowedInFrom(terrain: number[][], x: number, z: number): RiverSide {
  return SIDE_FLOWED_IN_FROM[terrain[x][z]];
}

// Where a glint lies on a square of river, counted in glints from the middle of the square to the
// middle of the glint.
export interface GlintPlace {
  x: number;
  z: number;
}

// The water of a square of river is cut into four strips of glints running with the river, each
// listed from where the river comes into the square to where it goes out. A straight section's
// strips are all eight glints long. A curve's strips follow the curve as nested Ls: the outermost
// runs along the outside of the curve, eleven glints long, and each one inside it is two glints
// shorter, down to five.
//
// The strips are listed from the left bank of the river to the right, looking the way it flows, so
// that a strip comes in at the same place across the river as the strip of the same number left the
// square before. A curve turning left has its outside on the right, and one turning right on the
// left.
//
// The river is taken to come in over the side it flowed into the square from; should the square run
// between two other sides, it comes in over the first of them.
export function riverGlintStrips(sides: RiverSide[], flowedInFrom: RiverSide): GlintPlace[][] {
  const sideIn = sides.find(side => isSameSide(side, flowedInFrom)) ?? sides[0];
  const sideOut = sides.find(side => !isSameSide(side, sideIn)) ?? opposite(sideIn);
  const flow = opposite(sideIn);
  const rightOfFlow = { x: -flow.z + 0, z: flow.x };

  if (isSameSide(sideOut, flow)) {
    return STRIPS.map(strip => straightStrip(strip).map(([along, across]) => glintPlace(flow, rightOfFlow, along, across)));
  }

  const outside = opposite(sideOut);
  const fromOutsideIn = STRIPS.map(strip => curvedStrip(strip).map(([along, across]) => glintPlace(flow, outside, along, across)));
  return isSameSide(outside, rightOfFlow) ? fromOutsideIn.reverse() : fromOutsideIn;
}

// The glints of a strip are given as how far they lie along the way the river flows into the
// square, and how far across it: towards its right bank in a straight section, and towards the
// outside of a curve.
const STRIPS = [0, 1, 2, 3];

// A straight section's strips are numbered from its left bank.
function straightStrip(strip: number): [number, number][] {
  return glintsBetween(-3.5, 3.5).map(along => [along, strip - 1.5]);
}

// A curve's strips are numbered from its outside in. A strip comes in along the arm the river flows
// in through, runs on into the middle of the square until it reaches its own turn, turns there and
// runs out along the other arm.
function curvedStrip(strip: number): [number, number][] {
  const turn = 1.5 - strip;
  return [
    ...glintsBetween(-3.5, turn).map((along): [number, number] => [along, turn]),
    ...glintsBetween(-3.5, turn - 1).reverse().map((across): [number, number] => [turn, across]),
  ];
}

// The middles of the glints lying from one place to another, a glint apart.
function glintsBetween(from: number, to: number): number[] {
  return Array.from({ length: Math.round(to - from) + 1 }, (_unused, index) => from + index);
}

function glintPlace(flow: RiverSide, towardsAcross: RiverSide, along: number, across: number): GlintPlace {
  // Adding nothing turns a negative zero into a plain one.
  return {
    x: flow.x * along + towardsAcross.x * across + 0,
    z: flow.z * along + towardsAcross.z * across + 0,
  };
}

function opposite(side: RiverSide): RiverSide {
  return { x: -side.x + 0, z: -side.z + 0 };
}

function isSameSide(side: RiverSide, otherSide: RiverSide): boolean {
  return side.x === otherSide.x && side.z === otherSide.z;
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

const SIDE_FLOWED_IN_FROM: { [riverSquare: number]: RiverSide } = {
  [RIVER_FROM_NORTH]: NORTH,
  [RIVER_FROM_WEST]: WEST,
  [RIVER_FROM_EAST]: EAST,
  [RIVER_FROM_SOUTH]: SOUTH,
};
