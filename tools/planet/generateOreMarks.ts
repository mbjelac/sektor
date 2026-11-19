// Marks the areas of the planet rich in an ore, and writes the marks into planet.md: the ore's name
// at the end of the area's line. Run with `node tools/planet/generateOreMarks.ts` from the repo root.
// The marks are drawn from a fixed seed, so running it again gives the same planet.
//
// Metals are drawn first as crescent-shaped curves, a fifth of them along coastlines, two fifths
// inland and two fifths on the seabed. Minerals follow as straight, curvy or slightly broken lines
// anywhere, then uranium as small clusters with empty areas between them. A later ore takes an area
// over from an earlier one. Last, the open sea, sea areas with no land next to them, loses its marks.
import { readFileSync, writeFileSync } from "node:fs";
import { createPlanetGrid, type PlanetTriangle, type Point, type TriangleCoordinate } from "../../frontend/src/list/planetGrid.ts";

const PLANET_PATH = "frontend/src/assets/planet.md";
const EDGE_DIVISIONS = 32;
const SEED = 66;

const METAL_CURVE_COUNT = 70;
const METAL_COASTAL_SHARE = 0.2;
const METAL_INLAND_SHARE = 0.4;
const METAL_LENGTH = { least: 2, most: 5 };
const MINERAL_LINE_COUNT = 80;
const MINERAL_LENGTH = { least: 2, most: 4 };
const URANIUM_CLUSTER_COUNT = 30;
const URANIUM_SIZE = { least: 1, most: 4 };
const ATTEMPTS = 200;

type Ore = "metals" | "minerals" | "uranium";
type AreaKind = "coastal" | "inland" | "seabed";

const random = seededRandom(SEED);
const grid = createPlanetGrid(EDGE_DIVISIONS);
const triangles = grid.rings.flat();
const planetLines = readFileSync(PLANET_PATH, "utf8").split("\n");
const areaLineNumbers = findAreaLineNumbers(planetLines);
const isLandByKey = new Map(triangles.map(triangle => [keyOf(triangle.coordinate), /\sL(\s|$)/.test(planetLines[areaLineNumbers.get(keyOf(triangle.coordinate))!]!)]));
const oreByKey = new Map<string, Ore>();

drawMetals();
drawMinerals();
drawUranium();
clearOpenSea();
writePlanet();

function drawMetals() {
  const coastalCount = Math.round(METAL_CURVE_COUNT * METAL_COASTAL_SHARE);
  const inlandCount = Math.round(METAL_CURVE_COUNT * METAL_INLAND_SHARE);
  const seabedCount = METAL_CURVE_COUNT - coastalCount - inlandCount;
  const kinds: [AreaKind, number][] = [["coastal", coastalCount], ["inland", inlandCount], ["seabed", seabedCount]];
  for (const [kind, count] of kinds) {
    const triangleFits = (triangle: PlanetTriangle) => areaKind(triangle) === kind;
    for (let curve = 0; curve < count; curve++) {
      const length = randomInteger(METAL_LENGTH.least, METAL_LENGTH.most);
      const turnDegrees = randomBetween(12, 25) * (random() < 0.5 ? -1 : 1);
      const curveTriangles = bestAttempt(length, METAL_LENGTH.least, () =>
        walkLine(length, triangleFits, "metals", () => turnDegrees, () => false));
      mark(curveTriangles, "metals");
    }
  }
}

function drawMinerals() {
  for (let line = 0; line < MINERAL_LINE_COUNT; line++) {
    const length = randomInteger(MINERAL_LENGTH.least, MINERAL_LENGTH.most);
    const style = randomInteger(0, 2);
    const curvyTurnDegrees = randomBetween(15, 30);
    const curvyPhase = randomBetween(0, 2 * Math.PI);
    const turn = [
      () => 0,
      (step: number) => curvyTurnDegrees * Math.sin(curvyPhase + step),
      () => randomBetween(-5, 5),
    ][style]!;
    // A broken line leaves a gap or two along it.
    const gapSteps = style === 2 ? new Set([randomInteger(1, length - 1), randomInteger(1, length - 1)]) : new Set<number>();
    const lineTriangles = bestAttempt(length, MINERAL_LENGTH.least, () =>
      walkLine(length, () => true, "minerals", turn, step => gapSteps.has(step)));
    mark(lineTriangles, "minerals");
  }
}

function drawUranium() {
  for (let cluster = 0; cluster < URANIUM_CLUSTER_COUNT; cluster++) {
    const size = randomInteger(URANIUM_SIZE.least, URANIUM_SIZE.most);
    const clusterTriangles = bestAttempt(size, URANIUM_SIZE.least, () => growCluster(size));
    mark(clusterTriangles, "uranium");
  }
}

// Tries again from another start until a line or cluster comes out as long as asked, settling for
// the longest at least as long as the least allowed.
function bestAttempt(length: number, leastLength: number, attempt: () => PlanetTriangle[]): PlanetTriangle[] {
  let best: PlanetTriangle[] = [];
  for (let attemptNumber = 0; attemptNumber < ATTEMPTS && best.length < length; attemptNumber++) {
    const attempted = attempt();
    if (attempted.length > best.length) best = attempted;
  }
  if (best.length < leastLength) throw new Error(`could not draw ${length} areas`);
  return best;
}

// A line goes from a random start with a heading along the planet's surface, stepping each time to
// the neighbour lying most along the heading, then turning the heading by the turn of the step. A
// gap step is stepped over without being marked. The line stops where no neighbour lies ahead.
function walkLine(
  length: number,
  triangleFits: (triangle: PlanetTriangle) => boolean,
  ore: Ore,
  turnDegrees: (step: number) => number,
  isGap: (step: number) => boolean,
): PlanetTriangle[] {
  const isFree = (triangle: PlanetTriangle) => triangleFits(triangle) && oreByKey.get(keyOf(triangle.coordinate)) !== ore;
  const start = randomTriangle(isFree);
  if (!start) return [];

  const visited = new Set([keyOf(start.coordinate)]);
  const marked = [start];
  let current = start;
  let heading = randomTangent(start.center);
  for (let step = 1; marked.length < length; step++) {
    const ahead = current.neighbours
      .map(neighbour => triangleAt(neighbour))
      .filter(neighbour => !visited.has(keyOf(neighbour.coordinate)) && isFree(neighbour))
      .map(neighbour => ({ neighbour, alignment: dot(normalize(subtract(neighbour.center, current.center)), heading) }))
      .filter(({ alignment }) => alignment > 0)
      .sort((first, second) => second.alignment - first.alignment)[0];
    if (!ahead) break;
    current = ahead.neighbour;
    visited.add(keyOf(current.coordinate));
    if (!isGap(step)) marked.push(current);
    heading = rotateAround(tangentPart(heading, current.center), current.center, turnDegrees(step) * Math.PI / 180);
  }
  return marked;
}

// A cluster grows from a random start onto neighbouring areas, never touching another cluster.
function growCluster(size: number): PlanetTriangle[] {
  const isFree = (triangle: PlanetTriangle) =>
    oreByKey.get(keyOf(triangle.coordinate)) !== "uranium"
    && triangle.neighbours.every(neighbour => oreByKey.get(keyOf(neighbour)) !== "uranium");
  const start = randomTriangle(isFree);
  if (!start) return [];

  const cluster = [start];
  const inCluster = new Set([keyOf(start.coordinate)]);
  while (cluster.length < size) {
    const frontier = cluster
      .flatMap(triangle => triangle.neighbours.map(neighbour => triangleAt(neighbour)))
      .filter(triangle => !inCluster.has(keyOf(triangle.coordinate)) && isFree(triangle));
    if (frontier.length === 0) break;
    const next = frontier[Math.floor(random() * frontier.length)]!;
    cluster.push(next);
    inCluster.add(keyOf(next.coordinate));
  }
  return cluster;
}

function clearOpenSea() {
  for (const triangle of triangles) {
    if (areaKind(triangle) === "seabed") oreByKey.delete(keyOf(triangle.coordinate));
  }
}

function mark(markedTriangles: PlanetTriangle[], ore: Ore) {
  for (const triangle of markedTriangles) oreByKey.set(keyOf(triangle.coordinate), ore);
}

function writePlanet() {
  const writtenLines = [...planetLines];
  for (const triangle of triangles) {
    const lineNumber = areaLineNumbers.get(keyOf(triangle.coordinate))!;
    const withoutOre = writtenLines[lineNumber]!.replace(/\s+(metals|minerals|uranium)$/, "");
    const ore = oreByKey.get(keyOf(triangle.coordinate));
    writtenLines[lineNumber] = ore ? `${withoutOre} ${ore}` : withoutOre;
  }
  writeFileSync(PLANET_PATH, writtenLines.join("\n"));

  const counts = (["metals", "minerals", "uranium"] as Ore[]).map(ore =>
    `${ore}: ${[...oreByKey.values()].filter(markedOre => markedOre === ore).length}`);
  console.log(counts.join(", "));
}

// The areas' lines in planet.md, by the triangle each stands for.
function findAreaLineNumbers(lines: string[]): Map<string, number> {
  const lineNumbers = new Map<string, number>();
  let isInTopology = false;
  let ring = -1;
  let index = 0;
  lines.forEach((line, lineNumber) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) isInTopology = trimmed === "# Topology";
    if (!isInTopology) return;
    const ringHeading = trimmed.match(/^## Ring (\d+)$/);
    if (ringHeading) {
      ring = Number(ringHeading[1]);
      index = 0;
      return;
    }
    if (/^#[0-9a-fA-F]{6}\b/.test(trimmed)) lineNumbers.set(keyOf({ ring, index: index++ }), lineNumber);
  });
  return lineNumbers;
}

function areaKind(triangle: PlanetTriangle): AreaKind {
  const isLand = isLandByKey.get(keyOf(triangle.coordinate))!;
  const isCoastal = triangle.neighbours.some(neighbour => isLandByKey.get(keyOf(neighbour)) !== isLand);
  if (isCoastal) return "coastal";
  return isLand ? "inland" : "seabed";
}

function randomTriangle(triangleFits: (triangle: PlanetTriangle) => boolean): PlanetTriangle | null {
  const fitting = triangles.filter(triangleFits);
  return fitting.length === 0 ? null : fitting[Math.floor(random() * fitting.length)]!;
}

function triangleAt({ ring, index }: TriangleCoordinate): PlanetTriangle {
  return grid.rings[ring]![index]!;
}

function keyOf({ ring, index }: TriangleCoordinate): string {
  return `${ring}:${index}`;
}

function randomTangent(normal: Point): Point {
  const randomPoint: Point = [randomBetween(-1, 1), randomBetween(-1, 1), randomBetween(-1, 1)];
  return tangentPart(randomPoint, normal);
}

// The part of a direction lying along the surface where the normal stands out of it.
function tangentPart(direction: Point, normal: Point): Point {
  const along = dot(direction, normal);
  return normalize(subtract(direction, scale(normal, along)));
}

// Rodrigues' rotation of a tangent direction around the normal.
function rotateAround(direction: Point, axis: Point, angle: number): Point {
  return normalize(add(scale(direction, Math.cos(angle)), scale(cross(axis, direction), Math.sin(angle))));
}

function dot(first: Point, second: Point): number {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
}

function cross(first: Point, second: Point): Point {
  return [
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0],
  ];
}

function add(first: Point, second: Point): Point {
  return [first[0] + second[0], first[1] + second[1], first[2] + second[2]];
}

function subtract(first: Point, second: Point): Point {
  return [first[0] - second[0], first[1] - second[1], first[2] - second[2]];
}

function scale(point: Point, factor: number): Point {
  return [point[0] * factor, point[1] * factor, point[2] * factor];
}

function normalize(point: Point): Point {
  return scale(point, 1 / Math.hypot(...point));
}

function randomInteger(least: number, most: number): number {
  return least + Math.floor(random() * (most - least + 1));
}

function randomBetween(least: number, most: number): number {
  return least + random() * (most - least);
}

// mulberry32: a small random number generator that gives the same numbers from the same seed.
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
