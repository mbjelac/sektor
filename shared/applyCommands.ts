import p5 from "p5";
import {drawPyramid} from "./primitive/drawPyramid";
import {drawPrism} from "./primitive/drawPrism";
import {drawSphere} from "./primitive/drawSphere";
import {drawCylinder} from "./primitive/drawCylinder";
import {drawCone} from "./primitive/drawCone";
import {drawTorus} from "./primitive/drawTorus";
import {CreateBody} from "./parseCommands";
import {BLOCK_SIZE} from "./constants";
import {animatedColor, animatedTranslate} from "./animateCommands";

const pyrSides: Record<string, number> = {
  pyr3: 3, pyr4: 4, pyr5: 5, pyr6: 6, pyr7: 7, pyr8: 8, pyr9: 9,
};

const priSides: Record<string, number> = {
  pri3: 3, pri4: 4, pri5: 5, pri6: 6, pri7: 7, pri8: 8, pri9: 9,
};

export function applyCommands(p: p5, commands: CreateBody[], elapsedMilliseconds = 0) {
  const drawnBodies = commands.map(command => ({
    command,
    color: animatedColor(command, elapsedMilliseconds) ?? undefined,
  }));

  // Opaque bodies first, so they populate the depth buffer before any blending.
  for (const {command, color} of drawnBodies) {
    if (!isTransparent(color)) {
      drawBody(p, command, color, elapsedMilliseconds);
    }
  }

  // Transparent bodies do not write depth, so they never hide bodies behind them.
  const transparentBodies = drawnBodies.filter(({color}) => isTransparent(color));
  if (transparentBodies.length > 0) {
    const gl = p.drawingContext as WebGLRenderingContext;
    gl.depthMask(false);
    for (const {command, color} of transparentBodies) {
      drawBody(p, command, color, elapsedMilliseconds);
    }
    gl.depthMask(true);
  }
}

function isTransparent(color: string | undefined): boolean {
  return color !== undefined && color.length >= 9 && parseInt(color.slice(7, 9), 16) < 255;
}

function drawBody(p: p5, command: CreateBody, color: string | undefined, elapsedMilliseconds: number) {
  p.push();
  if (command.translate || command.animateTranslate) {
    const translate = animatedTranslate(command, elapsedMilliseconds);
    const scale = BLOCK_SIZE / 100;
    p.translate(
      translate[0] * scale,
      -translate[2] * scale,
      translate[1] * scale
    );
  }
  if (command.rotate) {
    const toRad = Math.PI / 180;
    p.rotateY(command.rotate[0] * toRad);
    p.rotateX(command.rotate[1] * toRad);
    p.rotateZ(command.rotate[2] * toRad);
  }
  if (command.scale) {
    const toFactor = (v: number) => Math.max(v, 1) / 100;
    p.scale(
      toFactor(command.scale[0]),
      toFactor(command.scale[2]),
      toFactor(command.scale[1])
    );
  }
  const pyrN = pyrSides[command.type];
  if (pyrN) {
    drawPyramid(p, pyrN, color);
  }
  const priN = priSides[command.type];
  if (priN) {
    drawPrism(p, priN, color);
  }
  if (command.type === "sph") {
    drawSphere(p, color);
  }
  if (command.type === "cyl") {
    drawCylinder(p, color);
  }
  if (command.type === "con") {
    drawCone(p, color);
  }
  if (command.type === "tor") {
    drawTorus(p, color);
  }
  p.pop();
}
