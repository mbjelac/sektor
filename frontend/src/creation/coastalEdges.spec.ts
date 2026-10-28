import { describe, it, expect } from "vitest";
import { createPlanetGrid, TriangleCoordinate } from "../list/planetGrid";
import { PlanetRegion } from "../list/parsePlanet";
import { coastalEdges } from "./coastalEdges";

const grid = createPlanetGrid(2);
const land: PlanetRegion = { color: "#00c000", climate: "temperate", biome: "temperate", isLand: true, isForest: false, isDesert: false };

// Around the middle of the planet every other triangle of a ring points north, starting with the first.
const pointingSouth = { ring: 2, index: 1 };
const pointingNorth = { ring: 2, index: 2 };

function planetWithSeaAt(sea: TriangleCoordinate[]): PlanetRegion[][] {
  return grid.rings.map(ring => ring.map(({ coordinate }) => ({
    ...land,
    isLand: !sea.some(seaCoordinate => seaCoordinate.ring === coordinate.ring && seaCoordinate.index === coordinate.index),
  })));
}

function coastalEdgesWithSeaAt(triangle: TriangleCoordinate, seaNeighbours: number[]) {
  const neighbours = grid.rings[triangle.ring]![triangle.index]!.neighbours;
  return coastalEdges(grid, planetWithSeaAt(seaNeighbours.map(neighbour => neighbours[neighbour]!)), triangle);
}

const WEST = 0;
const EAST = 1;
const ACROSS_BASE = 2;

describe("coastalEdges", () => {
  it("faces the edges of the map the way the sea neighbours of the triangle lie", () => {
    expect({
      inland: coastalEdgesWithSeaAt(pointingSouth, []),
      seaNorth: coastalEdgesWithSeaAt(pointingSouth, [ACROSS_BASE]),
      seaNorthAndSouthWest: coastalEdgesWithSeaAt(pointingSouth, [ACROSS_BASE, WEST]),
      seaSouthEast: coastalEdgesWithSeaAt(pointingSouth, [EAST]),
      seaSouth: coastalEdgesWithSeaAt(pointingNorth, [ACROSS_BASE]),
      seaNorthEast: coastalEdgesWithSeaAt(pointingNorth, [EAST]),
      seaAllRound: coastalEdgesWithSeaAt(pointingNorth, [WEST, EAST, ACROSS_BASE]),
      onTheSea: coastalEdges(grid, planetWithSeaAt([pointingSouth]), pointingSouth),
    }).toEqual({
      inland: [],
      seaNorth: ["north"],
      seaNorthAndSouthWest: ["north", "south", "west"],
      seaSouthEast: ["east", "south"],
      seaSouth: ["south"],
      seaNorthEast: ["north", "east"],
      seaAllRound: ["north", "east", "south", "west"],
      onTheSea: [],
    });
  });
});
