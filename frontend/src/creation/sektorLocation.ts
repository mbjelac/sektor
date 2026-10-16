import { getSektorList } from "../list/sektorList.api";
import { getPlanet } from "../list/planet";
import { habitableTriangles } from "../list/habitableTriangles";
import { TriangleCoordinate } from "../list/planetGrid";

// A sektor is made on a habitable triangle of the planet, picked at random from those no other
// sektor lies on yet, so that no two sektors stand on top of each other. Once every habitable
// triangle has a sektor, sektors share them.
export function pickSektorLocation(): TriangleCoordinate {
  const { grid, regionRings } = getPlanet();
  const habitable = habitableTriangles(grid, regionRings);
  const taken = new Set(getSektorList().flatMap(sektor => sektor.location ? [`${sektor.location.ring}:${sektor.location.index}`] : []));
  const free = habitable.filter(({ ring, index }) => !taken.has(`${ring}:${index}`));
  const candidates = free.length > 0 ? free : habitable;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}
