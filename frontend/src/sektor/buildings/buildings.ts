import buildingsMd from "../../assets/buildings.md?raw";
import testBuildingsMd from "../../assets/buildings.test.md?raw";
import { BuildingDefinition, parseBuildingDefinitions } from "./parseBuildingDefinitions";
import { isTestMode } from "../../testMode";
import { FOREST_DEFINITION } from "../forest";

const source = isTestMode ? testBuildingsMd : buildingsMd;

// The buildings a player can put up, which are the ones the toolbar offers.
export const buildingDefinitions: BuildingDefinition[] = parseBuildingDefinitions(source.split("\n"));

// Every building a sektor can hold: those the player puts up, and the forests which were there first.
export const everyBuildingDefinition: BuildingDefinition[] = [...buildingDefinitions, FOREST_DEFINITION];
