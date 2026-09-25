// What the terrain of a sektor is drawn as. A square which is not plain ground carries a shape
// standing on it, described the same way a building is — but in the terrain's own .sgl files rather
// than buildings.md, as these are not buildings: the player neither puts them up nor takes them down.
//
// A square of rock is drawn from four sides, one file for each of north, east, south and west. A
// side which looks out onto open ground is drawn as the edge of the rock; a side which runs into
// more rock is drawn as its middle, so that rock on neighbouring squares reads as one outcrop rather
// than as squares of rock standing next to each other.

import { ELEVATION } from "../../../shared/terrain";

// What the panel calls a square of rock the player has clicked on. Every outcrop goes by it,
// whichever shape it happens to stand in.
export const ELEVATION_NAME = "Elevation";

// Which way each side of a square of rock looks: out onto the edge of the rock, or into its middle.
export type ElevationSides = {
  north: ElevationSide,
  east: ElevationSide,
  south: ElevationSide,
  west: ElevationSide,
};

export type ElevationSide = "edge" | "middle";

// How the four sides of the rock at a square are drawn. A side runs into the middle of the rock
// when the square on that side is rock too. North is towards the first row of the map and west
// towards the first column; a square past the rim of the map is never rock.
export function elevationSides(terrain: number[][], x: number, y: number): ElevationSides {
  return {
    north: elevationSideTowards(terrain, x, y - 1),
    east: elevationSideTowards(terrain, x + 1, y),
    south: elevationSideTowards(terrain, x, y + 1),
    west: elevationSideTowards(terrain, x - 1, y),
  };
}

// Which shape the rock on a square stands in. Two outcrops side by side looking alike would read
// as one thing stamped twice, so the shape is taken from where the square lies: the same square of
// the same map always comes out the same, while its neighbours come out differently. Scrambling
// the square's place before it is counted down to a shape is what spreads the shapes about instead
// of laying them out in bands; 37 and 100 share no divisor, so no two squares of a map are
// scrambled to the same number and every shape is given exactly its share of the map.
export function elevationVariation(x: number, z: number): number {
  const placeOnMap = x * 10 + z;
  const scrambled = (placeOnMap * 37 + 11) % 100;
  return scrambled % ELEVATION_VARIATION_COUNT;
}

export function elevationRenderingCode(variation: number, sides: ElevationSides): string {
  return elevationSideFiles(variation, sides)
    .map(sideFile => (elevationSideRenderingCodes[`${ELEVATIONS_FOLDER}/${sideFile}`] ?? "").trim())
    .join("\n");
}

// The files the four sides of a square of rock are drawn from. Each side comes in as many shapes
// as the rock does, and all four are taken in the same shape, told by the number the file ends in.
export function elevationSideFiles(variation: number, sides: ElevationSides): string[] {
  return [
    `${sides.north}/n${variation}.sgl`,
    `${sides.east}/e${variation}.sgl`,
    `${sides.south}/s${variation}.sgl`,
    `${sides.west}/w${variation}.sgl`,
  ];
}

function elevationSideTowards(terrain: number[][], x: number, y: number): ElevationSide {
  return terrain[x]?.[y] === ELEVATION ? "middle" : "edge";
}

// How many shapes rock is drawn in: every side of it has a file for each of them.
const ELEVATION_VARIATION_COUNT = 10;

const ELEVATIONS_FOLDER = "../assets/terrain/grassland/elevations";

// The bodies of every side file of the rock, by the path it was read from.
const elevationSideRenderingCodes = import.meta.glob<string>(
  "../assets/terrain/grassland/elevations/*/*.sgl",
  { query: "?raw", import: "default", eager: true },
);
