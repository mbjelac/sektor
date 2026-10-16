import { describe, it, expect } from "vitest";
import { createPlanetGrid, Point, PlanetTriangle, ringLength } from "./planetGrid";

const EDGE_DIVISIONS = 2;

describe("createPlanetGrid", () => {
  it("lays the triangles out in rings growing away from the poles and even around the middle", () => {
    const grid = createPlanetGrid(EDGE_DIVISIONS);

    expect({
      ringLengths: grid.rings.map(ring => ring.length),
      ringLengthsWorkedOut: grid.rings.map((_, ring) => ringLength(ring, EDGE_DIVISIONS)),
    }).toEqual({
      ringLengths: [5, 15, 20, 20, 15, 5],
      ringLengthsWorkedOut: [5, 15, 20, 20, 15, 5],
    });
  });

  it("covers the whole sphere exactly once, every triangle on the unit sphere", () => {
    const triangles = createPlanetGrid(EDGE_DIVISIONS).rings.flat();

    expect({
      cornerDistances: [...new Set(triangles.flatMap(triangle => triangle.corners).map(corner => round(Math.hypot(...corner))))],
      totalArea: round(triangles.reduce((total, triangle) => total + sphericalArea(triangle.corners), 0)),
    }).toEqual({
      cornerDistances: [1],
      totalArea: round(4 * Math.PI),
    });
  });

  it("puts the northern half of the rings north of the equator and the rest south of it", () => {
    const grid = createPlanetGrid(EDGE_DIVISIONS);

    expect(grid.rings.map(ring => [...new Set(ring.map(triangle => Math.sign(triangle.center[1])))]))
      .toEqual([[1], [1], [1], [-1], [-1], [-1]]);
  });

  it("gives every triangle its two neighbours along its ring and the one across its base", () => {
    const grid = createPlanetGrid(EDGE_DIVISIONS);
    const triangleAt = ({ ring, index }: { ring: number; index: number }) => grid.rings[ring]![index]!;

    const neighbourKinds = grid.rings.flat().map(triangle => {
      const [before, after, acrossBase] = triangle.neighbours;
      const { ring, index } = triangle.coordinate;
      const length = grid.rings[ring]!.length;
      return {
        before: before.ring === ring && before.index === (index - 1 + length) % length,
        after: after.ring === ring && after.index === (index + 1) % length,
        acrossBase: acrossBase.ring === ring + (triangle.pointsNorth ? 1 : -1),
        sharesTwoCorners: triangle.neighbours.every(neighbour => sharedCornerCount(triangle, triangleAt(neighbour)) === 2),
        isNeighbourOfItsNeighbours: triangle.neighbours.every(neighbour =>
          triangleAt(neighbour).neighbours.some(back => back.ring === ring && back.index === index)),
      };
    });

    expect([...new Set(neighbourKinds.map(kinds => JSON.stringify(kinds)))]).toEqual([JSON.stringify({
      before: true,
      after: true,
      acrossBase: true,
      sharesTwoCorners: true,
      isNeighbourOfItsNeighbours: true,
    })]);
  });
});

function round(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

// The area of a triangle drawn on the unit sphere, by the formula of Van Oosterom and Strackee.
function sphericalArea([first, second, third]: [Point, Point, Point]): number {
  const dot = (left: Point, right: Point) => left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
  const cross = (left: Point, right: Point): Point => [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
  const tripleProduct = Math.abs(dot(first, cross(second, third)));
  return 2 * Math.atan2(tripleProduct, 1 + dot(first, second) + dot(second, third) + dot(third, first));
}

function sharedCornerCount(triangle: PlanetTriangle, other: PlanetTriangle): number {
  const key = (corner: Point) => corner.map(coordinate => round(coordinate)).join(",");
  const otherCorners = new Set(other.corners.map(key));
  return triangle.corners.filter(corner => otherCorners.has(key(corner))).length;
}
