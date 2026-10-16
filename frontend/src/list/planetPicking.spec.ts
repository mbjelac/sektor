import { describe, it, expect } from "vitest";
import { createPlanetGrid, Point } from "./planetGrid";
import { findTriangleAt, planetPointAt, Rotation } from "./planetPicking";

const UNTURNED: Rotation = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const RADIUS = 100;

describe("planetPointAt", () => {
  it("sees the side of the planet facing the screen, north up, and nothing beside it", () => {
    const round = (point: Point | null) => point && point.map(coordinate => Math.round(coordinate * 1000) / 1000 + 0);

    expect({
      middle: round(planetPointAt(0, 0, RADIUS, UNTURNED)),
      top: round(planetPointAt(0, -RADIUS * 0.999, RADIUS, UNTURNED)),
      beside: planetPointAt(RADIUS * 2, 0, RADIUS, UNTURNED),
    }).toEqual({
      middle: [0, 0, -1],
      top: [0, 0.967, -0.253],
      beside: null,
    });
  });
});

describe("findTriangleAt", () => {
  it("finds every triangle at its centre", () => {
    const grid = createPlanetGrid(2);
    const triangles = grid.rings.flat();

    expect(triangles.map(triangle => findTriangleAt(grid, triangle.center)?.coordinate))
      .toEqual(triangles.map(triangle => triangle.coordinate));
  });
});
