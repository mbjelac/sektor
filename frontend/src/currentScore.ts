import { findThroughputValue, ImportsAndExports, listedResourceNames } from "./globalImportsAndExports";

// What a sektor is worth as things stand on the planet. Nothing a sektor moves is worth anything in
// itself: it is worth what it does for the planet. Sending out what the planet is short of is the
// best a sektor can do, bringing in what the planet is short of the worst, and taking a share of
// what the planet already has over is a small loss against a small gain.
const SCORE_FOR_BRINGING_IN_WHAT_THE_PLANET_HAS_OVER = -1;
const SCORE_FOR_BRINGING_IN_WHAT_THE_PLANET_IS_SHORT_OF = -2;
const SCORE_FOR_SENDING_OUT_WHAT_THE_PLANET_HAS_OVER = 1;
const SCORE_FOR_SENDING_OUT_WHAT_THE_PLANET_IS_SHORT_OF = 2;

// What the sektor scores altogether: every resource it moves, added up. It changes with every
// building put up anywhere on the planet, as that is what the planet being short of a resource or
// having it over is made of.
export function currentScore(
  sektorImportsAndExports: ImportsAndExports,
  planetImportsAndExports: ImportsAndExports,
  negativeScoringResources: string[],
): number {
  return listedResourceNames(sektorImportsAndExports)
    .map(resourceName => currentResourceScore(
      resourceName,
      sektorImportsAndExports,
      planetImportsAndExports,
      negativeScoringResources,
    ))
    .reduce((total, score) => total + score, 0);
}

// A resource nobody is short of and nobody has over is worth nothing either way, and so is one the
// sektor does not move at all. A resource which does the planet harm rather than good is worth the
// opposite of what the same resource would be worth were it wanted.
export function currentResourceScore(
  resourceName: string,
  sektorImportsAndExports: ImportsAndExports,
  planetImportsAndExports: ImportsAndExports,
  negativeScoringResources: string[],
): number {
  const score = scoreAgainstThePlanet(resourceName, sektorImportsAndExports, planetImportsAndExports);
  return negativeScoringResources.includes(resourceName) ? -score : score;
}

function scoreAgainstThePlanet(
  resourceName: string,
  sektorImportsAndExports: ImportsAndExports,
  planetImportsAndExports: ImportsAndExports,
): number {
  const planetIsShortOfIt = findThroughputValue(planetImportsAndExports.imports, resourceName) > 0;
  const planetHasItOver = findThroughputValue(planetImportsAndExports.exports, resourceName) > 0;

  if (findThroughputValue(sektorImportsAndExports.imports, resourceName) > 0) {
    if (planetIsShortOfIt) return SCORE_FOR_BRINGING_IN_WHAT_THE_PLANET_IS_SHORT_OF;
    if (planetHasItOver) return SCORE_FOR_BRINGING_IN_WHAT_THE_PLANET_HAS_OVER;
  }

  if (findThroughputValue(sektorImportsAndExports.exports, resourceName) > 0) {
    if (planetIsShortOfIt) return SCORE_FOR_SENDING_OUT_WHAT_THE_PLANET_IS_SHORT_OF;
    if (planetHasItOver) return SCORE_FOR_SENDING_OUT_WHAT_THE_PLANET_HAS_OVER;
  }

  return 0;
}
