
import { BuildingDefinition, BuildingFunction, ResourceThroughput } from "./buildings/parseBuildingDefinitions";
import { BuildingLocation, BuildingCreation, Building, Location } from "../../../shared/sektorData";
import { ELEVATION, SEA } from "../../../shared/terrain";

export type { BuildingLocation, BuildingCreation, Building, Location };

// Names one function of one building. The plan calls this a BuildingFunction, but that name is
// already taken by the function of a building definition, which carries no location.
export interface BuildingFunctionLocation {
  buildingLocation: BuildingLocation;
  functionIndex: number;
}

export interface SektorState {
  imports: ResourceThroughput[];
  exports: ResourceThroughput[];
  // How happy the sektor's people are: every unit of it the sektor makes. Hapiness is local, so
  // none of it leaves the sektor and none of it stands among the exports, but making it is what a
  // sektor's people are there for and so it counts all the same.
  hapiness: number;
  // How happy the sektor's people would be were every habitat given all it asks for: every unit of
  // Hapiness every function of every habitat could make.
  possibleHapiness: number;
  // What the sektor's habitats are going without, which is why their people are not as happy as
  // they could be.
  habitatShortages: string[];
  starvedFunctions: BuildingFunctionLocation[];
}

// The resource a sektor's people give off while they are content, which no other resource is
// treated like.
export const HAPINESS_RESOURCE = "Hapiness";

interface StarvationCandidate {
  buildingFunctionLocation: BuildingFunctionLocation;
  consumedAmount: number;
  distanceToNearestProducer: number;
}

export interface BuildingFunctionState {
  buildingFunction: BuildingFunction;
  outputAmounts: ResourceThroughput[];
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

export class Sektor {
  private buildings: Building[] = [];
  private readonly locations: Location[][];
  private readonly buildingDefinitions: BuildingDefinition[];
  private readonly localResources: string[];
  private readonly terrain: number[][];

  // A sektor handed no terrain is dry land the whole way across, which is what a sektor made
  // before there was any sea is.
  constructor(
    locations: Location[][],
    buildingDefinitions: BuildingDefinition[],
    localResources: string[],
    terrain: number[][] = [],
  ) {
    this.locations = locations;
    this.buildingDefinitions = buildingDefinitions;
    this.localResources = localResources;
    this.terrain = terrain;
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
        outputAmounts: this.getOutputAmounts(buildingFunction, location),
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
      return { name: input.name, value };
    });
    // A local resource cannot leave the sektor, so whatever is produced above what is consumed
    // is not an export of it, it is simply not made.
    const exports = totalOutputs
      .filter(output => !this.localResources.includes(output.name))
      .map(output => {
        const value = roundToOneDecimal(Math.max(0, output.value - this.findThroughputValue(totalInputs, output.name)));
        return { name: output.name, value };
      });

    return {
      imports,
      exports,
      hapiness: this.findThroughputValue(totalOutputs, HAPINESS_RESOURCE),
      possibleHapiness: this.findPossibleHapiness(),
      habitatShortages: this.findHabitatShortages(starvedFunctions),
      starvedFunctions,
    };
  }

  // Every habitat is counted as making all the Hapiness it is made to, whether it is given what it
  // asks for or not, so this is how happy the sektor's people would be with nothing going short.
  private findPossibleHapiness(): number {
    const possibleHapiness = this.buildings
      .map(building => this.findBuildingDefinition(building.type))
      .flatMap(buildingDefinition => buildingDefinition?.buildingFunctions ?? [])
      .flatMap(buildingFunction => buildingFunction.outputs)
      .filter(output => output.name === HAPINESS_RESOURCE)
      .reduce((total, output) => total + (output.value ?? 0), 0);
    return roundToOneDecimal(possibleHapiness);
  }

  // What the sektor's habitats are going without: every local resource asked for by a function of a
  // habitat which has been left starved. Only a local resource can leave anything starved, as
  // anything else short is simply brought in from outside.
  private findHabitatShortages(starvedFunctions: BuildingFunctionLocation[]): string[] {
    const shortages = new Set<string>();

    for (const starvedFunction of starvedFunctions) {
      const building = this.findBuildingAt(starvedFunction.buildingLocation);
      const buildingDefinition = building && this.findBuildingDefinition(building.type);
      if (!buildingDefinition || !isHabitat(buildingDefinition)) continue;

      const starvedInputs = buildingDefinition.buildingFunctions[starvedFunction.functionIndex].inputs;
      for (const input of starvedInputs) {
        if (this.localResources.includes(input.name)) shortages.add(input.name);
      }
    }

    return Array.from(shortages).sort((first, second) => first.localeCompare(second));
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

  // A local resource never travels far, so the functions closest to where it is made are the ones
  // which get it: the rest are starved, farthest first, enough of them to cover the shortage. A
  // function consuming more than is missing is still starved whole, since a function either runs
  // or it does not.
  private selectFunctionsToStarve(shortage: ResourceThroughput, starvedFunctions: BuildingFunctionLocation[]): BuildingFunctionLocation[] {
    const selectedFunctions: BuildingFunctionLocation[] = [];
    let selectedAmount = 0;
    for (const starvationCandidate of this.findStarvationCandidates(shortage, starvedFunctions)) {
      selectedFunctions.push(starvationCandidate.buildingFunctionLocation);
      selectedAmount = roundToOneDecimal(selectedAmount + starvationCandidate.consumedAmount);
      if (selectedAmount >= shortage.value) return selectedFunctions;
    }
    return selectedFunctions;
  }

  // Candidates equally far from the resource are starved in the order their buildings were built.
  // A building making the resource itself is as near to it as a building can be, and one in a
  // sektor which makes none of it is infinitely far from it.
  private findStarvationCandidates(shortage: ResourceThroughput, starvedFunctions: BuildingFunctionLocation[]): StarvationCandidate[] {
    const producerLocations = this.findProducerLocations(shortage.name, starvedFunctions);
    const starvationCandidates: StarvationCandidate[] = [];
    for (const building of this.buildings) {
      const buildingDefinition = this.findBuildingDefinition(building.type);
      if (!buildingDefinition) continue;
      const functionActivations = this.getFunctionActivations(building, buildingDefinition);
      for (const [functionIndex, buildingFunction] of buildingDefinition.buildingFunctions.entries()) {
        if (!functionActivations[functionIndex]) continue;
        if (isFunctionStarved(starvedFunctions, building.location, functionIndex)) continue;
        const consumedAmount = this.findThroughputValue(buildingFunction.inputs, shortage.name);
        if (consumedAmount <= 0) continue;
        starvationCandidates.push({
          buildingFunctionLocation: { buildingLocation: building.location, functionIndex },
          consumedAmount,
          distanceToNearestProducer: findDistanceToNearestLocation(building.location, producerLocations),
        });
      }
    }
    return starvationCandidates.sort(
      (firstCandidate, secondCandidate) => secondCandidate.distanceToNearestProducer - firstCandidate.distanceToNearestProducer
    );
  }

  private findProducerLocations(resourceType: string, starvedFunctions: BuildingFunctionLocation[]): BuildingLocation[] {
    return this.buildings
      .filter(building => this.findThroughputValue(this.getOutputs(building, starvedFunctions), resourceType) > 0)
      .map(building => building.location);
  }

  private aggregateThroughputs(throughputs: ResourceThroughput[]): ResourceThroughput[] {
    const amountsByResource = new Map<string, number>();
    for (const throughput of throughputs) {
      amountsByResource.set(throughput.name, (amountsByResource.get(throughput.name) ?? 0) + throughput.value);
    }
    return Array.from(amountsByResource.entries()).map(([name, value]) => ({ name, value: roundToOneDecimal(value) }));
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
        this.getOutputAmounts(buildingFunction, building.location)
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

  // An output naming a location property is produced in the amount the building's own location
  // has of that property, and a location which has nothing of it makes the building produce
  // nothing, never a negative amount.
  private getOutputAmounts(buildingFunction: BuildingFunction, location: BuildingLocation): ResourceThroughput[] {
    const locationProperties = this.locations[location.x]?.[location.y]?.properties ?? {};
    return buildingFunction.outputs.map(output => ({
      name: output.name,
      value: output.locationProperty !== undefined
        ? Math.max(0, locationProperties[output.locationProperty] ?? 0)
        : output.value ?? 0,
    }));
  }

  createBuilding(building: BuildingCreation): CreateBuildingResult {
    if (this.isSea(building.location)) {
      return { error: "notDryEnough", addedBuildings: [] };
    }

    if (this.isElevation(building.location)) {
      return { error: "notFlatEnough", addedBuildings: [] };
    }

    if (this.findBuildingAt(building.location)) {
      return { error: "locationOccupied", addedBuildings: [] };
    }

    const createdBuilding = { ...building };
    this.buildings.push(createdBuilding);

    return { error: undefined, addedBuildings: [createdBuilding] };
  }

  destroyBuilding(location: BuildingLocation): DestroyBuildingResult {
    // Rock was there before the player and stays after them: the destruction tool has nothing to
    // say to it.
    if (this.isElevation(location)) return { success: false, error: "canNotDestroyElevations" };

    const building = this.findBuildingAt(location);
    if (!building) return { success: false, error: "locationEmpty" };

    this.buildings = this.buildings.filter(
      existing => !(existing.location.x === location.x && existing.location.y === location.y)
    );

    return { success: true };
  }

  // Nothing stands in open water, so a square of sea is not a square to build on.
  private isSea(location: BuildingLocation): boolean {
    return this.terrain[location.x]?.[location.y] === SEA;
  }

  // Rock is no ground to build on either, and unlike the sea it is not going anywhere: a square of
  // it is a square the player builds around for good.
  private isElevation(location: BuildingLocation): boolean {
    return this.terrain[location.x]?.[location.y] === ELEVATION;
  }

  private findBuildingDefinition(type: string): BuildingDefinition | undefined {
    return this.buildingDefinitions.find(definition => definition.name === type);
  }

  private findBuildingAt(location: BuildingLocation): Building | undefined {
    return this.buildings.find(building => building.location.x === location.x && building.location.y === location.y);
  }
}

// Distances are only ever compared with each other, so the square root of the pythagorean
// distance is left out.
function findDistanceToNearestLocation(location: BuildingLocation, otherLocations: BuildingLocation[]): number {
  return otherLocations
    .map(otherLocation => (location.x - otherLocation.x) ** 2 + (location.y - otherLocation.y) ** 2)
    .reduce((nearestDistance, distance) => Math.min(nearestDistance, distance), Number.POSITIVE_INFINITY);
}

function isFunctionStarved(starvedFunctions: BuildingFunctionLocation[], location: BuildingLocation, functionIndex: number): boolean {
  return starvedFunctions.some(starvedFunction =>
    starvedFunction.buildingLocation.x === location.x
    && starvedFunction.buildingLocation.y === location.y
    && starvedFunction.functionIndex === functionIndex
  );
}

// A habitat is any building made to give off Hapiness, whatever it is called and whether or not it
// is giving off any at the moment.
function isHabitat(buildingDefinition: BuildingDefinition): boolean {
  return buildingDefinition.buildingFunctions.some(buildingFunction =>
    buildingFunction.outputs.some(output => output.name === HAPINESS_RESOURCE));
}

// Amounts are written with a single decimal place, so rounding to it keeps the floating point
// noise out of the amounts and scores added up from them.
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
