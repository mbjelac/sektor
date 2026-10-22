import { describe, it, expect } from "vitest";
import { parseCommands } from "../../shared/parseCommands";
import { animatedColor, animatedTranslate } from "../../shared/animateCommands";

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

describe("animatedColor", () => {
  it("fades a one-way gradually changing body forward, holds the color, then jumps back to its own color", () => {
    const [body] = parseCommands("sph c(#ffffffff) acg1(#ffffff00,100,40,200)");

    const colorsOverTime = [100, 200, 260, 300, 320, 340, 400].map(elapsedMilliseconds => ({
      elapsedMilliseconds,
      color: animatedColor(body, elapsedMilliseconds),
    }));

    expect(colorsOverTime).toEqual([
      {elapsedMilliseconds: 100, color: "#ffffffff"},
      {elapsedMilliseconds: 200, color: "#ffffffff"},
      {elapsedMilliseconds: 260, color: "#ffffff66"},
      {elapsedMilliseconds: 300, color: "#ffffff00"},
      {elapsedMilliseconds: 320, color: "#ffffff00"},
      {elapsedMilliseconds: 340, color: "#ffffffff"},
      {elapsedMilliseconds: 400, color: "#ffffff66"},
    ]);
  });
});
