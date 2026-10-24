import buildingsMd from "../../assets/buildings.md?raw";
import testBuildingsMd from "../../assets/buildings.test.md?raw";
import { BuildingDefinition, BuildingRenderingFiles, parseBuildingDefinitions } from "./parseBuildingDefinitions";
import { isTestMode } from "../../testMode";
import { FOREST_DEFINITION } from "../forest";

const source = isTestMode ? testBuildingsMd : buildingsMd;

const BUILDINGS_FOLDER = isTestMode ? "../../assets/buildings.test" : "../../assets/buildings";

// The SGL files of every building, and of every building the tests put up, by the path they were read from.
const renderingFilesByImportPath = import.meta.glob<string>(
  ["../../assets/buildings/*/*.sgl", "../../assets/buildings.test/*/*.sgl"],
  { query: "?raw", import: "default", eager: true },
);

// The buildings a player can put up, which are the ones the toolbar offers.
export const buildingDefinitions: BuildingDefinition[] = parseBuildingDefinitions(source.split("\n"), buildingRenderingFiles());

// Every building a sektor can hold: those the player puts up, and the forests which were there first.
export const everyBuildingDefinition: BuildingDefinition[] = [...buildingDefinitions, FOREST_DEFINITION];

// The SGL files of every building, by their path within the buildings folder.
function buildingRenderingFiles(): BuildingRenderingFiles {
  return Object.fromEntries(
    Object.entries(renderingFilesByImportPath)
      .filter(([importPath]) => importPath.startsWith(`${BUILDINGS_FOLDER}/`))
      .map(([importPath, renderingCode]) => [importPath.slice(BUILDINGS_FOLDER.length + 1), renderingCode]),
  );
}
