// Everything the sea is drawn out of: the water of a square, and the light shimmering over it.
// Which squares of a sektor are sea is the map's business; all this knows is how water looks.

import p5 from "p5";
import { drawWaterBed, drawWaterSurface, waterSurfaceHeight } from "../../../shared/drawFloor";
import { BLOCK_SIZE } from "../../../shared/constants";

export const SEA_COLOR: [number, number, number] = [66, 183, 255];

// The bed of the sea is as solid as the land is and belongs in the pass which writes depth; the
// surface over it is half seen through and belongs in the pass laid over that one.
export function drawSeaBed(p: p5) {
  drawWaterBed(p, BLOCK_SIZE, SEA_COLOR);
}

export function drawSeaSurface(p: p5) {
  drawWaterSurface(p, BLOCK_SIZE, SEA_COLOR);
}

// Where a square of the sea lies. The glints of the whole sea go into a single shape, which no
// transform can be applied in the middle of, so each glint is placed against its own square's
// water rather than drawn with the square translated under it. A square is known by its place on
// the map as well as in the world, as that is what tells its glints from every other square's.
export interface SeaSquare {
  x: number;
  z: number;
  centerX: number;
  centerZ: number;
}

// The sea is never still. White glints shimmer over the water, each fading in and out where it
// lies. No two glints keep the same count, so the sea is never all bright or all bare at once.
//
// There are thousands of them, and drawing each as a line of its own would cost p5 a geometry
// rebuild and a GPU upload per glint per frame — the same price the floors and the buildings are
// baked to get out of paying, at several times the scale. The whole sea goes into one shape
// instead: a single upload and a single draw call, however much water the map carries.
export function drawSeaGlints(p: p5, seaSquares: SeaSquare[], elapsedMilliseconds: number) {
  p.push();
  p.noFill();
  p.noLights();
  p.strokeWeight(WAVE_LINE_WEIGHT);
  p.beginShape(p.LINES);
  for (const seaSquare of seaSquares) {
    addGlintsOnSquare(p, seaSquare, elapsedMilliseconds);
  }
  p.endShape();
  p.pop();
}

// Every square of the sea carries its own grid of glints, lying on the floor of the map. A glint
// is numbered by where it falls in the grid the whole sea is covered with rather than in its own
// square's, so that no two squares shimmer alike and the sea does not show its tiling.
function addGlintsOnSquare(p: p5, seaSquare: SeaSquare, elapsedMilliseconds: number) {
  for (let glintX = 0; glintX < WAVE_GRID_SIZE; glintX++) {
    for (let glintZ = 0; glintZ < WAVE_GRID_SIZE; glintZ++) {
      addGlint(
        p,
        seaSquare.x * WAVE_GRID_SIZE + glintX,
        seaSquare.z * WAVE_GRID_SIZE + glintZ,
        seaSquare,
        elapsedMilliseconds,
      );
    }
  }
}

// A glint is a very short line lying flat on the water, running along the square it lies on rather
// than across it; every glint on the sea runs the same way. Over its cycle it swells from nothing
// to full white and back down to nothing, holding still the whole while; it moves only between
// cycles, landing somewhere new while there is nothing of it to see. Squaring the swell keeps it
// faint for most of the cycle and bright only briefly, which is what makes the water glitter
// rather than pulse.
function addGlint(p: p5, glintX: number, glintZ: number, seaSquare: SeaSquare, elapsedMilliseconds: number) {
  const cyclesElapsed = elapsedMilliseconds / WAVE_CYCLE_MILLISECONDS + waveVariation(glintX, glintZ, 1);
  const cycleNumber = Math.floor(cyclesElapsed);
  const swell = Math.sin((cyclesElapsed - cycleNumber) * Math.PI);
  if (swell <= 0) return;

  // Counting the cycle into the seed is what moves the glint: the roll comes out differently on
  // every cycle, so the glint comes back somewhere new each time. Two seeds go to a cycle, one
  // for each side it is measured along.
  const offsetAlongXSeed = 2 + cycleNumber * 2;
  const offsetAlongZSeed = 3 + cycleNumber * 2;
  const centerX = seaSquare.centerX + glintPosition(glintX, waveVariation(glintX, glintZ, offsetAlongXSeed));
  const centerZ = seaSquare.centerZ + glintPosition(glintZ, waveVariation(glintX, glintZ, offsetAlongZSeed));
  const halfLength = WAVE_LINE_LENGTH / 2;

  // A stroke color set between vertices is carried by the vertices after it, so every glint keeps
  // its own brightness although the whole sea is one shape.
  p.stroke(255, 255, 255, WAVE_MAX_ALPHA * swell * swell);
  p.vertex(centerX - halfLength, GLINT_HEIGHT, centerZ);
  p.vertex(centerX + halfLength, GLINT_HEIGHT, centerZ);
}

// The glints are anchored to an even grid over the water, each in the middle of its own share of
// its square, so that the shimmer is spread across the whole sea rather than clumping anywhere on
// it. The square is shared out whole, which is what puts a glint half a spacing from the edge it
// lies against: any less than the whole and the rims of the squares would show as bare water, any
// more and the glints of neighbouring squares would crowd over their shared edge. Each glint is
// then nudged off its anchor by a fraction of the distance to the next one, which takes the ruled
// look off the grid while leaving the spread of it alone. A glint is numbered across the whole sea
// while it is drawn within its own square, so what places it is what is left of its number once
// the squares before it are taken off.
function glintPosition(glintIndex: number, offsetVariation: number): number {
  const spacing = BLOCK_SIZE / WAVE_GRID_SIZE;
  const placeInGrid = (glintIndex % WAVE_GRID_SIZE + 0.5) * spacing - BLOCK_SIZE / 2;
  return placeInGrid + (offsetVariation - 0.5) * 2 * WAVE_GLINT_OFFSET * spacing;
}

// When a glint swells, and where it comes back each time it does, have to come out the same every
// frame, or the sea would jump about instead of shimmering. So a glint's own place in the grid
// stands in for the die roll, scrambled past all resemblance to its neighbours' — an even grid of
// dots all swelling together would read as a grid, which is the one thing the sea must not look
// like. The seed tells a glint's rolls apart: when it swells, and where it lands on each cycle.
function waveVariation(glintX: number, glintZ: number, seed: number): number {
  const scrambled = Math.sin(glintX * 127.1 + glintZ * 311.7 + seed * 74.7) * 43758.5453;
  return scrambled - Math.floor(scrambled);
}

// How many glints stand along each side of a square of water; every square carries the square of
// this many.
const WAVE_GRID_SIZE = 5;

// How long a glint takes to swell and fade away again.
const WAVE_CYCLE_MILLISECONDS = 1730;

// How far off its anchor a glint may land, as a part of the distance between one glint and the
// next. It is given a fresh place under this every time it fades out and comes back.
const WAVE_GLINT_OFFSET = 0.5;

// How long a glint is. A wave crest seen from this far up is a scratch of light, not a stroke.
const WAVE_LINE_LENGTH = BLOCK_SIZE * 0.03;

const WAVE_MAX_ALPHA = 230;

const WAVE_LINE_WEIGHT = BLOCK_SIZE * 0.005;

// How far under the surface the glints hang. They can sit this close because the surface writes no
// depth for them to fight over: what they are held against is the bed, well below them. Screen up
// is negative, so this is added to sink them.
const WAVE_DEPTH_UNDER_SURFACE = BLOCK_SIZE * 0.015;

// The glints lie a little under the surface of the water rather than on it, as light caught in the
// sea rather than laid over it. Every square of the sea stands at the same height, so they all
// hang at the one depth.
const GLINT_HEIGHT = waterSurfaceHeight(BLOCK_SIZE) + WAVE_DEPTH_UNDER_SURFACE;
