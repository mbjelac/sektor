import buildingsMd from "../../assets/buildings.md?raw";
import testBuildingsMd from "../../assets/buildings.test.md?raw";
import { BuildingDefinition, parseBuildingDefinitions } from "./parseBuildingDefinitions";
import { isTestMode } from "../../testMode";

const source = isTestMode ? testBuildingsMd : buildingsMd;

export const buildingDefinitions: BuildingDefinition[] = parseBuildingDefinitions(source.split("\n"));
