import { getSektorList } from "../list/sektorList.api";
import { getPlanet } from "../list/planet";
import { habitableTriangles } from "../list/habitableTriangles";
import { TriangleCoordinate } from "../list/planetGrid";
import { PlanetRegion } from "../list/parsePlanet";
import { RandomNumber } from "./randomNumber";

// One sektor in this many stands on an area rich in an ore.
const ORE_RICH_CHANCE = 1 / 4;

// A sektor is made on a habitable triangle of the planet, picked at random from those no other
// sektor lies on yet, so that no two sektors stand on top of each other. Once every habitable
// triangle has a sektor, sektors share them.
export function pickSektorLocation(): TriangleCoordinate {
  const { grid, regionRings } = getPlanet();
  const taken = new Set(getSektorList().flatMap(sektor => sektor.location ? [`${sektor.location.ring}:${sektor.location.index}`] : []));
  return pickLocationAmong(habitableTriangles(grid, regionRings), regionRings, taken, Math.random);
}

// First it is drawn whether the sektor stands on an area rich in an ore, and it is picked as always,
// but only among the ore-rich areas if so, and only among the ore-poor ones if not.
export function pickLocationAmong(
  habitable: TriangleCoordinate[],
  regionRings: PlanetRegion[][],
  taken: Set<string>,
  randomNumber: RandomNumber,
): TriangleCoordinate {
  const isOnOreRichArea = randomNumber() < ORE_RICH_CHANCE;
  const isOreRich = ({ ring, index }: TriangleCoordinate) => regionRings[ring]![index]!.richOre !== null;
  const ofDrawnKind = habitable.filter(coordinate => isOreRich(coordinate) === isOnOreRichArea);
  const free = ofDrawnKind.filter(({ ring, index }) => !taken.has(`${ring}:${index}`));
  const candidates = free.length > 0 ? free : ofDrawnKind;
  return candidates[Math.floor(randomNumber() * candidates.length)]!;
}
