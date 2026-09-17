import p5 from "p5";
import { MIN_ALTITUDE } from "./altitude";

// A location standing higher than the lowest ground is drawn as a taller block rather than a
// raised one: its bottom stays level with every other floor's, so what shows of it is the rock the
// ground stands on.
export function drawFloor(p: p5, s: number, topColor?: [number, number, number], altitude: number = 0) {
  const h = s / 2;
  const height = floorBlockHeight(s, altitude);
  const green: [number, number, number] = topColor ?? [30, 200, 80];
  const brown: [number, number, number] = [180, 140, 90];
  const darkBrown: [number, number, number] = [100, 70, 40];
  const sideColor = altitude > MIN_ALTITUDE ? green : darkBrown;
  const bottom = floorBlockBottom(s);
  const top = bottom - height;

  // Top face (green)
  p.fill(...green);
  p.beginShape();
  p.normal(0, -1, 0);
  p.vertex(-h, top, -h);
  p.vertex(h, top, -h);
  p.vertex(h, top, h);
  p.vertex(-h, top, h);
  p.endShape(p.CLOSE);

  // Bottom face
  p.fill(...brown);
  p.beginShape();
  p.normal(0, 1, 0);
  p.vertex(-h, bottom, -h);
  p.vertex(h, bottom, -h);
  p.vertex(h, bottom, h);
  p.vertex(-h, bottom, h);
  p.endShape(p.CLOSE);

  // Front face (+z)
  p.fill(...sideColor);
  p.beginShape();
  p.normal(0, 0, 1);
  p.vertex(-h, top, h);
  p.vertex(h, top, h);
  p.vertex(h, bottom, h);
  p.vertex(-h, bottom, h);
  p.endShape(p.CLOSE);

  // Back face (-z)
  p.fill(...sideColor);
  p.beginShape();
  p.normal(0, 0, -1);
  p.vertex(-h, top, -h);
  p.vertex(h, top, -h);
  p.vertex(h, bottom, -h);
  p.vertex(-h, bottom, -h);
  p.endShape(p.CLOSE);

  // Left face (-x)
  p.fill(...sideColor);
  p.beginShape();
  p.normal(-1, 0, 0);
  p.vertex(-h, top, -h);
  p.vertex(-h, top, h);
  p.vertex(-h, bottom, h);
  p.vertex(-h, bottom, -h);
  p.endShape(p.CLOSE);

  // Right face (+x)
  p.fill(...sideColor);
  p.beginShape();
  p.normal(1, 0, 0);
  p.vertex(h, top, -h);
  p.vertex(h, top, h);
  p.vertex(h, bottom, h);
  p.vertex(h, bottom, -h);
  p.endShape(p.CLOSE);
}

// A building may ask for no floor under it. Leaving the tile out altogether tears a hole in the
// grid, so the floor is drawn as if its panels were completely transparent: the edges of the block
// are still there, the faces are not. The four sides carry every edge of the block between them.
export function drawFloorWireframe(p: p5, size: number, altitude: number = 0) {
  const half = size / 2;
  const bottom = floorBlockBottom(size);
  const top = bottom - floorBlockHeight(size, altitude);

  p.push();
  p.noFill();
  p.stroke(150, 150, 150, 80);
  drawSideOutline(p, [-half, -half], [half, -half], top, bottom);
  drawSideOutline(p, [half, -half], [half, half], top, bottom);
  drawSideOutline(p, [half, half], [-half, half], top, bottom);
  drawSideOutline(p, [-half, half], [-half, -half], top, bottom);
  p.pop();
}

function drawSideOutline(
  p: p5,
  [startX, startZ]: [number, number],
  [endX, endZ]: [number, number],
  top: number,
  bottom: number,
) {
  p.beginShape();
  p.vertex(startX, top, startZ);
  p.vertex(endX, top, endZ);
  p.vertex(endX, bottom, endZ);
  p.vertex(startX, bottom, startZ);
  p.endShape(p.CLOSE);
}

// Every step of altitude adds two fifths of a block's height to the ground, so that high ground
// stands out without towering over the rest of the map.
export function floorBlockHeight(size: number, altitude: number): number {
  return size * FLOOR_HEIGHT_FRACTION * (1 + ALTITUDE_HEIGHT_FRACTION * altitude);
}

// Where the underside of every floor block sits, whatever the location's altitude.
export function floorBlockBottom(size: number): number {
  return size * FLOOR_HEIGHT_FRACTION / 2;
}

// How tall a block of ground at the lowest altitude stands, as a part of a location's width.
const FLOOR_HEIGHT_FRACTION = 0.15;

// How much taller each step of altitude makes a floor block, as a part of the lowest block's height.
const ALTITUDE_HEIGHT_FRACTION = 0.4;
