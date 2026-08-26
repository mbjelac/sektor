import { interpolateColors, parseHexColor } from "./properties";

const WORST_SCORE = -50;
const MIDDLE_SCORE = 0;
const BEST_SCORE = 50;

const WORST_COLOR = "#ff0000";
const MIDDLE_COLOR = "#ffff00";
const BEST_COLOR = "#00ff00";

// Scores are shown on a red-yellow-green scale, with everything below the worst
// score fully red and everything above the best score fully green.
export function scoreColor(score: number): string {
  if (score <= WORST_SCORE) return WORST_COLOR;
  if (score >= BEST_SCORE) return BEST_COLOR;
  if (score <= MIDDLE_SCORE) {
    return interpolatedColor(WORST_COLOR, MIDDLE_COLOR, (score - WORST_SCORE) / (MIDDLE_SCORE - WORST_SCORE));
  }
  return interpolatedColor(MIDDLE_COLOR, BEST_COLOR, (score - MIDDLE_SCORE) / (BEST_SCORE - MIDDLE_SCORE));
}

function interpolatedColor(fromColor: string, toColor: string, fraction: number): string {
  const [red, green, blue] = interpolateColors(parseHexColor(fromColor), parseHexColor(toColor), fraction);
  return `rgb(${red}, ${green}, ${blue})`;
}
