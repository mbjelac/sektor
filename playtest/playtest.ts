import { mkdirSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { buildingDefinitions, localResources, negativeScoringResources } from "./assets";
import { buildReport } from "./report";

// Measures what the numbers of the game currently add up to, by generating sektors the way the game
// does and playing each one as well as it can. Run it before and after changing anything which
// touches the economy, and hold the two reports against each other.
//
//   npm run playtest                                   print a report
//   npm run playtest -- --save                         and keep it under reports/
//   npm run playtest -- --levels 1,4 --runs 5 --seed 7
function main() {
  const options = readOptions(process.argv.slice(2));
  const report = buildReport(options, buildingDefinitions, localResources, negativeScoringResources);

  console.log(report);

  if (options.save) {
    const directory = join(import.meta.dirname, "reports");
    mkdirSync(directory, { recursive: true });
    const path = join(directory, `${new Date().toISOString().slice(0, 10)}-${commitHash()}.md`);
    writeFileSync(path, report);
    console.log(`\nkept as ${path}`);
  }
}

function readOptions(args: string[]) {
  const value = (name: string) => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : undefined;
  };
  return {
    levels: (value("levels") ?? "1,2,3,4,5,6,8,10").split(",").map(Number),
    runs: Number(value("runs") ?? 30),
    // Fixed by default, so that two reports differ only where the game differs.
    seed: Number(value("seed") ?? 1),
    save: args.includes("--save"),
  };
}

function commitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

main();
