
import { BuildingDefinition, BuildingFunction, ResourceThroughput } from "./buildings/parseBuildingDefinitions";
import { BuildingLocation, BuildingCreation, RestrictionsRequirements, Location } from "../../../shared/sektorData";

export type { BuildingLocation, BuildingCreation, RestrictionsRequirements, Location };

export type SektorStatus = "InProgress" | "Done" | "RestrictionsExceeded";

export interface ScoredThroughput extends ResourceThroughput {
  score: number;
}

export interface SektorState {
  imports: ScoredThroughput[];
  exports: ScoredThroughput[];
  status: SektorStatus;
  importRestrictions: ResourceThroughput[];
  exportRequirements: ResourceThroughput[];
}

export interface BuildingState {
  buildingFunction: BuildingFunction;
  modifiedOutputs: ResourceThroughput[];
}

export interface DestroyBuildingResult {
  success: boolean;
  error?: string;
}

export interface CreateBuildingResult {
  error: undefined | string;
  addedBuildings: BuildingCreation[];
}

const SCORE_PER_UNIT = 2;
const SCORE_PER_REQUIRED_UNIT = 3;

export class Sektor {
  private buildings: BuildingCreation[] = [];
  private readonly locations: Location[][];
  private readonly buildingDefinitions: BuildingDefinition[];
  private readonly restrictionsRequirements: RestrictionsRequirements;
  private readonly negativeScoringResources: string[];

  constructor(
    locations: Location[][],
    buildingDefinitions: BuildingDefinition[],
    restrictionsRequirements: RestrictionsRequirements,
    negativeScoringResources: string[],
  ) {
    this.locations = locations;
    this.buildingDefinitions = buildingDefinitions;
    this.restrictionsRequirements = restrictionsRequirements;
    this.negativeScoringResources = negativeScoringResources;
  }

  getLocations(): Location[][] {
    return this.locations;
  }

  getState(): { buildings: BuildingCreation[] } {
    return {
      buildings: this.buildings.map(building => ({ ...building })),
    };
  }

  loadState(state: { buildings: BuildingCreation[] }) {
    this.buildings = state.buildings;
  }

  getBuildingState(location: BuildingLocation): BuildingState | null {
    const building = this.findBuildingAt(location);
    if (!building) return null;
    const buildingDefinition = this.buildingDefinitions.find(definition => definition.name === building.type);
    if (!buildingDefinition) return null;
    return {
      buildingFunction: buildingDefinition.buildingFunction,
      modifiedOutputs: this.getOutputs(building.type, location),
    };
  }

  // All resources produced in the sektor are available to all its buildings, so a resource is
  // imported only for the amount by which the buildings' inputs exceed the buildings' outputs,
  // and exported only for the amount by which the outputs exceed the inputs.
  getSektorState(): SektorState {
    const totalInputs = this.aggregateThroughputs(
      this.buildings.map(building => this.getInputs(building.type)).flat()
    );
    const totalOutputs = this.aggregateThroughputs(
      this.buildings.map(building => this.getOutputs(building.type, building.location)).flat()
    );

    const imports = totalInputs.map(input => {
      const value = Math.max(0, input.value - this.findThroughputValue(totalOutputs, input.name));
      return { name: input.name, value, score: this.scoreImport(input.name, value) };
    });
    const exports = totalOutputs.map(output => {
      const value = Math.max(0, output.value - this.findThroughputValue(totalInputs, output.name));
      return { name: output.name, value, score: this.scoreExport(output.name, value) };
    });

    const { importRestrictions, exportRequirements } = this.restrictionsRequirements;

    const restrictionsExceeded = importRestrictions.some(restriction => {
      const importEntry = imports.find(entry => entry.name === restriction.name);
      return importEntry !== undefined && importEntry.value > restriction.value;
    });

    const requirementsMet = exportRequirements.every(requirement => {
      const exportEntry = exports.find(entry => entry.name === requirement.name);
      return exportEntry !== undefined && exportEntry.value >= requirement.value;
    });

    const status = restrictionsExceeded ? "RestrictionsExceeded" : requirementsMet ? "Done" : "InProgress";

    return { imports, exports, status, importRestrictions, exportRequirements };
  }

  private aggregateThroughputs(throughputs: ResourceThroughput[]): ResourceThroughput[] {
    const amountsByResource = new Map<string, number>();
    for (const throughput of throughputs) {
      amountsByResource.set(throughput.name, (amountsByResource.get(throughput.name) ?? 0) + throughput.value);
    }
    return Array.from(amountsByResource.entries()).map(([name, value]) => ({ name, value }));
  }

  private scoreImport(resourceType: string, value: number): number {
    return this.applyNegativeScoring(resourceType, -value * SCORE_PER_UNIT);
  }

  // Exported units which fulfill an export requirement are worth more than the units above it.
  private scoreExport(resourceType: string, value: number): number {
    const requirement = this.restrictionsRequirements.exportRequirements.find(
      requirement => requirement.name === resourceType
    );
    const requiredValue = requirement ? Math.min(value, requirement.value) : 0;
    const valueAboveRequired = value - requiredValue;
    return this.applyNegativeScoring(
      resourceType,
      requiredValue * SCORE_PER_REQUIRED_UNIT + valueAboveRequired * SCORE_PER_UNIT
    );
  }

  private applyNegativeScoring(resourceType: string, score: number): number {
    const signedScore = this.negativeScoringResources.includes(resourceType) ? -score : score;
    return signedScore === 0 ? 0 : signedScore;
  }

  doesBuildingNeedInput(location: BuildingLocation, resourceType: string): boolean {
    const building = this.findBuildingAt(location);
    if (!building) return false;
    return this.findThroughputValue(this.getInputs(building.type), resourceType) > 0;
  }

  doesBuildingHaveOutput(location: BuildingLocation, resourceType: string): boolean {
    const building = this.findBuildingAt(location);
    if (!building) return false;
    return this.findThroughputValue(this.getOutputs(building.type, location), resourceType) > 0;
  }

  private findThroughputValue(throughputs: ResourceThroughput[], resourceType: string): number {
    return throughputs.find(throughput => throughput.name === resourceType)?.value ?? 0;
  }

  private getInputs(type: string): ResourceThroughput[] {
    const buildingDefinition = this.buildingDefinitions.find(definition => definition.name === type);
    return buildingDefinition?.buildingFunction?.inputs ?? [];
  }

  private getOutputs(type: string, location: BuildingLocation): ResourceThroughput[] {
    const buildingDefinition = this.buildingDefinitions.find(definition => definition.name === type);
    if (!buildingDefinition) return [];
    const locationProperties = this.locations[location.x]?.[location.y]?.properties ?? {};
    return (buildingDefinition.buildingFunction?.outputs ?? []).map(output => {
      const outputModifier = buildingDefinition.outputModifiers.find(modifier => modifier.resource === output.name);
      const propertyValue = outputModifier ? (locationProperties[outputModifier.property] ?? 0) : 0;
      return {
        name: output.name,
        value: outputModifier ? Math.max(0, output.value + propertyValue) : output.value,
      };
    });
  }

  createBuilding(building: BuildingCreation): CreateBuildingResult {
    if (this.findBuildingAt(building.location)) {
      return { error: "locationOccupied", addedBuildings: [] };
    }

    this.buildings.push(building);

    return { error: undefined, addedBuildings: [building] };
  }

  destroyBuilding(location: BuildingLocation): DestroyBuildingResult {
    const building = this.findBuildingAt(location);
    if (!building) return { success: false, error: "buildingNotFound" };

    this.buildings = this.buildings.filter(
      existing => !(existing.location.x === location.x && existing.location.y === location.y)
    );

    return { success: true };
  }

  private findBuildingAt(location: BuildingLocation): BuildingCreation | undefined {
    return this.buildings.find(building => building.location.x === location.x && building.location.y === location.y);
  }
}
