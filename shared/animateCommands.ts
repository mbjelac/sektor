import {CreateBody} from "./parseCommands";
import {ANIMATION_STEP_MILLISECONDS} from "./constants";

export function animatedTranslate(command: CreateBody, elapsedMilliseconds: number): [number, number, number] {
  const baseTranslate = command.translate ?? [0, 0, 0];
  const animateTranslate = command.animateTranslate;
  if (!animateTranslate) return baseTranslate;

  const phaseSteps = animateTranslate.dt / ANIMATION_STEP_MILLISECONDS;
  const elapsedStep = Math.floor(elapsedMilliseconds / ANIMATION_STEP_MILLISECONDS);
  const cycleStep = elapsedStep % (2 * phaseSteps);
  const forwardStep = cycleStep <= phaseSteps ? cycleStep : 2 * phaseSteps - cycleStep;
  const progress = forwardStep / phaseSteps;

  return [
    baseTranslate[0] + animateTranslate.dx * progress,
    baseTranslate[1] + animateTranslate.dy * progress,
    baseTranslate[2] + animateTranslate.dz * progress,
  ];
}
