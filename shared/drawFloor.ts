import p5 from "p5";
import { MIN_ALTITUDE } from "./altitude";

// Which of a floor block's four sides stand on the edge of the map, with nothing beyond them, named
// as the faces of the block below are. A block lying anywhere else on the map has none of them.
export interface SidesOnMapEdge {
  front?: boolean;
  back?: boolean;
  left?: boolean;
  right?: boolean;
}

// A location standing higher than the lowest ground is drawn as a taller block rather than a
// raised one: its bottom stays level with every other floor's, so what shows of it is the ground
// carried on. A side of raised ground is the same color as its top, being the same ground seen
// from the side — except where it stands on the edge of the map, which is the bare earth the whole
// map is cut out of and is colored like the lowest ground there is.
export function drawFloor(
  p: p5,
  s: number,
  topColor?: [number, number, number],
  altitude: number = 0,
  sidesOnMapEdge: SidesOnMapEdge = {},
) {
  const h = s / 2;
  const height = floorBlockHeight(s, altitude);
  const green: [number, number, number] = topColor ?? [30, 200, 80];
  const brown: [number, number, number] = [180, 140, 90];
  const darkBrown: [number, number, number] = [100, 70, 40];
  const sideColor = altitude > MIN_ALTITUDE ? green : darkBrown;
  const colorOfSide = (isOnMapEdge?: boolean) => isOnMapEdge ? darkBrown : sideColor;
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
  p.fill(...colorOfSide(sidesOnMapEdge.front));
  p.beginShape();
  p.normal(0, 0, 1);
  p.vertex(-h, top, h);
  p.vertex(h, top, h);
  p.vertex(h, bottom, h);
  p.vertex(-h, bottom, h);
  p.endShape(p.CLOSE);

  // Back face (-z)
  p.fill(...colorOfSide(sidesOnMapEdge.back));
  p.beginShape();
  p.normal(0, 0, -1);
  p.vertex(-h, top, -h);
  p.vertex(h, top, -h);
  p.vertex(h, bottom, -h);
  p.vertex(-h, bottom, -h);
  p.endShape(p.CLOSE);

  // Left face (-x)
  p.fill(...colorOfSide(sidesOnMapEdge.left));
  p.beginShape();
  p.normal(-1, 0, 0);
  p.vertex(-h, top, -h);
  p.vertex(-h, top, h);
  p.vertex(-h, bottom, h);
  p.vertex(-h, bottom, -h);
  p.endShape(p.CLOSE);

  // Right face (+x)
  p.fill(...colorOfSide(sidesOnMapEdge.right));
  p.beginShape();
  p.normal(1, 0, 0);
  p.vertex(h, top, -h);
  p.vertex(h, top, h);
  p.vertex(h, bottom, h);
  p.vertex(h, bottom, -h);
  p.endShape(p.CLOSE);
}

// A location of open water is not a block but two flat sheets, with no sides between them: the sea
// does not end in a wall, and there is nothing in a block of it worth the drawing.
//
// The bed is the floor of the sea, lying where every other location's underside lies. It is opaque
// and is drawn with the land, in the pass that writes depth, because it is the only thing standing
// between what is above the water and what is below it — a building's pit, dug deep under the map,
// shows straight through a bed which never wrote itself into the depth buffer.
export function drawWaterBed(p: p5, size: number, color: [number, number, number]) {
  // The bed carries no edges. It is only ever seen through the water standing over it, where a
  // ruled outline would read as a second grid drawn on the bottom of the sea, under the one the
  // surface already carries.
  p.push();
  p.noStroke();
  drawWaterSheet(p, size, color, floorBlockBottom(size), OPAQUE);
  p.pop();
}

// The surface is the top of the water, standing at the height the ground of that location would.
// It is half seen through, so it is drawn after everything opaque and writes no depth of its own.
export function drawWaterSurface(p: p5, size: number, color: [number, number, number], altitude: number) {
  drawWaterSheet(p, size, color, floorBlockBottom(size) - floorBlockHeight(size, altitude), HALF_SEEN_THROUGH);
}

// Both sheets face upwards, the bed as much as the surface. The bed is the one underside anybody
// ever looks at — from above, through the water standing on it — so lighting it as the underside
// it geometrically is would turn it away from the light and leave it near black, and the surface
// over it would read as a hole in the water rather than as water.
function drawWaterSheet(p: p5, size: number, color: [number, number, number], height: number, alpha: number) {
  const half = size / 2;
  p.fill(color[0], color[1], color[2], alpha);
  p.beginShape();
  p.normal(0, -1, 0);
  p.vertex(-half, height, -half);
  p.vertex(half, height, -half);
  p.vertex(half, height, half);
  p.vertex(-half, height, half);
  p.endShape(p.CLOSE);
}

const OPAQUE = 255;

// How much of the surface of the sea is let through: half of it, leaving the water half its own
// color and half the bed lying under it.
const HALF_SEEN_THROUGH = 128;

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
