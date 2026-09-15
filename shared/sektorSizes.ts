// A sektor's map is square, so one number says how big it is: how many tiles it is across. Only
// these sizes are ever made, and each carries the name the player is shown.
export interface SektorSize {
  tilesPerSide: number;
  name: string;
}

// Ordered from smallest to largest, which is the order a size is looked for in.
export const SEKTOR_SIZES: SektorSize[] = [
  { tilesPerSide: 4, name: "Tiny" },
  { tilesPerSide: 6, name: "Small" },
  { tilesPerSide: 8, name: "Medium" },
  { tilesPerSide: 10, name: "Large" },
];

export const LARGEST_SEKTOR_SIZE = SEKTOR_SIZES[SEKTOR_SIZES.length - 1].tilesPerSide;
