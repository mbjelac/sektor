// Everything the sea is drawn out of: the water of a square, and the light shimmering over it.
// Which squares of a sektor are sea is the map's business; all this knows is how water looks.

import p5 from "p5";
import { drawWaterBed, drawWaterSurface, waterSurfaceHeight } from "../../../shared/drawFloor";
import { BLOCK_SIZE } from "../../../shared/constants";
import { withoutDepthWrites } from "../../../shared/applyCommands";

export const SEA_COLOR: [number, number, number] = [66, 183, 255];

// What the panel calls a square of water the player has clicked on.
export const SEA_NAME = "Sea";

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

// The sea is never still. Every square of water is cut into a grid of smaller squares of light,
// each fading in and out on its own count, so the sea is never all bright or all bare at once.
//
// There are thousands of them, and drawing each as a shape of its own would cost p5 a geometry
// rebuild and a GPU upload per glint per frame — the same price the floors and the buildings are
// baked to get out of paying, at several times the scale. The whole sea goes into one shape
// instead: a single upload and a single draw call, however much water the map carries.
//
// The glints are only ever half seen, and between them they cover the whole of the sea, so they
// write no depth: the water they lie in would otherwise hide whatever stands under it.
export function drawSeaGlints(p: p5, seaSquares: SeaSquare[], elapsedMilliseconds: number) {
  p.push();
  p.noStroke();
  p.noLights();
  withoutDepthWrites(p, () => {
    p.beginShape(p.TRIANGLES);
    for (const seaSquare of seaSquares) {
      addGlintsOnSquare(p, seaSquare, elapsedMilliseconds);
    }
    p.endShape();
  });
  p.pop();
}

// Every square of the sea is cut into a grid of glints, lying on the floor of the map. A glint is
// numbered by where it falls in the grid the whole sea is covered with rather than in its own
// square's, so that no two squares shimmer alike and the sea does not show its tiling.
function addGlintsOnSquare(p: p5, seaSquare: SeaSquare, elapsedMilliseconds: number) {
  for (let glintX = 0; glintX < GLINT_GRID_SIZE; glintX++) {
    for (let glintZ = 0; glintZ < GLINT_GRID_SIZE; glintZ++) {
      addGlint(
        p,
        seaSquare.x * GLINT_GRID_SIZE + glintX,
        seaSquare.z * GLINT_GRID_SIZE + glintZ,
        seaSquare,
        elapsedMilliseconds,
      );
    }
  }
}

// A glint is a square lying flat on the water, filling its whole share of the square it lies on,
// so that glints standing side by side touch edge to edge. It never moves; over its cycle it goes
// from clear to a thin white and back to clear. It never reaches full white — the water is lit,
// not painted over. Squaring the swell keeps it faint for most of the cycle and brightest only
// briefly, which is what makes the water glitter rather than pulse.
function addGlint(p: p5, glintX: number, glintZ: number, seaSquare: SeaSquare, elapsedMilliseconds: number) {
  const cyclesElapsed = elapsedMilliseconds / GLINT_CYCLE_MILLISECONDS + glintVariation(glintX, glintZ);
  const swell = Math.sin((cyclesElapsed - Math.floor(cyclesElapsed)) * Math.PI);
  const alpha = GLINT_MAX_ALPHA * swell * swell;
  if (alpha < 1) return;

  const left = seaSquare.centerX + glintEdge(glintX);
  const right = left + GLINT_SIZE;
  const front = seaSquare.centerZ + glintEdge(glintZ);
  const back = front + GLINT_SIZE;

  // A fill set between vertices is carried by the vertices after it, so every glint keeps its own
  // brightness although the whole sea is one shape.
  p.fill(255, 255, 255, alpha);
  p.vertex(left, GLINT_HEIGHT, front);
  p.vertex(right, GLINT_HEIGHT, front);
  p.vertex(right, GLINT_HEIGHT, back);
  p.vertex(left, GLINT_HEIGHT, front);
  p.vertex(right, GLINT_HEIGHT, back);
  p.vertex(left, GLINT_HEIGHT, back);
}

// Where the near edge of a glint lies, measured from the middle of its square. A glint is numbered
// across the whole sea while it is drawn within its own square, so what places it is what is left
// of its number once the squares before it are taken off.
function glintEdge(glintIndex: number): number {
  return (glintIndex % GLINT_GRID_SIZE) * GLINT_SIZE - BLOCK_SIZE / 2;
}

// When a glint swells has to come out the same every frame, or the sea would flicker instead of
// shimmering. So a glint's own place in the grid stands in for the die roll, scrambled past all
// resemblance to its neighbours' — a grid of squares all swelling together would read as a grid,
// which is the one thing the sea must not look like.
function glintVariation(glintX: number, glintZ: number): number {
  const scrambled = Math.sin(glintX * 127.1 + glintZ * 311.7 + 74.7) * 43758.5453;
  return scrambled - Math.floor(scrambled);
}

// How many glints stand along each side of a square of water; every square carries the square of
// this many.
const GLINT_GRID_SIZE = 4;

// How long a side of a glint is: its whole share of its square.
const GLINT_SIZE = BLOCK_SIZE / GLINT_GRID_SIZE;

// How long a glint takes to swell and fade away again.
const GLINT_CYCLE_MILLISECONDS = 5000;

// How white a glint gets at its brightest: well short of opaque, so the water always shows through.
const GLINT_MAX_ALPHA = 40;

// How far under the surface the glints hang. They can sit this close because the surface writes no
// depth for them to fight over: what they are held against is the bed, well below them. Screen up
// is negative, so this is added to sink them.
const GLINT_DEPTH_UNDER_SURFACE = BLOCK_SIZE * 0.015;

// The glints lie a little under the surface of the water rather than on it, as light caught in the
// sea rather than laid over it. Every square of the sea stands at the same height, so they all
// hang at the one depth.
const GLINT_HEIGHT = waterSurfaceHeight(BLOCK_SIZE) + GLINT_DEPTH_UNDER_SURFACE;
