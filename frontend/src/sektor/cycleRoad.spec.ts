import { describe, it, expect } from "vitest";
import { cycleRoadAt, cycleRoadDrawnSquare, cycleRoadRenderingCode } from "./cycleRoad";

describe("cycleRoadAt", () => {
  it("finds no road in the middle of a square", () => {
    expect(cycleRoadAt(3.5, 4.5)).toEqual(null);
  });

  it("finds no road just farther from the edge than the tolerance", () => {
    expect(cycleRoadAt(3.94, 4.5)).toEqual(null);
  });

  it("finds the road along the east side of a square, near its edge", () => {
    expect(cycleRoadAt(3.96, 4.5)).toEqual([{ x: 3, y: 4 }, { x: 4, y: 4 }]);
  });

  it("finds the road along the edge from the square the point lies on", () => {
    expect(cycleRoadAt(4.04, 4.5)).toEqual([{ x: 4, y: 4 }, { x: 3, y: 4 }]);
  });

  it("finds the road along each side of a square", () => {
    expect([
      cycleRoadAt(3.5, 4.01),
      cycleRoadAt(3.99, 4.5),
      cycleRoadAt(3.5, 4.99),
      cycleRoadAt(3.01, 4.5),
    ]).toEqual([
      [{ x: 3, y: 4 }, { x: 3, y: 3 }],
      [{ x: 3, y: 4 }, { x: 4, y: 4 }],
      [{ x: 3, y: 4 }, { x: 3, y: 5 }],
      [{ x: 3, y: 4 }, { x: 2, y: 4 }],
    ]);
  });

  it("finds the road along the nearest edge in a corner of a square", () => {
    expect(cycleRoadAt(3.98, 4.01)).toEqual([{ x: 3, y: 4 }, { x: 3, y: 3 }]);
  });

  it("finds the road along the rim of the map, running to a square beyond it", () => {
    expect([cycleRoadAt(0.02, 4.5), cycleRoadAt(4.5, 9.98)]).toEqual([
      [{ x: 0, y: 4 }, { x: -1, y: 4 }],
      [{ x: 4, y: 9 }, { x: 4, y: 10 }],
    ]);
  });

  it("finds the road along the rim from the square beyond the map, for a point just beyond the rim", () => {
    expect(cycleRoadAt(-0.02, 4.5)).toEqual([{ x: -1, y: 4 }, { x: 0, y: 4 }]);
  });

  it("finds no road between two squares both beyond the rim", () => {
    expect(cycleRoadAt(-0.02, -0.5)).toEqual(null);
  });
});

describe("cycleRoadDrawnSquare", () => {
  it("draws a road on its first square, along the side looking towards the second", () => {
    expect([
      cycleRoadDrawnSquare([{ x: 3, y: 4 }, { x: 3, y: 3 }]),
      cycleRoadDrawnSquare([{ x: 3, y: 4 }, { x: 4, y: 4 }]),
      cycleRoadDrawnSquare([{ x: 3, y: 4 }, { x: 3, y: 5 }]),
      cycleRoadDrawnSquare([{ x: 3, y: 4 }, { x: 2, y: 4 }]),
    ]).toEqual([
      { location: { x: 3, y: 4 }, side: "north" },
      { location: { x: 3, y: 4 }, side: "east" },
      { location: { x: 3, y: 4 }, side: "south" },
      { location: { x: 3, y: 4 }, side: "west" },
    ]);
  });

  it("draws a road on its second square when the first lies beyond the rim of the map", () => {
    expect([
      cycleRoadDrawnSquare([{ x: -1, y: 4 }, { x: 0, y: 4 }]),
      cycleRoadDrawnSquare([{ x: 4, y: 10 }, { x: 4, y: 9 }]),
    ]).toEqual([
      { location: { x: 0, y: 4 }, side: "west" },
      { location: { x: 4, y: 9 }, side: "south" },
    ]);
  });
});

describe("cycleRoadRenderingCode", () => {
  it("draws a road along every side of a square", () => {
    const sides = ["north", "east", "south", "west"] as const;

    expect(sides.map(side => cycleRoadRenderingCode(side).length > 0)).toEqual([true, true, true, true]);
  });
});
