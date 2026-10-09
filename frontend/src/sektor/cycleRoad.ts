// A cycle road is put up like a building, picked from the toolbar, but it runs along the edge
// between two squares rather than standing on one. It is drawn on one of the two squares, along
// the side of it the road runs on: on the first, unless the first lies beyond the rim of the map.

import { BuildingLocation, CycleRoad } from "../../../shared/sektorData";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

// What a cycle road is called in the toolbar.
export const CYCLE_ROAD_NAME = "CycleRoad";

export type CycleRoadSide = "north" | "east" | "south" | "west";

// How near the edge of a square a click has to land to be on the edge rather than on the square,
// as a part of how wide a square is.
const EDGE_TOLERANCE = 0.05;

// The road along the edge nearest a point of the map, the point measured in squares: the square
// (x, y) runs from x to x + 1 across and from y to y + 1 down. A point farther from every edge than
// the tolerance is on the square, not on an edge, and has no road. The square the point lies on comes
// first, so a point just beyond the rim tells the road along the rim from the square beyond it. An
// edge between two squares both beyond the rim is no edge of the map.
export function cycleRoadAt(gridX: number, gridY: number): CycleRoad | null {
  const square = { x: Math.floor(gridX), y: Math.floor(gridY) };
  const distancesToSides: { side: CycleRoadSide, distance: number }[] = [
    { side: "north", distance: gridY - square.y },
    { side: "east", distance: square.x + 1 - gridX },
    { side: "south", distance: square.y + 1 - gridY },
    { side: "west", distance: gridX - square.x },
  ];
  const nearestSide = distancesToSides.reduce((nearest, candidate) =>
    candidate.distance < nearest.distance ? candidate : nearest);
  if (nearestSide.distance > EDGE_TOLERANCE) return null;

  const neighbour = neighbourTowards(square, nearestSide.side);
  if (!isOnMap(square) && !isOnMap(neighbour)) return null;
  return [square, neighbour];
}

// North is towards the first row of the map and west towards the first column, as it is for the
// sides of rock.
function neighbourTowards(square: BuildingLocation, side: CycleRoadSide): BuildingLocation {
  const step = SIDE_STEPS[side];
  return { x: square.x + step.x, y: square.y + step.y };
}

const SIDE_STEPS: { [side in CycleRoadSide]: BuildingLocation } = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

// The square a road is drawn on, and the side of it the road runs along: the side looking towards
// the other square. A road is drawn on its first square, unless that one lies beyond the rim of the
// map, where nothing is drawn: then it is drawn on its second.
export function cycleRoadDrawnSquare(cycleRoad: CycleRoad): { location: BuildingLocation; side: CycleRoadSide } {
  const [firstSquare, secondSquare] = cycleRoad;
  return isOnMap(firstSquare)
    ? { location: firstSquare, side: sideTowards(firstSquare, secondSquare) }
    : { location: secondSquare, side: sideTowards(secondSquare, firstSquare) };
}

function sideTowards(square: BuildingLocation, neighbour: BuildingLocation): CycleRoadSide {
  const sides = Object.keys(SIDE_STEPS) as CycleRoadSide[];
  return sides.find(side =>
    square.x + SIDE_STEPS[side].x === neighbour.x && square.y + SIDE_STEPS[side].y === neighbour.y)!;
}

function isOnMap(location: BuildingLocation): boolean {
  return location.x >= 0 && location.x < SEKTOR_SIZE && location.y >= 0 && location.y < SEKTOR_SIZE;
}

export function cycleRoadRenderingCode(side: CycleRoadSide): string {
  return (cycleRoadRenderingCodes[`${CYCLE_ROADS_FOLDER}/${side}.sgl`] ?? "").trim();
}

const CYCLE_ROADS_FOLDER = "../assets/terrain/temperate/cycle-roads";

// The bodies of a road along every side of a square, by the path it was read from.
const cycleRoadRenderingCodes = import.meta.glob<string>(
  "../assets/terrain/temperate/cycle-roads/*.sgl",
  { query: "?raw", import: "default", eager: true },
);
