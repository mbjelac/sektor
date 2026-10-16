export type Point = [number, number, number];
// Where a triangle is on the planet: its ring, counted from the north pole, and its place along the
// ring, counted eastwards from the line of longitude through the first corner below the pole.
export type TriangleCoordinate = { ring: number; index: number };
export type PlanetTriangle = {
  coordinate: TriangleCoordinate;
  corners: [Point, Point, Point];
  center: Point;
  // A triangle points either north, with its tip towards the north pole and its base towards the
  // south, or the other way round.
  pointsNorth: boolean;
  // The three triangles sharing an edge with it: the one before it and the one after it along its
  // ring, and the one across its base, in the ring south of it if it points north, north if not.
  neighbours: [TriangleCoordinate, TriangleCoordinate, TriangleCoordinate];
};
export type PlanetGrid = { rings: PlanetTriangle[][] };

// A corner of the grid, named by the line of latitude it lies on, counted from the north pole, and
// its place along that line. Line 0 is the north pole itself and the last line the south pole.
type GridPointId = { line: number; position: number };
type GridTriangle = { corners: [GridPointId, GridPointId, GridPointId]; pointsNorth: boolean };

const SECTOR_COUNT = 5;
const RING_LATITUDE_OF_ICOSAHEDRON_CORNERS = Math.atan(0.5);

// The planet is an icosahedron standing on one of its corners, so that a corner sits on each pole,
// its twenty faces cut into a grid by dividing every edge into equal steps, and every corner of the
// grid pushed out onto the sphere. The five faces around the north pole, the ten around the middle
// and the five around the south pole each give a third of the rings: rings in the caps grow by ten
// triangles every ring away from the pole, rings around the middle are all as long as one another.
// The equator is the line of grid corners exactly halfway between the poles.
export function createPlanetGrid(edgeDivisions: number): PlanetGrid {
  const ringCount = 3 * edgeDivisions;
  const gridRings = Array.from({ length: ringCount }, (_, ring) => gridRingTriangles(ring, edgeDivisions));
  const neighbourRings = findNeighbours(gridRings);
  const icosahedronCorners = createIcosahedronCorners();

  return {
    rings: gridRings.map((gridRing, ring) => gridRing.map((gridTriangle, index) => {
      const corners = gridTriangle.corners.map(corner => gridPoint(corner, edgeDivisions, icosahedronCorners)) as [Point, Point, Point];
      return {
        coordinate: { ring, index },
        corners,
        center: normalize(sum(corners)),
        pointsNorth: gridTriangle.pointsNorth,
        neighbours: neighbourRings[ring]![index]!,
      };
    })),
  };
}

export function ringLength(ring: number, edgeDivisions: number): number {
  if (ring < edgeDivisions) return SECTOR_COUNT * (2 * ring + 1);
  if (ring < 2 * edgeDivisions) return SECTOR_COUNT * 2 * edgeDivisions;
  return SECTOR_COUNT * (2 * (3 * edgeDivisions - 1 - ring) + 1);
}

// A ring is the strip of triangles between two neighbouring lines of the grid, every triangle in it
// sharing an edge with the one before it, the last with the first.
function gridRingTriangles(ring: number, edgeDivisions: number): GridTriangle[] {
  if (ring < edgeDivisions) return northCapRing(ring, edgeDivisions);
  if (ring < 2 * edgeDivisions) return middleRing(ring, edgeDivisions);
  return southCapRing(ring, edgeDivisions);
}

// Within each of the five faces around the north pole the ring holds one more triangle pointing
// north than pointing south: its line nearer the pole has one corner fewer there than the other.
function northCapRing(ring: number, edgeDivisions: number): GridTriangle[] {
  const top = (position: number) => gridPointId(ring, position, edgeDivisions);
  const bottom = (position: number) => gridPointId(ring + 1, position, edgeDivisions);
  const triangles: GridTriangle[] = [];

  for (let sector = 0; sector < SECTOR_COUNT; sector++) {
    const topStart = sector * ring;
    const bottomStart = sector * (ring + 1);
    for (let step = 0; step <= ring; step++) {
      triangles.push({ corners: [top(topStart + step), bottom(bottomStart + step), bottom(bottomStart + step + 1)], pointsNorth: true });
      if (step < ring) {
        triangles.push({ corners: [top(topStart + step), bottom(bottomStart + step + 1), top(topStart + step + 1)], pointsNorth: false });
      }
    }
  }

  return triangles;
}

// Around the middle both lines of a ring have as many corners as each other, every corner of the
// southern line standing a half step east of the one with its place on the northern line.
function middleRing(ring: number, edgeDivisions: number): GridTriangle[] {
  const top = (position: number) => gridPointId(ring, position, edgeDivisions);
  const bottom = (position: number) => gridPointId(ring + 1, position, edgeDivisions);
  const triangles: GridTriangle[] = [];

  for (let position = 0; position < SECTOR_COUNT * edgeDivisions; position++) {
    triangles.push({ corners: [top(position), bottom(position - 1), bottom(position)], pointsNorth: true });
    triangles.push({ corners: [top(position), bottom(position), top(position + 1)], pointsNorth: false });
  }

  return triangles;
}

// The north cap turned upside down: one more triangle pointing south than pointing north.
function southCapRing(ring: number, edgeDivisions: number): GridTriangle[] {
  const stepsFromSouthPole = 3 * edgeDivisions - ring;
  const top = (position: number) => gridPointId(ring, position, edgeDivisions);
  const bottom = (position: number) => gridPointId(ring + 1, position, edgeDivisions);
  const triangles: GridTriangle[] = [];

  for (let sector = 0; sector < SECTOR_COUNT; sector++) {
    const topStart = sector * stepsFromSouthPole;
    const bottomStart = sector * (stepsFromSouthPole - 1);
    for (let step = 0; step < stepsFromSouthPole; step++) {
      triangles.push({ corners: [top(topStart + step), bottom(bottomStart + step), top(topStart + step + 1)], pointsNorth: false });
      if (step < stepsFromSouthPole - 1) {
        triangles.push({ corners: [bottom(bottomStart + step), top(topStart + step + 1), bottom(bottomStart + step + 1)], pointsNorth: true });
      }
    }
  }

  return triangles;
}

// A line closes on itself, so a place past its end is a place from its start over again.
function gridPointId(line: number, position: number, edgeDivisions: number): GridPointId {
  const length = lineLength(line, edgeDivisions);
  return { line, position: ((position % length) + length) % length };
}

function lineLength(line: number, edgeDivisions: number): number {
  if (line === 0 || line === 3 * edgeDivisions) return 1;
  if (line < edgeDivisions) return SECTOR_COUNT * line;
  if (line <= 2 * edgeDivisions) return SECTOR_COUNT * edgeDivisions;
  return SECTOR_COUNT * (3 * edgeDivisions - line);
}

// Two triangles are neighbours when they share an edge, which is found by the two grid corners at
// its ends rather than worked out ring by ring.
function findNeighbours(gridRings: GridTriangle[][]): [TriangleCoordinate, TriangleCoordinate, TriangleCoordinate][][] {
  const trianglesByEdge = new Map<string, TriangleCoordinate[]>();
  gridRings.forEach((gridRing, ring) => gridRing.forEach((gridTriangle, index) => {
    for (const edge of triangleEdgeKeys(gridTriangle)) {
      trianglesByEdge.set(edge, [...(trianglesByEdge.get(edge) ?? []), { ring, index }]);
    }
  }));

  return gridRings.map((gridRing, ring) => gridRing.map((gridTriangle, index) => {
    const neighbours = triangleEdgeKeys(gridTriangle).map(edge =>
      trianglesByEdge.get(edge)!.find(triangle => triangle.ring !== ring || triangle.index !== index)!,
    );
    return orderNeighbours(neighbours, { ring, index }, gridRing.length) as [TriangleCoordinate, TriangleCoordinate, TriangleCoordinate];
  }));
}

function triangleEdgeKeys({ corners: [first, second, third] }: GridTriangle): string[] {
  return [[first, second], [second, third], [third, first]].map(edge =>
    edge.map(corner => `${corner.line}:${corner.position}`).sort().join("-"),
  );
}

function orderNeighbours(neighbours: TriangleCoordinate[], triangle: TriangleCoordinate, ringLengthOfTriangle: number): TriangleCoordinate[] {
  const previousIndex = (triangle.index - 1 + ringLengthOfTriangle) % ringLengthOfTriangle;
  const nextIndex = (triangle.index + 1) % ringLengthOfTriangle;
  const isAlongRing = (neighbour: TriangleCoordinate, alongIndex: number) => neighbour.ring === triangle.ring && neighbour.index === alongIndex;
  return [
    neighbours.find(neighbour => isAlongRing(neighbour, previousIndex))!,
    neighbours.find(neighbour => isAlongRing(neighbour, nextIndex))!,
    neighbours.find(neighbour => neighbour.ring !== triangle.ring)!,
  ];
}

type IcosahedronCorners = { northPole: Point; southPole: Point; upper: Point[]; lower: Point[] };

// Below the north pole stand five corners in a ring, and above the south pole five more, each a
// half step round from the ones above it.
function createIcosahedronCorners(): IcosahedronCorners {
  const sectorAngle = 2 * Math.PI / SECTOR_COUNT;
  const sectors = Array.from({ length: SECTOR_COUNT }, (_, sector) => sector);
  return {
    northPole: [0, 1, 0],
    southPole: [0, -1, 0],
    upper: sectors.map(sector => pointAt(RING_LATITUDE_OF_ICOSAHEDRON_CORNERS, sector * sectorAngle)),
    lower: sectors.map(sector => pointAt(-RING_LATITUDE_OF_ICOSAHEDRON_CORNERS, (sector + 0.5) * sectorAngle)),
  };
}

function pointAt(latitude: number, longitude: number): Point {
  return [Math.cos(latitude) * Math.cos(longitude), Math.sin(latitude), Math.cos(latitude) * Math.sin(longitude)];
}

// A grid corner is a blend of the corners of the face it lies on, pushed out onto the sphere.
function gridPoint({ line, position }: GridPointId, edgeDivisions: number, icosahedronCorners: IcosahedronCorners): Point {
  const { northPole, southPole, upper, lower } = icosahedronCorners;
  const upperCorner = (sector: number) => upper[sector % SECTOR_COUNT]!;
  const lowerCorner = (sector: number) => lower[sector % SECTOR_COUNT]!;

  if (line === 0) return northPole;
  if (line === 3 * edgeDivisions) return southPole;

  if (line <= edgeDivisions) {
    const sector = Math.floor(position / line);
    const step = position % line;
    return normalize(blend([
      [northPole, 1 - line / edgeDivisions],
      [upperCorner(sector), (line - step) / edgeDivisions],
      [upperCorner(sector + 1), step / edgeDivisions],
    ]));
  }

  if (line <= 2 * edgeDivisions) {
    const stepsBelowUpperCorners = line - edgeDivisions;
    const sector = Math.floor(position / edgeDivisions);
    const step = position % edgeDivisions;
    if (step + stepsBelowUpperCorners <= edgeDivisions) {
      return normalize(blend([
        [upperCorner(sector), 1 - step / edgeDivisions - stepsBelowUpperCorners / edgeDivisions],
        [upperCorner(sector + 1), step / edgeDivisions],
        [lowerCorner(sector), stepsBelowUpperCorners / edgeDivisions],
      ]));
    }
    return normalize(blend([
      [lowerCorner(sector), 1 - (step + stepsBelowUpperCorners - edgeDivisions) / edgeDivisions - (edgeDivisions - stepsBelowUpperCorners) / edgeDivisions],
      [lowerCorner(sector + 1), (step + stepsBelowUpperCorners - edgeDivisions) / edgeDivisions],
      [upperCorner(sector + 1), (edgeDivisions - stepsBelowUpperCorners) / edgeDivisions],
    ]));
  }

  const stepsFromSouthPole = 3 * edgeDivisions - line;
  const sector = Math.floor(position / stepsFromSouthPole);
  const step = position % stepsFromSouthPole;
  return normalize(blend([
    [southPole, 1 - stepsFromSouthPole / edgeDivisions],
    [lowerCorner(sector), (stepsFromSouthPole - step) / edgeDivisions],
    [lowerCorner(sector + 1), step / edgeDivisions],
  ]));
}

function blend(weightedPoints: [Point, number][]): Point {
  return sum(weightedPoints.map(([point, weight]) => point.map(coordinate => coordinate * weight) as Point));
}

function sum(points: Point[]): Point {
  return points.reduce<Point>((total, point) => [total[0] + point[0], total[1] + point[1], total[2] + point[2]], [0, 0, 0]);
}

function normalize(point: Point): Point {
  const length = Math.hypot(...point);
  return point.map(coordinate => coordinate / length) as Point;
}
