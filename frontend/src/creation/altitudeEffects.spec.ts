import { describe, it, expect } from "vitest";
import { propertiesShapedByAltitude } from "./altitudeEffects";

describe("propertiesShapedByAltitude", () => {
  it("thins soil by four for every step the ground rises, down to bare rock", () => {
    const shaped = propertiesShapedByAltitude({ soil: [[12, 12, 12, 12, 12]] }, [[0, 1, 2, 3, 4]]);

    expect(shaped).toEqual({ soil: [[12, 8, 4, 0, 0]] });
  });

  it("strengthens wind by two for every step the ground rises", () => {
    const shaped = propertiesShapedByAltitude({ wind: [[4, 4, 4, 4, 4]] }, [[0, 1, 2, 3, 4]]);

    expect(shaped).toEqual({ wind: [[4, 6, 8, 10, 12]] });
  });

  it("never blows wind harder than the hardest there is", () => {
    const shaped = propertiesShapedByAltitude({ wind: [[10, 10]] }, [[1, 4]]);

    expect(shaped).toEqual({ wind: [[12, 12]] });
  });

  // The middle location is overlooked from all four sides, the middle of each edge from two, and
  // the ground standing over them is in nobody's shadow.
  it("dims insolation by two for every neighbour standing over a location", () => {
    const insolation = [[12, 12, 12], [12, 12, 12], [12, 12, 12]];
    const altitudes = [[0, 1, 0], [1, 0, 1], [0, 1, 0]];

    const shaped = propertiesShapedByAltitude({ insolation }, altitudes);

    expect(shaped).toEqual({ insolation: [[8, 12, 8], [12, 4, 12], [8, 12, 8]] });
  });

  // The middle location has high ground on all four of its corners and none on any of its sides,
  // so nothing stands over it and it keeps the whole of its light.
  it("leaves insolation alone where the higher ground lies on the diagonal", () => {
    const insolation = [[12, 12, 12], [12, 12, 12], [12, 12, 12]];
    const altitudes = [[1, 0, 1], [0, 0, 0], [1, 0, 1]];

    const shaped = propertiesShapedByAltitude({ insolation }, altitudes);

    expect(shaped).toEqual({ insolation: [[12, 8, 12], [8, 12, 8], [12, 8, 12]] });
  });

  it("leaves a property the height of the ground says nothing about", () => {
    const shaped = propertiesShapedByAltitude({ groundwater: [[5, 5]] }, [[0, 4]]);

    expect(shaped).toEqual({ groundwater: [[5, 5]] });
  });
});
