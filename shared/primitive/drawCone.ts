import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";
import { faceNormal } from "./faceNormal";

const CONE_SEGMENTS = 48;

export function drawCone(p: p5, color?: string, hollow?: number, frustum?: number) {
  const radius = BLOCK_SIZE / 2;
  const height = BLOCK_SIZE;
  const floorY = -(BLOCK_SIZE * 0.15) / 2;

  p.fill(...colorToRgb(color));

  if ((hollow && hollow > 0) || (frustum && frustum > 0)) {
    drawConeWalls(p, radius, height, floorY, (hollow ?? 0) / 100, (frustum ?? 0) / 100);
    return;
  }

  const centerY = floorY - height / 2;
  p.push();
  p.translate(0, centerY, 0);
  p.rotateX(Math.PI);
  p.cone(radius, height);
  p.pop();
}

// A cone can be hollowed out by a smaller cone standing on the same base plane, leaving it open
// at its base, and cut off by a plane parallel to that base, leaving it without its tip. What
// is drawn are the walls left over between the two.
function drawConeWalls(
  p: p5,
  radius: number,
  height: number,
  floorY: number,
  innerScale: number,
  cutOffScale: number,
) {
  const apex: [number, number, number] = [0, floorY - height, 0];
  const topY = floorY - height * (1 - cutOffScale);
  const baseVertices = circleVertices(radius, 1, floorY);
  const topVertices = circleVertices(radius, cutOffScale, topY);

  const innerApex: [number, number, number] = [0, floorY - height * innerScale, 0];
  const innerVertices = circleVertices(radius, innerScale, floorY);
  // The cut goes through the cone inside the hollow one only once it is low enough to reach
  // below that inner cone's own tip — from there on the hollow is open at the top as well.
  const innerTopScale = Math.max(0, innerScale + cutOffScale - 1);
  const innerTopVertices = circleVertices(radius, innerTopScale, topY);

  const isHollow = innerScale > 0;
  const isCutOff = cutOffScale > 0;
  const isOpenAtTop = isHollow && innerTopScale > 0;

  if (isHollow) {
    // Base ring (normal pointing down)
    for (let segment = 0; segment < CONE_SEGMENTS; segment++) {
      const nextSegment = (segment + 1) % CONE_SEGMENTS;
      p.beginShape();
      p.normal(0, 1, 0);
      p.vertex(...innerVertices[segment]);
      p.vertex(...innerVertices[nextSegment]);
      p.vertex(...baseVertices[nextSegment]);
      p.vertex(...baseVertices[segment]);
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

  for (let segment = 0; segment < CONE_SEGMENTS; segment++) {
    const nextSegment = (segment + 1) % CONE_SEGMENTS;

    // Outer wall (normal pointing outward)
    const outerNormal = faceNormal(
      baseVertices[segment],
      baseVertices[nextSegment],
      isCutOff ? topVertices[nextSegment] : apex,
    );
    p.beginShape();
    p.normal(...outerNormal);
    p.vertex(...baseVertices[segment]);
    p.vertex(...baseVertices[nextSegment]);
    if (isCutOff) {
      p.vertex(...topVertices[nextSegment]);
      p.vertex(...topVertices[segment]);
    } else {
      p.vertex(...apex);
    }
    p.endShape(p.CLOSE);

    if (!isHollow) continue;

    // Inner wall (normal pointing inward, into the hole)
    const innerNormal = faceNormal(
      innerVertices[segment],
      innerVertices[nextSegment],
      isOpenAtTop ? innerTopVertices[nextSegment] : innerApex,
    );
    p.beginShape();
    p.normal(-innerNormal[0], -innerNormal[1], -innerNormal[2]);
    if (isOpenAtTop) {
      p.vertex(...innerTopVertices[segment]);
      p.vertex(...innerTopVertices[nextSegment]);
    } else {
      p.vertex(...innerApex);
    }
    p.vertex(...innerVertices[nextSegment]);
    p.vertex(...innerVertices[segment]);
    p.endShape(p.CLOSE);
  }

  if (!isCutOff) return;

  if (isOpenAtTop) {
    // Top ring (normal pointing up)
    for (let segment = 0; segment < CONE_SEGMENTS; segment++) {
      const nextSegment = (segment + 1) % CONE_SEGMENTS;
      p.beginShape();
      p.normal(0, -1, 0);
      p.vertex(...topVertices[segment]);
      p.vertex(...topVertices[nextSegment]);
      p.vertex(...innerTopVertices[nextSegment]);
      p.vertex(...innerTopVertices[segment]);
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

function circleVertices(radius: number, scale: number, y: number): [number, number, number][] {
  return Array.from({ length: CONE_SEGMENTS }, (_, segment) => {
    const angle = (2 * Math.PI * segment) / CONE_SEGMENTS;
    return [radius * scale * Math.cos(angle), y, radius * scale * Math.sin(angle)];
  });
}
