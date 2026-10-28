import { describe, it, expect } from "vitest";
import { parseCommands } from "../../shared/parseCommands";
import { animatedColor, animatedScale, animatedShine, animatedTranslate } from "../../shared/animateCommands";

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

describe("animatedScale", () => {
  it("grows a one-way size animated body, holds its size, then jumps back to its own size", () => {
    const [body] = parseCommands("sph s(10,20,30) as1(10,0,-10,100,40,200)");

    const sizesOverTime = [100, 200, 260, 300, 320, 340, 400].map(elapsedMilliseconds => ({
      elapsedMilliseconds,
      size: animatedScale(body, elapsedMilliseconds),
    }));

    expect(sizesOverTime).toEqual([
      {elapsedMilliseconds: 100, size: [10, 20, 30]},
      {elapsedMilliseconds: 200, size: [10, 20, 30]},
      {elapsedMilliseconds: 260, size: [16, 20, 24]},
      {elapsedMilliseconds: 300, size: [20, 20, 20]},
      {elapsedMilliseconds: 320, size: [20, 20, 20]},
      {elapsedMilliseconds: 340, size: [10, 20, 30]},
      {elapsedMilliseconds: 400, size: [16, 20, 24]},
    ]);
  });
});

describe("animatedColor", () => {
  it("fades a gradually changing body there, holds the color, fades back, holds its own color, then fades there again", () => {
    const [body] = parseCommands("sph c(#ffffffff) acg(#ffffff00,100,40,200)");

    const colorsOverTime = [100, 200, 260, 300, 340, 400, 440, 480, 540].map(elapsedMilliseconds => ({
      elapsedMilliseconds,
      color: animatedColor(body, elapsedMilliseconds),
    }));

    expect(colorsOverTime).toEqual([
      {elapsedMilliseconds: 100, color: "#ffffffff"},
      {elapsedMilliseconds: 200, color: "#ffffffff"},
      {elapsedMilliseconds: 260, color: "#ffffff66"},
      {elapsedMilliseconds: 300, color: "#ffffff00"},
      {elapsedMilliseconds: 340, color: "#ffffff00"},
      {elapsedMilliseconds: 400, color: "#ffffff99"},
      {elapsedMilliseconds: 440, color: "#ffffffff"},
      {elapsedMilliseconds: 480, color: "#ffffffff"},
      {elapsedMilliseconds: 540, color: "#ffffff66"},
    ]);
  });

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

describe("animatedShine", () => {
  it("raises the shine from none, holds it, lowers it back to none, holds that, then raises it again", () => {
    const [body] = parseCommands("sph sh(30) ash(80,100,40)");

    const shinesOverTime = [0, 60, 100, 140, 200, 240, 260, 280, 340].map(elapsedMilliseconds => ({
      elapsedMilliseconds,
      shine: animatedShine(body, elapsedMilliseconds),
    }));

    expect(shinesOverTime).toEqual([
      {elapsedMilliseconds: 0, shine: 0},
      {elapsedMilliseconds: 60, shine: 48},
      {elapsedMilliseconds: 100, shine: 80},
      {elapsedMilliseconds: 140, shine: 80},
      {elapsedMilliseconds: 200, shine: 32},
      {elapsedMilliseconds: 240, shine: 0},
      {elapsedMilliseconds: 260, shine: 0},
      {elapsedMilliseconds: 280, shine: 0},
      {elapsedMilliseconds: 340, shine: 48},
    ]);
  });
});
