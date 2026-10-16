import { describe, it, expect } from "vitest";
import { Point } from "./planetGrid";
import { dragRotation, Rotation, UNTURNED, uprightRotation } from "./planetRotation";

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
