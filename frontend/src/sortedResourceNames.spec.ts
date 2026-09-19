import { describe, it, expect } from "vitest";
import { ImportsAndExports, sortedResourceNames } from "./globalImportsAndExports";

function moving(imports: [string, number][], exports: [string, number][]): ImportsAndExports {
  return {
    imports: imports.map(([name, value]) => ({ name, value })),
    exports: exports.map(([name, value]) => ({ name, value })),
  };
}

describe("sortedResourceNames", () => {
  it("puts the resources in the order of their names", () => {
    const moved = moving([["Water", 1], ["Food", 2]], [["Ore", 3]]);

    expect(sortedResourceNames(moved, "resource")).toEqual(["Food", "Ore", "Water"]);
  });

  it("puts the most brought in first", () => {
    const moved = moving([["Water", 1], ["Food", 9], ["Ore", 5]], []);

    expect(sortedResourceNames(moved, "imported")).toEqual(["Food", "Ore", "Water"]);
  });

  it("puts the most sent out first", () => {
    const moved = moving([], [["Water", 1], ["Food", 9], ["Ore", 5]]);

    expect(sortedResourceNames(moved, "exported")).toEqual(["Food", "Ore", "Water"]);
  });

  // Of two resources equally brought in, the one less sent out is the one the planet is shorter of.
  it("puts the least sent out first among those equally brought in", () => {
    const moved = moving([["Water", 4], ["Ore", 4]], [["Water", 7], ["Ore", 2]]);

    expect(sortedResourceNames(moved, "imported")).toEqual(["Ore", "Water"]);
  });

  it("puts the least brought in first among those equally sent out", () => {
    const moved = moving([["Water", 7], ["Ore", 2]], [["Water", 4], ["Ore", 4]]);

    expect(sortedResourceNames(moved, "exported")).toEqual(["Ore", "Water"]);
  });

  // A resource which is neither brought in nor sent out stands at nothing in both columns, so what
  // is left to tell the tied ones apart is their names.
  it("falls back on the names of resources tied in both columns", () => {
    const moved = moving([["Water", 4], ["Food", 4], ["Ore", 4]], []);

    expect(sortedResourceNames(moved, "imported")).toEqual(["Food", "Ore", "Water"]);
  });

  it("leaves out a resource which is not moved, whatever the order asked for", () => {
    const moved = moving([["Water", 0], ["Food", 3]], [["Water", 0]]);

    expect(sortedResourceNames(moved, "imported")).toEqual(["Food"]);
  });
});
