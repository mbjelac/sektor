import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";

export function drawPyramid(p: p5, sides: number, color?: string, hollow?: number) {
  const h = BLOCK_SIZE / 2;
  const floorY = -(BLOCK_SIZE * 0.15) / 2;
  const apexY = floorY - BLOCK_SIZE;
  const apex: [number, number, number] = [0, apexY, 0];

  const vertices: [number, number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    vertices.push([h * Math.cos(angle), floorY, h * Math.sin(angle)]);
  }

  p.fill(...colorToRgb(color));

  if (hollow && hollow > 0) {
    drawHollowPyramid(p, sides, vertices, apex, floorY, hollow / 100);
    return;
  }

  // Base (normal pointing down)
  p.beginShape();
  p.normal(0, 1, 0);
  for (const v of vertices) {
    p.vertex(...v);
  }
  p.endShape(p.CLOSE);

  // Side faces
  for (let i = 0; i < sides; i++) {
    const v0 = vertices[i];
    const v1 = vertices[(i + 1) % sides];
    const n = faceNormal(v0, v1, apex);
    p.beginShape();
    p.normal(...n);
    p.vertex(...v0);
    p.vertex(...v1);
    p.vertex(...apex);
    p.endShape(p.CLOSE);
  }
}

// A hollow pyramid has a smaller pyramid cut out of it, standing on the same base plane, so
// the pyramid is open at its base. The bigger that inner pyramid, the thinner the walls left
// around it.
function drawHollowPyramid(
  p: p5,
  sides: number,
  vertices: [number, number, number][],
  apex: [number, number, number],
  floorY: number,
  innerScale: number,
) {
  const innerVertices: [number, number, number][] = vertices.map(
    vertex => [vertex[0] * innerScale, floorY, vertex[2] * innerScale]
  );
  const innerApex: [number, number, number] = [0, floorY + (apex[1] - floorY) * innerScale, 0];

  for (let vertexIndex = 0; vertexIndex < sides; vertexIndex++) {
    const nextIndex = (vertexIndex + 1) % sides;

    // Outer side face (normal pointing outward)
    const outerNormal = faceNormal(vertices[vertexIndex], vertices[nextIndex], apex);
    p.beginShape();
    p.normal(...outerNormal);
    p.vertex(...vertices[vertexIndex]);
    p.vertex(...vertices[nextIndex]);
    p.vertex(...apex);
    p.endShape(p.CLOSE);

    // Inner side face (normal pointing inward, into the hole)
    const innerNormal = faceNormal(innerVertices[vertexIndex], innerVertices[nextIndex], innerApex);
    p.beginShape();
    p.normal(-innerNormal[0], -innerNormal[1], -innerNormal[2]);
    p.vertex(...innerApex);
    p.vertex(...innerVertices[nextIndex]);
    p.vertex(...innerVertices[vertexIndex]);
    p.endShape(p.CLOSE);

    // Base ring quad (normal pointing down)
    p.beginShape();
    p.normal(0, 1, 0);
    p.vertex(...innerVertices[vertexIndex]);
    p.vertex(...innerVertices[nextIndex]);
    p.vertex(...vertices[nextIndex]);
    p.vertex(...vertices[vertexIndex]);
    p.endShape(p.CLOSE);
  }
}

function faceNormal(
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number],
): [number, number, number] {
  const e1: [number, number, number] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const e2: [number, number, number] = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const nx = e1[1] * e2[2] - e1[2] * e2[1];
  const ny = e1[2] * e2[0] - e1[0] * e2[2];
  const nz = e1[0] * e2[1] - e1[1] * e2[0];
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  return [nx / len, ny / len, nz / len];
}
