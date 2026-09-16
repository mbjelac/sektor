import { describe, it, expect } from "vitest";
import { OwnedSektor, playerScores } from "./playerScores";

function sektorOf(owner: string | null, status: "InProgress" | "Done" | "Overrun", score: number): OwnedSektor {
  return { owner, status, score };
}

describe("playerScores", () => {
  it("credits a player with what their finished sektors scored", () => {
    expect(playerScores([
      sektorOf("Ada", "Done", 30),
      sektorOf("Ada", "Done", 12),
    ])).toEqual([{ name: "Ada", score: 42 }]);
  });

  it("credits a player with nothing for a sektor they are still working on", () => {
    expect(playerScores([
      sektorOf("Ada", "Done", 30),
      sektorOf("Ada", "InProgress", 100),
    ])).toEqual([{ name: "Ada", score: 30 }]);
  });

  it("credits a player with nothing for a sektor which breaks its restrictions", () => {
    expect(playerScores([
      sektorOf("Ada", "Done", 30),
      sektorOf("Ada", "Overrun", 100),
    ])).toEqual([{ name: "Ada", score: 30 }]);
  });

  // A half built sektor used to drag its player down, which punished them for starting one.
  it("keeps a player out of the red while their only sektor is unfinished", () => {
    expect(playerScores([sektorOf("Ada", "InProgress", -40)])).toEqual([{ name: "Ada", score: 0 }]);
  });

  // Claiming a sektor is what makes somebody a player, so they stand there from that moment on.
  it("stands a player on nothing rather than leaving them out", () => {
    expect(playerScores([
      sektorOf("Ada", "Done", 30),
      sektorOf("Bea", "InProgress", 0),
    ])).toEqual([{ name: "Ada", score: 30 }, { name: "Bea", score: 0 }]);
  });

  it("counts nobody for a sektor which has no owner", () => {
    expect(playerScores([
      sektorOf(null, "Done", 500),
      sektorOf("Ada", "Done", 30),
    ])).toEqual([{ name: "Ada", score: 30 }]);
  });

  it("puts the best standing first", () => {
    expect(playerScores([
      sektorOf("Ada", "Done", 10),
      sektorOf("Bea", "Done", 50),
      sektorOf("Cy", "Done", 30),
    ])).toEqual([{ name: "Bea", score: 50 }, { name: "Cy", score: 30 }, { name: "Ada", score: 10 }]);
  });

  it("stands nobody anywhere when no sektor has been claimed", () => {
    expect(playerScores([sektorOf(null, "InProgress", 0)])).toEqual([]);
  });
});
