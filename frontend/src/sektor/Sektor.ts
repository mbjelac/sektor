
import { BuildingDefinition, BuildingFunction, ResourceThroughput } from "./buildings/parseBuildingDefinitions";
import { BuildingLocation, BuildingCreation, Building, RestrictionsRequirements, Location } from "../../../shared/sektorData";

export type { BuildingLocation, BuildingCreation, Building, RestrictionsRequirements, Location };

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

export interface BuildingFunctionState {
  buildingFunction: BuildingFunction;
  modifiedOutputs: ResourceThroughput[];
  capacity: number;
}

export interface BuildingState {
  buildingFunctions: BuildingFunctionState[];
}

export interface DestroyBuildingResult {
  success: boolean;
  error?: string;
}

export interface CreateBuildingResult {
  error: undefined | string;
  addedBuildings: Building[];
}

const SCORE_PER_UNIT = 2;
const SCORE_PER_REQUIRED_UNIT = 3;

const MINIMUM_CAPACITY = 0;
const MAXIMUM_CAPACITY = 1;
const CAPACITY_STEP = 0.1;
const INITIAL_CAPACITY = 0.1;

export class Sektor {
  private buildings: Building[] = [];
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

  getState(): { buildings: Building[] } {
    return {
      buildings: this.buildings.map(building => ({ ...building })),
    };
  }

  // Sektors saved before buildings had a capacity hold no capacity, and those saved before
  // each building function had its own capacity hold a single one for the whole building, so
  // their building functions start off at the capacity a newly created building gets.
  loadState(state: { buildings: Building[] }) {
    this.buildings = state.buildings.map(building => ({
      type: building.type,
      location: building.location,
      capacities: this.buildingCapacities(building),
    }));
  }

  getBuildingState(location: BuildingLocation): BuildingState | null {
    const building = this.findBuildingAt(location);
    if (!building) return null;
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return null;
    return {
      buildingFunctions: buildingDefinition.buildingFunctions.map((buildingFunction, functionIndex) => ({
        buildingFunction: buildingFunction,
        modifiedOutputs: this.getModifiedOutputs(buildingFunction, buildingDefinition, location),
        capacity: building.capacities[functionIndex],
      })),
    };
  }

  // All resources produced in the sektor are available to all its buildings, so a resource is
  // imported only for the amount by which the buildings' inputs exceed the buildings' outputs,
  // and exported only for the amount by which the outputs exceed the inputs.
  getSektorState(): SektorState {
    const totalInputs = this.aggregateThroughputs(
      this.buildings.map(building => this.getInputs(building)).flat()
    );
    const totalOutputs = this.aggregateThroughputs(
      this.buildings.map(building => this.getOutputs(building)).flat()
    );

    const imports = totalInputs.map(input => {
      const value = roundToOneDecimal(Math.max(0, input.value - this.findThroughputValue(totalOutputs, input.name)));
      return { name: input.name, value, score: this.scoreImport(input.name, value) };
    });
    const exports = totalOutputs.map(output => {
      const value = roundToOneDecimal(Math.max(0, output.value - this.findThroughputValue(totalInputs, output.name)));
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
    return Array.from(amountsByResource.entries()).map(([name, value]) => ({ name, value: roundToOneDecimal(value) }));
  }

  private scoreImport(resourceType: string, value: number): number {
    return roundToOneDecimal(this.applyNegativeScoring(resourceType, -value * SCORE_PER_UNIT));
  }

  // Exported units which fulfill an export requirement are worth more than the units above it.
  private scoreExport(resourceType: string, value: number): number {
    const requirement = this.restrictionsRequirements.exportRequirements.find(
      requirement => requirement.name === resourceType
    );
    const requiredValue = requirement ? Math.min(value, requirement.value) : 0;
    const valueAboveRequired = value - requiredValue;
    return roundToOneDecimal(this.applyNegativeScoring(
      resourceType,
      requiredValue * SCORE_PER_REQUIRED_UNIT + valueAboveRequired * SCORE_PER_UNIT
    ));
  }

  private applyNegativeScoring(resourceType: string, score: number): number {
    const signedScore = this.negativeScoringResources.includes(resourceType) ? -score : score;
    return signedScore === 0 ? 0 : signedScore;
  }

  doesBuildingNeedInput(location: BuildingLocation, resourceType: string): boolean {
    const building = this.findBuildingAt(location);
    if (!building) return false;
    return this.findThroughputValue(this.getInputs(building), resourceType) > 0;
  }

  doesBuildingHaveOutput(location: BuildingLocation, resourceType: string): boolean {
    const building = this.findBuildingAt(location);
    if (!building) return false;
    return this.findThroughputValue(this.getOutputs(building), resourceType) > 0;
  }

  private findThroughputValue(throughputs: ResourceThroughput[], resourceType: string): number {
    return throughputs.find(throughput => throughput.name === resourceType)?.value ?? 0;
  }

  // A building function describes its throughputs at full capacity, so the amounts it actually
  // consumes and produces are those scaled down by that function's own capacity. The scaled
  // amounts of all the building's functions are then added up per resource.
  private getInputs(building: Building): ResourceThroughput[] {
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return [];
    return this.aggregateThroughputs(
      buildingDefinition.buildingFunctions.map((buildingFunction, functionIndex) =>
        buildingFunction.inputs.map(input => applyCapacity(input, building.capacities[functionIndex]))
      ).flat()
    );
  }

  private getOutputs(building: Building): ResourceThroughput[] {
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return [];
    return this.aggregateThroughputs(
      buildingDefinition.buildingFunctions.map((buildingFunction, functionIndex) =>
        this.getModifiedOutputs(buildingFunction, buildingDefinition, building.location)
          .map(output => applyCapacity(output, building.capacities[functionIndex]))
      ).flat()
    );
  }

  private getModifiedOutputs(buildingFunction: BuildingFunction, buildingDefinition: BuildingDefinition, location: BuildingLocation): ResourceThroughput[] {
    const locationProperties = this.locations[location.x]?.[location.y]?.properties ?? {};
    return buildingFunction.outputs.map(output => {
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

    const createdBuilding = { ...building, capacities: this.buildingCapacities(building) };
    this.buildings.push(createdBuilding);

    return { error: undefined, addedBuildings: [createdBuilding] };
  }

  // Every function of a building runs at its own capacity, so a building holds one capacity
  // per function of its definition.
  private buildingCapacities(building: { type: string, capacities?: number[], capacity?: number }): number[] {
    const buildingFunctionCount = this.findBuildingDefinition(building.type)?.buildingFunctions.length ?? 0;
    return Array.from(
      { length: buildingFunctionCount },
      (_, functionIndex) => building.capacities?.[functionIndex] ?? building.capacity ?? INITIAL_CAPACITY
    );
  }

  destroyBuilding(location: BuildingLocation): DestroyBuildingResult {
    const building = this.findBuildingAt(location);
    if (!building) return { success: false, error: "buildingNotFound" };

    this.buildings = this.buildings.filter(
      existing => !(existing.location.x === location.x && existing.location.y === location.y)
    );

    return { success: true };
  }

  increaseBuildingCapacity(location: BuildingLocation, functionIndex: number, completely = false): number {
    return this.changeBuildingCapacity(location, functionIndex, capacity => completely ? MAXIMUM_CAPACITY : capacity + CAPACITY_STEP);
  }

  decreaseBuildingCapacity(location: BuildingLocation, functionIndex: number, completely = false): number {
    return this.changeBuildingCapacity(location, functionIndex, capacity => completely ? MINIMUM_CAPACITY : capacity - CAPACITY_STEP);
  }

  private changeBuildingCapacity(location: BuildingLocation, functionIndex: number, changeCapacity: (capacity: number) => number): number {
    const building = this.findBuildingAt(location);
    if (!building) throw new Error("buildingNotFound");
    const capacity = building.capacities[functionIndex];
    if (capacity === undefined) throw new Error("buildingFunctionNotFound");
    const changedCapacity = roundToOneDecimal(
      Math.min(MAXIMUM_CAPACITY, Math.max(MINIMUM_CAPACITY, changeCapacity(capacity)))
    );
    building.capacities[functionIndex] = changedCapacity;
    return changedCapacity;
  }

  private findBuildingDefinition(type: string): BuildingDefinition | undefined {
    return this.buildingDefinitions.find(definition => definition.name === type);
  }

  private findBuildingAt(location: BuildingLocation): Building | undefined {
    return this.buildings.find(building => building.location.x === location.x && building.location.y === location.y);
  }
}

function applyCapacity(throughput: ResourceThroughput, capacity: number): ResourceThroughput {
  return { name: throughput.name, value: roundToOneDecimal(throughput.value * capacity) };
}

// Capacities have a single decimal place, so every amount derived from one has a single decimal
// place too — rounding to it keeps the floating point noise out of the amounts and scores.
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
