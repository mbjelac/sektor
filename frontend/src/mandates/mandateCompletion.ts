import { ImportsAndExports } from "../globalImportsAndExports";
import { Mandate, MandateCriterion } from "./mandates.api";

// What all of a player's sektors bring in and send out between them, resource by resource. Unlike
// the planet's, what comes in of a resource is not set against what goes out of it: a mandate asks
// about the player's imports and exports each in its own right.
export function summedImportsAndExports(sektorImportsAndExports: ImportsAndExports[]): ImportsAndExports {
  return {
    imports: summedThroughputs(sektorImportsAndExports.flatMap(sektor => sektor.imports)),
    exports: summedThroughputs(sektorImportsAndExports.flatMap(sektor => sektor.exports)),
  };
}

// The mandate as the player's sektors together leave it: every criterion completed or not, and the
// mandate complete when every one of its criteria is.
export function completedMandate(mandate: Mandate, playerImportsAndExports: ImportsAndExports): Mandate {
  const criteria = mandate.criteria.map(criterion => ({
    ...criterion,
    completed: isCriterionFulfilled(criterion, playerImportsAndExports),
  }));
  return { ...mandate, criteria, completed: criteria.every(criterion => criterion.completed) };
}

function isCriterionFulfilled(criterion: MandateCriterion, playerImportsAndExports: ImportsAndExports): boolean {
  if (criterion.type === "minimumExport") {
    return summedValue(playerImportsAndExports.exports, criterion.resourceName) >= criterion.amount;
  }
  return summedValue(playerImportsAndExports.imports, criterion.resourceName) <= criterion.amount;
}

function summedThroughputs(throughputs: { name: string; value: number }[]): { name: string; value: number }[] {
  const valueByResourceName = new Map<string, number>();
  for (const throughput of throughputs) {
    valueByResourceName.set(throughput.name, (valueByResourceName.get(throughput.name) ?? 0) + throughput.value);
  }
  return [...valueByResourceName.entries()].map(([name, value]) => ({ name, value }));
}

function summedValue(throughputs: { name: string; value: number }[], resourceName: string): number {
  return throughputs.find(throughput => throughput.name === resourceName)?.value ?? 0;
}
