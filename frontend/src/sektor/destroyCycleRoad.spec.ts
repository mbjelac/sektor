import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";

function createSektor(): Sektor {
  return new Sektor([[{ properties: { soil: 1.0 } }]], [], []);
}

describe("destroyCycleRoad", () => {
  it("destroys a cycle road, leaving the others standing", () => {
    const sektor = createSektor();
    sektor.createCycleRoad([{ x: 2, y: 3 }, { x: 3, y: 3 }]);
    sektor.createCycleRoad([{ x: 5, y: 5 }, { x: 5, y: 6 }]);

    const result = sektor.destroyCycleRoad([{ x: 2, y: 3 }, { x: 3, y: 3 }]);

    expect({ result, cycleRoads: sektor.getState().cycleRoads }).toEqual({
      result: { success: true },
      cycleRoads: [[{ x: 5, y: 5 }, { x: 5, y: 6 }]],
    });
  });

  it("destroys a cycle road told from the other square than it was built from", () => {
    const sektor = createSektor();
    sektor.createCycleRoad([{ x: 2, y: 3 }, { x: 3, y: 3 }]);

    const result = sektor.destroyCycleRoad([{ x: 3, y: 3 }, { x: 2, y: 3 }]);

    expect({ result, cycleRoads: sektor.getState().cycleRoads }).toEqual({
      result: { success: true },
      cycleRoads: [],
    });
  });

  it("does not destroy anything on an edge holding no cycle road", () => {
    const sektor = createSektor();
    sektor.createCycleRoad([{ x: 2, y: 3 }, { x: 3, y: 3 }]);

    const result = sektor.destroyCycleRoad([{ x: 3, y: 3 }, { x: 3, y: 4 }]);

    expect({ result, cycleRoads: sektor.getState().cycleRoads }).toEqual({
      result: { success: false, error: "locationEmpty" },
      cycleRoads: [[{ x: 2, y: 3 }, { x: 3, y: 3 }]],
    });
  });
});
