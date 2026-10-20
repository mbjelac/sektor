// The desert has no soil to color its floor by, so every square of it is given a sand of its own
// from the desert's colors instead: scattered rather than laid out, but always the same for the
// same square, so that the floor does not change from one visit to the next.
export function desertFloorFraction(x: number, z: number): number {
  const scrambled = Math.imul(x * 73 + z * 151 + 17, 2654435761) >>> 0;
  return (scrambled % DESERT_SHADE_COUNT) / (DESERT_SHADE_COUNT - 1);
}

// How many sands the desert's colors are told apart into.
const DESERT_SHADE_COUNT = 101;
