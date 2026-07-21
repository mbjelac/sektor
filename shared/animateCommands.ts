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

export function animatedColor(command: CreateBody, elapsedMilliseconds: number): string | null {
  const baseColor = command.color;
  const animateColorToggle = command.animateColorToggle;
  if (!animateColorToggle) return baseColor;

  const baseColorFirstSteps = animateColorToggle.dt1 / ANIMATION_STEP_MILLISECONDS;
  const newColorSteps = animateColorToggle.dt2 / ANIMATION_STEP_MILLISECONDS;
  const baseColorLastSteps = animateColorToggle.dt3 / ANIMATION_STEP_MILLISECONDS;
  const cycleSteps = baseColorFirstSteps + newColorSteps + baseColorLastSteps;
  const cycleStep = Math.floor(elapsedMilliseconds / ANIMATION_STEP_MILLISECONDS) % cycleSteps;

  const newColorActive = cycleStep >= baseColorFirstSteps && cycleStep < baseColorFirstSteps + newColorSteps;
  return newColorActive ? animateColorToggle.color : baseColor;
}
