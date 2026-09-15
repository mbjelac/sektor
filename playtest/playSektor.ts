import { BuildingLocation, ScoredThroughput, Sektor, SektorStatus } from "../frontend/src/sektor/Sektor";
import { BuildingDefinition } from "../frontend/src/sektor/buildings/parseBuildingDefinitions";
import { locationPropertiesToLocations } from "../frontend/src/sektor/locationProperties";
import { SektorData } from "../shared/sektorData";
import { BuildingPlan, planBuildings } from "./planBuildings";

// A sektor which is not finished is worth less than its score says, so the player is pushed towards
// meeting what is required by counting every unit still missing against them.
const SHORTFALL_PENALTY = 10;
// Going over a restriction is bad but not unthinkable: a player building a chain goes over while
// only half of it stands, and comes back under once the rest is up. The penalty has to be steep
// enough to be climbed back out of, and finite enough to be climbed into.
const EXCESS_PENALTY = 5;
// Long enough to raise a chain several buildings deep before anything is gained from it.
const PLACEMENT_STEPS = 80;

export interface PlayResult {
  level: number;
  status: SektorStatus;
  score: number;
  buildingCount: number;
  buildingsPlaced: { type: string; count: number }[];
  imports: ScoredThroughput[];
  exports: ScoredThroughput[];
  exportRequirements: { name: string; value: number; exported: number }[];
}

// Plays a sektor the way a patient player would: place whatever building improves the sektor most,
// over and over, until nothing improves it any further, then try every function switch. It finds a
// good sektor, not the best possible one, so what it reports is a floor on what a player could
// score — which is what a difficulty question needs. A ceiling would need a real solver.
export function playSektor(
  sektorData: SektorData,
  buildingDefinitions: BuildingDefinition[],
  localResources: string[],
  negativeScoringResources: string[],
): PlayResult {
  const locations = locationPropertiesToLocations(sektorData.locationProperties);
  const sektor = new Sektor(
    locations,
    buildingDefinitions,
    { importRestrictions: sektorData.importRestrictions, exportRequirements: sektorData.exportRequirements },
    negativeScoringResources,
    localResources,
    sektorData.allowedBuildings,
  );

  buildThePlan(sektor, sektorData, buildingDefinitions, planBuildings(sektorData, buildingDefinitions), locations.length);
  placeBuildings(sektor, sektorData, buildingDefinitions, locations.length);
  switchFunctionsWhileItHelps(sektor, sektorData, buildingDefinitions);

  return report(sektor, sektorData);
}

// Puts up what the plan calls for, as far as the ground allows, each building set to do the one
// thing the plan wanted it for.
function buildThePlan(
  sektor: Sektor,
  sektorData: SektorData,
  buildingDefinitions: BuildingDefinition[],
  plans: BuildingPlan[],
  gridSize: number,
) {
  for (const plan of plans) {
    const buildingDefinition = buildingDefinitions.find(definition => definition.name === plan.buildingName);
    if (!buildingDefinition) continue;

    for (let built = 0; built < plan.count; built++) {
      const location = bestFreeLocation(sektor, sektorData, buildingDefinition, gridSize);
      if (!location) return;
      if (sektor.createBuilding({ type: plan.buildingName, location }).error !== undefined) return;

      if (buildingDefinition.buildingFunctions.length > 1) {
        sektor.activateFunction(location, plan.functionIndex);
        buildingDefinition.buildingFunctions.forEach((_, functionIndex) => {
          if (functionIndex !== plan.functionIndex) sektor.deactivateFunction(location, functionIndex);
        });
      }
    }
  }
}

// Keeps putting up whichever building leaves the sektor best off, and carries on even when the best
// of them leaves it worse off — a chain has to be half built before any of it pays, and a player
// who only ever took a step which helped straight away would never build one. The best sektor seen
// along the way is kept, and the wandering afterwards costs nothing.
function placeBuildings(
  sektor: Sektor,
  sektorData: SektorData,
  buildingDefinitions: BuildingDefinition[],
  gridSize: number,
) {
  let bestState = sektor.getState();
  let bestValue = sektor.getSektorState().status === "RestrictionsExceeded" ? -Infinity : valueOf(sektor, sektorData);

  for (let step = 0; step < PLACEMENT_STEPS; step++) {
    let bestBuildingType: string | null = null;
    let bestLocation: BuildingLocation | null = null;
    let bestStepValue = -Infinity;

    for (const buildingType of sektorData.allowedBuildings) {
      const buildingDefinition = buildingDefinitions.find(definition => definition.name === buildingType);
      if (!buildingDefinition || buildingDefinition.buildingFunctions.length === 0) continue;

      const location = bestFreeLocation(sektor, sektorData, buildingDefinition, gridSize);
      if (!location) continue;

      if (sektor.createBuilding({ type: buildingType, location }).error !== undefined) continue;
      const value = valueOf(sektor, sektorData);
      sektor.destroyBuilding(location);

      if (value > bestStepValue) {
        bestStepValue = value;
        bestBuildingType = buildingType;
        bestLocation = location;
      }
    }

    if (!bestBuildingType || !bestLocation) break;
    sektor.createBuilding({ type: bestBuildingType, location: bestLocation });

    if (sektor.getSektorState().status !== "RestrictionsExceeded" && bestStepValue > bestValue) {
      bestValue = bestStepValue;
      bestState = sektor.getState();
    }
  }

  sektor.loadState(bestState);
}

// A building whose output is named after a location property makes as much of it as the location
// holds, so it is worth putting where that property is richest. Anything else can stand anywhere.
function bestFreeLocation(
  sektor: Sektor,
  sektorData: SektorData,
  buildingDefinition: BuildingDefinition,
  gridSize: number,
): BuildingLocation | null {
  const wantedProperties = buildingDefinition.buildingFunctions
    .flatMap(buildingFunction => buildingFunction.outputs)
    .map(output => output.locationProperty)
    .filter((propertyName): propertyName is string => propertyName !== undefined);

  const occupied = new Set(sektor.getState().buildings.map(building => `${building.location.x},${building.location.y}`));

  let bestLocation: BuildingLocation | null = null;
  let bestRichness = -1;
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (occupied.has(`${x},${y}`)) continue;
      const richness = wantedProperties.reduce(
        (total, propertyName) => total + (sektorData.locationProperties[propertyName]?.[x]?.[y] ?? 0), 0
      );
      if (richness > bestRichness) {
        bestRichness = richness;
        bestLocation = { x, y };
      }
    }
  }
  return bestLocation;
}

function switchFunctionsWhileItHelps(sektor: Sektor, sektorData: SektorData, buildingDefinitions: BuildingDefinition[]) {
  for (let pass = 0; pass < 4; pass++) {
    let improved = false;

    for (const building of sektor.getState().buildings) {
      const buildingDefinition = buildingDefinitions.find(definition => definition.name === building.type);
      if (!buildingDefinition || buildingDefinition.buildingFunctions.length < 2) continue;

      for (let functionIndex = 0; functionIndex < buildingDefinition.buildingFunctions.length; functionIndex++) {
        const before = valueOf(sektor, sektorData);
        const wasActive = sektor.getBuildingState(building.location)?.buildingFunctions[functionIndex].active ?? false;

        if (wasActive) sektor.deactivateFunction(building.location, functionIndex);
        else sektor.activateFunction(building.location, functionIndex);

        if (valueOf(sektor, sektorData) > before) improved = true;
        else if (wasActive) sektor.activateFunction(building.location, functionIndex);
        else sektor.deactivateFunction(building.location, functionIndex);
      }
    }

    if (!improved) return;
  }
}

// What the sektor is worth to a player working towards finishing it: what it scores, less what is
// still missing from what it has to export, less whatever it brings in over what it is allowed to.
function valueOf(sektor: Sektor, sektorData: SektorData): number {
  const sektorState = sektor.getSektorState();

  const score = [...sektorState.imports, ...sektorState.exports]
    .reduce((total, throughput) => total + throughput.score, 0);

  const shortfall = sektorData.exportRequirements.reduce((total, requirement) => {
    const exported = sektorState.exports.find(entry => entry.name === requirement.name)?.value ?? 0;
    return total + Math.max(0, requirement.value - exported);
  }, 0);

  const excess = sektorData.importRestrictions.reduce((total, restriction) => {
    const imported = sektorState.imports.find(entry => entry.name === restriction.name)?.value ?? 0;
    return total + Math.max(0, imported - restriction.value);
  }, 0);

  return score - shortfall * SHORTFALL_PENALTY - excess * EXCESS_PENALTY;
}

function report(sektor: Sektor, sektorData: SektorData): PlayResult {
  const sektorState = sektor.getSektorState();
  const buildings = sektor.getState().buildings;

  const countsByType = new Map<string, number>();
  for (const building of buildings) {
    countsByType.set(building.type, (countsByType.get(building.type) ?? 0) + 1);
  }

  return {
    level: sektorData.level,
    status: sektorState.status,
    score: [...sektorState.imports, ...sektorState.exports].reduce((total, throughput) => total + throughput.score, 0),
    buildingCount: buildings.length,
    buildingsPlaced: [...countsByType].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    imports: sektorState.imports.filter(entry => entry.value > 0),
    exports: sektorState.exports.filter(entry => entry.value > 0),
    exportRequirements: sektorData.exportRequirements.map(requirement => ({
      name: requirement.name,
      value: requirement.value,
      exported: sektorState.exports.find(entry => entry.name === requirement.name)?.value ?? 0,
    })),
  };
}
