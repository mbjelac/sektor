import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";

export function drawSphere(p: p5, color?: string) {
  const radius = BLOCK_SIZE / 2;
  // The base stands on the body's own origin, which is where t() puts it.
  const floorY = 0;
  const centerY = floorY - radius;

  p.push();
  p.translate(0, centerY, 0);
  p.fill(...colorToRgb(color));
  p.sphere(radius);
  p.pop();
}
