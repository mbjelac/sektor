import { Mandate, MandateCriterion } from "./mandates.api";
import { BuildingDefinition } from "../sektor/buildings/parseBuildingDefinitions";
import { HAPINESS_RESOURCE } from "../sektor/Sektor";

// A mandate waiting to be claimed which asks for something no building available to the player can
// make is one they cannot complete, so they are not shown it.
export function withoutUnproducibleMandates(mandates: Mandate[], availableBuildings: BuildingDefinition[]): Mandate[] {
  return mandates.filter(mandate => mandate.criteria.every(criterion => canBeServed(criterion, availableBuildings)));
}

// A resource is sent out only if some building makes it, and a resource which does harm is taken in
// only if some building uses it up. People are housed, and Hapiness made, only by habitats, which are
// the buildings giving off Hapiness. Whatever asks for at most so much can always be done by building
// less, so it is never left out.
function canBeServed(criterion: MandateCriterion, availableBuildings: BuildingDefinition[]): boolean {
  switch (criterion.type) {
    case "minimumExport": return isOutputOfAny(criterion.resourceName, availableBuildings);
    case "minimumImport": return isInputOfAny(criterion.resourceName, availableBuildings);
    case "minimumPopulation":
    case "minimumHapiness": return isOutputOfAny(HAPINESS_RESOURCE, availableBuildings);
    default: return true;
  }
}

function isOutputOfAny(resourceName: string, buildings: BuildingDefinition[]): boolean {
  return buildings.some(building => building.buildingFunctions.some(buildingFunction =>
    buildingFunction.outputs.some(output => output.name === resourceName)));
}

function isInputOfAny(resourceName: string, buildings: BuildingDefinition[]): boolean {
  return buildings.some(building => building.buildingFunctions.some(buildingFunction =>
    buildingFunction.inputs.some(input => input.name === resourceName)));
}
