import { describe, it, expect } from "vitest";
import {
  PlayerSektor,
  ResourceMovingSektor,
  resourceTotal,
  sektorsMovingResource,
  sortSektorsMovingResource,
} from "./sektorsMovingResource";

function playerSektorOf(sektorName: string, imports: [string, number][], exports: [string, number][]): PlayerSektor {
  return {
    sektorId: `${sektorName}-id`,
    sektorName,
    importsAndExports: {
      imports: imports.map(([name, value]) => ({ name, value })),
      exports: exports.map(([name, value]) => ({ name, value })),
    },
  };
}

describe("sektorsMovingResource", () => {
  it("lists every sektor bringing in or sending out the resource with how much, leaving out the others", () => {
    expect(sektorsMovingResource([
      playerSektorOf("Alpha", [["Wood", 3]], []),
      playerSektorOf("Beta", [["Stone", 2]], [["Water", 1]]),
      playerSektorOf("Gamma", [], [["Wood", 5]]),
      playerSektorOf("Delta", [["Wood", 1]], [["Wood", 4]]),
    ], "Wood")).toEqual([
      { sektorId: "Alpha-id", sektorName: "Alpha", imported: 3, exported: 0 },
      { sektorId: "Gamma-id", sektorName: "Gamma", imported: 0, exported: 5 },
      { sektorId: "Delta-id", sektorName: "Delta", imported: 1, exported: 4 },
    ]);
  });

  it("leaves out a sektor which lists the resource at nothing", () => {
    expect(sektorsMovingResource([playerSektorOf("Alpha", [["Wood", 0]], [["Wood", 0]])], "Wood")).toEqual([]);
  });
});

function resourceMovingSektorOf(sektorName: string, imported: number, exported: number): ResourceMovingSektor {
  return { sektorId: `${sektorName}-id`, sektorName, imported, exported };
}

const unsortedSektors = [
  resourceMovingSektorOf("Gamma", 2, 1),
  resourceMovingSektorOf("Alpha", 0, 5),
  resourceMovingSektorOf("Delta", 2, 0),
  resourceMovingSektorOf("Beta", 7, 1),
];

function sortedSektorNames(sortOrder: "sektor" | "imported" | "exported"): string[] {
  return sortSektorsMovingResource(unsortedSektors, sortOrder).map(resourceMovingSektor => resourceMovingSektor.sektorName);
}

describe("sortSektorsMovingResource", () => {
  it("puts sektors in order of their names, of most imported, or of most exported, ties by name", () => {
    expect({
      sektor: sortedSektorNames("sektor"),
      imported: sortedSektorNames("imported"),
      exported: sortedSektorNames("exported"),
    }).toEqual({
      sektor: ["Alpha", "Beta", "Delta", "Gamma"],
      imported: ["Beta", "Delta", "Gamma", "Alpha"],
      exported: ["Alpha", "Beta", "Gamma", "Delta"],
    });
  });
});

describe("resourceTotal", () => {
  it("tells the sektors as exporting, importing or neither by what they export less what they import", () => {
    expect({
      exporting: resourceTotal([resourceMovingSektorOf("Alpha", 2, 5), resourceMovingSektorOf("Beta", 1.1, 0)]),
      importing: resourceTotal([resourceMovingSektorOf("Alpha", 4, 1), resourceMovingSektorOf("Beta", 0, 0.5)]),
      cancelledOut: resourceTotal([resourceMovingSektorOf("Alpha", 3, 0), resourceMovingSektorOf("Beta", 0, 3)]),
    }).toEqual({
      exporting: { direction: "export", amount: 1.9 },
      importing: { direction: "import", amount: 2.5 },
      cancelledOut: { direction: null, amount: 0 },
    });
  });
});
