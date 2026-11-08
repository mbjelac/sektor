import { BuildingDefinition, ResourceThroughput } from "../sektor/buildings/parseBuildingDefinitions";

// One resource a building function makes, how much of it, and what the function takes in to make it.
export interface ResourceProduction {
  outputName: string;
  outputAmount: number;
  inputs: ResourceThroughput[];
}

// Every resource every building function makes. An output drawn from the ground the building stands
// on comes in whatever amount the ground gives, and is counted as one.
export function resourceProductions(buildingDefinitions: BuildingDefinition[]): ResourceProduction[] {
  return buildingDefinitions.flatMap(buildingDefinition =>
    buildingDefinition.buildingFunctions.flatMap(buildingFunction =>
      buildingFunction.outputs.map(output => ({
        outputName: output.name,
        outputAmount: output.value ?? 1,
        inputs: buildingFunction.inputs,
      }))
    )
  );
}
