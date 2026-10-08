import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";

const TUBE_SEGMENTS = 48;

export function drawCylinder(p: p5, color?: string, hollow?: number, frustum?: number) {
  const radius = BLOCK_SIZE / 2;
  const height = BLOCK_SIZE;
  // The base stands on the body's own origin, which is where t() puts it.
  const floorY = 0;
  const centerY = floorY - height / 2;

  p.push();
  p.translate(0, centerY, 0);
  p.fill(...colorToRgb(color));
  if (frustum && frustum > 0) {
    drawCutCylinder(p, radius, radius * ((hollow ?? 0) / 100), height, frustum / 100);
  } else if (hollow && hollow > 0) {
    drawTube(p, radius, radius * (hollow / 100), height);
  } else {
    p.cylinder(radius, height);
  }
  p.pop();
}

function drawTube(p: p5, outerRadius: number, innerRadius: number, height: number) {
  const top = -height / 2;
  const bottom = height / 2;

  for (let segment = 0; segment < TUBE_SEGMENTS; segment++) {
    const angle = (2 * Math.PI * segment) / TUBE_SEGMENTS;
    const nextAngle = (2 * Math.PI * (segment + 1)) / TUBE_SEGMENTS;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nextCos = Math.cos(nextAngle);
    const nextSin = Math.sin(nextAngle);

    // Outer wall (normal pointing outward)
    p.beginShape();
    p.normal(cos, 0, sin);
    p.vertex(outerRadius * cos, bottom, outerRadius * sin);
    p.vertex(outerRadius * nextCos, bottom, outerRadius * nextSin);
    p.vertex(outerRadius * nextCos, top, outerRadius * nextSin);
    p.vertex(outerRadius * cos, top, outerRadius * sin);
    p.endShape(p.CLOSE);

    // Inner wall (normal pointing inward, toward the axis)
    p.beginShape();
    p.normal(-cos, 0, -sin);
    p.vertex(innerRadius * cos, top, innerRadius * sin);
    p.vertex(innerRadius * nextCos, top, innerRadius * nextSin);
    p.vertex(innerRadius * nextCos, bottom, innerRadius * nextSin);
    p.vertex(innerRadius * cos, bottom, innerRadius * sin);
    p.endShape(p.CLOSE);

    // Top ring (normal pointing up)
    p.beginShape();
    p.normal(0, -1, 0);
    p.vertex(outerRadius * cos, top, outerRadius * sin);
    p.vertex(outerRadius * nextCos, top, outerRadius * nextSin);
    p.vertex(innerRadius * nextCos, top, innerRadius * nextSin);
    p.vertex(innerRadius * cos, top, innerRadius * sin);
    p.endShape(p.CLOSE);

    // Bottom ring (normal pointing down)
    p.beginShape();
    p.normal(0, 1, 0);
    p.vertex(innerRadius * cos, bottom, innerRadius * sin);
    p.vertex(innerRadius * nextCos, bottom, innerRadius * nextSin);
    p.vertex(outerRadius * nextCos, bottom, outerRadius * nextSin);
    p.vertex(outerRadius * cos, bottom, outerRadius * sin);
    p.endShape(p.CLOSE);
  }
}

// A cylinder is cut off by a plane parallel to its axis, which takes away the side of it facing
// +x. The cut goes in from that side as far across the diameter as the cut off scale says: half
// of the cylinder is left at 0.5, and only a sliver along its far side at 1. A hollow cylinder
// keeps its hole, which the cut opens up once it reaches into it.
function drawCutCylinder(
  p: p5,
  outerRadius: number,
  innerRadius: number,
  height: number,
  cutOffScale: number,
) {
  const top = -height / 2;
  const bottom = height / 2;
  // Never quite the whole diameter, so a sliver of the cylinder is always left.
  const cutX = outerRadius - 2 * outerRadius * Math.min(cutOffScale, 0.995);

  const outerArc = arcAlongCut(outerRadius, cutX);
  // Once the cut lies past the far side of the hole, there is no hole left to draw.
  const isHollow = innerRadius > 0 && cutX > -innerRadius;
  const isHoleOpened = isHollow && cutX < innerRadius;
  const innerArc = isHollow ? arcAlongCut(innerRadius, cutX) : [];

  for (let segment = 0; segment < TUBE_SEGMENTS; segment++) {
    // Outer wall (normal pointing outward)
    const [outerX, outerZ] = outerArc[segment];
    const [nextOuterX, nextOuterZ] = outerArc[segment + 1];
    p.beginShape();
    p.normal(outerX / outerRadius, 0, outerZ / outerRadius);
    p.vertex(outerX, bottom, outerZ);
    p.vertex(nextOuterX, bottom, nextOuterZ);
    p.vertex(nextOuterX, top, nextOuterZ);
    p.vertex(outerX, top, outerZ);
    p.endShape(p.CLOSE);

    if (!isHollow) continue;

    // Inner wall (normal pointing inward, toward the axis)
    const [innerX, innerZ] = innerArc[segment];
    const [nextInnerX, nextInnerZ] = innerArc[segment + 1];
    p.beginShape();
    p.normal(-innerX / innerRadius, 0, -innerZ / innerRadius);
    p.vertex(innerX, top, innerZ);
    p.vertex(nextInnerX, top, nextInnerZ);
    p.vertex(nextInnerX, bottom, nextInnerZ);
    p.vertex(innerX, bottom, innerZ);
    p.endShape(p.CLOSE);

    // Top ring (normal pointing up)
    p.beginShape();
    p.normal(0, -1, 0);
    p.vertex(outerX, top, outerZ);
    p.vertex(nextOuterX, top, nextOuterZ);
    p.vertex(nextInnerX, top, nextInnerZ);
    p.vertex(innerX, top, innerZ);
    p.endShape(p.CLOSE);

    // Bottom ring (normal pointing down)
    p.beginShape();
    p.normal(0, 1, 0);
    p.vertex(innerX, bottom, innerZ);
    p.vertex(nextInnerX, bottom, nextInnerZ);
    p.vertex(nextOuterX, bottom, nextOuterZ);
    p.vertex(outerX, bottom, outerZ);
    p.endShape(p.CLOSE);
  }

  const outerCutZ = Math.sqrt(outerRadius * outerRadius - cutX * cutX);

  if (isHoleOpened) {
    // The cut face is split in two by the hole (normal pointing toward the cut away side)
    const innerCutZ = Math.sqrt(innerRadius * innerRadius - cutX * cutX);
    drawCutFace(p, cutX, innerCutZ, outerCutZ, top, bottom);
    drawCutFace(p, cutX, -outerCutZ, -innerCutZ, top, bottom);
    return;
  }

  // The cut face (normal pointing toward the cut away side)
  drawCutFace(p, cutX, -outerCutZ, outerCutZ, top, bottom);

  if (isHollow) {
    // The ring runs all the way around the hole, which leaves a sliver between the hole and the
    // cut face for the top and bottom to be closed over.
    const [firstOuterX, firstOuterZ] = outerArc[0];
    const [lastOuterX, lastOuterZ] = outerArc[TUBE_SEGMENTS];
    const [holeEdgeX, holeEdgeZ] = innerArc[0];
    for (const [y, normalY] of [[top, -1], [bottom, 1]]) {
      p.beginShape();
      p.normal(0, normalY, 0);
      p.vertex(firstOuterX, y, firstOuterZ);
      p.vertex(holeEdgeX, y, holeEdgeZ);
      p.vertex(lastOuterX, y, lastOuterZ);
      p.endShape(p.CLOSE);
    }
    return;
  }

  // Top and bottom (normals pointing up and down)
  for (const [y, normalY] of [[top, -1], [bottom, 1]]) {
    p.beginShape();
    p.normal(0, normalY, 0);
    for (const [x, z] of outerArc) {
      p.vertex(x, y, z);
    }
    p.endShape(p.CLOSE);
  }
}

// The points of a circle left standing on the near side of the cut, from one end of the cut to
// the other, going the long way around through the far side. A circle the cut does not reach is
// gone all the way around, starting and ending on its point nearest the cut.
function arcAlongCut(radius: number, cutX: number): [number, number][] {
  const startAngle = Math.acos(Math.max(-1, Math.min(1, cutX / radius)));
  const endAngle = 2 * Math.PI - startAngle;
  return Array.from({ length: TUBE_SEGMENTS + 1 }, (_, point) => {
    const angle = startAngle + ((endAngle - startAngle) * point) / TUBE_SEGMENTS;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  });
}

function drawCutFace(p: p5, cutX: number, fromZ: number, toZ: number, top: number, bottom: number) {
  p.beginShape();
  p.normal(1, 0, 0);
  p.vertex(cutX, bottom, fromZ);
  p.vertex(cutX, bottom, toZ);
  p.vertex(cutX, top, toZ);
  p.vertex(cutX, top, fromZ);
  p.endShape(p.CLOSE);
}
