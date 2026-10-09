
import { BuildingDefinition, BuildingFunction, BuildingFunctionOutput, ResourceThroughput } from "./buildings/parseBuildingDefinitions";
import { BuildingLocation, BuildingCreation, Building, CycleRoad, Location } from "../../../shared/sektorData";
import { ELEVATION, isRiver, SEA } from "../../../shared/terrain";
import {
  MOST_POLLUTION,
  POLLUTION_PROPERTY,
  isAffectedByPollution,
  isOutputAffectedByPollution,
  pollutedLocationProperties,
  pollutedOutputAmount,
} from "./pollution";
import { ECOSYSTEM_SUPPORT_RESOURCE } from "./forest";

export type { BuildingLocation, BuildingCreation, Building, CycleRoad, Location };

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
  // How much the sektor supports its ecosystem: all of the support it makes, less what it uses up.
  // It is counted whether or not the support can leave the sektor.
  ecosystemSupport: number;
  // What the sektor's habitats are going without, which is why their people are not as happy as
  // they could be.
  habitatShortages: string[];
  starvedFunctions: BuildingFunctionLocation[];
  // Buildings standing idle because the sektor cannot ship in and out all it would take to run
  // them.
  disabledBuildings: BuildingLocation[];
}

// The resource a sektor's people give off while they are content, which no other resource is
// treated like.
export const HAPINESS_RESOURCE = "Hapiness";

// The resource an inter-city transport hub makes: every unit of it is a unit of imports or exports
// the sektor can ship in or out.
export const IMPORT_EXPORT_RESOURCE = "ImportExport";

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
  disabled: boolean;
}

export interface DestroyBuildingResult {
  success: boolean;
  error?: string;
}

export interface CreateBuildingResult {
  error: undefined | string;
  addedBuildings: Building[];
}

export interface CreateCycleRoadResult {
  error: undefined | string;
}

// How much more polluted a location is for every square nearer a polluting building it lies.
const POLLUTION_STEP = 20;

export class Sektor {
  private buildings: Building[] = [];
  private cycleRoads: CycleRoad[] = [];
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

  getState(): { buildings: Building[], cycleRoads: CycleRoad[] } {
    return {
      buildings: this.buildings.map(building => building.activeFunctions
        ? { ...building, activeFunctions: [...building.activeFunctions] }
        : { ...building }),
      cycleRoads: this.cycleRoads.map(cycleRoad => [{ ...cycleRoad[0] }, { ...cycleRoad[1] }]),
    };
  }

  // A sektor saved before there were any cycle roads has none to load.
  loadState(state: { buildings: Building[], cycleRoads?: CycleRoad[] }) {
    this.cycleRoads = (state.cycleRoads ?? []).map(cycleRoad => [{ ...cycleRoad[0] }, { ...cycleRoad[1] }]);
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
    const disabledBuildings = this.findDisabledBuildings();
    const starvedFunctions = this.findStarvedFunctions(this.findFunctionsOfBuildings(disabledBuildings));
    return {
      buildingFunctions: buildingDefinition.buildingFunctions.map((buildingFunction, functionIndex) => ({
        buildingFunction: buildingFunction,
        outputAmounts: this.getOutputAmounts(buildingFunction, location),
        active: functionActivations[functionIndex],
        starved: includesFunction(starvedFunctions, location, functionIndex),
      })),
      disabled: includesLocation(disabledBuildings, location),
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
    const disabledBuildings = this.findDisabledBuildings();
    const disabledFunctions = this.findFunctionsOfBuildings(disabledBuildings);
    const starvedFunctions = this.findStarvedFunctions(disabledFunctions);
    const { totalInputs, totalOutputs } = this.aggregateSektorThroughputs([...disabledFunctions, ...starvedFunctions]);
    const { imports, exports } = this.findImportsAndExports(totalInputs, totalOutputs);

    return {
      imports,
      exports,
      hapiness: this.findThroughputValue(totalOutputs, HAPINESS_RESOURCE),
      possibleHapiness: this.findPossibleHapiness(),
      ecosystemSupport: roundToOneDecimal(Math.max(0,
        this.findThroughputValue(totalOutputs, ECOSYSTEM_SUPPORT_RESOURCE)
        - this.findThroughputValue(totalInputs, ECOSYSTEM_SUPPORT_RESOURCE)
      )),
      habitatShortages: this.findHabitatShortages(starvedFunctions),
      starvedFunctions,
      disabledBuildings,
    };
  }

  // Nothing is shipped in or out of a sektor but through its inter-city transport hubs, so a sektor
  // importing and exporting more than its hubs can carry has to go without some of its buildings.
  // Buildings are disabled one at a time, the one farthest from a hub first, and the sektor is
  // recalculated after each, until what is left of its imports and exports fits through its hubs.
  private findDisabledBuildings(): BuildingLocation[] {
    const disabledBuildings: BuildingLocation[] = [];
    for (;;) {
      const disabledFunctions = this.findFunctionsOfBuildings(disabledBuildings);
      const stoppedFunctions = [...disabledFunctions, ...this.findStarvedFunctions(disabledFunctions)];
      if (!this.isImportExportCapacityExceeded(stoppedFunctions)) return disabledBuildings;
      const buildingToDisable = this.findBuildingFarthestFromHub(stoppedFunctions);
      if (!buildingToDisable) return disabledBuildings;
      disabledBuildings.push(buildingToDisable);
    }
  }

  private isImportExportCapacityExceeded(stoppedFunctions: BuildingFunctionLocation[]): boolean {
    const { totalInputs, totalOutputs } = this.aggregateSektorThroughputs(stoppedFunctions);
    const { imports, exports } = this.findImportsAndExports(totalInputs, totalOutputs);
    const importExportAmount = roundToOneDecimal(
      [...imports, ...exports].reduce((total, throughput) => total + throughput.value, 0)
    );
    return importExportAmount > this.findThroughputValue(totalOutputs, IMPORT_EXPORT_RESOURCE);
  }

  // Buildings equally far from a hub are disabled in the order they were built, and in a sektor
  // without a hub every building is infinitely far from one. A building consuming nothing needs
  // nothing brought in, so it is left running, and so is one doing nothing, which has nothing to
  // give up.
  private findBuildingFarthestFromHub(stoppedFunctions: BuildingFunctionLocation[]): BuildingLocation | undefined {
    const hubLocations = this.findProducerLocations(IMPORT_EXPORT_RESOURCE, stoppedFunctions);
    return this.buildings
      .filter(building => this.getInputs(building, stoppedFunctions).length > 0)
      .map(building => ({
        location: building.location,
        distanceToNearestHub: findDistanceToNearestLocation(building.location, hubLocations),
      }))
      .sort((firstBuilding, secondBuilding) => secondBuilding.distanceToNearestHub - firstBuilding.distanceToNearestHub)
      [0]?.location;
  }

  // A disabled building runs none of its functions.
  private findFunctionsOfBuildings(buildingLocations: BuildingLocation[]): BuildingFunctionLocation[] {
    return buildingLocations.flatMap(buildingLocation => {
      const building = this.findBuildingAt(buildingLocation);
      const buildingDefinition = building && this.findBuildingDefinition(building.type);
      return (buildingDefinition?.buildingFunctions ?? []).map((_, functionIndex) => ({ buildingLocation, functionIndex }));
    });
  }

  private findImportsAndExports(totalInputs: ResourceThroughput[], totalOutputs: ResourceThroughput[]): { imports: ResourceThroughput[], exports: ResourceThroughput[] } {
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
    return { imports, exports };
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
  // recalculated until no shortage is left. The functions of disabled buildings are not running to
  // begin with.
  private findStarvedFunctions(disabledFunctions: BuildingFunctionLocation[]): BuildingFunctionLocation[] {
    const starvedFunctions: BuildingFunctionLocation[] = [];
    for (;;) {
      const stoppedFunctions = [...disabledFunctions, ...starvedFunctions];
      const shortage = this.findLocalResourceShortage(stoppedFunctions);
      if (!shortage) return starvedFunctions;
      const newlyStarvedFunctions = this.selectFunctionsToStarve(shortage, stoppedFunctions);
      if (newlyStarvedFunctions.length === 0) return starvedFunctions;
      starvedFunctions.push(...newlyStarvedFunctions);
    }
  }

  private findLocalResourceShortage(stoppedFunctions: BuildingFunctionLocation[]): ResourceThroughput | undefined {
    const { totalInputs, totalOutputs } = this.aggregateSektorThroughputs(stoppedFunctions);
    return totalInputs
      .filter(input => this.localResources.includes(input.name))
      .map(input => ({
        name: input.name,
        value: roundToOneDecimal(input.value - this.findThroughputValue(totalOutputs, input.name)),
      }))
      .find(shortage => shortage.value > 0);
  }

  private aggregateSektorThroughputs(stoppedFunctions: BuildingFunctionLocation[]): { totalInputs: ResourceThroughput[], totalOutputs: ResourceThroughput[] } {
    return {
      totalInputs: this.aggregateThroughputs(
        this.buildings.map(building => this.getInputs(building, stoppedFunctions)).flat()
      ),
      totalOutputs: this.aggregateThroughputs(
        this.buildings.map(building => this.getOutputs(building, stoppedFunctions)).flat()
      ),
    };
  }

  // A local resource never travels far, so the functions closest to where it is made are the ones
  // which get it: the rest are starved, farthest first, enough of them to cover the shortage. A
  // function consuming more than is missing is still starved whole, since a function either runs
  // or it does not.
  private selectFunctionsToStarve(shortage: ResourceThroughput, stoppedFunctions: BuildingFunctionLocation[]): BuildingFunctionLocation[] {
    const selectedFunctions: BuildingFunctionLocation[] = [];
    let selectedAmount = 0;
    for (const starvationCandidate of this.findStarvationCandidates(shortage, stoppedFunctions)) {
      selectedFunctions.push(starvationCandidate.buildingFunctionLocation);
      selectedAmount = roundToOneDecimal(selectedAmount + starvationCandidate.consumedAmount);
      if (selectedAmount >= shortage.value) return selectedFunctions;
    }
    return selectedFunctions;
  }

  // Candidates equally far from the resource are starved in the order their buildings were built.
  // A building making the resource itself is as near to it as a building can be, and one in a
  // sektor which makes none of it is infinitely far from it.
  private findStarvationCandidates(shortage: ResourceThroughput, stoppedFunctions: BuildingFunctionLocation[]): StarvationCandidate[] {
    const producerLocations = this.findProducerLocations(shortage.name, stoppedFunctions);
    const starvationCandidates: StarvationCandidate[] = [];
    for (const building of this.buildings) {
      const buildingDefinition = this.findBuildingDefinition(building.type);
      if (!buildingDefinition) continue;
      const functionActivations = this.getFunctionActivations(building, buildingDefinition);
      for (const [functionIndex, buildingFunction] of buildingDefinition.buildingFunctions.entries()) {
        if (!functionActivations[functionIndex]) continue;
        if (includesFunction(stoppedFunctions, building.location, functionIndex)) continue;
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

  private findProducerLocations(resourceType: string, stoppedFunctions: BuildingFunctionLocation[]): BuildingLocation[] {
    return this.buildings
      .filter(building => this.findThroughputValue(this.getOutputs(building, stoppedFunctions), resourceType) > 0)
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

  // Every building whose output pollution has decreased, so that all of them can be marked.
  findBuildingsWithOutputDecreasedByPollution(): BuildingLocation[] {
    return this.buildings
      .filter(building => this.isOutputDecreasedByPollution(building.location))
      .map(building => building.location);
  }

  // A building drawing what it makes out of a property pollution spoils makes less of it on fouled
  // ground, and so does a building making an output pollution affects. Only what the building is
  // doing counts: a function switched off makes nothing to lose.
  isOutputDecreasedByPollution(location: BuildingLocation): boolean {
    const building = this.findBuildingAt(location);
    if (!building) return false;
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return false;
    const pollution = this.locations[location.x]?.[location.y]?.properties[POLLUTION_PROPERTY] ?? 0;
    const functionActivations = this.getFunctionActivations(building, buildingDefinition);
    return buildingDefinition.buildingFunctions
      .filter((_, functionIndex) => functionActivations[functionIndex])
      .flatMap(buildingFunction => buildingFunction.outputs)
      .some(output =>
        (output.locationProperty !== undefined && isAffectedByPollution(output.locationProperty, pollution))
        || isOutputAffectedByPollution(output, pollution)
      );
  }

  private findThroughputValue(throughputs: ResourceThroughput[], resourceType: string): number {
    return throughputs.find(throughput => throughput.name === resourceType)?.value ?? 0;
  }

  // The amounts consumed and produced by all of the building's functions are added up per
  // resource.
  private getInputs(building: Building, stoppedFunctions: BuildingFunctionLocation[]): ResourceThroughput[] {
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return [];
    return this.aggregateThroughputs(
      this.getRunningBuildingFunctions(building, buildingDefinition, stoppedFunctions)
        .map(buildingFunction => buildingFunction.inputs).flat()
    );
  }

  private getOutputs(building: Building, stoppedFunctions: BuildingFunctionLocation[]): ResourceThroughput[] {
    const buildingDefinition = this.findBuildingDefinition(building.type);
    if (!buildingDefinition) return [];
    return this.aggregateThroughputs(
      this.getRunningBuildingFunctions(building, buildingDefinition, stoppedFunctions).map(buildingFunction =>
        this.getOutputAmounts(buildingFunction, building.location)
      ).flat()
    );
  }

  // A function which is turned off, starved of a local resource, or of a disabled building
  // consumes and produces nothing, so it is left out of every amount the building contributes to
  // the sektor.
  private getRunningBuildingFunctions(building: Building, buildingDefinition: BuildingDefinition, stoppedFunctions: BuildingFunctionLocation[]): BuildingFunction[] {
    const functionActivations = this.getFunctionActivations(building, buildingDefinition);
    return buildingDefinition.buildingFunctions.filter((_, functionIndex) =>
      functionActivations[functionIndex] && !includesFunction(stoppedFunctions, building.location, functionIndex)
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
  // has of that property, once pollution has spoiled what it spoils, and a location which has
  // nothing of it makes the building produce nothing, never a negative amount. An output made in
  // an amount which pollution affects is cut down by the pollution of the location.
  private getOutputAmounts(buildingFunction: BuildingFunction, location: BuildingLocation): ResourceThroughput[] {
    const locationProperties = pollutedLocationProperties(this.locations[location.x]?.[location.y]?.properties ?? {});
    const pollution = locationProperties[POLLUTION_PROPERTY] ?? 0;
    return buildingFunction.outputs.map(output => ({
      name: output.name,
      value: output.locationProperty !== undefined
        ? Math.max(0, locationProperties[output.locationProperty] ?? 0)
        : this.getOutputAmount(output, pollution),
    }));
  }

  private getOutputAmount(output: BuildingFunctionOutput, pollution: number): number {
    const amount = output.value ?? 0;
    return isOutputAffectedByPollution(output, pollution) ? pollutedOutputAmount(amount, pollution) : amount;
  }

  createBuilding(building: BuildingCreation): CreateBuildingResult {
    if (this.isSea(building.location) || this.isRiver(building.location)) {
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
    if (this.isPolluting(createdBuilding)) this.updatePollution();

    return { error: undefined, addedBuildings: [createdBuilding] };
  }

  // Every edge between two squares holds one cycle road at the most, whichever of the two squares
  // it was built from.
  createCycleRoad(cycleRoad: CycleRoad): CreateCycleRoadResult {
    if (this.cycleRoads.some(existing => isSameCycleRoad(existing, cycleRoad))) {
      return { error: "locationOccupied" };
    }
    this.cycleRoads.push([{ ...cycleRoad[0] }, { ...cycleRoad[1] }]);
    return { error: undefined };
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
    if (this.isPolluting(building)) this.updatePollution();

    return { success: true };
  }

  // The ground of a sektor starts out clean, so the pollution of a location is all of what every
  // polluting building standing around it puts there. Working it out afresh from the buildings
  // standing means a building taken down takes away exactly what it put there, even where the
  // pollution was more than a location can hold and was capped.
  private updatePollution() {
    const pollutingBuildings = this.buildings.filter(building => this.isPolluting(building));
    this.locations.forEach((row, x) => row.forEach((location, y) => {
      const pollution = pollutingBuildings.reduce(
        (total, building) => total + this.pollutionAround(building, { x, y }),
        0,
      );
      location.properties[POLLUTION_PROPERTY] = Math.min(MOST_POLLUTION, pollution);
    }));
  }

  private isPolluting(building: Building): boolean {
    return this.findBuildingDefinition(building.type)?.properties.pollutionArea !== undefined;
  }

  // A polluting building fouls the ground the most right beside it and less with every square
  // further out, down to one step of pollution at the edge of its area. The building's own square
  // is not counted as around it.
  private pollutionAround(building: Building, location: BuildingLocation): number {
    const pollutionArea = this.findBuildingDefinition(building.type)?.properties.pollutionArea ?? 0;
    const distance = Math.abs(location.x - building.location.x) + Math.abs(location.y - building.location.y);
    if (distance === 0 || distance > pollutionArea) return 0;
    return (pollutionArea - distance + 1) * POLLUTION_STEP;
  }

  // Nothing stands in open water, so a square of sea is not a square to build on.
  private isSea(location: BuildingLocation): boolean {
    return this.terrain[location.x]?.[location.y] === SEA;
  }

  // A river is open water as much as the sea is, however narrow it runs.
  private isRiver(location: BuildingLocation): boolean {
    return isRiver(this.terrain[location.x]?.[location.y]);
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

function includesFunction(buildingFunctionLocations: BuildingFunctionLocation[], location: BuildingLocation, functionIndex: number): boolean {
  return buildingFunctionLocations.some(buildingFunctionLocation =>
    buildingFunctionLocation.buildingLocation.x === location.x
    && buildingFunctionLocation.buildingLocation.y === location.y
    && buildingFunctionLocation.functionIndex === functionIndex
  );
}

// A road runs between the same two squares whichever of them it is told from.
function isSameCycleRoad(cycleRoad: CycleRoad, otherCycleRoad: CycleRoad): boolean {
  return (isSameLocation(cycleRoad[0], otherCycleRoad[0]) && isSameLocation(cycleRoad[1], otherCycleRoad[1]))
    || (isSameLocation(cycleRoad[0], otherCycleRoad[1]) && isSameLocation(cycleRoad[1], otherCycleRoad[0]));
}

function isSameLocation(location: BuildingLocation, otherLocation: BuildingLocation): boolean {
  return location.x === otherLocation.x && location.y === otherLocation.y;
}

function includesLocation(locations: BuildingLocation[], location: BuildingLocation): boolean {
  return locations.some(otherLocation => otherLocation.x === location.x && otherLocation.y === location.y);
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
