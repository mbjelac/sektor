import { BuildingDefinition } from "./parseBuildingDefinitions";
import { buildingDefinitions } from "./buildings";
import { isUnlockedFor } from "./mandatesNeeded";
import { getMandates } from "../../mandates/mandates.api";
import { mandateCounts } from "../../mandates/mandateCounts";

// The buildings a player can put up: those they have completed enough mandates for.
export function getAvailableBuildings(playerName: string | null): BuildingDefinition[] {
  const completedMandateCount = mandateCounts(getMandates(), playerName).complete;
  return buildingDefinitions.filter(building => isUnlockedFor(building, completedMandateCount));
}
