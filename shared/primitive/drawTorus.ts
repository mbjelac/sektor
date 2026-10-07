import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";

// Outer edge of the torus, kept fixed so that hollowing only widens the hole and thins the tube.
const OUTER_RADIUS = (BLOCK_SIZE / 2) * (4 / 3);

// Without h(), the torus keeps its original proportions: hole radius is half the outer radius.
const DEFAULT_HOLLOW = 50;

// A torus thinned all the way to h(100) would have no tube at all, so it is left with a sliver
// of thickness to stay visible as a circle.
const MINIMUM_TUBE_RADIUS = OUTER_RADIUS / 100;

export function drawTorus(p: p5, color?: string, hollow?: number) {
  const tubeRadius = torusTubeRadius(hollow);
  const ringRadius = OUTER_RADIUS - tubeRadius;
  // The base stands on the body's own origin, which is where t() puts it.
  const floorY = 0;
  const centerY = floorY - tubeRadius;

  p.push();
  p.translate(0, centerY, 0);
  p.rotateX(Math.PI / 2);
  p.fill(...colorToRgb(color));
  p.torus(ringRadius, tubeRadius);
  p.pop();
}

export function torusTubeRadius(hollow?: number): number {
  const holeRadius = OUTER_RADIUS * (hollow ?? DEFAULT_HOLLOW) / 100;
  return Math.max((OUTER_RADIUS - holeRadius) / 2, MINIMUM_TUBE_RADIUS);
}
