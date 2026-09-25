import { describe, it, expect } from "vitest";
import { parseBuildingTags } from "./buildingTags";

describe("parseBuildingTags", () => {
  it("takes one tag from every line, leaving out blank lines", () => {
    expect(parseBuildingTags(["fruit", "", "  metal  ", ""])).toEqual(["fruit", "metal"]);
  });
});
