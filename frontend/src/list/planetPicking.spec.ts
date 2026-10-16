import { describe, it, expect } from "vitest";
import { createPlanetGrid, Point } from "./planetGrid";
import { findTriangleAt, planetPointAt, screenSpotOf } from "./planetPicking";
import { dragRotation, UNTURNED } from "./planetRotation";
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

describe("screenSpotOf", () => {
  it("is where the point is seen again, and nowhere for a point on the far side", () => {
    const turned = dragRotation(70, -40, UNTURNED);
    const seen = planetPointAt(30, -55, RADIUS, turned)!;
    const spot = screenSpotOf(seen, RADIUS, turned)!;

    expect({
      spot: [Math.round(spot.x * 1e6) / 1e6, Math.round(spot.y * 1e6) / 1e6],
      farSide: screenSpotOf([-seen[0], -seen[1], -seen[2]], RADIUS, turned),
    }).toEqual({
      spot: [30, -55],
      farSide: null,
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
