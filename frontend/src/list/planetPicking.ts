import { PlanetGrid, PlanetTriangle, Point } from "./planetGrid";
import { Rotation } from "./planetRotation";

// Where p5's default camera stands: on the z axis, looking at the middle of the canvas, from as far
// away as makes a pixel of the canvas a unit of its space at z = 0.
const CAMERA_DISTANCE = 800;

// The point of the planet, on its unit sphere and in its own axes, seen at a spot of the screen
// given from the middle of the canvas, x to the right and y downwards. The planet is drawn turned
// by the rotation, then turned over so its north is up, then grown to its radius; seeing it means
// following the line of sight from the camera to where it first meets the sphere, then undoing all
// three. A spot off the planet sees none of it.
export function planetPointAt(screenX: number, screenY: number, radius: number, rotation: Rotation): Point | null {
  const direction: Point = [screenX, screenY, -CAMERA_DISTANCE];
  const directionLengthSquared = dot(direction, direction);
  const towardsCentre = -CAMERA_DISTANCE * CAMERA_DISTANCE;
  const discriminant = towardsCentre * towardsCentre - directionLengthSquared * (CAMERA_DISTANCE * CAMERA_DISTANCE - radius * radius);
  if (discriminant < 0) return null;

  const distanceAlongSight = (-towardsCentre - Math.sqrt(discriminant)) / directionLengthSquared;
  const seen: Point = [direction[0] * distanceAlongSight, direction[1] * distanceAlongSight, CAMERA_DISTANCE + direction[2] * distanceAlongSight];
  const [x, y, z] = [0, 1, 2].map(column =>
    (rotation[0][column] * seen[0] + rotation[1][column] * seen[1] + rotation[2][column] * seen[2]) / radius,
  ) as Point;
  return [x, -y, -z];
}

// Where on the screen a point of the planet is seen, from the middle of the canvas, x to the right
// and y downwards: the way back of the spot a point is seen at. A point on the side turned away from
// the camera, or behind the planet's edge as the camera sees it, is not seen at all.
export function screenSpotOf(point: Point, radius: number, rotation: Rotation): { x: number; y: number } | null {
  const turnedOver: Point = [point[0], -point[1], -point[2]];
  const [x, y, z] = rotation.map(row => radius * dot(row, turnedOver)) as Point;
  if (z <= radius * radius / CAMERA_DISTANCE) return null;
  const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - z);
  return { x: x * perspective, y: y * perspective };
}

// The triangle a point of the sphere lies in: the one whose three edges all have the point on the
// same side as the triangle itself.
export function findTriangleAt(grid: PlanetGrid, point: Point): PlanetTriangle | undefined {
  return grid.rings.flat().find(triangle => contains(triangle, point));
}

const EDGE_TOLERANCE = 1e-12;

function contains({ corners: [first, second, third], center }: PlanetTriangle, point: Point): boolean {
  if (dot(point, center) <= 0) return false;
  const sides = [cross(first, second), cross(second, third), cross(third, first)].map(edgeNormal => dot(point, edgeNormal));
  return sides.every(side => side >= -EDGE_TOLERANCE) || sides.every(side => side <= EDGE_TOLERANCE);
}

function dot(left: Point, right: Point): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function cross(left: Point, right: Point): Point {
  return [left[1] * right[2] - left[2] * right[1], left[2] * right[0] - left[0] * right[2], left[0] * right[1] - left[1] * right[0]];
}
