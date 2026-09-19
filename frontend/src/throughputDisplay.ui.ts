import { ResourceThroughput } from "../../shared/sektorData";
import { ImportsAndExports } from "./globalImportsAndExports";
import { getResourceIcon } from "./resources";
import { formatNumber } from "./formatNumber";

// Only a resource which is actually moved is listed, as nothing else has anything to say.
export function listedResourceNames(importsAndExports: ImportsAndExports): string[] {
  const resourceNames = new Set<string>();
  for (const throughput of [...importsAndExports.imports, ...importsAndExports.exports]) {
    if (throughput.value !== 0) resourceNames.add(throughput.name);
  }
  return Array.from(resourceNames).sort((first, second) => first.localeCompare(second));
}

export function resourceNameText(resourceName: string): string {
  return `${resourceName} ${getResourceIcon(resourceName) ?? ""}`;
}

// A resource which is neither brought in nor sent out says nothing in the column, so that what is
// actually moved stands out from what is merely touched.
export function throughputText(value: number): string {
  return value !== 0 ? formatNumber(value) : "";
}

export function findThroughputValue(throughputs: ResourceThroughput[], resourceName: string): number {
  return throughputs.find(throughput => throughput.name === resourceName)?.value ?? 0;
}
