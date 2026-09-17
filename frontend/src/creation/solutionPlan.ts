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
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { locationPropertiesToLocations } from "../sektor/locationProperties";

// The player needs more ground than the solution stands on: room to put a building up and take it
// down again, room to make more of something than the least that will do, and room for whatever
// pays but was never asked for. Half the map is enough of a spare, because the sektor asks for only
// a share of what the solution grown here delivers, and so takes fewer buildings than this did.

// How many times the growing solution may be looked at and answered before the ground is called
// full. Most rounds put a building up or take one down, and the few which do neither only give up
// on a resource no producer can answer for, of which there are never many, so this comfortably
// outlasts the tiles the solution is allowed.
const MOST_ROUNDS_PER_TILE = 4;

// What the solution grown on this map actually sends out of the sektor, resource by resource.
// Nothing here is an estimate: the buildings are placed, the game's own rules are asked what comes
// of them, and a placement which breaks a restriction is answered or pulled back until it does not.
export function exportsOfThePlacedSolution(
  requiredResources: string[],
  locationProperties: { [key: string]: number[][] },
  importRestrictions: ResourceThroughput[],
  buildingDefinitions: BuildingDefinition[],
  localResources: string[],
  negativeScoringResources: string[],
): Map<string, number> {
  const locations = locationPropertiesToLocations(locationProperties);
  const sektor = new Sektor(
    locations,
    buildingDefinitions,
    { importRestrictions, exportRequirements: [] },
    negativeScoringResources,
    localResources,
  );

  buildTheSolutionOn(sektor, requiredResources, locationProperties, importRestrictions, buildingDefinitions, localResources);

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
  localResources: string[],
) {
  const takenTiles = new Set<string>();
  const tilesAllowed = Math.max(1, Math.floor(SEKTOR_SIZE * SEKTOR_SIZE / 2));
  // What putting a producer up has already been seen not to help with. A producer which does not
  // bring its resource down is set aside rather than tried again, so that the solution answers what
  // it can answer instead of burying the map in buildings which change nothing.
  const overbuyingNoProducerAnswers = new Set<string>();
  let nextResourceToGrow = 0;

  for (let round = 0; round < tilesAllowed * MOST_ROUNDS_PER_TILE; round++) {
    if (takenTiles.size >= tilesAllowed) break;

    // The sektor is buying something it was told to make for itself, so whatever makes that goes up.
    const overboughtResource = resourceBoughtBeyondItsRestriction(sektor, importRestrictions, overbuyingNoProducerAnswers);
    if (overboughtResource !== undefined) {
      if (!placingAProducerLowersTheImport(sektor, overboughtResource, locationProperties, takenTiles, buildingDefinitions)) {
        overbuyingNoProducerAnswers.add(overboughtResource);
      }
      continue;
    }

    // Something here cannot get what it needs from anywhere but here, so more of that is made.
    const starvedResource = resourceSomethingIsStarvedOf(sektor, buildingDefinitions, localResources);
    if (starvedResource !== undefined) {
      if (!placeProducerOf(sektor, starvedResource, locationProperties, takenTiles, buildingDefinitions)) {
        if (!removeNewestBuilding(sektor, takenTiles)) break;
      }
      // Feeding what was starving sets something running which was not running before, so a
      // resource no producer could answer for is worth answering for again.
      overbuyingNoProducerAnswers.clear();
      continue;
    }

    // Nothing is wrong with the sektor as it stands, so it reaches for more of what it sends out,
    // taking the required resources in turn so that no one of them is grown at the expense of
    // another.
    if (requiredResources.length === 0) break;
    const resource = requiredResources[nextResourceToGrow % requiredResources.length];
    nextResourceToGrow++;
    if (!placeProducerOf(sektor, resource, locationProperties, takenTiles, buildingDefinitions)) break;
    overbuyingNoProducerAnswers.clear();
  }

  pullBackUntilRestrictionsAreKept(sektor);
}

// Which resource the sektor brings in more of than it is allowed to, if any. Whatever putting up a
// producer has already failed to answer is passed over, so the next breached restriction gets its
// turn rather than the first one taking every round there is.
function resourceBoughtBeyondItsRestriction(
  sektor: Sektor,
  importRestrictions: ResourceThroughput[],
  overbuyingNoProducerAnswers: Set<string>,
): string | undefined {
  const { imports } = sektor.getSektorState();

  return importRestrictions.find(restriction =>
    !overbuyingNoProducerAnswers.has(restriction.name)
    && (imports.find(bought => bought.name === restriction.name)?.value ?? 0) > restriction.value
  )?.name;
}

// Puts up a producer of a resource the sektor buys too much of, and keeps it only if it actually
// lowered what is bought. A producer can raise it instead — a refinery which cannot get its ore buys
// more of everything else it needs and refines nothing — and standing there it would have the next
// round put up another, and another, until the ground was full of them and the sektor no closer to
// keeping its restrictions.
function placingAProducerLowersTheImport(
  sektor: Sektor,
  resource: string,
  locationProperties: { [key: string]: number[][] },
  takenTiles: Set<string>,
  buildingDefinitions: BuildingDefinition[],
): boolean {
  const importedBefore = importedAmountOf(sektor, resource);
  if (!placeProducerOf(sektor, resource, locationProperties, takenTiles, buildingDefinitions)) return false;
  if (importedAmountOf(sektor, resource) < importedBefore) return true;

  removeNewestBuilding(sektor, takenTiles);
  return false;
}

function importedAmountOf(sektor: Sektor, resource: string): number {
  return sektor.getSektorState().imports.find(bought => bought.name === resource)?.value ?? 0;
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

// Of everything which makes the resource, the one making most of it per building is the one put up,
// on the best ground left to it.
function placeProducerOf(
  sektor: Sektor,
  resource: string,
  locationProperties: { [key: string]: number[][] },
  takenTiles: Set<string>,
  buildingDefinitions: BuildingDefinition[],
): boolean {
  const producer = bestProducerOf(buildingDefinitions, locationProperties, resource);
  if (producer === undefined) return false;
  return placeOnBestFreeTile(sektor, producer, locationProperties, takenTiles);
}

// Which building to put up and which of the things it does it was put up to do. A building does
// only the first of its functions until somebody switches another on, so a producer which is not
// the first function of its building is a producer only once that switch is thrown.
interface PlaceableProducer {
  buildingName: string;
  functionIndex: number;
  locationProperty?: string;
}

function bestProducerOf(
  buildingDefinitions: BuildingDefinition[],
  locationProperties: { [key: string]: number[][] },
  resource: string,
): PlaceableProducer | undefined {
  let best: PlaceableProducer | undefined = undefined;
  let bestAmount = -1;

  for (const buildingDefinition of buildingDefinitions) {
    for (const [functionIndex, buildingFunction] of buildingDefinition.buildingFunctions.entries()) {
      for (const output of buildingFunction.outputs) {
        if (output.name !== resource) continue;
        const amount = output.value ?? richestGround(locationProperties, output.locationProperty);
        if (amount <= bestAmount) continue;
        bestAmount = amount;
        best = { buildingName: buildingDefinition.name, functionIndex, locationProperty: output.locationProperty };
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
  producer: PlaceableProducer,
  locationProperties: { [key: string]: number[][] },
  takenTiles: Set<string>,
): boolean {
  const freeTiles: { x: number; z: number }[] = [];
  for (let x = 0; x < SEKTOR_SIZE; x++) {
    for (let z = 0; z < SEKTOR_SIZE; z++) {
      if (!takenTiles.has(tileKey(x, z))) freeTiles.push({ x, z });
    }
  }
  if (producer.locationProperty !== undefined) {
    const matrix = locationProperties[producer.locationProperty];
    freeTiles.sort((tile, otherTile) => (matrix?.[otherTile.x]?.[otherTile.z] ?? 0) - (matrix?.[tile.x]?.[tile.z] ?? 0));
  }

  for (const tile of freeTiles) {
    const result = sektor.createBuilding({ type: producer.buildingName, location: { x: tile.x, y: tile.z } });
    if (result.error === undefined) {
      // The building was put up to make one thing, so the function which makes it is switched on.
      // Whatever else the building was already doing is left doing it: the functions of a building
      // are often a ladder, each rung making what the next one climbs from, and switching the lower
      // rungs off would leave the one which was wanted with nothing to work on.
      sektor.activateFunction({ x: tile.x, y: tile.z }, producer.functionIndex);
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
