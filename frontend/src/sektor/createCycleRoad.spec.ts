import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";

function createSektor(): Sektor {
  return new Sektor([[{ properties: { soil: 1.0 } }]], [], []);
}

describe("createCycleRoad", () => {
  it("creates a cycle road between two squares", () => {
    const sektor = createSektor();

    const result = sektor.createCycleRoad([{ x: 2, y: 3 }, { x: 3, y: 3 }]);

    expect({ result, cycleRoads: sektor.getState().cycleRoads }).toEqual({
      result: { error: undefined },
      cycleRoads: [[{ x: 2, y: 3 }, { x: 3, y: 3 }]],
    });
  });

  it("creates a cycle road along the rim of the map, running to a square beyond it", () => {
    const sektor = createSektor();

    sektor.createCycleRoad([{ x: 0, y: 4 }, { x: -1, y: 4 }]);
    sektor.createCycleRoad([{ x: 9, y: 4 }, { x: 9, y: 10 }]);

    expect(sektor.getState().cycleRoads).toEqual([
      [{ x: 0, y: 4 }, { x: -1, y: 4 }],
      [{ x: 9, y: 4 }, { x: 9, y: 10 }],
    ]);
  });

  it("does not create a second cycle road on an edge already holding one", () => {
    const sektor = createSektor();
    sektor.createCycleRoad([{ x: 2, y: 3 }, { x: 3, y: 3 }]);

    const result = sektor.createCycleRoad([{ x: 2, y: 3 }, { x: 3, y: 3 }]);

    expect({ result, cycleRoads: sektor.getState().cycleRoads }).toEqual({
      result: { error: "locationOccupied" },
      cycleRoads: [[{ x: 2, y: 3 }, { x: 3, y: 3 }]],
    });
  });

  it("does not create a second cycle road on an edge already holding one built from the other square", () => {
    const sektor = createSektor();
    sektor.createCycleRoad([{ x: 2, y: 3 }, { x: 3, y: 3 }]);

    const result = sektor.createCycleRoad([{ x: 3, y: 3 }, { x: 2, y: 3 }]);

    expect({ result, cycleRoads: sektor.getState().cycleRoads }).toEqual({
      result: { error: "locationOccupied" },
      cycleRoads: [[{ x: 2, y: 3 }, { x: 3, y: 3 }]],
    });
  });

  it("keeps the cycle roads of a saved sektor once it is loaded again", () => {
    const sektor = createSektor();
    sektor.createCycleRoad([{ x: 2, y: 3 }, { x: 3, y: 3 }]);
    const reloadedSektor = createSektor();

    reloadedSektor.loadState(sektor.getState());

    expect(reloadedSektor.getState().cycleRoads).toEqual([[{ x: 2, y: 3 }, { x: 3, y: 3 }]]);
  });

  it("loads no cycle roads for a sektor saved before there were any", () => {
    const sektor = createSektor();

    sektor.loadState({ buildings: [] });

    expect(sektor.getState().cycleRoads).toEqual([]);
  });
});
