
import { BuildingDefinition, BuildingFunction, ResourceThroughput } from "./buildings/parseBuildingDefinitions";
import { BuildingLocation, BuildingCreation, Building, RestrictionsRequirements, Location } from "../../../shared/sektorData";

export type { BuildingLocation, BuildingCreation, Building, RestrictionsRequirements, Location };

export type SektorStatus = "InProgress" | "Done" | "RestrictionsExceeded";

export interface ScoredThroughput extends ResourceThroughput {
  score: number;
}

// Names one function of one building. The plan calls this a BuildingFunction, but that name is
// already taken by the function of a building definition, which carries no location.
export interface BuildingFunctionLocation {
  buildingLocation: BuildingLocation;
  functionIndex: number;
}

export interface SektorState {
  imports: ScoredThroughput[];
  exports: ScoredThroughput[];
  status: SektorStatus;
  importRestrictions: ResourceThroughput[];
  exportRequirements: ResourceThroughput[];
  starvedFunctions: BuildingFunctionLocation[];
}

export interface BuildingFunctionState {
  buildingFunction: BuildingFunction;
  modifiedOutputs: ResourceThroughput[];
  active: boolean;
  starved: boolean;
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

export class Sektor {
  private buildings: Building[] = [];
  private readonly locations: Location[][];
  private readonly buildingDefinitions: BuildingDefinition[];
  private readonly restrictionsRequirements: RestrictionsRequirements;
  private readonly negativeScoringResources: string[];
  private readonly localResources: string[];

  constructor(
    locations: Location[][],
    buildingDefinitions: BuildingDefinition[],
    restrictionsRequirements: RestrictionsRequirements,
    negativeScoringResources: string[],
    localResources: string[],
  ) {
    this.locations = locations;
    this.buildingDefinitions = buildingDefinitions;
    this.restrictionsRequirements = restrictionsRequirements;
    this.negativeScoringResources = negativeScoringResources;
    this.localResources = localResources;
  }

  getLocations(): Location[][] {
    return this.locations;
  }

  getState(): { buildings: Building[] } {
    return {
      buildings: this.buildings.map(building => building.activeFunctions
        ? { ...building, activeFunctions: [...building.activeFunctions] }
        : { ...building }),
    };
  }

  loadState(state: { buildings: Building[] }) {
    this.buildings = state.buildings.map(building => building.activeFunctions
      ? {
        type: building.type,
        location: building.location,
        activeFunctions: [...building.activeFunctions],
      }
      : {
        type: building.type,
        location: building.location,
      });
  }

  getBuildingState(location: BuildingLocation): BuildingState | null {
    const building = this.findBuildingAt(location);
    if (!building) return null;
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return null;
    const functionActivations = this.getFunctionActivations(building, buildingDefinition);
    const starvedFunctions = this.findStarvedFunctions();
    return {
      buildingFunctions: buildingDefinition.buildingFunctions.map((buildingFunction, functionIndex) => ({
        buildingFunction: buildingFunction,
        modifiedOutputs: this.getModifiedOutputs(buildingFunction, buildingDefinition, location),
        active: functionActivations[functionIndex],
        starved: isFunctionStarved(starvedFunctions, location, functionIndex),
      })),
    };
  }

  activateFunction(buildingLocation: BuildingLocation, functionIndex: number) {
    this.setFunctionActivation(buildingLocation, functionIndex, true);
  }

  deactivateFunction(buildingLocation: BuildingLocation, functionIndex: number) {
    this.setFunctionActivation(buildingLocation, functionIndex, false);
  }

  // The single function of a building which has only one cannot be turned off, so the building
  // always does something. Neither can a function the building always does.
  private setFunctionActivation(buildingLocation: BuildingLocation, functionIndex: number, active: boolean) {
    const building = this.findBuildingAt(buildingLocation);
    if (!building) return;
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return;
    if (buildingDefinition.buildingFunctions.length < 2) return;
    if (functionIndex < 0 || functionIndex >= buildingDefinition.buildingFunctions.length) return;
    if (buildingDefinition.buildingFunctions[functionIndex].alwaysActive) return;
    const functionActivations = this.getFunctionActivations(building, buildingDefinition);
    functionActivations[functionIndex] = active;
    building.activeFunctions = functionActivations;
  }

  // All resources produced in the sektor are available to all its buildings, so a resource is
  // imported only for the amount by which the buildings' inputs exceed the buildings' outputs,
  // and exported only for the amount by which the outputs exceed the inputs.
  getSektorState(): SektorState {
    const starvedFunctions = this.findStarvedFunctions();
    const totalInputs = this.aggregateThroughputs(
      this.buildings.map(building => this.getInputs(building, starvedFunctions)).flat()
    );
    const totalOutputs = this.aggregateThroughputs(
      this.buildings.map(building => this.getOutputs(building, starvedFunctions)).flat()
    );

    const imports = totalInputs.map(input => {
      const value = roundToOneDecimal(Math.max(0, input.value - this.findThroughputValue(totalOutputs, input.name)));
      return { name: input.name, value, score: this.scoreImport(input.name, value) };
    });
    // A local resource cannot leave the sektor, so whatever is produced above what is consumed
    // is not an export of it, it is simply not made.
    const exports = totalOutputs
      .filter(output => !this.localResources.includes(output.name))
      .map(output => {
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

    return { imports, exports, status, importRestrictions, exportRequirements, starvedFunctions };
  }

  // A local resource cannot be imported, so buildings needing more of it than the sektor makes
  // go without: functions consuming it are starved until the shortage is gone. Starving a
  // function also takes away what it produced, which can starve others in turn, so the sektor is
  // recalculated until no shortage is left.
  private findStarvedFunctions(): BuildingFunctionLocation[] {
    const starvedFunctions: BuildingFunctionLocation[] = [];
    for (;;) {
      const shortage = this.findLocalResourceShortage(starvedFunctions);
      if (!shortage) return starvedFunctions;
      const newlyStarvedFunctions = this.selectFunctionsToStarve(shortage, starvedFunctions);
      if (newlyStarvedFunctions.length === 0) return starvedFunctions;
      starvedFunctions.push(...newlyStarvedFunctions);
    }
  }

  private findLocalResourceShortage(starvedFunctions: BuildingFunctionLocation[]): ResourceThroughput | undefined {
    const totalInputs = this.aggregateThroughputs(
      this.buildings.map(building => this.getInputs(building, starvedFunctions)).flat()
    );
    const totalOutputs = this.aggregateThroughputs(
      this.buildings.map(building => this.getOutputs(building, starvedFunctions)).flat()
    );
    return totalInputs
      .filter(input => this.localResources.includes(input.name))
      .map(input => ({
        name: input.name,
        value: roundToOneDecimal(input.value - this.findThroughputValue(totalOutputs, input.name)),
      }))
      .find(shortage => shortage.value > 0);
  }

  // Functions are starved in the order their buildings were built, enough of them to cover the
  // shortage. A function consuming more than is missing is still starved whole, since a function
  // either runs or it does not.
  private selectFunctionsToStarve(shortage: ResourceThroughput, starvedFunctions: BuildingFunctionLocation[]): BuildingFunctionLocation[] {
    const selectedFunctions: BuildingFunctionLocation[] = [];
    let selectedAmount = 0;
    for (const building of this.buildings) {
      const buildingDefinition = this.findBuildingDefinition(building.type);
      if (!buildingDefinition) continue;
      const functionActivations = this.getFunctionActivations(building, buildingDefinition);
      for (const [functionIndex, buildingFunction] of buildingDefinition.buildingFunctions.entries()) {
        if (!functionActivations[functionIndex]) continue;
        if (isFunctionStarved(starvedFunctions, building.location, functionIndex)) continue;
        const consumedAmount = this.findThroughputValue(buildingFunction.inputs, shortage.name);
        if (consumedAmount <= 0) continue;
        selectedFunctions.push({ buildingLocation: building.location, functionIndex });
        selectedAmount = roundToOneDecimal(selectedAmount + consumedAmount);
        if (selectedAmount >= shortage.value) return selectedFunctions;
      }
    }
    return selectedFunctions;
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
    return this.findThroughputValue(this.getInputs(building, []), resourceType) > 0;
  }

  doesBuildingHaveOutput(location: BuildingLocation, resourceType: string): boolean {
    const building = this.findBuildingAt(location);
    if (!building) return false;
    return this.findThroughputValue(this.getOutputs(building, []), resourceType) > 0;
  }

  private findThroughputValue(throughputs: ResourceThroughput[], resourceType: string): number {
    return throughputs.find(throughput => throughput.name === resourceType)?.value ?? 0;
  }

  // The amounts consumed and produced by all of the building's functions are added up per
  // resource.
  private getInputs(building: Building, starvedFunctions: BuildingFunctionLocation[]): ResourceThroughput[] {
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return [];
    return this.aggregateThroughputs(
      this.getRunningBuildingFunctions(building, buildingDefinition, starvedFunctions)
        .map(buildingFunction => buildingFunction.inputs).flat()
    );
  }

  private getOutputs(building: Building, starvedFunctions: BuildingFunctionLocation[]): ResourceThroughput[] {
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return [];
    return this.aggregateThroughputs(
      this.getRunningBuildingFunctions(building, buildingDefinition, starvedFunctions).map(buildingFunction =>
        this.getModifiedOutputs(buildingFunction, buildingDefinition, building.location)
      ).flat()
    );
  }

  // A function which is turned off, or starved of a local resource, consumes and produces
  // nothing, so it is left out of every amount the building contributes to the sektor.
  private getRunningBuildingFunctions(building: Building, buildingDefinition: BuildingDefinition, starvedFunctions: BuildingFunctionLocation[]): BuildingFunction[] {
    const functionActivations = this.getFunctionActivations(building, buildingDefinition);
    return buildingDefinition.buildingFunctions.filter((_, functionIndex) =>
      functionActivations[functionIndex] && !isFunctionStarved(starvedFunctions, building.location, functionIndex)
    );
  }

  // A building with a single function is always doing it, while a building with several of them
  // starts out doing only the first one, until the player activates the others. A function the
  // building always does runs whichever one it is and whatever the player has switched.
  private getFunctionActivations(building: Building, buildingDefinition: BuildingDefinition): boolean[] {
    const buildingFunctionCount = buildingDefinition.buildingFunctions.length;
    if (buildingFunctionCount < 2) return buildingDefinition.buildingFunctions.map(() => true);
    return buildingDefinition.buildingFunctions.map((buildingFunction, functionIndex) =>
      buildingFunction.alwaysActive === true
      || (building.activeFunctions?.[functionIndex] ?? functionIndex === 0)
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

    const createdBuilding = { ...building };
    this.buildings.push(createdBuilding);

    return { error: undefined, addedBuildings: [createdBuilding] };
  }

  destroyBuilding(location: BuildingLocation): DestroyBuildingResult {
    const building = this.findBuildingAt(location);
    if (!building) return { success: false, error: "locationEmpty" };

    this.buildings = this.buildings.filter(
      existing => !(existing.location.x === location.x && existing.location.y === location.y)
    );

    return { success: true };
  }

  private findBuildingDefinition(type: string): BuildingDefinition | undefined {
    return this.buildingDefinitions.find(definition => definition.name === type);
  }

  private findBuildingAt(location: BuildingLocation): Building | undefined {
    return this.buildings.find(building => building.location.x === location.x && building.location.y === location.y);
  }
}

function isFunctionStarved(starvedFunctions: BuildingFunctionLocation[], location: BuildingLocation, functionIndex: number): boolean {
  return starvedFunctions.some(starvedFunction =>
    starvedFunction.buildingLocation.x === location.x
    && starvedFunction.buildingLocation.y === location.y
    && starvedFunction.functionIndex === functionIndex
  );
}

// Amounts are written with a single decimal place, so rounding to it keeps the floating point
// noise out of the amounts and scores added up from them.
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
