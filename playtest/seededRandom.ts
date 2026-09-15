// A report is only worth comparing to the last one if the same configuration gives the same
// numbers every time. Left to Math.random, every run would differ, and the differences between two
// reports would be mostly noise — which is exactly what makes a difference impossible to explain.
// So every sektor of a report is generated from a seed, and the seed is written into the report.
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let scrambled = Math.imul(state ^ (state >>> 15), 1 | state);
    scrambled = (scrambled + Math.imul(scrambled ^ (scrambled >>> 7), 61 | scrambled)) ^ scrambled;
    return ((scrambled ^ (scrambled >>> 14)) >>> 0) / 4294967296;
  };
}
