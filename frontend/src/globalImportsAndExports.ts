import { ResourceThroughput } from "../../shared/sektorData";

// What is brought in and what is sent out, resource by resource: of one sektor, or of the whole
// planet once every sektor's have been added up.
export interface ImportsAndExports {
  imports: ResourceThroughput[];
  exports: ResourceThroughput[];
}

// The planet brings in and sends out what all its sektors together do. What the sektors bring in of
// a resource is set against what they send out of it, so that a resource more of which comes in than
// goes out is imported by the planet, and one more of which goes out than comes in is exported by
// it. A resource the sektors bring in exactly as much of as they send out is neither, and is left
// out of both: the planet moves none of it.
export function globalImportsAndExports(sektorImportsAndExports: ImportsAndExports[]): ImportsAndExports {
  const broughtInByResourceName = new Map<string, number>();

  for (const sektor of sektorImportsAndExports) {
    for (const importedResource of sektor.imports) {
      addToResource(broughtInByResourceName, importedResource.name, importedResource.value);
    }
    for (const exportedResource of sektor.exports) {
      addToResource(broughtInByResourceName, exportedResource.name, -exportedResource.value);
    }
  }

  return {
    imports: throughputsOf(broughtInByResourceName, broughtIn => broughtIn > 0 ? broughtIn : 0),
    exports: throughputsOf(broughtInByResourceName, broughtIn => broughtIn < 0 ? -broughtIn : 0),
  };
}

// Only a resource which is actually moved is listed, as nothing else has anything to say.
export function listedResourceNames(importsAndExports: ImportsAndExports): string[] {
  const resourceNames = new Set<string>();
  for (const throughput of [...importsAndExports.imports, ...importsAndExports.exports]) {
    if (throughput.value !== 0) resourceNames.add(throughput.name);
  }
  return Array.from(resourceNames).sort((first, second) => first.localeCompare(second));
}

// Which column of a list of imports and exports its resources are put in order by.
export type ResourceSortOrder = "resource" | "imported" | "exported";

// A player looking for what is most brought in or most sent out puts the largest amounts at the
// top. The other column breaks the ties the other way about: of two resources equally brought in,
// the one less sent out is the one the planet is shorter of, and so stands higher. Resources tied
// in both columns keep the order their names put them in.
export function sortedResourceNames(
  importsAndExports: ImportsAndExports,
  sortOrder: ResourceSortOrder,
): string[] {
  const resourceNames = listedResourceNames(importsAndExports);

  if (sortOrder === "imported") {
    return resourceNames.sort((first, second) =>
      movedDifference(importsAndExports.imports, second, first) || movedDifference(importsAndExports.exports, first, second));
  }

  if (sortOrder === "exported") {
    return resourceNames.sort((first, second) =>
      movedDifference(importsAndExports.exports, second, first) || movedDifference(importsAndExports.imports, first, second));
  }

  return resourceNames;
}

function movedDifference(throughputs: ResourceThroughput[], resourceName: string, otherResourceName: string): number {
  return findThroughputValue(throughputs, resourceName) - findThroughputValue(throughputs, otherResourceName);
}

export function findThroughputValue(throughputs: ResourceThroughput[], resourceName: string): number {
  return throughputs.find(throughput => throughput.name === resourceName)?.value ?? 0;
}

function addToResource(broughtInByResourceName: Map<string, number>, resourceName: string, broughtIn: number) {
  broughtInByResourceName.set(resourceName, (broughtInByResourceName.get(resourceName) ?? 0) + broughtIn);
}

// Only the resources the planet actually moves one way are listed, in the order they are read in.
function throughputsOf(
  broughtInByResourceName: Map<string, number>,
  amountMoved: (broughtIn: number) => number,
): ResourceThroughput[] {
  return [...broughtInByResourceName.entries()]
    .map(([resourceName, broughtIn]) => ({ name: resourceName, value: roundToOneDecimal(amountMoved(broughtIn)) }))
    .filter(throughput => throughput.value > 0)
    .sort((throughput, otherThroughput) => throughput.name.localeCompare(otherThroughput.name));
}

// Amounts are written with a single decimal place, so rounding to it keeps the floating point noise
// out of the amounts added up from them.
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
