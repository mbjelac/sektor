import { describe, it, expect } from "vitest";
import { OwnedSektor, playerScores } from "./playerScores";

function sektorOf(owner: string | null, score: number): OwnedSektor {
  return { owner, score };
}

describe("playerScores", () => {
  it("credits a player with what their sektors score", () => {
    expect(playerScores([
      sektorOf("Ada", 30),
      sektorOf("Ada", 12),
    ])).toEqual([{ name: "Ada", score: 42 }]);
  });

  // Claiming a sektor is what makes somebody a player, so they stand there from that moment on.
  it("stands a player on nothing rather than leaving them out", () => {
    expect(playerScores([
      sektorOf("Ada", 30),
      sektorOf("Bea", 0),
    ])).toEqual([{ name: "Ada", score: 30 }, { name: "Bea", score: 0 }]);
  });

  it("counts nobody for a sektor which has no owner", () => {
    expect(playerScores([
      sektorOf(null, 500),
      sektorOf("Ada", 30),
    ])).toEqual([{ name: "Ada", score: 30 }]);
  });

  it("puts the best standing first", () => {
    expect(playerScores([
      sektorOf("Ada", 10),
      sektorOf("Bea", 50),
      sektorOf("Cy", 30),
    ])).toEqual([{ name: "Bea", score: 50 }, { name: "Cy", score: 30 }, { name: "Ada", score: 10 }]);
  });

  it("stands nobody anywhere when no sektor has been claimed", () => {
    expect(playerScores([sektorOf(null, 0)])).toEqual([]);
  });
});
