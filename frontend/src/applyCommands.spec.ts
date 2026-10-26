import { describe, it, expect } from "vitest";
import p5 from "p5";
import { CreateBody, parseCommands } from "../../shared/parseCommands";
import { drawBodies } from "../../shared/applyCommands";

describe("drawBodies", () => {
  it("keeps the centre of a body where it is while as1 changes its size", () => {
    const [body] = parseCommands("sph s(10,10,10) t(5,5,5) as1(0,0,20,100)");

    expect(centreAt(body, 60)).toEqual(centreAt(body, 0));
  });
});

// Where the body's centre is moved to: the first translation drawing it makes, which takes it to
// the point it is turned and sized about.
function centreAt(body: CreateBody, elapsedMilliseconds: number): number[] {
  const translations: number[][] = [];
  drawBodies(recordingSketch(translations), [body], elapsedMilliseconds);
  return translations[0];
}

// A sketch which draws nothing, only keeping the translations it is asked for. A shape it is asked
// to build comes out empty.
function recordingSketch(translations: number[][]): p5 {
  return new Proxy({}, {
    get: (_target, property) => {
      if (property === "translate") return (...coordinates: number[]) => { translations.push(coordinates); };
      if (property === "buildGeometry") return () => ({ vertexColors: [], vertexStrokeColors: [] });
      return () => undefined;
    },
  }) as p5;
}
