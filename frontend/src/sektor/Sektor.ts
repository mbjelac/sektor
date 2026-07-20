
import { BuildingDefinition, BuildingFunction, ResourceThroughput } from "./buildings/parseBuildingDefinitions";
import { BuildingLocation, BuildingCreation, Connection, RestrictionsRequirements, Location } from "../../../shared/sektorData";
import { calculateBoost } from "./calculateBoost";

export type { BuildingLocation, BuildingCreation, Connection, RestrictionsRequirements, Location };

export type SektorStatus = "InProgress" | "Done" | "RestrictionsExceeded";

export interface SektorState {
  imports: ResourceThroughput[];
  exports: ResourceThroughput[];
  status: SektorStatus;
  importRestrictions: ResourceThroughput[];
  exportRequirements: ResourceThroughput[];
}

export interface BuildingConnection {
  to: BuildingLocation;
  resourceType: string;
  amount: number;
}

export interface BuildingState {
  buildingFunction: BuildingFunction;
  modifiedOutputs: ResourceThroughput[];
  exports: ResourceThroughput[];
  imports: ResourceThroughput[];
  inputConnections: BuildingConnection[];
  outputConnections: BuildingConnection[];
}

export interface PossibleConnection {
  location: BuildingLocation;
  totalOutput: number;
  remainingOutput: number;
}

export interface AddConnectionResult {
  success: boolean;
  error?: string;
}

export interface ConnectionAmountChangeResult {
  success: boolean;
  error?: string;
  newAmount: number;
}

export interface DestroyBuildingResult {
  success: boolean;
  error?: string;
}

export interface CreateBuildingResult {
  error: undefined | string;
  addedBuildings: BuildingCreation[];
}

export class Sektor {
  private buildings: BuildingCreation[] = [];
  private connections: Connection[] = [];
  private readonly locations: Location[][];
  private readonly buildingDefinitions: BuildingDefinition[];
  private readonly restrictionsRequirements: RestrictionsRequirements;

  constructor(locations: Location[][], buildingDefinitions: BuildingDefinition[], restrictionsRequirements: RestrictionsRequirements) {
    this.locations = locations;
    this.buildingDefinitions = buildingDefinitions;
    this.restrictionsRequirements = restrictionsRequirements;
  }

  getLocations(): Location[][] {
    return this.locations;
  }

  getState(): { buildings: BuildingCreation[]; connections: Connection[] } {
    return {
      buildings: this.buildings.map(building => ({ ...building })),
      connections: this.connections.map(connection => ({ ...connection })),
    };
  }

  loadState(state: { buildings: BuildingCreation[]; connections: Connection[] }) {
    this.buildings = state.buildings;
    this.connections = state.connections;
  }

  getBuildingState(location: BuildingLocation): BuildingState | null {
    const building = this.findBuildingAt(location);
    if (!building) return null;
    const def = this.buildingDefinitions.find(b => b.name === building.type);
    if (!def) return null;
    const inputConnections = this.connections
      .filter(c => c.target.x === location.x && c.target.y === location.y)
      .map(c => ({ to: c.source, resourceType: c.resourceType, amount: c.amount }));
    const outputConnections = this.connections
      .filter(c => c.source.x === location.x && c.source.y === location.y)
      .map(c => ({ to: c.target, resourceType: c.resourceType, amount: c.amount }));
    const imports = def.buildingFunction.inputs.map(input => ({
      name: input.name,
      value: this.getRemainingImport(location, input.name),
    }));
    const modifiedOutputs = this.getOutputs(building.type, location);
    const exports = modifiedOutputs.map(output => ({
      name: output.name,
      value: this.getRemainingExport(location, output.name),
    }));
    const buildingFunction: BuildingFunction = {
      inputs: [...def.buildingFunction.inputs, ...def.boosters.map(booster => ({ ...booster.input }))],
      outputs: def.buildingFunction.outputs,
    };
    return {
      buildingFunction,
      modifiedOutputs,
      exports,
      imports,
      inputConnections,
      outputConnections,
    };
  }

  getSektorState(): SektorState {
    const imports = this.aggregateThroughputs(this.buildings.map(building => this.getInputs(building.type)).flat());
    const exports = this.aggregateThroughputs(
      this.buildings
        .filter(building => this.isAutoExport(building.type))
        .map(building => this.getOutputs(building.type, building.location))
        .flat()
    );

    for (const connection of this.connections) {
      const importEntry = imports.find(entry => entry.name === connection.resourceType);
      if (importEntry) importEntry.value -= connection.amount;
      if (this.isAutoExport(this.findBuildingAt(connection.source)?.type)) {
        const exportEntry = exports.find(entry => entry.name === connection.resourceType);
        if (exportEntry) exportEntry.value -= connection.amount;
      }
    }

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

  canIncreaseImport(location: BuildingLocation, resourceType: string): boolean {
    return this.getRemainingImport(location, resourceType) > 0;
  }

  private getInputs(type: string): ResourceThroughput[] {
    const def = this.buildingDefinitions.find(b => b.name === type);
    return def?.buildingFunction?.inputs ?? [];
  }

  private getConnectableInputs(type: string): ResourceThroughput[] {
    const def = this.buildingDefinitions.find(b => b.name === type);
    if (!def) return [];
    return [...def.buildingFunction.inputs, ...def.boosters.map(booster => ({ ...booster.input }))];
  }

  private getOutputs(type: string, location: BuildingLocation): ResourceThroughput[] {
    const def = this.buildingDefinitions.find(b => b.name === type);
    if (!def) return [];
    const locationProperties = this.locations[location.x]?.[location.y]?.properties ?? {};
    const connectedBoosterInputAmounts = def.boosters.map(booster => ({
      name: booster.input.name,
      value: this.getConnectedInputAmount(location, booster.input.name),
    }));
    const boosts = calculateBoost(def.boosters, connectedBoosterInputAmounts);
    return (def.buildingFunction?.outputs ?? []).map(output => {
      const modifier = def.outputModifiers.find(modifier => modifier.resource === output.name);
      const propertyValue = modifier ? (locationProperties[modifier.property] ?? 0) : 0;
      const modifiedValue = modifier ? Math.max(0, output.value + propertyValue) : output.value;
      const boost = boosts.find(boost => boost.name === output.name)?.value ?? 0;
      return { name: output.name, value: modifiedValue + boost };
    });
  }

  private getConnectedInputAmount(location: BuildingLocation, resourceType: string): number {
    return this.connections
      .filter(c => c.target.x === location.x && c.target.y === location.y && c.resourceType === resourceType)
      .reduce((sum, c) => sum + c.amount, 0);
  }

  // A building with autoExport=false does not contribute its outputs to sektor exports:
  // its connected outputs are consumed internally and its excess is not exported.
  private isAutoExport(type: string | undefined): boolean {
    const def = this.buildingDefinitions.find(b => b.name === type);
    return def?.properties.autoExport !== false;
  }

  private getConnectedOutputAmount(location: BuildingLocation, resourceType: string): number {
    return this.connections
      .filter(c => c.source.x === location.x && c.source.y === location.y && c.resourceType === resourceType)
      .reduce((sum, c) => sum + c.amount, 0);
  }

  private getRemainingImport(location: BuildingLocation, resourceType: string): number {
    const building = this.findBuildingAt(location);
    if (!building) return 0;
    const input = this.getConnectableInputs(building.type).find(i => i.name === resourceType);
    if (!input) return 0;
    return input.value - this.getConnectedInputAmount(location, resourceType);
  }

  private getRemainingExport(location: BuildingLocation, resourceType: string): number {
    const building = this.findBuildingAt(location);
    if (!building) return 0;
    const output = this.getOutputs(building.type, location).find(o => o.name === resourceType);
    if (!output) return 0;
    return output.value - this.getConnectedOutputAmount(location, resourceType);
  }

  private isAlreadyConnected(target: BuildingLocation, source: BuildingLocation, resourceType: string): boolean {
    return this.connections.some(
      connection => connection.target.x === target.x && connection.target.y === target.y
        && connection.source.x === source.x && connection.source.y === source.y
        && connection.resourceType === resourceType
    );
  }

  private aggregateThroughputs(throughputs: ResourceThroughput[]): ResourceThroughput[] {
    const map = new Map<string, number>();
    for (const t of throughputs) {
      map.set(t.name, (map.get(t.name) ?? 0) + t.value);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  addConnection(target: BuildingLocation, source: BuildingLocation, resourceType: string): AddConnectionResult {
    const targetBuilding = this.findBuildingAt(target);
    if (!targetBuilding) return { success: false, error: "targetBuildingNotFound" };

    const sourceBuilding = this.findBuildingAt(source);
    if (!sourceBuilding) return { success: false, error: "sourceBuildingNotFound" };

    const targetInput = this.getConnectableInputs(targetBuilding.type).find(input => input.name === resourceType);
    if (!targetInput) return { success: false, error: "targetHasNoMatchingInput" };

    const sourceOutput = this.getOutputs(sourceBuilding.type, source).find(output => output.name === resourceType);
    if (!sourceOutput) return { success: false, error: "sourceHasNoMatchingOutput" };

    if (this.isAlreadyConnected(target, source, resourceType)) return { success: false, error: "alreadyConnected" };

    const remainingImport = this.getRemainingImport(target, resourceType);
    if (remainingImport <= 0) return { success: false, error: "targetInputFull" };

    const remainingOutput = this.getRemainingExport(source, resourceType);
    if (remainingOutput <= 0) return { success: false, error: "sourceOutputExhausted" };

    this.connections.push({ target, source, resourceType, amount: 1 });
    return { success: true };
  }

  changeConnectionAmount(target: BuildingLocation, source: BuildingLocation, resourceType: string, delta: number): ConnectionAmountChangeResult {
    const connection = this.connections.find(
      c => c.target.x === target.x && c.target.y === target.y
        && c.source.x === source.x && c.source.y === source.y
        && c.resourceType === resourceType
    );
    if (!connection) return { success: false, error: "connectionNotFound", newAmount: 0 };

    const newAmount = connection.amount + delta;

    if (newAmount < 0) return { success: false, error: "cannotDecreaseBelowZero", newAmount: connection.amount };

    const targetBuilding = this.findBuildingAt(target);
    if (!targetBuilding) return { success: false, error: "targetBuildingNotFound", newAmount: connection.amount };
    const targetInput = this.getConnectableInputs(targetBuilding.type).find(input => input.name === resourceType);
    if (!targetInput) return { success: false, error: "targetHasNoMatchingInput", newAmount: connection.amount };
    const totalInputConnected = this.connections
      .filter(c => c.target.x === target.x && c.target.y === target.y && c.resourceType === resourceType)
      .reduce((sum, c) => sum + c.amount, 0) + delta;
    if (totalInputConnected > targetInput.value) return { success: false, error: "inputOverflow", newAmount: connection.amount };

    const sourceBuilding = this.findBuildingAt(source);
    if (!sourceBuilding) return { success: false, error: "sourceBuildingNotFound", newAmount: connection.amount };
    const sourceOutput = this.getOutputs(sourceBuilding.type, source).find(output => output.name === resourceType);
    if (!sourceOutput) return { success: false, error: "sourceHasNoMatchingOutput", newAmount: connection.amount };
    const totalOutputConnected = this.connections
      .filter(c => c.source.x === source.x && c.source.y === source.y && c.resourceType === resourceType)
      .reduce((sum, c) => sum + c.amount, 0) + delta;
    if (totalOutputConnected > sourceOutput.value) return { success: false, error: "outputOverflow", newAmount: connection.amount };

    connection.amount = newAmount;
    return { success: true, newAmount };
  }

  removeInputConnection(target: BuildingLocation, source: BuildingLocation, resource: string): void {
    const index = this.connections.findIndex(
      connection => connection.target.x === target.x && connection.target.y === target.y
        && connection.source.x === source.x && connection.source.y === source.y
        && connection.resourceType === resource
    );
    if (index === -1) throw new Error("connectionNotFound");
    this.connections.splice(index, 1);
  }

  getPossibleConnectionsForInput(target: BuildingLocation, resourceType: string): PossibleConnection[] {
    return this.buildings
      .filter(building => {
        if (building.location.x === target.x && building.location.y === target.y) return false;
        if (!this.getOutputs(building.type, building.location).some(output => output.name === resourceType)) return false;
        if (this.isAlreadyConnected(target, building.location, resourceType)) return false;
        return this.getRemainingExport(building.location, resourceType) > 0;
      })
      .map(building => ({
        location: building.location,
        totalOutput: this.getOutputs(building.type, building.location).find(output => output.name === resourceType)!.value,
        remainingOutput: this.getRemainingExport(building.location, resourceType),
      }));
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

    this.connections = this.connections.filter(
      connection => !(connection.target.x === location.x && connection.target.y === location.y)
        && !(connection.source.x === location.x && connection.source.y === location.y)
    );
    this.buildings = this.buildings.filter(
      existing => !(existing.location.x === location.x && existing.location.y === location.y)
    );

    return { success: true };
  }

  private findBuildingAt(location: BuildingLocation): BuildingCreation | undefined {
    return this.buildings.find(building => building.location.x === location.x && building.location.y === location.y);
  }
}
