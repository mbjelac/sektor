import { readFileSync } from "fs";
import { join } from "path";
import { parseBuildingDefinitions } from "../frontend/src/sektor/buildings/parseBuildingDefinitions";
import { localResourceNames, negativeScoringResourceNames, parseResources } from "../frontend/src/parseResources";

// The game reads these through Vite, which a plain script cannot do, so they are read off the disk
// here and handed to the very same parsers the game uses. Nothing about a resource or a building is
// restated in this folder: a harness which describes the rules in its own words ends up measuring
// its own description of the game rather than the game.
const assetDirectory = join(import.meta.dirname, "..", "frontend", "src", "assets");

function readAssetLines(fileName: string): string[] {
  return readFileSync(join(assetDirectory, fileName), "utf8").split("\n");
}

export const buildingDefinitions = parseBuildingDefinitions(readAssetLines("buildings.md"));

const resourceDefinitions = parseResources(readAssetLines("resources.md"));

export const localResources = localResourceNames(resourceDefinitions);

export const negativeScoringResources = negativeScoringResourceNames(resourceDefinitions);
