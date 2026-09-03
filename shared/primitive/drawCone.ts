import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";
import { faceNormal } from "./faceNormal";

const CONE_SEGMENTS = 48;

export function drawCone(p: p5, color?: string, hollow?: number) {
  const radius = BLOCK_SIZE / 2;
  const height = BLOCK_SIZE;
  const floorY = -(BLOCK_SIZE * 0.15) / 2;

  p.fill(...colorToRgb(color));

  if (hollow && hollow > 0) {
    drawHollowCone(p, radius, height, floorY, hollow / 100);
    return;
  }

  const centerY = floorY - height / 2;
  p.push();
  p.translate(0, centerY, 0);
  p.rotateX(Math.PI);
  p.cone(radius, height);
  p.pop();
}

// A hollow cone has a smaller cone cut out of it, standing on the same base plane, so the cone
// is open at its base. The bigger that inner cone, the thinner the wall left around it.
function drawHollowCone(p: p5, radius: number, height: number, floorY: number, innerScale: number) {
  const apex: [number, number, number] = [0, floorY - height, 0];
  const innerRadius = radius * innerScale;
  const innerApex: [number, number, number] = [0, floorY - height * innerScale, 0];

  for (let segment = 0; segment < CONE_SEGMENTS; segment++) {
    const angle = (2 * Math.PI * segment) / CONE_SEGMENTS;
    const nextAngle = (2 * Math.PI * (segment + 1)) / CONE_SEGMENTS;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nextCos = Math.cos(nextAngle);
    const nextSin = Math.sin(nextAngle);

    const baseVertex: [number, number, number] = [radius * cos, floorY, radius * sin];
    const nextBaseVertex: [number, number, number] = [radius * nextCos, floorY, radius * nextSin];
    const innerBaseVertex: [number, number, number] = [innerRadius * cos, floorY, innerRadius * sin];
    const nextInnerBaseVertex: [number, number, number] = [innerRadius * nextCos, floorY, innerRadius * nextSin];

    // Outer wall (normal pointing outward)
    const outerNormal = faceNormal(baseVertex, nextBaseVertex, apex);
    p.beginShape();
    p.normal(...outerNormal);
    p.vertex(...baseVertex);
    p.vertex(...nextBaseVertex);
    p.vertex(...apex);
    p.endShape(p.CLOSE);

    // Inner wall (normal pointing inward, into the hole)
    const innerNormal = faceNormal(innerBaseVertex, nextInnerBaseVertex, innerApex);
    p.beginShape();
    p.normal(-innerNormal[0], -innerNormal[1], -innerNormal[2]);
    p.vertex(...innerApex);
    p.vertex(...nextInnerBaseVertex);
    p.vertex(...innerBaseVertex);
    p.endShape(p.CLOSE);

    // Base ring quad (normal pointing down)
    p.beginShape();
    p.normal(0, 1, 0);
    p.vertex(...innerBaseVertex);
    p.vertex(...nextInnerBaseVertex);
    p.vertex(...nextBaseVertex);
    p.vertex(...baseVertex);
    p.endShape(p.CLOSE);
  }
}
