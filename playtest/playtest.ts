import { createSektor } from "../frontend/src/creation/createSektor";
import { buildingDefinitions, localResources, negativeScoringResources } from "./assets";
import { PlayResult, playSektor } from "./playSektor";

// Generates sektors the way the game does and plays each one as well as a patient player would, so
// that "is this too hard" can be answered by measuring rather than by arguing about the numbers in
// buildings.md. Run it before and after changing anything in the economy.
//
//   npm run playtest                          levels 1-6, 20 sektors each
//   npm run playtest -- --levels 1,4 --runs 5
//   npm run playtest -- --levels 3 --runs 1 --detail
function main() {
  const options = readOptions(process.argv.slice(2));

  for (const level of options.levels) {
    const results: PlayResult[] = [];
    for (let run = 0; run < options.runs; run++) {
      const sektorData = createSektor(level, buildingDefinitions, localResources, negativeScoringResources);
      const result = playSektor(sektorData, buildingDefinitions, localResources, negativeScoringResources);
      results.push(result);
      if (options.detail) printDetail(sektorData.allowedBuildings, sektorData.importRestrictions, result);
    }
    printSummary(level, results);
  }
}

function readOptions(args: string[]): { levels: number[]; runs: number; detail: boolean } {
  const value = (name: string) => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : undefined;
  };
  return {
    levels: (value("levels") ?? "1,2,3,4,5,6").split(",").map(Number),
    runs: Number(value("runs") ?? 20),
    detail: args.includes("--detail"),
  };
}

function printSummary(level: number, results: PlayResult[]) {
  const scores = results.map(result => result.score).sort((a, b) => a - b);
  const finished = results.filter(result => result.status === "Done").length;
  const losses = results.filter(result => result.score < 0).length;
  const buildings = results.map(result => result.buildingCount).sort((a, b) => a - b);

  console.log(
    `level ${level}  `
    + `finished ${finished}/${results.length}  `
    + `score worst ${scores[0].toFixed(0)} / median ${median(scores).toFixed(0)} / best ${scores[scores.length - 1].toFixed(0)}  `
    + `left the player worse off ${losses}/${results.length}  `
    + `buildings median ${median(buildings).toFixed(0)}`
  );
}

function printDetail(allowedBuildings: string[], importRestrictions: { name: string; value: number }[], result: PlayResult) {
  console.log(`\n--- level ${result.level}: ${result.status}, score ${result.score.toFixed(1)}`);
  console.log(`  allowed    ${allowedBuildings.join(", ")}`);
  console.log(`  restricted ${importRestrictions.map(r => `${r.name}<=${r.value}`).join(", ") || "(none)"}`);
  console.log(`  required   ${result.exportRequirements.map(r => `${r.name} ${r.exported.toFixed(1)}/${r.value}`).join(", ")}`);
  console.log(`  built      ${result.buildingsPlaced.map(b => `${b.type} x${b.count}`).join(", ") || "(nothing)"}`);
  console.log(`  imported   ${result.imports.map(i => `${i.name} ${i.value.toFixed(1)} (${i.score.toFixed(0)})`).join(", ") || "(nothing)"}`);
  console.log(`  exported   ${result.exports.map(e => `${e.name} ${e.value.toFixed(1)} (${e.score.toFixed(0)})`).join(", ") || "(nothing)"}`);
}

function median(sortedNumbers: number[]): number {
  return sortedNumbers[Math.floor(sortedNumbers.length / 2)];
}

main();
