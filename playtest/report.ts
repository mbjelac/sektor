import { execSync } from "child_process";
import { SCORE_PER_REQUIRED_UNIT, SCORE_PER_UNIT } from "../frontend/src/sektor/Sektor";
import { MODIFIER_MAX, MODIFIER_MIN } from "../shared/modifierLimits";
import { BuildingDefinition } from "../frontend/src/sektor/buildings/parseBuildingDefinitions";
import { createSektor } from "../frontend/src/creation/createSektor";
import { farmSektor, PlayResult, playSektor } from "./playSektor";
import { seededRandom } from "./seededRandom";

export interface ReportOptions {
  levels: number[];
  runs: number;
  seed: number;
}

interface Played {
  level: number;
  result: PlayResult;
  farmScore: number;
}

export function buildReport(
  options: ReportOptions,
  buildingDefinitions: BuildingDefinition[],
  localResources: string[],
  negativeScoringResources: string[],
): string {
  const randomNumber = seededRandom(options.seed);
  const played: Played[] = [];

  for (const level of options.levels) {
    for (let run = 0; run < options.runs; run++) {
      const sektorData = createSektor(level, buildingDefinitions, localResources, negativeScoringResources, randomNumber);
      played.push({
        level,
        result: playSektor(sektorData, buildingDefinitions, localResources, negativeScoringResources),
        farmScore: farmSektor(sektorData, buildingDefinitions, localResources, negativeScoringResources),
      });
    }
  }

  return [
    configuration(options, buildingDefinitions, localResources, negativeScoringResources),
    byLevel(options, played),
    byRequirement(played),
    doingTheTaskAgainstIgnoringIt(played),
    whatIsAlwaysBought(played),
    contentNeverUsed(played, buildingDefinitions),
  ].join("\n");
}

// Everything a difference between two reports might be explained by, written down beside the
// numbers it produced, so that a report read months later still says what it was measuring.
function configuration(
  options: ReportOptions,
  buildingDefinitions: BuildingDefinition[],
  localResources: string[],
  negativeScoringResources: string[],
): string {
  const producedResources = new Set(
    buildingDefinitions.flatMap(d => d.buildingFunctions).flatMap(f => f.outputs).map(o => o.name)
  );
  const consumedResources = new Set(
    buildingDefinitions.flatMap(d => d.buildingFunctions).flatMap(f => f.inputs).map(i => i.name)
  );
  const neverProduced = [...consumedResources].filter(resource => !producedResources.has(resource));

  return [
    "# Playtest report",
    "",
    `commit         ${gitDescribe()}`,
    `date           ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
    `seed           ${options.seed}   (same seed and same commit give the same report)`,
    `sektors        ${options.runs} a level, levels ${options.levels.join(", ")}`,
    "",
    "## Configuration",
    "",
    `import cost            ${SCORE_PER_UNIT} a unit`,
    `export reward          ${SCORE_PER_UNIT} a unit, ${SCORE_PER_REQUIRED_UNIT} when it meets a requirement`,
    `location property      ${MODIFIER_MIN} to ${MODIFIER_MAX}`,
    `buildings              ${buildingDefinitions.filter(d => d.buildingFunctions.length > 0).length} which do something, ${buildingDefinitions.length} in all`,
    `resources              ${producedResources.size + neverProduced.length}`,
    `  local                ${localResources.join(", ") || "(none)"}`,
    `  negative             ${negativeScoringResources.join(", ") || "(none)"}`,
    `  nothing makes them   ${neverProduced.join(", ") || "(none)"}`,
    "",
  ].join("\n");
}

function byLevel(options: ReportOptions, played: Played[]): string {
  const lines = [
    "## By level",
    "",
    "A sektor the player is better off never touching is one scoring below zero. A sektor left",
    "unfinished may be one the harness could not play rather than one which cannot be played.",
    "",
    "level   finished   worst   median     best   below zero   buildings",
  ];

  for (const level of options.levels) {
    const forLevel = played.filter(entry => entry.level === level);
    const scores = forLevel.map(entry => entry.result.score).sort((a, b) => a - b);
    const buildings = forLevel.map(entry => entry.result.buildingCount).sort((a, b) => a - b);
    const finished = forLevel.filter(entry => entry.result.status === "Done").length;
    const belowZero = scores.filter(score => score < 0).length;

    lines.push(
      `${String(level).padStart(5)}`
      + `${`${finished}/${forLevel.length}`.padStart(11)}`
      + `${scores[0].toFixed(0).padStart(8)}`
      + `${median(scores).toFixed(0).padStart(9)}`
      + `${scores[scores.length - 1].toFixed(0).padStart(9)}`
      + `${String(belowZero).padStart(13)}`
      + `${median(buildings).toFixed(0).padStart(12)}`
    );
  }

  return lines.join("\n") + "\n";
}

// Which resources make a good thing to be asked for and which do not. A resource which is asked for
// often and finished rarely is either too dear to make or impossible with the buildings given.
function byRequirement(played: Played[]): string {
  const askedFor = new Map<string, { times: number; finished: number; scores: number[] }>();

  for (const entry of played) {
    for (const requirement of entry.result.exportRequirements) {
      const tally = askedFor.get(requirement.name) ?? { times: 0, finished: 0, scores: [] };
      tally.times++;
      if (requirement.exported >= requirement.value) tally.finished++;
      tally.scores.push(entry.result.score);
      askedFor.set(requirement.name, tally);
    }
  }

  const rows = [...askedFor].map(([resource, tally]) => ({
    resource,
    times: tally.times,
    met: tally.finished / tally.times,
    median: median(tally.scores.sort((a, b) => a - b)),
  })).sort((a, b) => a.met - b.met);

  return [
    "## By what was required",
    "",
    "resource                asked   met     median score",
    ...rows.map(row =>
      `${row.resource.padEnd(22)}${String(row.times).padStart(6)}`
      + `${`${(row.met * 100).toFixed(0)}%`.padStart(7)}`
      + `${row.median.toFixed(0).padStart(16)}`
    ),
    "",
  ].join("\n");
}

// If ignoring what a sektor asks for scores better than doing it, the game rewards the wrong thing
// and no amount of tuning the sektors themselves will fix it.
function doingTheTaskAgainstIgnoringIt(played: Played[]): string {
  const ignoringPaysBetter = played.filter(entry => entry.farmScore > entry.result.score);
  const finishScores = played.map(entry => entry.result.score).sort((a, b) => a - b);
  const farmScores = played.map(entry => entry.farmScore).sort((a, b) => a - b);

  return [
    "## Doing the task against ignoring it",
    "",
    `median score doing what the sektor asks    ${median(finishScores).toFixed(0)}`,
    `median score building only what pays       ${median(farmScores).toFixed(0)}`,
    `sektors where ignoring the task pays more  ${ignoringPaysBetter.length}/${played.length}`,
    "",
    ignoringPaysBetter.length > played.length / 2
      ? "More than half the sektors are better ignored than played. The requirement bonus is not"
      + "\nworth what the chain costs, or something unrelated to the task pays too well."
      : "Doing what the sektor asks is worth more than ignoring it, in most sektors.",
    "",
  ].join("\n");
}

// What every sektor ends up buying is what every sektor is taxed by, whatever else changes.
function whatIsAlwaysBought(played: Played[]): string {
  const bought = new Map<string, { units: number; score: number; sektors: number }>();
  for (const entry of played) {
    for (const entryImport of entry.result.imports) {
      const tally = bought.get(entryImport.name) ?? { units: 0, score: 0, sektors: 0 };
      tally.units += entryImport.value;
      tally.score += entryImport.score;
      tally.sektors++;
      bought.set(entryImport.name, tally);
    }
  }

  const rows = [...bought].sort((a, b) => a[1].score - b[1].score).slice(0, 10);

  return [
    "## What the sektors buy",
    "",
    "resource                sektors      units   score",
    ...rows.map(([resource, tally]) =>
      `${resource.padEnd(22)}${String(tally.sektors).padStart(8)}`
      + `${tally.units.toFixed(0).padStart(11)}${tally.score.toFixed(0).padStart(8)}`
    ),
    "",
  ].join("\n");
}

// A building offered again and again and never worth putting up is either priced wrong or pointless.
// Every sektor offers every building there is, so each of them is offered once per sektor played.
function contentNeverUsed(played: Played[], buildingDefinitions: BuildingDefinition[]): string {
  const offered = new Map<string, number>();
  const built = new Map<string, number>();

  for (const entry of played) {
    for (const buildingDefinition of buildingDefinitions) {
      offered.set(buildingDefinition.name, (offered.get(buildingDefinition.name) ?? 0) + 1);
    }
    for (const placed of entry.result.buildingsPlaced) {
      built.set(placed.type, (built.get(placed.type) ?? 0) + 1);
    }
  }

  const neverBuilt = [...offered]
    .filter(([buildingName]) => !built.has(buildingName))
    .sort((a, b) => b[1] - a[1]);

  const definitionsWithFunctions = buildingDefinitions.filter(d => d.buildingFunctions.length > 0).length;

  return [
    "## Buildings never worth putting up",
    "",
    neverBuilt.length === 0
      ? "Every building offered was worth building in at least one sektor."
      : [
        `${neverBuilt.length} of ${definitionsWithFunctions} buildings were offered but never built:`,
        "",
        "building                offered",
        ...neverBuilt.map(([buildingName, times]) => `${buildingName.padEnd(22)}${String(times).padStart(8)}`),
      ].join("\n"),
    "",
  ].join("\n");
}

function gitDescribe(): string {
  try {
    const hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim().length > 0;
    return hash + (dirty ? " (with uncommitted changes)" : "");
  } catch {
    return "unknown";
  }
}

function median(sortedNumbers: number[]): number {
  return sortedNumbers.length === 0 ? 0 : sortedNumbers[Math.floor(sortedNumbers.length / 2)];
}
