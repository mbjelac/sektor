// What the terrain of a sektor is drawn as. A square which is not plain ground carries a shape
// standing on it, described the same way a building is — but in terrain.md rather than
// buildings.md, as these are not buildings: the player neither puts them up nor takes them down.
//
// terrain.md holds a Render section for every shape a square of rock may take. They are told apart
// by nothing but the order they are written in, the first being the 0th, as one outcrop is no more
// of a kind than another.

import terrainMd from "../assets/terrain.md?raw";

// What the panel calls a square of rock the player has clicked on. Every outcrop goes by it,
// whichever shape it happens to stand in.
export const ELEVATION_NAME = "Elevation";

// Which shape the rock on a square stands in. Two outcrops side by side looking alike would read
// as one thing stamped twice, so the shape is taken from where the square lies: the same square of
// the same map always comes out the same, while its neighbours come out differently. Scrambling
// the square's place before it is counted down to a shape is what spreads the shapes about instead
// of laying them out in bands; 37 and 100 share no divisor, so no two squares of a map are
// scrambled to the same number and every shape is given exactly its share of the map.
export function elevationVariation(x: number, z: number): number {
  const placeOnMap = x * 10 + z;
  const scrambled = (placeOnMap * 37 + 11) % 100;
  return scrambled % ELEVATION_SHAPE_COUNT;
}

export function elevationRenderingCode(variation: number): string {
  return elevationRenderingCodes[variation % elevationRenderingCodes.length] ?? "";
}

// The fence a Render section's bodies are written between.
const CODE_FENCE = "```";

const elevationRenderingCodes = renderingCodesOf(terrainMd.split("\n"));

// How many shapes rock is drawn in, which is however many terrain.md describes.
const ELEVATION_SHAPE_COUNT = elevationRenderingCodes.length;

// Every Render section of terrain.md, in the order they are written. A section is the lines fenced
// off under its heading; everything outside a fence describes rather than draws.
function renderingCodesOf(markdownLines: string[]): string[] {
  const renderingCodes: string[] = [];
  let codeLines: string[] | null = null;
  let isUnderRenderHeading = false;

  for (const line of markdownLines) {
    if (line.match(/^##\s+Render/)) {
      isUnderRenderHeading = true;
      continue;
    }
    if (!isUnderRenderHeading) continue;

    if (line.trim() !== CODE_FENCE) {
      codeLines?.push(line);
      continue;
    }

    if (codeLines === null) {
      codeLines = [];
      continue;
    }

    renderingCodes.push(codeLines.join("\n"));
    codeLines = null;
    isUnderRenderHeading = false;
  }

  return renderingCodes;
}
