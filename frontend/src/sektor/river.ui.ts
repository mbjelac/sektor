// What a river is drawn out of. A square of river is a block of ground like any other, with the bed
// of the river cut into the top of it: a trough running between the sides of the square the river
// runs between — straight across it, or round a curve as an L. The trough is covered with water
// lying level with the ground around it.

import p5 from "p5";
import { BLOCK_SIZE } from "../../../shared/constants";
import {
  floorBlockBottom,
  floorBlockHeight,
  FLOOR_SIDE_COLOR,
  FLOOR_UNDERSIDE_COLOR,
} from "../../../shared/drawFloor";
import { SEA_COLOR } from "./sea.ui";
import { withoutDepthWrites } from "../../../shared/applyCommands";
import { GlintPlace, GLINTS_ACROSS_RIVER, RiverSide } from "./river";

// What the panel calls a square of river the player has clicked on.
export const RIVER_NAME = "River";

// How wide the river is, straight or curving, as a part of the width of a square.
const RIVER_WIDTH = BLOCK_SIZE * 0.5;

// How deep the bed of the river is cut into the ground: half of the block.
const RIVER_DEPTH = floorBlockHeight(BLOCK_SIZE) * 0.5;

const RIVER_BED_COLOR: [number, number, number] = [130, 205, 190];

const SURFACE_TRANSPARENCY = 200;

const HALF = BLOCK_SIZE / 2;
const BOTTOM = floorBlockBottom(BLOCK_SIZE);
const TOP = BOTTOM - floorBlockHeight(BLOCK_SIZE);
const RIVER_BED = TOP + RIVER_DEPTH;

// The top of a square is cut three ways along each side of it — the river's width in the middle and
// what is left over on either side — into nine cells. The trough is the middle cell and the cell
// lying between it and each side the river runs out over; every other cell is ground.
const CELL_BOUNDS = [-HALF, -RIVER_WIDTH / 2, RIVER_WIDTH / 2, HALF];

interface Cell {
  x: number;
  z: number;
}

const CELLS: Cell[] = [0, 1, 2].flatMap(x => [0, 1, 2].map(z => ({ x, z })));

// The opaque part of a square of river: the ground, the bed cut into it, and the earth around and
// under it. It is drawn in the pass which writes depth, with the land.
export function drawRiverBed(p: p5, sides: RiverSide[], groundColor: [number, number, number]) {
  const trough = troughCells(sides);
  p.push();
  p.noStroke();
  drawTop(p, trough, groundColor);
  drawTroughWalls(p, trough);
  drawOuterSides(p, trough);
  drawUnderside(p);
  p.pop();
  drawOutlines(p, trough);
}

// The water lying over the bed, level with the ground. It is half seen through, so it is drawn in
// the pass laid over the opaque one.
export function drawRiverSurface(p: p5, sides: RiverSide[]) {
  p.push();
  p.noStroke();
  p.fill(SEA_COLOR[0], SEA_COLOR[1], SEA_COLOR[2], SURFACE_TRANSPARENCY);
  for (const cell of troughCells(sides)) {
    drawLevelCell(p, cell, TOP);
  }
  p.pop();
}

// Where a square of the river lies, and the strips of glints running through it. The glints of the
// whole river go into a single shape, which no transform can be applied in the middle of, so each
// glint is placed against its own square's middle rather than drawn with the square translated
// under it.
export interface RiverSquare {
  centerX: number;
  centerZ: number;
  glintStrips: GlintPlace[][];
}

// A river is never still: light runs down it the way the water flows. Its water is cut into strips
// of small squares of light running with the river. Every glint swells and fades without end, the
// way the sea's glints do, each a little behind the one before it along its strip, so that the
// light travels down the strip from where the river comes into the square to where it goes out.
// The whole river goes into one shape, for the same reason the sea's glints do.
export function drawRiverGlints(p: p5, riverSquares: RiverSquare[], elapsedMilliseconds: number) {
  p.push();
  p.noStroke();
  p.noLights();
  withoutDepthWrites(p, () => {
    p.beginShape(p.TRIANGLES);
    for (const riverSquare of riverSquares) {
      addGlintsOnSquare(p, riverSquare, elapsedMilliseconds);
    }
    p.endShape();
  });
  p.pop();
}

// The glints of a strip lag behind one another so that the light takes one whole cycle to cross the
// square along any of its strips, and runs on into the next square of the river as it leaves this
// one. A strip round the outside of a curve is longer than one round its inside, so the light runs
// faster round the outside and slower round the inside.
//
// The light of every strip starts at its own point in the cycle, so that it does not run down the
// river as one band across it. The strip at the same place across the river starts at the same
// point in every square, so the light it carries runs on unbroken from one square to the next.
function addGlintsOnSquare(p: p5, riverSquare: RiverSquare, elapsedMilliseconds: number) {
  riverSquare.glintStrips.forEach((strip, stripIndex) => {
    const cyclesElapsed = elapsedMilliseconds / GLINT_CYCLE_MILLISECONDS + STRIP_START_OFFSETS[stripIndex];
    strip.forEach((glintPlace, indexInStrip) => {
      addGlint(p, riverSquare, glintPlace, glintAlpha(cyclesElapsed - indexInStrip / strip.length));
    });
  });
}

// Over its cycle a glint goes from clear to white and back to clear, swelling the way the sea's
// glints do: faint for most of its cycle and brightest only briefly.
function glintAlpha(cyclesElapsed: number): number {
  const swell = Math.sin((cyclesElapsed - Math.floor(cyclesElapsed)) * Math.PI);
  return GLINT_MAX_ALPHA * swell * swell;
}

function addGlint(p: p5, riverSquare: RiverSquare, glintPlace: GlintPlace, alpha: number) {
  if (alpha < 1) return;

  const left = riverSquare.centerX + (glintPlace.x - 0.5) * GLINT_SIZE;
  const right = left + GLINT_SIZE;
  const front = riverSquare.centerZ + (glintPlace.z - 0.5) * GLINT_SIZE;
  const back = front + GLINT_SIZE;

  // A fill set between vertices is carried by the vertices after it, so every glint keeps its own
  // brightness although the whole river is one shape.
  p.fill(255, 255, 255, alpha);
  p.vertex(left, GLINT_HEIGHT, front);
  p.vertex(right, GLINT_HEIGHT, front);
  p.vertex(right, GLINT_HEIGHT, back);
  p.vertex(left, GLINT_HEIGHT, front);
  p.vertex(right, GLINT_HEIGHT, back);
  p.vertex(left, GLINT_HEIGHT, back);
}

const GLINT_SIZE = RIVER_WIDTH / GLINTS_ACROSS_RIVER;

// How far into its cycle the light of each strip starts, as a part of the whole cycle: one for each
// place across the river, from its left bank to its right, drawn once for the whole river.
const STRIP_START_OFFSETS = Array.from({ length: GLINTS_ACROSS_RIVER }, () => Math.random());

// How long a glint takes to swell and fade away again, which is as long as the light takes to run
// down a strip from one side of a square to the other.
const GLINT_CYCLE_MILLISECONDS = 5000;

// How white a glint gets at its brightest
const GLINT_MAX_ALPHA = 50;

// The glints hang a little under the surface of the water, as the sea's do, well clear of the bed.
// Screen up is negative, so this is added to sink them.
const GLINT_HEIGHT = TOP + BLOCK_SIZE * 0.015;

function troughCells(sides: RiverSide[]): Cell[] {
  return [{ x: 1, z: 1 }, ...sides.map(side => ({ x: 1 + side.x, z: 1 + side.z }))];
}

function isTrough(trough: Cell[], cell: Cell): boolean {
  return trough.some(troughCell => troughCell.x === cell.x && troughCell.z === cell.z);
}

function drawTop(p: p5, trough: Cell[], groundColor: [number, number, number]) {
  for (const cell of CELLS) {
    if (isTrough(trough, cell)) {
      p.fill(...RIVER_BED_COLOR);
      drawLevelCell(p, cell, RIVER_BED);
    } else {
      p.fill(...groundColor);
      drawLevelCell(p, cell, TOP);
    }
  }
}

function drawLevelCell(p: p5, cell: Cell, height: number) {
  const [fromX, toX] = [CELL_BOUNDS[cell.x], CELL_BOUNDS[cell.x + 1]];
  const [fromZ, toZ] = [CELL_BOUNDS[cell.z], CELL_BOUNDS[cell.z + 1]];
  p.beginShape();
  p.normal(0, -1, 0);
  p.vertex(fromX, height, fromZ);
  p.vertex(toX, height, fromZ);
  p.vertex(toX, height, toZ);
  p.vertex(fromX, height, toZ);
  p.endShape(p.CLOSE);
}

// Wherever the trough meets ground inside the square, a wall of earth stands between the bed and
// the ground, facing into the trough.
function drawTroughWalls(p: p5, trough: Cell[]) {
  p.fill(...FLOOR_SIDE_COLOR);
  for (const wall of troughWalls(trough)) {
    drawUpright(p, wall.from, wall.to, wall.facing, TOP, RIVER_BED);
  }
}

interface Wall {
  from: [number, number];
  to: [number, number];
  facing: RiverSide;
}

function troughWalls(trough: Cell[]): Wall[] {
  return trough.flatMap(cell => DIRECTIONS
    .map(direction => ({ x: cell.x + direction.x, z: cell.z + direction.z, direction }))
    .filter(neighbour => isInsideSquare(neighbour) && !isTrough(trough, neighbour))
    .map(neighbour => edgeOfCell(cell, neighbour.direction)));
}

function isInsideSquare(cell: Cell): boolean {
  return cell.x >= 0 && cell.x <= 2 && cell.z >= 0 && cell.z <= 2;
}

// The edge of a cell on one side of it, facing back into the cell.
function edgeOfCell(cell: Cell, direction: RiverSide): Wall {
  const facing = { x: -direction.x, z: -direction.z };
  if (direction.x !== 0) {
    const x = CELL_BOUNDS[cell.x + (direction.x > 0 ? 1 : 0)];
    return { from: [x, CELL_BOUNDS[cell.z]], to: [x, CELL_BOUNDS[cell.z + 1]], facing };
  }
  const z = CELL_BOUNDS[cell.z + (direction.z > 0 ? 1 : 0)];
  return { from: [CELL_BOUNDS[cell.x], z], to: [CELL_BOUNDS[cell.x + 1], z], facing };
}

// Each side of the block is the side of the three cells lying along it. Where one of them is the
// trough, the side stands only as high as the bed, so that the river runs out of the square
// through a notch in it.
function drawOuterSides(p: p5, trough: Cell[]) {
  p.fill(...FLOOR_SIDE_COLOR);
  for (const segment of outerSideSegments(trough)) {
    drawUpright(p, segment.from, segment.to, segment.facing, segment.top, BOTTOM);
  }
}

interface SideSegment extends Wall {
  top: number;
}

function outerSideSegments(trough: Cell[]): SideSegment[] {
  return DIRECTIONS.flatMap(direction => cellsAlongSide(direction).map(cell => ({
    ...edgeOfCell(cell, direction),
    facing: direction,
    top: isTrough(trough, cell) ? RIVER_BED : TOP,
  })));
}

function cellsAlongSide(direction: RiverSide): Cell[] {
  return [0, 1, 2].map(along => direction.x !== 0
    ? { x: direction.x > 0 ? 2 : 0, z: along }
    : { x: along, z: direction.z > 0 ? 2 : 0 });
}

function drawUpright(
  p: p5,
  [fromX, fromZ]: [number, number],
  [toX, toZ]: [number, number],
  facing: RiverSide,
  top: number,
  bottom: number,
) {
  p.beginShape();
  p.normal(facing.x, 0, facing.z);
  p.vertex(fromX, top, fromZ);
  p.vertex(toX, top, toZ);
  p.vertex(toX, bottom, toZ);
  p.vertex(fromX, bottom, fromZ);
  p.endShape(p.CLOSE);
}

function drawUnderside(p: p5) {
  p.fill(...FLOOR_UNDERSIDE_COLOR);
  p.beginShape();
  p.normal(0, 1, 0);
  p.vertex(-HALF, BOTTOM, -HALF);
  p.vertex(HALF, BOTTOM, -HALF);
  p.vertex(HALF, BOTTOM, HALF);
  p.vertex(-HALF, BOTTOM, HALF);
  p.endShape(p.CLOSE);
}

// The faces are drawn without edges, as the ground is cut into cells which would otherwise show as
// a grid on top of the square. The edges a block of ground shows — its sides, and here the rim of
// the trough — are drawn on their own, in whatever stroke the square is drawn in.
function drawOutlines(p: p5, trough: Cell[]) {
  p.push();
  p.noFill();
  for (const segment of outerSideSegments(trough)) {
    drawOutline(p, segment.from, segment.to, segment.top, BOTTOM);
  }
  for (const wall of troughWalls(trough)) {
    drawOutline(p, wall.from, wall.to, TOP, RIVER_BED);
  }
  p.pop();
}

function drawOutline(
  p: p5,
  [fromX, fromZ]: [number, number],
  [toX, toZ]: [number, number],
  top: number,
  bottom: number,
) {
  p.beginShape();
  p.vertex(fromX, top, fromZ);
  p.vertex(toX, top, toZ);
  p.vertex(toX, bottom, toZ);
  p.vertex(fromX, bottom, fromZ);
  p.endShape(p.CLOSE);
}

const DIRECTIONS: RiverSide[] = [{ x: 0, z: -1 }, { x: 0, z: 1 }, { x: -1, z: 0 }, { x: 1, z: 0 }];
