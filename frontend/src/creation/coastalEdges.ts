import { PlanetGrid, TriangleCoordinate } from "../list/planetGrid";
import { PlanetRegion } from "../list/parsePlanet";
import { MapEdge } from "./terrainMatrix";

// Which edges of the map of a sektor on land face the sea: those lying the way the triangle's sea
// neighbours lie. A triangle pointing south has a neighbour north of it, across its base, and two
// south-west and south-east of it, along its ring; one pointing north has them the other way
// round. A neighbour lying between two edges of the map, such as south-west, faces both of them. A
// sektor on the sea is laid out as sea already, and has no coasts of its own.
export function coastalEdges(grid: PlanetGrid, regionRings: PlanetRegion[][], { ring, index }: TriangleCoordinate): MapEdge[] {
  const isLand = (coordinate: TriangleCoordinate) => regionRings[coordinate.ring]![coordinate.index]!.isLand;
  const triangle = grid.rings[ring]![index]!;
  if (!isLand(triangle.coordinate)) return [];

  const [westNeighbour, eastNeighbour, neighbourAcrossBase] = triangle.neighbours;
  const edgesFacingNeighbours: [TriangleCoordinate, MapEdge[]][] = triangle.pointsNorth
    ? [[westNeighbour, ["north", "west"]], [eastNeighbour, ["north", "east"]], [neighbourAcrossBase, ["south"]]]
    : [[westNeighbour, ["south", "west"]], [eastNeighbour, ["south", "east"]], [neighbourAcrossBase, ["north"]]];
  const edgesFacingSea = new Set(edgesFacingNeighbours
    .filter(([neighbour]) => !isLand(neighbour))
    .flatMap(([, edges]) => edges));
  return MAP_EDGES_IN_ORDER.filter(edge => edgesFacingSea.has(edge));
}

const MAP_EDGES_IN_ORDER: MapEdge[] = ["north", "east", "south", "west"];
