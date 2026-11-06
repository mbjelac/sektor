import { ImportsAndExports } from "../globalImportsAndExports";
import { Mandate } from "./mandates.api";

// What all of a player's sektors bring in and send out between them, resource by resource. Unlike
// the planet's, what comes in of a resource is not set against what goes out of it: a mandate asks
// about the player's imports and exports each in its own right.
export function summedImportsAndExports(sektorImportsAndExports: ImportsAndExports[]): ImportsAndExports {
  return {
    imports: summedThroughputs(sektorImportsAndExports.flatMap(sektor => sektor.imports)),
    exports: summedThroughputs(sektorImportsAndExports.flatMap(sektor => sektor.exports)),
  };
}

// A mandate is complete when the player's sektors together fulfil every one of its criteria.
export function isMandateComplete(mandate: Mandate, playerImportsAndExports: ImportsAndExports): boolean {
  return mandate.criteria.every(criterion => {
    if (criterion.type === "minimumExport") {
      return summedValue(playerImportsAndExports.exports, criterion.resourceName) >= criterion.amount;
    }
    return summedValue(playerImportsAndExports.imports, criterion.resourceName) <= criterion.amount;
  });
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
