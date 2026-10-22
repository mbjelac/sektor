import { describe, it, expect } from "vitest";
import { parseCommands } from "../../shared/parseCommands";
import { animatedTranslate } from "../../shared/animateCommands";

describe("animatedTranslate", () => {
  it("moves a one-way animated body forward, pauses, then jumps back to its start", () => {
    const [body] = parseCommands("cyl t(0,0,0) at1(0,0,10,100,40,200)");

    const heightsOverTime = [100, 200, 260, 300, 320, 340, 400].map(elapsedMilliseconds => ({
      elapsedMilliseconds,
      height: animatedTranslate(body, elapsedMilliseconds)[2],
    }));

    expect(heightsOverTime).toEqual([
      {elapsedMilliseconds: 100, height: 0},
      {elapsedMilliseconds: 200, height: 0},
      {elapsedMilliseconds: 260, height: 6},
      {elapsedMilliseconds: 300, height: 10},
      {elapsedMilliseconds: 320, height: 10},
      {elapsedMilliseconds: 340, height: 0},
      {elapsedMilliseconds: 400, height: 6},
    ]);
  });
});
