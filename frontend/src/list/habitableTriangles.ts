import { PlanetGrid, TriangleCoordinate } from "./planetGrid";
import { PlanetRegion } from "./parsePlanet";

// How far out to sea a sektor may lie: on the sea next to land, or with one sea triangle between it
// and the land.
const MAXIMUM_STEPS_FROM_LAND = 2;

// The triangles a sektor can be made on: anywhere outside the polar zones, on land or on the sea
// along its coasts.
export function habitableTriangles(grid: PlanetGrid, regionRings: PlanetRegion[][]): TriangleCoordinate[] {
  const stepsFromLand = countStepsFromLand(grid, regionRings);
  return grid.rings.flat()
    .map(triangle => triangle.coordinate)
    .filter(({ ring, index }) =>
      regionRings[ring]![index]!.climate !== "polar" && stepsFromLand.get(keyOf({ ring, index }))! <= MAXIMUM_STEPS_FROM_LAND,
    );
}

// Land is no steps from land, the sea next to it one step, and so on outwards, as far as is needed.
function countStepsFromLand(grid: PlanetGrid, regionRings: PlanetRegion[][]): Map<string, number> {
  const steps = new Map<string, number>();
  let frontier = grid.rings.flat().filter(({ coordinate }) => regionRings[coordinate.ring]![coordinate.index]!.isLand);
  frontier.forEach(triangle => steps.set(keyOf(triangle.coordinate), 0));

  for (let step = 1; step <= MAXIMUM_STEPS_FROM_LAND; step++) {
    frontier = frontier
      .flatMap(triangle => triangle.neighbours)
      .filter(neighbour => !steps.has(keyOf(neighbour)))
      .map(neighbour => grid.rings[neighbour.ring]![neighbour.index]!);
    frontier.forEach(triangle => steps.set(keyOf(triangle.coordinate), step));
  }

  grid.rings.flat().forEach(({ coordinate }) => {
    if (!steps.has(keyOf(coordinate))) steps.set(keyOf(coordinate), Infinity);
  });
  return steps;
}

function keyOf({ ring, index }: TriangleCoordinate): string {
  return `${ring}:${index}`;
}
