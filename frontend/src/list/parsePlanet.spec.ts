import { describe, it, expect } from "vitest";
import { parsePlanet } from "./parsePlanet";

describe("parsePlanet", () => {
  it("reads every ring under its heading, one triangle a line, each with its ring's climate", () => {
    const planetMarkdown = [
      "# Topology",
      "",
      "## Ring 0",
      "",
      "Climate: polar",
      "",
      "#ff0000 polar",
      "#00ff00 polar",
      "",
      "## Ring 1",
      "Climate: tropical",
      "#0000ff tropical",
    ].join("\n");

    expect(parsePlanet(planetMarkdown)).toEqual([
      [
        { color: "#ff0000", climate: "polar", biome: "polar", isLand: false, isForest: false, isDesert: false },
        { color: "#00ff00", climate: "polar", biome: "polar", isLand: false, isForest: false, isDesert: false },
      ],
      [
        { color: "#0000ff", climate: "tropical", biome: "tropical", isLand: false, isForest: false, isDesert: false },
      ],
    ]);
  });

  it("reads whether a triangle is land, forest or desert", () => {
    const planetMarkdown = [
      "# Topology",
      "## Ring 0",
      "Climate: temperate",
      "#00c000 L temperate",
      "#0a6900 L F temperate",
      "#f5e198 L D tropical",
    ].join("\n");

    expect(parsePlanet(planetMarkdown)).toEqual([[
      { color: "#00c000", climate: "temperate", biome: "temperate", isLand: true, isForest: false, isDesert: false },
      { color: "#0a6900", climate: "temperate", biome: "temperate", isLand: true, isForest: true, isDesert: false },
      { color: "#f5e198", climate: "temperate", biome: "tropical", isLand: true, isForest: false, isDesert: true },
    ]]);
  });

  it("reads only what stands in the Topology section", () => {
    const planetMarkdown = [
      "# Notes",
      "## Ring 0",
      "#ffffff polar",
      "# Topology",
      "## Ring 0",
      "Climate: polar",
      "#ff0000 polar",
      "# Later",
      "#000000 polar",
    ].join("\n");

    expect(parsePlanet(planetMarkdown)).toEqual([[
      { color: "#ff0000", climate: "polar", biome: "polar", isLand: false, isForest: false, isDesert: false },
    ]]);
  });
});
