import { describe, it, expect } from "vitest";
import { fadedColor } from "./color";

describe("fadedColor", () => {
  // The color stays the same whatever the fraction; only how see-through it is changes.
  it("keeps the color and makes it the more see-through the smaller the fraction", () => {
    expect([1, 0.5, 0].map(fraction => fadedColor("#336699", fraction))).toEqual([
      [0x33, 0x66, 0x99, 255],
      [0x33, 0x66, 0x99, 128],
      [0x33, 0x66, 0x99, 0],
    ]);
  });
});
