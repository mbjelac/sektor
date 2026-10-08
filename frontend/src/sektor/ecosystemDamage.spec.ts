import { describe, it, expect } from "vitest";
import { ecosystemDamage } from "./ecosystemDamage";

describe("ecosystemDamage", () => {
  it("is the initial support less the support the sektor still gives", () => {
    expect(ecosystemDamage(40, 30)).toEqual({ damage: 10, initialEcosystemSupport: 40, percentage: 25 });
  });

  it("is all of the initial support when the sektor gives none of it", () => {
    expect(ecosystemDamage(42, 0)).toEqual({ damage: 42, initialEcosystemSupport: 42, percentage: 100 });
  });

  it("rounds the percentage to a whole number", () => {
    expect(ecosystemDamage(3, 2)).toEqual({ damage: 1, initialEcosystemSupport: 3, percentage: 33 });
  });

  it("stands at none for a sektor which started with no support", () => {
    expect(ecosystemDamage(0, 0)).toEqual({ damage: 0, initialEcosystemSupport: 0, percentage: 0 });
  });
});
