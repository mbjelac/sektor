import resourcesMd from "./assets/resources.md?raw";
import testResourcesMd from "./assets/resources.test.md?raw";
import { negativeScoringResourceNames, parseResources } from "./parseResources";

const isTestMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("test") === "true";
const source = isTestMode ? testResourcesMd : resourcesMd;

const resourceDefinitions = parseResources(source.split("\n"));

export function getResourceIcon(name: string): string | null {
  return resourceDefinitions.find(resourceDefinition => resourceDefinition.name === name)?.icon ?? null;
}

export function getResourceColor(name: string): string {
  return resourceDefinitions.find(resourceDefinition => resourceDefinition.name === name)?.color ?? "#ffffff";
}

export function getNegativeScoringResources(): string[] {
  return negativeScoringResourceNames(resourceDefinitions);
}
