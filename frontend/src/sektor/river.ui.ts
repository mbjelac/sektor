// What a river is drawn out of: water lying on the floor of every square of it, running between the
// sides of the square the river runs between — straight across it, or round a curve.

import p5 from "p5";
import { BLOCK_SIZE } from "../../../shared/constants";
import { waterSurfaceHeight } from "../../../shared/drawFloor";
import { SEA_COLOR } from "./sea.ui";
import { RiverSide } from "./river";

// How wide the water of a river is, straight or curving, as a part of the width of a square.
const RIVER_WIDTH = BLOCK_SIZE * 0.6;

// The water lies just over the floor rather than on it, so that the two do not fight over the
// same depth.
const HEIGHT_ABOVE_FLOOR = BLOCK_SIZE * 0.005;

// The water is a square of it in the middle of the square, with an arm of it running out to each of
// the sides the river runs between: two arms facing each other make a straight strip, and two at a
// right angle make an L.
export function drawRiver(p: p5, sides: RiverSide[]) {
  const halfWidth = RIVER_WIDTH / 2;
  p.push();
  p.noStroke();
  p.fill(...SEA_COLOR);
  drawWaterPatch(p, -halfWidth, -halfWidth, halfWidth, halfWidth);
  for (const side of sides) {
    drawWaterPatch(p, ...armTowards(side, halfWidth));
  }
  p.pop();
}

function armTowards(side: RiverSide, halfWidth: number): [number, number, number, number] {
  const edge = BLOCK_SIZE / 2;
  if (side.x !== 0) {
    return side.x > 0 ? [halfWidth, -halfWidth, edge, halfWidth] : [-edge, -halfWidth, -halfWidth, halfWidth];
  }
  return side.z > 0 ? [-halfWidth, halfWidth, halfWidth, edge] : [-halfWidth, -edge, halfWidth, -halfWidth];
}

function drawWaterPatch(p: p5, fromX: number, fromZ: number, toX: number, toZ: number) {
  const height = waterSurfaceHeight(BLOCK_SIZE) - HEIGHT_ABOVE_FLOOR;
  p.beginShape();
  p.normal(0, -1, 0);
  p.vertex(fromX, height, fromZ);
  p.vertex(toX, height, fromZ);
  p.vertex(toX, height, toZ);
  p.vertex(fromX, height, toZ);
  p.endShape(p.CLOSE);
}
