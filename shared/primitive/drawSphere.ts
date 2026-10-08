import p5 from "p5";
import {BLOCK_SIZE} from "../constants";
import { colorToRgb } from "./colorToRgb";

const SPHERE_SEGMENTS = 48;
const SPHERE_RINGS = 24;

export function drawSphere(p: p5, color?: string, hollow?: number, frustum?: number) {
  const radius = BLOCK_SIZE / 2;
  // The base stands on the body's own origin, which is where t() puts it.
  const floorY = 0;
  const centerY = floorY - radius;

  p.push();
  p.translate(0, centerY, 0);
  p.fill(...colorToRgb(color));
  if ((hollow && hollow > 0) || (frustum && frustum > 0)) {
    drawSphereShell(p, radius, radius * ((hollow ?? 0) / 100), (frustum ?? 0) / 100);
  } else {
    p.sphere(radius);
  }
  p.pop();
}

// A sphere can be hollowed out by a smaller sphere around the same centre, and cut off by a plane
// parallel to the ground it stands on, which takes its top away. The cut comes down from the top
// as far as the cut off scale says: the lower half of the sphere is left at 0.5, and only a sliver
// at its bottom at 1. Once the cut reaches the sphere hollowing this one out, it opens it up, and
// once it lies below that sphere, there is no hollow left.
function drawSphereShell(p: p5, radius: number, innerRadius: number, cutOffScale: number) {
  // Never quite the whole height, so a sliver of the sphere is always left.
  const cutHeight = 2 * radius * (1 - Math.min(cutOffScale, 0.995));
  // Measured from the bottom of a sphere, around its centre, up to where the cut goes through it.
  const cutAngle = Math.acos(1 - cutHeight / radius);
  const innerCutHeight = cutHeight - (radius - innerRadius);
  const isHollow = innerRadius > 0 && innerCutHeight > 0;
  const innerCutAngle = isHollow ? Math.acos(Math.max(-1, 1 - innerCutHeight / innerRadius)) : 0;
  const isCutOff = cutOffScale > 0;

  // Outer surface (normal pointing outward, away from the centre)
  drawSurface(p, radius, cutAngle, 1);

  // Inner surface (normal pointing inward, toward the centre)
  if (isHollow) drawSurface(p, innerRadius, innerCutAngle, -1);

  if (!isCutOff) return;

  if (isHollow && innerCutAngle < Math.PI) {
    // Top ring (normal pointing up)
    for (let segment = 0; segment < SPHERE_SEGMENTS; segment++) {
      const angle = (2 * Math.PI * segment) / SPHERE_SEGMENTS;
      const nextAngle = (2 * Math.PI * (segment + 1)) / SPHERE_SEGMENTS;
      p.beginShape();
      p.normal(0, -1, 0);
      p.vertex(...surfacePoint(radius, cutAngle, angle));
      p.vertex(...surfacePoint(radius, cutAngle, nextAngle));
      p.vertex(...surfacePoint(innerRadius, innerCutAngle, nextAngle));
      p.vertex(...surfacePoint(innerRadius, innerCutAngle, angle));
      p.endShape(p.CLOSE);
    }
    return;
  }

  // Top (normal pointing up)
  p.beginShape();
  p.normal(0, -1, 0);
  for (let segment = 0; segment < SPHERE_SEGMENTS; segment++) {
    const angle = (2 * Math.PI * segment) / SPHERE_SEGMENTS;
    p.vertex(...surfacePoint(radius, cutAngle, angle));
  }
  p.endShape(p.CLOSE);
}

// The surface of a sphere from its bottom up to the ring at the given ring angle, with normals
// pointing out of the sphere, or into it for a normal direction of -1.
function drawSurface(p: p5, radius: number, topRingAngle: number, normalDirection: number) {
  for (let ring = 0; ring < SPHERE_RINGS; ring++) {
    const ringAngle = (topRingAngle * ring) / SPHERE_RINGS;
    const nextRingAngle = (topRingAngle * (ring + 1)) / SPHERE_RINGS;

    for (let segment = 0; segment < SPHERE_SEGMENTS; segment++) {
      const angle = (2 * Math.PI * segment) / SPHERE_SEGMENTS;
      const nextAngle = (2 * Math.PI * (segment + 1)) / SPHERE_SEGMENTS;
      p.beginShape();
      surfaceVertex(p, radius, ringAngle, angle, normalDirection);
      surfaceVertex(p, radius, ringAngle, nextAngle, normalDirection);
      surfaceVertex(p, radius, nextRingAngle, nextAngle, normalDirection);
      surfaceVertex(p, radius, nextRingAngle, angle, normalDirection);
      p.endShape(p.CLOSE);
    }
  }
}

// A point on the sphere carries its own normal, pointing straight out from the centre (or straight
// in toward it), so the surface is shaded smoothly rather than in facets.
function surfaceVertex(p: p5, radius: number, ringAngle: number, angle: number, normalDirection: number) {
  const [x, y, z] = surfacePoint(radius, ringAngle, angle);
  const normalScale = normalDirection / radius;
  p.normal(x * normalScale, y * normalScale, z * normalScale);
  p.vertex(x, y, z);
}

// The point on the sphere, around its centre, at a ring angle measured up from its bottom and an
// angle measured around its axis.
function surfacePoint(radius: number, ringAngle: number, angle: number): [number, number, number] {
  const ringRadius = radius * Math.sin(ringAngle);
  return [ringRadius * Math.cos(angle), radius * Math.cos(ringAngle), ringRadius * Math.sin(angle)];
}
