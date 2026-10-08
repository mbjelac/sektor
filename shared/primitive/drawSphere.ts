import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";

const SPHERE_SEGMENTS = 48;
const SPHERE_RINGS = 24;

export function drawSphere(p: p5, color?: string, frustum?: number) {
  const radius = BLOCK_SIZE / 2;
  // The base stands on the body's own origin, which is where t() puts it.
  const floorY = 0;
  const centerY = floorY - radius;

  p.push();
  p.translate(0, centerY, 0);
  p.fill(...colorToRgb(color));
  if (frustum && frustum > 0) {
    drawCutSphere(p, radius, frustum / 100);
  } else {
    p.sphere(radius);
  }
  p.pop();
}

// A sphere is cut off by a plane parallel to the ground it stands on, which takes its top away.
// The cut comes down from the top as far as the cut off scale says: the lower half of the sphere
// is left at 0.5, and only a sliver at its bottom at 1. The cut leaves a flat disc on top.
function drawCutSphere(p: p5, radius: number, cutOffScale: number) {
  // Never quite the whole height, so a sliver of the sphere is always left.
  const cutHeight = 2 * radius * (1 - Math.min(cutOffScale, 0.995));
  // Measured from the bottom of the sphere, around its centre, up to where the cut goes through it.
  const cutAngle = Math.acos(1 - cutHeight / radius);

  for (let ring = 0; ring < SPHERE_RINGS; ring++) {
    const ringAngle = (cutAngle * ring) / SPHERE_RINGS;
    const nextRingAngle = (cutAngle * (ring + 1)) / SPHERE_RINGS;

    // Surface (normal pointing outward, away from the centre)
    for (let segment = 0; segment < SPHERE_SEGMENTS; segment++) {
      const angle = (2 * Math.PI * segment) / SPHERE_SEGMENTS;
      const nextAngle = (2 * Math.PI * (segment + 1)) / SPHERE_SEGMENTS;
      p.beginShape();
      surfaceVertex(p, radius, ringAngle, angle);
      surfaceVertex(p, radius, ringAngle, nextAngle);
      surfaceVertex(p, radius, nextRingAngle, nextAngle);
      surfaceVertex(p, radius, nextRingAngle, angle);
      p.endShape(p.CLOSE);
    }
  }

  // Top (normal pointing up)
  p.beginShape();
  p.normal(0, -1, 0);
  for (let segment = 0; segment < SPHERE_SEGMENTS; segment++) {
    const angle = (2 * Math.PI * segment) / SPHERE_SEGMENTS;
    const [x, y, z] = surfacePoint(radius, cutAngle, angle);
    p.vertex(x, y, z);
  }
  p.endShape(p.CLOSE);
}

// A point on the sphere carries its own normal, pointing straight out from the centre, so the
// surface is shaded smoothly rather than in facets.
function surfaceVertex(p: p5, radius: number, ringAngle: number, angle: number) {
  const [x, y, z] = surfacePoint(radius, ringAngle, angle);
  p.normal(x / radius, y / radius, z / radius);
  p.vertex(x, y, z);
}

// The point on the sphere, around its centre, at a ring angle measured up from its bottom and an
// angle measured around its axis.
function surfacePoint(radius: number, ringAngle: number, angle: number): [number, number, number] {
  const ringRadius = radius * Math.sin(ringAngle);
  return [ringRadius * Math.cos(angle), radius * Math.cos(ringAngle), ringRadius * Math.sin(angle)];
}
