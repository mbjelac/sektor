import p5 from "p5";
import {CreateBody} from "./parseCommands";
import {drawBodies, opaqueBodies, transparentBodies, withoutDepthWrites} from "./applyCommands";

export interface BakedBodies {
  opaqueGeometry: p5.Geometry | null;
  transparentGeometry: p5.Geometry | null;
  animatedCommands: CreateBody[];
}

// Drawing a body costs p5 a full geometry rebuild and a GPU upload, every body every frame,
// because bodies are drawn in immediate mode. Bodies which never move and never change color
// are therefore baked once into cached geometries — one draw call each from then on, with no
// uploads. Animated bodies have to be rebuilt every frame anyway, so they stay out of the bake.
// Opaque and transparent bodies are baked apart so that the two can keep being drawn in
// separate passes, which is what stops transparent bodies from hiding what is behind them.
export function bakeCommands(p: p5, commands: CreateBody[]): BakedBodies {
  const staticCommands = commands.filter(command => !isAnimated(command));
  return {
    opaqueGeometry: bakeBodies(p, opaqueBodies(staticCommands, 0)),
    transparentGeometry: bakeBodies(p, transparentBodies(staticCommands, 0)),
    animatedCommands: commands.filter(isAnimated),
  };
}

export function drawBakedBodies(p: p5, bakedBodies: BakedBodies, elapsedMilliseconds: number) {
  if (bakedBodies.opaqueGeometry) {
    p.model(bakedBodies.opaqueGeometry);
  }
  drawBodies(p, opaqueBodies(bakedBodies.animatedCommands, elapsedMilliseconds), elapsedMilliseconds);

  const animatedTransparentCommands = transparentBodies(bakedBodies.animatedCommands, elapsedMilliseconds);
  if (!bakedBodies.transparentGeometry && animatedTransparentCommands.length === 0) return;
  withoutDepthWrites(p, () => {
    if (bakedBodies.transparentGeometry) {
      p.model(bakedBodies.transparentGeometry);
    }
    drawBodies(p, animatedTransparentCommands, elapsedMilliseconds);
  });
}

// A body counts as animated when anything about it can change from one frame to the next.
// A colour animation matters even when the body never moves, because it can turn a body
// transparent, which decides the pass the body has to be drawn in.
function isAnimated(command: CreateBody): boolean {
  return command.animateTranslate !== null
    || command.animateColorToggle !== null
    || command.animateColorGradual !== null;
}

function bakeBodies(p: p5, commands: CreateBody[]): p5.Geometry | null {
  if (commands.length === 0) return null;
  return p.buildGeometry(() => drawBodies(p, commands, 0));
}
