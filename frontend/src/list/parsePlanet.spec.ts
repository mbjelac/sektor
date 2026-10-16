import { describe, it, expect } from "vitest";
import { parsePlanetColors } from "./parsePlanet";

describe("parsePlanetColors", () => {
  it("reads the colours of every ring under its heading, one triangle a line", () => {
    const planetMarkdown = [
      "# Topology",
      "",
      "## Ring 0",
      "",
      "#ff0000",
      "#00ff00",
      "",
      "## Ring 1",
      "#0000ff",
    ].join("\n");

    expect(parsePlanetColors(planetMarkdown)).toEqual([["#ff0000", "#00ff00"], ["#0000ff"]]);
  });

  it("reads only what stands in the Topology section", () => {
    const planetMarkdown = [
      "# Notes",
      "## Ring 0",
      "#ffffff",
      "# Topology",
      "## Ring 0",
      "#ff0000",
      "# Later",
      "#000000",
    ].join("\n");

    expect(parsePlanetColors(planetMarkdown)).toEqual([["#ff0000"]]);
  });
});
