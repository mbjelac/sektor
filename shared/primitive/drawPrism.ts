import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";
import { faceNormal } from "./faceNormal";

export function drawPrism(p: p5, sides: number, color?: string, hollow?: number) {
  const h = BLOCK_SIZE / 2;
  const floorY = -(BLOCK_SIZE * 0.15) / 2;
  const topY = floorY - BLOCK_SIZE;

  const bottomVerts: [number, number, number][] = [];
  const topVerts: [number, number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + Math.PI / 4 + (2 * Math.PI * i) / sides;
    const x = h * Math.cos(angle);
    const z = h * Math.sin(angle);
    bottomVerts.push([x, floorY, z]);
    topVerts.push([x, topY, z]);
  }

  p.fill(...colorToRgb(color));

  if (hollow && hollow > 0) {
    drawHollowPrism(p, sides, bottomVerts, topVerts, hollow / 100);
    return;
  }

  // Bottom face (normal pointing down)
  p.beginShape();
  p.normal(0, 1, 0);
  for (const v of bottomVerts) {
    p.vertex(...v);
  }
  p.endShape(p.CLOSE);

  // Top face (normal pointing up)
  p.beginShape();
  p.normal(0, -1, 0);
  for (const v of topVerts) {
    p.vertex(...v);
  }
  p.endShape(p.CLOSE);

  // Side faces
  for (let i = 0; i < sides; i++) {
    const next = (i + 1) % sides;
    const n = faceNormal(bottomVerts[i], bottomVerts[next], topVerts[next]);
    p.beginShape();
    p.normal(...n);
    p.vertex(...bottomVerts[i]);
    p.vertex(...bottomVerts[next]);
    p.vertex(...topVerts[next]);
    p.vertex(...topVerts[i]);
    p.endShape(p.CLOSE);
  }
}

function drawHollowPrism(
  p: p5,
  sides: number,
  bottomVerts: [number, number, number][],
  topVerts: [number, number, number][],
  innerScale: number,
) {
  const innerBottomVerts = bottomVerts.map(v => scaleTowardsAxis(v, innerScale));
  const innerTopVerts = topVerts.map(v => scaleTowardsAxis(v, innerScale));

  for (let i = 0; i < sides; i++) {
    const next = (i + 1) % sides;

    // Outer side face (normal pointing outward)
    const outerNormal = faceNormal(bottomVerts[i], bottomVerts[next], topVerts[next]);
    p.beginShape();
    p.normal(...outerNormal);
    p.vertex(...bottomVerts[i]);
    p.vertex(...bottomVerts[next]);
    p.vertex(...topVerts[next]);
    p.vertex(...topVerts[i]);
    p.endShape(p.CLOSE);

    // Inner side face (normal pointing inward, into the hole)
    p.beginShape();
    p.normal(-outerNormal[0], -outerNormal[1], -outerNormal[2]);
    p.vertex(...innerTopVerts[i]);
    p.vertex(...innerTopVerts[next]);
    p.vertex(...innerBottomVerts[next]);
    p.vertex(...innerBottomVerts[i]);
    p.endShape(p.CLOSE);

    // Bottom ring quad (normal pointing down)
    p.beginShape();
    p.normal(0, 1, 0);
    p.vertex(...innerBottomVerts[i]);
    p.vertex(...innerBottomVerts[next]);
    p.vertex(...bottomVerts[next]);
    p.vertex(...bottomVerts[i]);
    p.endShape(p.CLOSE);

    // Top ring quad (normal pointing up)
    p.beginShape();
    p.normal(0, -1, 0);
    p.vertex(...topVerts[i]);
    p.vertex(...topVerts[next]);
    p.vertex(...innerTopVerts[next]);
    p.vertex(...innerTopVerts[i]);
    p.endShape(p.CLOSE);
  }
}

function scaleTowardsAxis(vertex: [number, number, number], scale: number): [number, number, number] {
  return [vertex[0] * scale, vertex[1], vertex[2] * scale];
}
