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

  it("reads the colour of a triangle whatever it is marked as", () => {
    const planetMarkdown = [
      "# Topology",
      "## Ring 0",
      "#ffea00 L temperate",
      "#0a6900 L F temperate",
      "#f5e198 L D tropical",
      "#006eff polar",
    ].join("\n");

    expect(parsePlanetColors(planetMarkdown)).toEqual([["#ffea00", "#0a6900", "#f5e198", "#006eff"]]);
  });

  it("does not take a ring's climate zone for a triangle", () => {
    const planetMarkdown = [
      "# Topology",
      "## Ring 0",
      "Climate: polar",
      "#ffffff",
    ].join("\n");

    expect(parsePlanetColors(planetMarkdown)).toEqual([["#ffffff"]]);
  });
});
