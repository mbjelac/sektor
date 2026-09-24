// What the terrain of a sektor is drawn as. A square which is not plain ground carries a shape
// standing on it, described the same way a building is — but in terrain.md rather than
// buildings.md, as these are not buildings: the player neither puts them up nor takes them down.

import terrainMd from "../assets/terrain.md?raw";
import { parseBuildingDefinitions } from "./buildings/parseBuildingDefinitions";

// The one shape rock is drawn as for now. Every square of elevation on every map is this.
const ELEVATION_FEATURE_NAME = "Grassy rocky outcrop";

// What the panel calls a square of rock the player has clicked on.
export const ELEVATION_NAME = "Elevation";

export function elevationRenderingCode(): string {
  return terrainFeatures.find(feature => feature.name === ELEVATION_FEATURE_NAME)?.renderingCode ?? "";
}

const terrainFeatures = parseBuildingDefinitions(terrainMd.split("\n"));
