import { describe, it, expect } from "vitest";
import { playerScores } from "./playerScores";

describe("playerScores", () => {
  // A player's score comes of the mandates they have completed, and none can be completed yet.
  it("stands a player on nothing whatever their sektors do", () => {
    expect(playerScores(["Ada"])).toEqual([{ name: "Ada", score: 0 }]);
  });

  it("stands a player owning several sektors there once", () => {
    expect(playerScores(["Ada", "Bea", "Ada"])).toEqual([{ name: "Ada", score: 0 }, { name: "Bea", score: 0 }]);
  });

  it("counts nobody for a sektor which has no owner", () => {
    expect(playerScores([null, "Ada"])).toEqual([{ name: "Ada", score: 0 }]);
  });

  it("stands nobody anywhere when no sektor has been claimed", () => {
    expect(playerScores([null])).toEqual([]);
  });
});
