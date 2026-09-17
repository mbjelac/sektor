// A sektor is only worth asking something of once there is somewhere to deliver it from. The map,
// its ground and its mountains are all made before this runs, so the solution the sektor was built
// around can be laid out on the real map: every building of it standing on a real location, making
// what that location lets it make, no two of them on the same tile. What the sektor then asks for
// is measured against what that laid-out solution actually delivers, which is why a sektor made
// this way can be finished rather than usually being finishable.
//
// The solution is not placed in one go and hoped over. It is grown: a building goes up, the game's
// own rules are asked what became of the sektor, and the next building answers whatever that says
// is wrong — a restriction broken means the sektor is buying something it must make instead, and a
// starving function means something it makes is not reaching it. Only when nothing is wrong does
// the solution reach for more of what the sektor exports. What it is holding when the ground runs
// out is a working sektor, and what that sektor sends out is a thing a player can do.

import { Sektor } from "../sektor/Sektor";
import { BuildingDefinition } from "../sektor/buildings/parseBuildingDefinitions";
import { ResourceThroughput } from "../../../shared/sektorData";
import { locationPropertiesToLocations } from "../sektor/locationProperties";

// The player needs more ground than the solution stands on: room to put a building up and take it
// down again, room to make more of something than the least that will do, and room for whatever
// pays but was never asked for. Half the map is enough of a spare, because the sektor asks for only
// a share of what the solution grown here delivers, and so takes fewer buildings than this did.

// How many times the growing solution may be looked at and answered before the ground is called
// full. Every round either puts a building up or takes one down, so this only has to outlast the
// tiles the solution is allowed.
const MOST_ROUNDS_PER_TILE = 4;

// What the solution grown on this map actually sends out of the sektor, resource by resource.
// Nothing here is an estimate: the buildings are placed, the game's own rules are asked what comes
// of them, and a placement which breaks a restriction is answered or pulled back until it does not.
export function exportsOfThePlacedSolution(
  requiredResources: string[],
  locationProperties: { [key: string]: number[][] },
  importRestrictions: ResourceThroughput[],
  buildingDefinitions: BuildingDefinition[],
  allowedBuildings: string[],
  localResources: string[],
  negativeScoringResources: string[],
): Map<string, number> {
  const locations = locationPropertiesToLocations(locationProperties);
  const size = locations.length;
  const sektor = new Sektor(
    locations,
    buildingDefinitions,
    { importRestrictions, exportRequirements: [] },
    negativeScoringResources,
    localResources,
    allowedBuildings,
  );

  buildTheSolutionOn(sektor, requiredResources, locationProperties, importRestrictions, buildingDefinitions, allowedBuildings, localResources);

  return new Map(sektor.getSektorState().exports.map(({ name, value }) => [name, value]));
}

// Grows the solution on a sektor and leaves it standing there. What the sektor makes of it is for
// the caller to ask: creation asks what it delivers, and a test asks whether it finishes the job.
export function buildTheSolutionOn(
  sektor: Sektor,
  requiredResources: string[],
  locationProperties: { [key: string]: number[][] },
  importRestrictions: ResourceThroughput[],
  buildingDefinitions: BuildingDefinition[],
  allowedBuildings: string[],
  localResources: string[],
) {
  const size = locationPropertiesToLocations(locationProperties).length;
  const takenTiles = new Set<string>();
  const tilesAllowed = Math.max(1, Math.floor(size * size / 2));
  let nextResourceToGrow = 0;

  for (let round = 0; round < tilesAllowed * MOST_ROUNDS_PER_TILE; round++) {
    if (takenTiles.size >= tilesAllowed) break;

    // The sektor is buying something it was told to make for itself, so whatever makes that goes up.
    const overboughtResource = resourceBoughtBeyondItsRestriction(sektor, importRestrictions);
    if (overboughtResource !== undefined) {
      if (!placeProducerOf(sektor, overboughtResource, locationProperties, size, takenTiles, buildingDefinitions, allowedBuildings)) {
        if (!removeNewestBuilding(sektor, takenTiles)) break;
      }
      continue;
    }

    // Something here cannot get what it needs from anywhere but here, so more of that is made.
    const starvedResource = resourceSomethingIsStarvedOf(sektor, buildingDefinitions, localResources);
    if (starvedResource !== undefined) {
      if (!placeProducerOf(sektor, starvedResource, locationProperties, size, takenTiles, buildingDefinitions, allowedBuildings)) {
        if (!removeNewestBuilding(sektor, takenTiles)) break;
      }
      continue;
    }

    // Nothing is wrong with the sektor as it stands, so it reaches for more of what it sends out,
    // taking the required resources in turn so that no one of them is grown at the expense of
    // another.
    if (requiredResources.length === 0) break;
    const resource = requiredResources[nextResourceToGrow % requiredResources.length];
    nextResourceToGrow++;
    if (!placeProducerOf(sektor, resource, locationProperties, size, takenTiles, buildingDefinitions, allowedBuildings)) break;
  }

  pullBackUntilRestrictionsAreKept(sektor);
}

// Which resource the sektor brings in more of than it is allowed to, if any.
function resourceBoughtBeyondItsRestriction(sektor: Sektor, importRestrictions: ResourceThroughput[]): string | undefined {
  const { imports } = sektor.getSektorState();

  return importRestrictions.find(restriction =>
    (imports.find(bought => bought.name === restriction.name)?.value ?? 0) > restriction.value
  )?.name;
}

// A local resource cannot be brought in from anywhere, so a building which needs one and has none
// simply stops. What it is short of is what wants making.
function resourceSomethingIsStarvedOf(
  sektor: Sektor,
  buildingDefinitions: BuildingDefinition[],
  localResources: string[],
): string | undefined {
  const { starvedFunctions } = sektor.getSektorState();
  const buildings = sektor.getState().buildings;

  for (const starvedFunction of starvedFunctions) {
    const building = buildings.find(placed =>
      placed.location.x === starvedFunction.buildingLocation.x && placed.location.y === starvedFunction.buildingLocation.y
    );
    const buildingDefinition = buildingDefinitions.find(definition => definition.name === building?.type);
    const starvedInput = buildingDefinition?.buildingFunctions[starvedFunction.functionIndex]?.inputs
      .map(input => input.name)
      .find(inputName => localResources.includes(inputName));
    if (starvedInput !== undefined) return starvedInput;
  }

  return undefined;
}

// A placement which still breaks a restriction after everything has been tried is no solution at
// all, so buildings come down, newest first, until the sektor keeps within what it restricts.
function pullBackUntilRestrictionsAreKept(sektor: Sektor) {
  for (;;) {
    if (sektor.getSektorState().status !== "Overrun") return;
    const buildings = sektor.getState().buildings;
    if (buildings.length === 0) return;
    sektor.destroyBuilding(buildings[buildings.length - 1].location);
  }
}

// Of everything the sektor allows which makes the resource, the one making most of it per building
// is the one put up, on the best ground left to it.
function placeProducerOf(
  sektor: Sektor,
  resource: string,
  locationProperties: { [key: string]: number[][] },
  size: number,
  takenTiles: Set<string>,
  buildingDefinitions: BuildingDefinition[],
  allowedBuildings: string[],
): boolean {
  const producer = bestProducerOf(buildingDefinitions, allowedBuildings, locationProperties, resource);
  if (producer === undefined) return false;
  return placeOnBestFreeTile(sektor, producer.buildingName, producer.locationProperty, locationProperties, size, takenTiles);
}

function bestProducerOf(
  buildingDefinitions: BuildingDefinition[],
  allowedBuildings: string[],
  locationProperties: { [key: string]: number[][] },
  resource: string,
): { buildingName: string; locationProperty?: string } | undefined {
  let best: { buildingName: string; locationProperty?: string } | undefined = undefined;
  let bestAmount = -1;

  for (const buildingDefinition of buildingDefinitions) {
    if (!allowedBuildings.includes(buildingDefinition.name)) continue;
    for (const buildingFunction of buildingDefinition.buildingFunctions) {
      for (const output of buildingFunction.outputs) {
        if (output.name !== resource) continue;
        const amount = output.value ?? richestGround(locationProperties, output.locationProperty);
        if (amount <= bestAmount) continue;
        bestAmount = amount;
        best = { buildingName: buildingDefinition.name, locationProperty: output.locationProperty };
      }
    }
  }

  return best;
}

function richestGround(locationProperties: { [key: string]: number[][] }, propertyName?: string): number {
  if (propertyName === undefined) return 0;
  const matrix = locationProperties[propertyName];
  if (!matrix) return 0;
  return Math.max(...matrix.flat());
}

// A building which draws its output from the ground goes on the richest ground left; one which makes
// the same wherever it stands goes anywhere there is room.
function placeOnBestFreeTile(
  sektor: Sektor,
  buildingName: string,
  propertyName: string | undefined,
  locationProperties: { [key: string]: number[][] },
  size: number,
  takenTiles: Set<string>,
): boolean {
  const freeTiles: { x: number; z: number }[] = [];
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      if (!takenTiles.has(tileKey(x, z))) freeTiles.push({ x, z });
    }
  }
  if (propertyName !== undefined) {
    const matrix = locationProperties[propertyName];
    freeTiles.sort((tile, otherTile) => (matrix?.[otherTile.x]?.[otherTile.z] ?? 0) - (matrix?.[tile.x]?.[tile.z] ?? 0));
  }

  for (const tile of freeTiles) {
    const result = sektor.createBuilding({ type: buildingName, location: { x: tile.x, y: tile.z } });
    if (result.error === undefined) {
      takenTiles.add(tileKey(tile.x, tile.z));
      return true;
    }
    // Ground too high for this building is ground it may never stand on, so the next tile is tried.
    if (result.error !== "altitudeTooHigh") return false;
  }

  return false;
}

function removeNewestBuilding(sektor: Sektor, takenTiles: Set<string>): boolean {
  const buildings = sektor.getState().buildings;
  if (buildings.length === 0) return false;
  const newest = buildings[buildings.length - 1];
  sektor.destroyBuilding(newest.location);
  takenTiles.delete(tileKey(newest.location.x, newest.location.y));
  return true;
}

function tileKey(x: number, z: number): string {
  return `${x},${z}`;
}
