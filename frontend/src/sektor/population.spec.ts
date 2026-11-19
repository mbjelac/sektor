import { describe, it, expect } from "vitest";
import { sektorPopulation, totalPopulation } from "./population";

describe("population", () => {
  it("is as many people as the habitats of a sektor house, added up over the sektors", () => {
    expect({
      sektorPopulations: [sektorPopulation(0), sektorPopulation(3)],
      totalPopulation: totalPopulation([120, 40, 0]),
      noSektors: totalPopulation([]),
    }).toEqual({ sektorPopulations: [0, 120], totalPopulation: 160, noSektors: 0 });
  });
});
