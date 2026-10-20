import { describe, it, expect } from "vitest";
import { sektorNameFrom } from "./sektorName";

// The draws fall in the order given.
function drawing(...values: number[]): () => number {
  let drawIndex = 0;
  return () => values[drawIndex++];
}

describe("sektorNameFrom", () => {
  it("joins two words drawn from those given with a dash", () => {
    expect(sektorNameFrom(["meadow", "harvest", "quiet"], drawing(0.5, 0))).toEqual("harvest-meadow");
  });

  // The first word drawn is put aside, so drawing the same place again lands on the word after it.
  it("never names a sektor after the same word twice", () => {
    expect(sektorNameFrom(["meadow", "harvest"], drawing(0, 0))).toEqual("meadow-harvest");
  });
});
