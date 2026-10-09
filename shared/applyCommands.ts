import p5 from "p5";
import {drawPyramid} from "./primitive/drawPyramid";
import {drawPrism} from "./primitive/drawPrism";
import {drawSphere} from "./primitive/drawSphere";
import {drawCylinder} from "./primitive/drawCylinder";
import {drawCone} from "./primitive/drawCone";
import {drawTorus, torusTubeRadius} from "./primitive/drawTorus";
import {CreateBody} from "./parseCommands";
import {BLOCK_SIZE} from "./constants";
import {animatedColor, animatedRotate, animatedTranslate, isShown} from "./animateCommands";

const pyrSides: Record<string, number> = {
  pyr3: 3, pyr4: 4, pyr5: 5, pyr6: 6, pyr7: 7, pyr8: 8, pyr9: 9,
};

const priSides: Record<string, number> = {
  pri3: 3, pri4: 4, pri5: 5, pri6: 6, pri7: 7, pri8: 8, pri9: 9,
};

// How far the top of the ground stands above the origin: the floor block is centred on it.
const GROUND_HEIGHT = (BLOCK_SIZE * 0.15) / 2;

export function applyCommands(p: p5, commands: CreateBody[], elapsedMilliseconds = 0) {
  drawBodies(p, opaqueBodies(commands, elapsedMilliseconds), elapsedMilliseconds);

  const transparentCommands = transparentBodies(commands, elapsedMilliseconds);
  if (transparentCommands.length === 0) return;
  withoutDepthWrites(p, () => drawBodies(p, transparentCommands, elapsedMilliseconds));
}

// A body which is hidden, or has no opacity at all, would show nothing, so it is not drawn: there
// is nothing for it to leave behind, in the depth buffer or anywhere else.
export function drawBodies(p: p5, commands: CreateBody[], elapsedMilliseconds: number) {
  for (const command of commands) {
    const color = bodyColor(command, elapsedMilliseconds);
    if (!isShown(command, elapsedMilliseconds) || isInvisible(color)) continue;
    drawBody(p, command, color, elapsedMilliseconds);
  }
}

// Opaque bodies are drawn first, so they populate the depth buffer before any blending.
export function opaqueBodies(commands: CreateBody[], elapsedMilliseconds: number): CreateBody[] {
  return commands.filter(command => !isTransparent(bodyColor(command, elapsedMilliseconds)));
}

export function transparentBodies(commands: CreateBody[], elapsedMilliseconds: number): CreateBody[] {
  return commands.filter(command => isTransparent(bodyColor(command, elapsedMilliseconds)));
}

// Transparent bodies do not write depth, so they never hide bodies behind them. p5 turns depth
// writes back on whenever it switches blending on or off, which it does on the first transparent
// body after an opaque one, so depth writes are kept off by holding p5's hands off them until the
// transparent bodies are drawn.
export function withoutDepthWrites(p: p5, drawTransparent: () => void) {
  const gl = p.drawingContext as WebGLRenderingContext;
  const depthMask = gl.depthMask;
  gl.depthMask(false);
  gl.depthMask = () => {};
  try {
    drawTransparent();
  } finally {
    gl.depthMask = depthMask;
    gl.depthMask(true);
  }
}

function bodyColor(command: CreateBody, elapsedMilliseconds: number): string | undefined {
  return animatedColor(command, elapsedMilliseconds) ?? undefined;
}

function isTransparent(color: string | undefined): boolean {
  return colorAlpha(color) < 255;
}

function isInvisible(color: string | undefined): boolean {
  return colorAlpha(color) === 0;
}

function colorAlpha(color: string | undefined): number {
  if (color === undefined || color.length < 9) return 255;
  return parseInt(color.slice(7, 9), 16);
}

function drawBody(p: p5, command: CreateBody, color: string | undefined, elapsedMilliseconds: number) {
  p.push();
  // A body's base stands on its t() point, and t() is measured from the top of the ground, so
  // t(x,y,0) stands a body of any height on the ground. Rotation turns it about its own centre,
  // halfway up the body above that point, so that a body spinning in place stays in place — or
  // about a point ro() away from that centre.
  const translate = animatedTranslate(command, elapsedMilliseconds);
  const rotationOffset = command.rotationOffset ?? [0, 0, 0];
  const scale = BLOCK_SIZE / 100;
  const centreHeight = bodyCentreHeight(command);
  const heightFactor = command.scale ? toScaleFactor(command.scale[2]) : 1;
  p.translate(
    (translate[0] + rotationOffset[0]) * scale,
    -(translate[2] + rotationOffset[2]) * scale - GROUND_HEIGHT - centreHeight * heightFactor,
    (translate[1] + rotationOffset[1]) * scale
  );
  if (command.rotate || command.animateRotate) {
    const rotate = animatedRotate(command, elapsedMilliseconds);
    const toRad = Math.PI / 180;
    p.rotateY(rotate[0] * toRad);
    p.rotateX(rotate[1] * toRad);
    p.rotateZ(rotate[2] * toRad);
  }
  p.translate(-rotationOffset[0] * scale, rotationOffset[2] * scale, -rotationOffset[1] * scale);
  if (command.scale) {
    p.scale(
      toScaleFactor(command.scale[0]),
      toScaleFactor(command.scale[2]),
      toScaleFactor(command.scale[1])
    );
  }
  p.translate(0, centreHeight, 0);
  const pyrN = pyrSides[command.type];
  if (pyrN) {
    drawPyramid(p, pyrN, color, command.hollow ?? undefined, command.frustum ?? undefined);
  }
  const priN = priSides[command.type];
  if (priN) {
    drawPrism(p, priN, color, command.hollow ?? undefined);
  }
  if (command.type === "sph") {
    drawSphere(p, color, command.hollow ?? undefined, command.frustum ?? undefined);
  }
  if (command.type === "cyl") {
    drawCylinder(p, color, command.hollow ?? undefined, command.frustum ?? undefined);
  }
  if (command.type === "con") {
    drawCone(p, color, command.hollow ?? undefined, command.frustum ?? undefined);
  }
  if (command.type === "tor") {
    drawTorus(p, color, command.hollow ?? undefined);
  }
  p.pop();
}

// How high above its base the centre of a body stands, before it is scaled: halfway up, which for a
// torus lying flat is the middle of its tube, and for a cut off pyramid, cone or sphere is halfway up to
// the cut.
function bodyCentreHeight(command: CreateBody): number {
  if (command.type === "tor") return torusTubeRadius(command.hollow ?? undefined);
  if (command.frustum && (pyrSides[command.type] || command.type === "con" || command.type === "sph")) {
    return BLOCK_SIZE * (1 - command.frustum / 100) / 2;
  }
  return BLOCK_SIZE / 2;
}

function toScaleFactor(value: number): number {
  return Math.max(value, 1) / 100;
}
