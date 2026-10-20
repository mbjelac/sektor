import { describe, it, expect } from "vitest";
import { soilWateredByRiver } from "./riverSoil";
import { GROUND, RIVER_FROM_WEST } from "../../../shared/terrain";

const _ = GROUND;
const R = RIVER_FROM_WEST;

// The terrain and the soil are read column first: [x][z].
describe("soilWateredByRiver", () => {
  it("leaves the soil of a map without a river as it is", () => {
    const soil = [[1, 2], [3, 4]];

    expect(soilWateredByRiver(soil, [[_, _], [_, _]])).toEqual([[1, 2], [3, 4]]);
  });

  // A square at a corner of the river is two steps from it, across the side of a square between them.
  it("makes the soil of the river and of the squares sharing a side with it as rich as soil gets", () => {
    const terrain = [
      [_, _, _],
      [_, R, _],
      [_, _, _],
    ];
    const soil = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ];

    expect(soilWateredByRiver(soil, terrain)).toEqual([
      [8, 12, 8],
      [12, 12, 12],
      [8, 12, 8],
    ]);
  });

  // 12 beside the river, then 8, 4 and 0 a step further each; the soil of 9 three steps out is
  // richer than the river leaves it there, and stays.
  it("leaves the soil poorer by 4 for every step further from the river, unless it is richer already", () => {
    const terrain = [[R, _, _, _, _, _]];
    const soil = [[0, 0, 0, 9, 0, 0]];

    expect(soilWateredByRiver(soil, terrain)).toEqual([[12, 12, 8, 9, 0, 0]]);
  });
});
