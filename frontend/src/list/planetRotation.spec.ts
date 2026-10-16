import { describe, it, expect } from "vitest";
import { Point } from "./planetGrid";
import { dragRotation, facingRotation, Rotation, rotationBetween, UNTURNED, uprightRotation } from "./planetRotation";

describe("uprightRotation", () => {
  it("stands the planet with north straight up, still facing the viewer with the same longitude", () => {
    const tilted = dragRotation(130, -70, UNTURNED);
    const upright = uprightRotation(tilted);

    expect({
      northOnScreen: round(onScreen(upright, [0, 1, 0])),
      southOnScreen: round(onScreen(upright, [0, -1, 0])),
      facingLongitude: round([longitudeFacingViewer(upright)]),
    }).toEqual({
      northOnScreen: [0, -1, 0],
      southOnScreen: [0, 1, 0],
      facingLongitude: round([longitudeFacingViewer(tilted)]),
    });
  });

  it("leaves an unturned planet as it is", () => {
    expect(uprightRotation(UNTURNED).map(row => round(row))).toEqual(UNTURNED);
  });
});

describe("facingRotation", () => {
  it("brings the point to the middle of the screen, facing the viewer, with north straight up from it", () => {
    const point: Point = [0.3, 0.5, -Math.sqrt(1 - 0.09 - 0.25)];
    const facing = facingRotation(point);
    const north = onScreen(facing, [0, 1, 0]);

    expect({
      pointOnScreen: round(onScreen(facing, point)),
      northStraightUp: [round([north[0]])[0], north[1] < 0],
    }).toEqual({
      pointOnScreen: [0, 0, 1],
      northStraightUp: [0, true],
    });
  });
});

describe("rotationBetween", () => {
  it("starts at the first rotation, ends at the second, and is halfway round halfway through", () => {
    const from = dragRotation(130, -70, UNTURNED);
    const to = facingRotation([0.3, 0.5, -Math.sqrt(1 - 0.09 - 0.25)]);
    const halfway = rotationBetween(from, to, 0.5);

    expect({
      start: rotationBetween(from, to, 0).map(row => round(row)),
      end: rotationBetween(from, to, 1).map(row => round(row)),
      halfwayTurns: round([angleBetween(from, halfway), angleBetween(halfway, to)]),
    }).toEqual({
      start: from.map(row => round(row)),
      end: to.map(row => round(row)),
      halfwayTurns: round([angleBetween(from, to) / 2, angleBetween(from, to) / 2]),
    });
  });
});

// How far one rotation is turned from the other: the angle of the turn taking one to the other.
function angleBetween(first: Rotation, second: Rotation): number {
  const trace = [0, 1, 2].reduce((total, axis) => total + [0, 1, 2].reduce((sum, row) => sum + first[row]![axis]! * second[row]![axis]!, 0), 0);
  return Math.acos(Math.max(-1, Math.min(1, (trace - 1) / 2)));
}

// Where a point of the planet is drawn: turned by the rotation after being turned over.
function onScreen(rotation: Rotation, [x, y, z]: Point): Point {
  const turnedOver: Point = [x, -y, -z];
  return rotation.map(row => row[0] * turnedOver[0] + row[1] * turnedOver[1] + row[2] * turnedOver[2]) as Point;
}

function longitudeFacingViewer(rotation: Rotation): number {
  const facing: Point = [rotation[2][0], -rotation[2][1], -rotation[2][2]];
  return Math.atan2(facing[2], facing[0]);
}

function round(values: number[]): number[] {
  return values.map(value => Math.round(value * 1e6) / 1e6 + 0);
}
