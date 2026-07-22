import {AnimateColorGradual, AnimateColorToggle, CreateBody} from "./parseCommands";
import {ANIMATION_STEP_MILLISECONDS} from "./constants";
import {colorToRgb} from "./primitive/colorToRgb";

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
  if (command.animateColorToggle) {
    return toggledColor(baseColor, command.animateColorToggle, elapsedMilliseconds);
  }
  if (command.animateColorGradual) {
    return graduallyChangedColor(baseColor, command.animateColorGradual, elapsedMilliseconds);
  }
  return baseColor;
}

function toggledColor(baseColor: string | null, animateColorToggle: AnimateColorToggle, elapsedMilliseconds: number): string | null {
  const baseColorFirstSteps = animateColorToggle.dt1 / ANIMATION_STEP_MILLISECONDS;
  const newColorSteps = animateColorToggle.dt2 / ANIMATION_STEP_MILLISECONDS;
  const baseColorLastSteps = animateColorToggle.dt3 / ANIMATION_STEP_MILLISECONDS;
  const cycleSteps = baseColorFirstSteps + newColorSteps + baseColorLastSteps;
  const cycleStep = Math.floor(elapsedMilliseconds / ANIMATION_STEP_MILLISECONDS) % cycleSteps;

  const newColorActive = cycleStep >= baseColorFirstSteps && cycleStep < baseColorFirstSteps + newColorSteps;
  return newColorActive ? animateColorToggle.color : baseColor;
}

function graduallyChangedColor(baseColor: string | null, animateColorGradual: AnimateColorGradual, elapsedMilliseconds: number): string {
  const phaseSteps = animateColorGradual.dt / ANIMATION_STEP_MILLISECONDS;
  const elapsedStep = Math.floor(elapsedMilliseconds / ANIMATION_STEP_MILLISECONDS);
  const cycleStep = elapsedStep % (2 * phaseSteps);
  const forwardStep = cycleStep <= phaseSteps ? cycleStep : 2 * phaseSteps - cycleStep;
  const progress = forwardStep / phaseSteps;

  const fromRgba = toRgba(baseColor);
  const toRgbaColor = toRgba(animateColorGradual.color);
  return rgbaToHex([
    Math.round(fromRgba[0] + (toRgbaColor[0] - fromRgba[0]) * progress),
    Math.round(fromRgba[1] + (toRgbaColor[1] - fromRgba[1]) * progress),
    Math.round(fromRgba[2] + (toRgbaColor[2] - fromRgba[2]) * progress),
    Math.round(fromRgba[3] + (toRgbaColor[3] - fromRgba[3]) * progress),
  ]);
}

function toRgba(color: string | null): [number, number, number, number] {
  const rgb = colorToRgb(color ?? undefined);
  return [rgb[0], rgb[1], rgb[2], rgb[3] ?? 255];
}

function rgbaToHex(rgba: [number, number, number, number]): string {
  const componentToHex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
  return `#${componentToHex(rgba[0])}${componentToHex(rgba[1])}${componentToHex(rgba[2])}${componentToHex(rgba[3])}`;
}
