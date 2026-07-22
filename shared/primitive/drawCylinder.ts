import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";

const TUBE_SEGMENTS = 48;

export function drawCylinder(p: p5, color?: string, hollow?: number) {
  const radius = BLOCK_SIZE / 2;
  const height = BLOCK_SIZE;
  const floorY = -(BLOCK_SIZE * 0.15) / 2;
  const centerY = floorY - height / 2;

  p.push();
  p.translate(0, centerY, 0);
  p.fill(...colorToRgb(color));
  if (hollow && hollow > 0) {
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
