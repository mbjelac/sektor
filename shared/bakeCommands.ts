import p5 from "p5";
import {CreateBody} from "./parseCommands";
import {applyShine, drawBodies, opaqueBodies, transparentBodies, withoutDepthWrites} from "./applyCommands";

export interface BakedBodies {
  opaqueGeometry: p5.Geometry | null;
  transparentGeometry: p5.Geometry | null;
  opaqueShinyGeometries: ShinyGeometry[];
  transparentShinyGeometries: ShinyGeometry[];
  animatedCommands: CreateBody[];
}

// A geometry keeps the colors of its bodies but not how shiny they are, which is set for a whole
// geometry when it is drawn, so shiny bodies are baked apart, one geometry for every shine and
// color they come in.
interface ShinyGeometry {
  shine: number;
  color: string | undefined;
  geometry: p5.Geometry;
}

// Drawing a body costs p5 a full geometry rebuild and a GPU upload, every body every frame,
// because bodies are drawn in immediate mode. Bodies which never move and never change color
// are therefore baked once into cached geometries — one draw call each from then on, with no
// uploads. Animated bodies have to be rebuilt every frame anyway, so they stay out of the bake.
// Opaque and transparent bodies are baked apart so that the two can keep being drawn in
// separate passes, which is what stops transparent bodies from hiding what is behind them.
export function bakeCommands(p: p5, commands: CreateBody[]): BakedBodies {
  const staticCommands = commands.filter(command => !isAnimated(command));
  const dullCommands = staticCommands.filter(command => !command.shine);
  const shinyCommands = staticCommands.filter(command => command.shine);
  return {
    opaqueGeometry: bakeBodies(p, opaqueBodies(dullCommands, 0)),
    transparentGeometry: bakeBodies(p, transparentBodies(dullCommands, 0)),
    opaqueShinyGeometries: bakeShinyBodies(p, opaqueBodies(shinyCommands, 0)),
    transparentShinyGeometries: bakeShinyBodies(p, transparentBodies(shinyCommands, 0)),
    animatedCommands: commands.filter(isAnimated),
  };
}

export function drawBakedBodies(p: p5, bakedBodies: BakedBodies, elapsedMilliseconds: number) {
  if (bakedBodies.opaqueGeometry) {
    p.model(bakedBodies.opaqueGeometry);
  }
  drawShinyGeometries(p, bakedBodies.opaqueShinyGeometries);
  drawBodies(p, opaqueBodies(bakedBodies.animatedCommands, elapsedMilliseconds), elapsedMilliseconds);

  const animatedTransparentCommands = transparentBodies(bakedBodies.animatedCommands, elapsedMilliseconds);
  if (!bakedBodies.transparentGeometry && bakedBodies.transparentShinyGeometries.length === 0
    && animatedTransparentCommands.length === 0) return;
  withoutDepthWrites(p, () => {
    if (bakedBodies.transparentGeometry) {
      p.model(bakedBodies.transparentGeometry);
    }
    drawShinyGeometries(p, bakedBodies.transparentShinyGeometries);
    drawBodies(p, animatedTransparentCommands, elapsedMilliseconds);
  });
}

function drawShinyGeometries(p: p5, shinyGeometries: ShinyGeometry[]) {
  for (const shinyGeometry of shinyGeometries) {
    p.push();
    applyShine(p, shinyGeometry.shine, shinyGeometry.color);
    p.model(shinyGeometry.geometry);
    p.pop();
  }
}

// Geometries live on the graphics card until they are handed back, so a bake which is replaced by
// a later one has to give its geometries up, or every rebake leaves its own behind.
export function freeBakedBodies(p: p5, bakedBodies: BakedBodies) {
  if (bakedBodies.opaqueGeometry) {
    p.freeGeometry(bakedBodies.opaqueGeometry);
  }
  if (bakedBodies.transparentGeometry) {
    p.freeGeometry(bakedBodies.transparentGeometry);
  }
  for (const shinyGeometry of [...bakedBodies.opaqueShinyGeometries, ...bakedBodies.transparentShinyGeometries]) {
    p.freeGeometry(shinyGeometry.geometry);
  }
}

// A body counts as animated when anything about it can change from one frame to the next.
// A colour animation matters even when the body never moves, because it can turn a body
// transparent, which decides the pass the body has to be drawn in.
function isAnimated(command: CreateBody): boolean {
  return command.animateTranslate !== null
    || command.animateRotate !== null
    || command.animateColorToggle !== null
    || command.animateColorGradual !== null
    || command.animateShow !== null;
}

function bakeShinyBodies(p: p5, commands: CreateBody[]): ShinyGeometry[] {
  const commandsByMaterial = new Map<string, CreateBody[]>();
  for (const command of commands) {
    const material = `${command.shine} ${command.color}`;
    commandsByMaterial.set(material, [...(commandsByMaterial.get(material) ?? []), command]);
  }
  return [...commandsByMaterial.values()].map(materialCommands => ({
    shine: materialCommands[0].shine!,
    color: materialCommands[0].color ?? undefined,
    geometry: bakeBodies(p, materialCommands)!,
  }));
}

function bakeBodies(p: p5, commands: CreateBody[]): p5.Geometry | null {
  if (commands.length === 0) return null;
  return p.buildGeometry(() => drawBodies(p, commands, 0));
}
