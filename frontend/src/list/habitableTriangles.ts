import { PlanetGrid, TriangleCoordinate } from "./planetGrid";
import { PlanetRegion } from "./parsePlanet";

// The triangles a sektor can be made on: anywhere outside the polar zones, on land or on the sea
// right next to it.
export function habitableTriangles(grid: PlanetGrid, regionRings: PlanetRegion[][]): TriangleCoordinate[] {
  const isLand = ({ ring, index }: TriangleCoordinate) => regionRings[ring]![index]!.isLand;
  return grid.rings.flat()
    .filter(({ coordinate, neighbours }) =>
      regionRings[coordinate.ring]![coordinate.index]!.climate !== "polar" && (isLand(coordinate) || neighbours.some(isLand)),
    )
    .map(triangle => triangle.coordinate);
}
