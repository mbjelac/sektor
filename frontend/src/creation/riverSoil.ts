import { isRiver } from "../../../shared/terrain";
import { MODIFIER_MAX } from "../../../shared/modifierLimits";

// A river waters the ground it runs through, which leaves the soil along it rich. Soil is laid out
// first, whatever the sektor's biome makes of it, and the river is reckoned in only afterwards,
// so that it enriches the soil there is rather than taking its place.
//
// The river's own squares, and the squares sharing a side with them, hold the richest soil there is.
// Every step further out, going from square to square across their sides, the river's water leaves
// the soil poorer by the fall-off, and a square which is richer than that already keeps its own.
export const RIVER_SOIL_FALL_OFF_PER_SQUARE = 4;

export function soilWateredByRiver(soil: number[][], terrain: number[][]): number[][] {
  const riverSquares = squaresOfRiver(terrain);
  if (riverSquares.length === 0) return soil.map(row => [...row]);
  return soil.map((row, x) => row.map((value, z) => {
    const stepsFromRiver = Math.min(...riverSquares.map(square => Math.abs(square.x - x) + Math.abs(square.z - z)));
    const wateredSoil = MODIFIER_MAX - RIVER_SOIL_FALL_OFF_PER_SQUARE * Math.max(0, stepsFromRiver - 1);
    return Math.max(value, wateredSoil);
  }));
}

function squaresOfRiver(terrain: number[][]): { x: number, z: number }[] {
  return terrain.flatMap((row, x) => row.flatMap((square, z) => isRiver(square) ? [{ x, z }] : []));
}
