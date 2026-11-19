import { describe, it, expect } from "vitest";
import { criterionSektors } from "./criterionSektors";
import { PlayerSektor } from "./sektorsMovingResource";

// Alpha sends out 6 Wood, Beta brings in 4 and Gamma moves none. Alpha has lost 10 of its support,
// is polluted 40, houses 80 people and makes 5 Hapiness; Beta has lost none, is not polluted, houses
// nobody and makes none.
const PLAYER_SEKTORS: PlayerSektor[] = [
  {
    sektorId: "alpha-id",
    sektorName: "Alpha",
    importsAndExports: { imports: [], exports: [{ name: "Wood", value: 6 }] },
    ecosystem: { initialEcosystemSupport: 30, ecosystemSupport: 20 },
    pollution: 40,
    population: 80,
    hapiness: 5,
  },
  {
    sektorId: "beta-id",
    sektorName: "Beta",
    importsAndExports: { imports: [{ name: "Wood", value: 4 }], exports: [] },
    ecosystem: { initialEcosystemSupport: 20, ecosystemSupport: 20 },
    pollution: 0,
    population: 0,
    hapiness: 0,
  },
  {
    sektorId: "gamma-id",
    sektorName: "Gamma",
    importsAndExports: { imports: [], exports: [] },
    ecosystem: { initialEcosystemSupport: 0, ecosystemSupport: 0 },
    pollution: 0,
    population: 0,
    hapiness: 0,
  },
];

describe("criterionSektors", () => {
  it("counts a sektor moving the resource the asked way towards a criterion, and one moving it the other way against it", () => {
    expect({
      export: criterionSektors({ type: "minimumExport", resourceName: "Wood", amount: 5, completed: false }, PLAYER_SEKTORS),
      import: criterionSektors({ type: "maximumImport", resourceName: "Wood", amount: 5, completed: false }, PLAYER_SEKTORS),
    }).toEqual({
      export: [{ sektorId: "alpha-id", sektorName: "Alpha", amount: 6 }, { sektorId: "beta-id", sektorName: "Beta", amount: -4 }],
      import: [{ sektorId: "alpha-id", sektorName: "Alpha", amount: -6 }, { sektorId: "beta-id", sektorName: "Beta", amount: 4 }],
    });
  });

  it("counts every sektor coming to any of a measure by as much as it comes to", () => {
    expect([
      criterionSektors({ type: "maximumDeforestation", amount: 5, completed: false }, PLAYER_SEKTORS),
      criterionSektors({ type: "maximumPollution", amount: 5, completed: false }, PLAYER_SEKTORS),
      criterionSektors({ type: "minimumPopulation", amount: 5, completed: false }, PLAYER_SEKTORS),
      criterionSektors({ type: "minimumHapiness", amount: 5, completed: false }, PLAYER_SEKTORS),
    ]).toEqual([
      [{ sektorId: "alpha-id", sektorName: "Alpha", amount: 10 }],
      [{ sektorId: "alpha-id", sektorName: "Alpha", amount: 40 }],
      [{ sektorId: "alpha-id", sektorName: "Alpha", amount: 80 }],
      [{ sektorId: "alpha-id", sektorName: "Alpha", amount: 5 }],
    ]);
  });
});
