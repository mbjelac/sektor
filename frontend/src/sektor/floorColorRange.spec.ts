import { describe, it, expect } from "vitest";
import { floorColorRange } from "./floorColorRange";

describe("floorColorRange", () => {
  it("runs temperate ground from sand to soil's own color, and tropical ground from #E3C286 to #99EB73", () => {
    expect({
      temperate: floorColorRange("temperate", "#123456"),
      tropical: floorColorRange("tropical", "#123456"),
    }).toEqual({
      temperate: { poorest: "#E3CA86", richest: "#123456" },
      tropical: { poorest: "#E3C286", richest: "#99EB73" },
    });
  });
});
