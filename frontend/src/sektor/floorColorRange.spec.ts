import { describe, it, expect } from "vitest";
import { floorColorRange } from "./floorColorRange";

describe("floorColorRange", () => {
  it("runs temperate ground from sand to soil's own color, tropical ground from #E3C286 to #99EB73 polar ground from #AFCCC1 to #86EBC4 and desert ground from #D7E07E to #F0C756", () => {
    expect({
      temperate: floorColorRange("temperate", "#123456"),
      tropical: floorColorRange("tropical", "#123456"),
      polar: floorColorRange("polar", "#123456"),
      desert: floorColorRange("desert", "#123456"),
    }).toEqual({
      temperate: { poorest: "#E3CA86", richest: "#123456" },
      tropical: { poorest: "#E3C286", richest: "#99EB73" },
      polar: { poorest: "#AFCCC1", richest: "#86EBC4" },
      desert: { poorest: "#D7E07E", richest: "#F0C756" },
    });
  });
});
