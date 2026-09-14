import { describe, it, expect } from "vitest";
import { playerLevel } from "./playerLevel";

describe("playerLevel", () => {
  it("puts a player who has scored nothing on the first level", () => {
    expect(playerLevel(0)).toEqual(1);
  });

  it("puts a player with a negative score on the first level", () => {
    expect(playerLevel(-20)).toEqual(1);
  });

  it("keeps a player below the first doubling on the first level", () => {
    expect(playerLevel(2)).toEqual(1);
  });

  it("raises a player a level with every doubling of their score", () => {
    expect([3, 7, 15, 31].map(playerScore => playerLevel(playerScore))).toEqual([2, 3, 4, 5]);
  });

  it("keeps a player on their level until the next doubling", () => {
    expect(playerLevel(30)).toEqual(4);
  });
});
