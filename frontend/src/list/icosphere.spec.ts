import { describe, it, expect } from "vitest";
import { createIcosphere } from "./icosphere";

describe("createIcosphere", () => {
  it("cuts the icosahedron into sixteen times as many triangles, every corner on the unit sphere", () => {
    const triangles = createIcosphere(4);
    const cornerDistances = triangles.flat().map(corner => Math.round(Math.hypot(...corner) * 1e9) / 1e9);

    expect({
      triangleCount: triangles.length,
      distinctCornerDistances: [...new Set(cornerDistances)],
    }).toEqual({
      triangleCount: 320,
      distinctCornerDistances: [1],
    });
  });
});
