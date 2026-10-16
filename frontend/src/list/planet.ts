import planetMd from "../assets/planet.md?raw";
import { createPlanetGrid, PlanetGrid } from "./planetGrid";
import { parsePlanet, PlanetRegion } from "./parsePlanet";

const EDGE_DIVISIONS = 16;

// The planet's grid of triangles, and what the planet is like at every one of them, ring by ring as
// the grid has them. It is the same on every visit, as planet.md has it.
export type Planet = { grid: PlanetGrid; regionRings: PlanetRegion[][] };

let planet: Planet | null = null;

// Worked out once, the first time anything asks. A planet.md shaped for another planet is said
// rather than read wrongly.
export function getPlanet(): Planet {
  if (planet) return planet;

  const grid = createPlanetGrid(EDGE_DIVISIONS);
  const regionRings = parsePlanet(planetMd);
  if (regionRings.length !== grid.rings.length) {
    throw new Error(`planet.md has ${regionRings.length} rings, but the planet has ${grid.rings.length}`);
  }
  grid.rings.forEach((ring, ringIndex) => {
    const regionRingLength = regionRings[ringIndex]?.length ?? 0;
    if (regionRingLength !== ring.length) {
      throw new Error(`planet.md has ${regionRingLength} triangles on ring ${ringIndex}, but the ring has ${ring.length}`);
    }
  });

  planet = { grid, regionRings };
  return planet;
}
