import { describe, it, expect } from "vitest";
import { sektorDeforestation, totalDeforestation } from "./deforestation";

describe("sektorDeforestation", () => {
  it("is the initial support less the support the sektor still gives", () => {
    expect(sektorDeforestation(40, 30)).toEqual({ deforestation: 10, initialEcosystemSupport: 40, percentage: 25 });
  });

  it("is all of the initial support when the sektor gives none of it", () => {
    expect(sektorDeforestation(42, 0)).toEqual({ deforestation: 42, initialEcosystemSupport: 42, percentage: 100 });
  });

  it("rounds the percentage to a whole number", () => {
    expect(sektorDeforestation(3, 2)).toEqual({ deforestation: 1, initialEcosystemSupport: 3, percentage: 33 });
  });

  it("stands at none for a sektor which started with no support", () => {
    expect(sektorDeforestation(0, 0)).toEqual({ deforestation: 0, initialEcosystemSupport: 0, percentage: 0 });
  });
});

describe("totalDeforestation", () => {
  it("is all the sektors' initial support less all the support they still give", () => {
    expect(totalDeforestation([
      { initialEcosystemSupport: 40, ecosystemSupport: 30 },
      { initialEcosystemSupport: 20, ecosystemSupport: 25 },
      { initialEcosystemSupport: 10.2, ecosystemSupport: 0.1 },
    ])).toEqual(15.1);
  });

  it("stands at none for no sektors", () => {
    expect(totalDeforestation([])).toEqual(0);
  });
});
