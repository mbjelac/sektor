import { describe, it, expect } from "vitest";
import { propertiesShapedByAltitude } from "./altitudeEffects";

describe("propertiesShapedByAltitude", () => {
  it("thins soil by two for every step the ground rises, down to bare rock", () => {
    const shaped = propertiesShapedByAltitude({ soil: [[12, 12, 12, 12, 12, 12, 12]] }, [[0, 1, 2, 3, 4, 6, 9]]);

    expect(shaped).toEqual({ soil: [[12, 10, 8, 6, 4, 0, 0]] });
  });

  it("strengthens wind by two for every step the ground rises", () => {
    const shaped = propertiesShapedByAltitude({ wind: [[4, 4, 4, 4, 4]] }, [[0, 1, 2, 3, 4]]);

    expect(shaped).toEqual({ wind: [[4, 6, 8, 10, 12]] });
  });

  it("never blows wind harder than the hardest there is", () => {
    const shaped = propertiesShapedByAltitude({ wind: [[10, 10]] }, [[1, 9]]);

    expect(shaped).toEqual({ wind: [[12, 12]] });
  });

  // The middle location has a cliff on all four sides and each corner on two, while the high ground
  // between them has a cliff on each of the three sides it has a neighbour on.
  it("dims insolation by two for every side a cliff stands on", () => {
    const insolation = [[12, 12, 12], [12, 12, 12], [12, 12, 12]];
    const altitudes = [[0, 3, 0], [3, 0, 3], [0, 3, 0]];

    const shaped = propertiesShapedByAltitude({ insolation }, altitudes);

    expect(shaped).toEqual({ insolation: [[8, 6, 8], [6, 4, 6], [8, 6, 8]] });
  });

  // Ground climbing a single step is a hillside rather than a cliff, and a hillside takes nothing
  // away from the day a location sees.
  it("leaves insolation alone where the ground only steps up", () => {
    const insolation = [[12, 12, 12], [12, 12, 12], [12, 12, 12]];
    const altitudes = [[0, 1, 0], [1, 0, 1], [0, 1, 0]];

    const shaped = propertiesShapedByAltitude({ insolation }, altitudes);

    expect(shaped).toEqual({ insolation: [[12, 12, 12], [12, 12, 12], [12, 12, 12]] });
  });

  // The middle location has cliffs on all four of its corners and none on any of its sides, so
  // nothing walls it in and it keeps the whole of its light. The high ground on the corners is
  // walled in on the two sides it has neighbours on, the map's edge standing as no cliff at all.
  it("leaves insolation alone where the cliffs lie on the diagonal", () => {
    const insolation = [[12, 12, 12], [12, 12, 12], [12, 12, 12]];
    const altitudes = [[3, 0, 3], [0, 0, 0], [3, 0, 3]];

    const shaped = propertiesShapedByAltitude({ insolation }, altitudes);

    expect(shaped).toEqual({ insolation: [[8, 8, 8], [8, 12, 8], [8, 8, 8]] });
  });

  it("leaves a property the height of the ground says nothing about", () => {
    const shaped = propertiesShapedByAltitude({ groundwater: [[5, 5]] }, [[0, 4]]);

    expect(shaped).toEqual({ groundwater: [[5, 5]] });
  });
});
