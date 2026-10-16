import { describe, it, expect } from "vitest";
import { createPlanetGrid, TriangleCoordinate } from "./planetGrid";
import { PlanetRegion } from "./parsePlanet";
import { habitableTriangles } from "./habitableTriangles";

const grid = createPlanetGrid(2);
const sea: PlanetRegion = { color: "#2482e0", climate: "temperate", biome: "temperate", isLand: false, isForest: false, isDesert: false };

function planetWith(land: TriangleCoordinate[], polarRings: number[] = []): PlanetRegion[][] {
  return grid.rings.map((ring, ringIndex) => ring.map(({ coordinate }) => ({
    ...sea,
    climate: polarRings.includes(ringIndex) ? "polar" : "temperate",
    isLand: land.some(landCoordinate => landCoordinate.ring === coordinate.ring && landCoordinate.index === coordinate.index),
  })));
}

const neighboursOf = ({ ring, index }: TriangleCoordinate) => grid.rings[ring]![index]!.neighbours;
const sorted = (coordinates: TriangleCoordinate[]) =>
  [...new Map(coordinates.map(coordinate => [`${coordinate.ring}:${coordinate.index}`, coordinate])).values()]
    .sort((left, right) => left.ring - right.ring || left.index - right.index);

describe("habitableTriangles", () => {
  it("takes land, the sea next to it and the sea one triangle further out", () => {
    const island = { ring: 2, index: 0 };
    const nextToLand = neighboursOf(island);
    const oneFurtherOut = nextToLand.flatMap(neighboursOf);

    expect(sorted(habitableTriangles(grid, planetWith([island]))))
      .toEqual(sorted([island, ...nextToLand, ...oneFurtherOut]));
  });

  it("leaves out the polar zones, even their land", () => {
    const polarIsland = { ring: 0, index: 0 };
    const habitable = habitableTriangles(grid, planetWith([polarIsland], [0]));

    expect({
      polarTriangles: habitable.filter(coordinate => coordinate.ring === 0),
      ringOneNextToIsland: habitable.some(coordinate => coordinate.ring === 1 && coordinate.index === neighboursOf(polarIsland)[2].index),
    }).toEqual({
      polarTriangles: [],
      ringOneNextToIsland: true,
    });
  });
});
