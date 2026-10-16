import { Point } from "./planetGrid";

// Rows of the matrix the sphere is turned by, the turns of every drag gathered into it. The planet
// is drawn turned by it and then turned over about the screen's level, so that the planet's north,
// up its own y axis, stands at the top of the screen, whose y runs downwards.
export type Rotation = [[number, number, number], [number, number, number], [number, number, number]];

export const UNTURNED: Rotation = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const RADIANS_PER_DRAGGED_PIXEL = 0.01;

// The sphere turns the way it is dragged, whichever way it has already been turned: a drag sideways
// turns it about the upright of the screen and a drag up or down about the level of the screen, the
// screen's y running downwards. The turn of the drag is put before the turns already gathered.
export function dragRotation(draggedX: number, draggedY: number, rotation: Rotation): Rotation {
  const turnOfDrag = multiply(turnAboutLevel(-draggedY * RADIANS_PER_DRAGGED_PIXEL), turnAboutUpright(draggedX * RADIANS_PER_DRAGGED_PIXEL));
  return multiply(turnOfDrag, rotation);
}

// The planet stood upright, its north pole straight up the screen and its south pole straight down,
// both as far from the viewer as each other. Of all the ways to stand it so, the one kept is the one
// still showing the viewer the line of longitude it showed before.
export function uprightRotation(rotation: Rotation): Rotation {
  // The point of the planet facing the viewer, in the planet's own axes: the turns undone, then the
  // turning over.
  const [facingX, , facingZ] = [rotation[2][0], -rotation[2][1], -rotation[2][2]];
  return uprightFacing(longitudeOf(facingX, facingZ));
}

// The planet turned so that the given point of it, on its unit sphere, faces the viewer from the
// middle of the screen, the planet's north straight up from it.
export function facingRotation([x, y, z]: Point): Rotation {
  const latitude = Math.asin(Math.max(-1, Math.min(1, y)));
  return multiply(turnAboutLevel(-latitude), uprightFacing(longitudeOf(x, z)));
}

// The planet part of the way through turning from one rotation to another, from 0 at the first to 1
// at the second, along the shortest turn between them and at an even pace.
export function rotationBetween(from: Rotation, to: Rotation, progress: number): Rotation {
  return quaternionToRotation(slerp(rotationToQuaternion(from), rotationToQuaternion(to), progress));
}

type Quaternion = [number, number, number, number];

function rotationToQuaternion(rotation: Rotation): Quaternion {
  const [[m00, m01, m02], [m10, m11, m12], [m20, m21, m22]] = rotation;
  const trace = m00 + m11 + m22;
  if (trace > 0) {
    const scale = Math.sqrt(trace + 1) * 2;
    return [scale / 4, (m21 - m12) / scale, (m02 - m20) / scale, (m10 - m01) / scale];
  }
  if (m00 > m11 && m00 > m22) {
    const scale = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return [(m21 - m12) / scale, scale / 4, (m01 + m10) / scale, (m02 + m20) / scale];
  }
  if (m11 > m22) {
    const scale = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return [(m02 - m20) / scale, (m01 + m10) / scale, scale / 4, (m12 + m21) / scale];
  }
  const scale = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return [(m10 - m01) / scale, (m02 + m20) / scale, (m12 + m21) / scale, scale / 4];
}

// A quaternion and its negative are the same rotation, and the one nearer the start is taken, so
// that the turn goes the short way round.
function slerp(from: Quaternion, to: Quaternion, progress: number): Quaternion {
  let cosine = from.reduce((total, component, componentIndex) => total + component * to[componentIndex]!, 0);
  const target = cosine < 0 ? to.map(component => -component) as Quaternion : to;
  cosine = Math.abs(cosine);
  if (cosine > 0.9995) {
    const blended = from.map((component, componentIndex) => component + (target[componentIndex]! - component) * progress) as Quaternion;
    const length = Math.hypot(...blended);
    return blended.map(component => component / length) as Quaternion;
  }
  const angle = Math.acos(cosine);
  const fromWeight = Math.sin(angle * (1 - progress)) / Math.sin(angle);
  const toWeight = Math.sin(angle * progress) / Math.sin(angle);
  return from.map((component, componentIndex) => component * fromWeight + target[componentIndex]! * toWeight) as Quaternion;
}

function quaternionToRotation([w, x, y, z]: Quaternion): Rotation {
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}

// At a pole every longitude meets, and the one the planet starts out showing is taken.
function longitudeOf(x: number, z: number): number {
  return Math.hypot(x, z) < 1e-9 ? -Math.PI / 2 : Math.atan2(z, x);
}

// The planet upright, showing the viewer the given line of longitude.
function uprightFacing(longitude: number): Rotation {
  return turnAboutUpright(Math.atan2(-Math.cos(longitude), -Math.sin(longitude)));
}

function turnAboutLevel(angle: number): Rotation {
  return [
    [1, 0, 0],
    [0, Math.cos(angle), -Math.sin(angle)],
    [0, Math.sin(angle), Math.cos(angle)],
  ];
}

function turnAboutUpright(angle: number): Rotation {
  return [
    [Math.cos(angle), 0, Math.sin(angle)],
    [0, 1, 0],
    [-Math.sin(angle), 0, Math.cos(angle)],
  ];
}

function multiply(left: Rotation, right: Rotation): Rotation {
  return [0, 1, 2].map(row =>
    [0, 1, 2].map(column => left[row]![0] * right[0]![column]! + left[row]![1] * right[1]![column]! + left[row]![2] * right[2]![column]!),
  ) as Rotation;
}
