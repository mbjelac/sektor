import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";
import { faceNormal } from "./faceNormal";

export function drawPyramid(p: p5, sides: number, color?: string, hollow?: number, frustum?: number) {
  const baseRadius = BLOCK_SIZE / 2;
  const height = BLOCK_SIZE;
  const floorY = -(BLOCK_SIZE * 0.15) / 2;

  const baseVertices: [number, number, number][] = [];
  for (let vertexIndex = 0; vertexIndex < sides; vertexIndex++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * vertexIndex) / sides;
    baseVertices.push([baseRadius * Math.cos(angle), floorY, baseRadius * Math.sin(angle)]);
  }

  p.fill(...colorToRgb(color));

  drawPyramidWalls(p, sides, baseVertices, floorY, height, (hollow ?? 0) / 100, (frustum ?? 0) / 100);
}

// A pyramid can be hollowed out by a smaller pyramid standing on the same base plane, leaving
// it open at its base, and cut off by a plane parallel to that base, leaving it without its
// tip. What is drawn are the walls left over, which without either are simply the base and the
// sides of a solid pyramid.
function drawPyramidWalls(
  p: p5,
  sides: number,
  baseVertices: [number, number, number][],
  floorY: number,
  height: number,
  innerScale: number,
  cutOffScale: number,
) {
  const apex: [number, number, number] = [0, floorY - height, 0];
  const topY = floorY - height * (1 - cutOffScale);
  const topVertices = scaleVertices(baseVertices, cutOffScale, topY);

  const innerApex: [number, number, number] = [0, floorY - height * innerScale, 0];
  const innerVertices = scaleVertices(baseVertices, innerScale, floorY);
  // The cut goes through the pyramid inside the hollow one only once it is low enough to reach
  // below that inner pyramid's own tip — from there on the hollow is open at the top as well.
  const innerTopScale = Math.max(0, innerScale + cutOffScale - 1);
  const innerTopVertices = scaleVertices(baseVertices, innerTopScale, topY);

  const isHollow = innerScale > 0;
  const isCutOff = cutOffScale > 0;
  const isOpenAtTop = isHollow && innerTopScale > 0;

  if (isHollow) {
    // Base ring (normal pointing down)
    for (let vertexIndex = 0; vertexIndex < sides; vertexIndex++) {
      const nextIndex = (vertexIndex + 1) % sides;
      p.beginShape();
      p.normal(0, 1, 0);
      p.vertex(...innerVertices[vertexIndex]);
      p.vertex(...innerVertices[nextIndex]);
      p.vertex(...baseVertices[nextIndex]);
      p.vertex(...baseVertices[vertexIndex]);
      p.endShape(p.CLOSE);
    }
  } else {
    // Base (normal pointing down)
    p.beginShape();
    p.normal(0, 1, 0);
    for (const vertex of baseVertices) {
      p.vertex(...vertex);
    }
    p.endShape(p.CLOSE);
  }

  for (let vertexIndex = 0; vertexIndex < sides; vertexIndex++) {
    const nextIndex = (vertexIndex + 1) % sides;

    // Outer side face (normal pointing outward)
    const outerNormal = faceNormal(
      baseVertices[vertexIndex],
      baseVertices[nextIndex],
      isCutOff ? topVertices[nextIndex] : apex,
    );
    p.beginShape();
    p.normal(...outerNormal);
    p.vertex(...baseVertices[vertexIndex]);
    p.vertex(...baseVertices[nextIndex]);
    if (isCutOff) {
      p.vertex(...topVertices[nextIndex]);
      p.vertex(...topVertices[vertexIndex]);
    } else {
      p.vertex(...apex);
    }
    p.endShape(p.CLOSE);

    if (!isHollow) continue;

    // Inner side face (normal pointing inward, into the hole)
    const innerNormal = faceNormal(
      innerVertices[vertexIndex],
      innerVertices[nextIndex],
      isOpenAtTop ? innerTopVertices[nextIndex] : innerApex,
    );
    p.beginShape();
    p.normal(-innerNormal[0], -innerNormal[1], -innerNormal[2]);
    if (isOpenAtTop) {
      p.vertex(...innerTopVertices[vertexIndex]);
      p.vertex(...innerTopVertices[nextIndex]);
    } else {
      p.vertex(...innerApex);
    }
    p.vertex(...innerVertices[nextIndex]);
    p.vertex(...innerVertices[vertexIndex]);
    p.endShape(p.CLOSE);
  }

  if (!isCutOff) return;

  if (isOpenAtTop) {
    // Top ring (normal pointing up)
    for (let vertexIndex = 0; vertexIndex < sides; vertexIndex++) {
      const nextIndex = (vertexIndex + 1) % sides;
      p.beginShape();
      p.normal(0, -1, 0);
      p.vertex(...topVertices[vertexIndex]);
      p.vertex(...topVertices[nextIndex]);
      p.vertex(...innerTopVertices[nextIndex]);
      p.vertex(...innerTopVertices[vertexIndex]);
      p.endShape(p.CLOSE);
    }
    return;
  }

  // Top (normal pointing up)
  p.beginShape();
  p.normal(0, -1, 0);
  for (const vertex of topVertices) {
    p.vertex(...vertex);
  }
  p.endShape(p.CLOSE);
}

function scaleVertices(
  vertices: [number, number, number][],
  scale: number,
  y: number,
): [number, number, number][] {
  return vertices.map(vertex => [vertex[0] * scale, y, vertex[2] * scale]);
}
