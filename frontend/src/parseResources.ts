export interface ResourceDefinition {
  name: string;
  icon: string;
  color: string;
  negativeScoring: boolean;
  local: boolean;
}

const NEGATIVE_SCORING_MARKER = "negative";
const LOCAL_MARKER = "local";
const DEFAULT_RESOURCE_COLOR = "#ffffff";

export function parseResources(lines: string[]): ResourceDefinition[] {
  const resourceDefinitions: ResourceDefinition[] = [];

  for (const line of lines) {
    const parts = line.trim().split(" ");
    if (parts.length < 2) continue;
    resourceDefinitions.push({
      name: parts[0],
      icon: parts[1],
      color: parts.length >= 3 ? parts[2] : DEFAULT_RESOURCE_COLOR,
      negativeScoring: parts.includes(NEGATIVE_SCORING_MARKER),
      local: parts.includes(LOCAL_MARKER),
    });
  }

  return resourceDefinitions;
}

export function negativeScoringResourceNames(resourceDefinitions: ResourceDefinition[]): string[] {
  return resourceDefinitions
    .filter(resourceDefinition => resourceDefinition.negativeScoring)
    .map(resourceDefinition => resourceDefinition.name);
}

// A local resource cannot be imported or exported, so a sektor has to produce every unit of it
// that its buildings consume.
export function localResourceNames(resourceDefinitions: ResourceDefinition[]): string[] {
  return resourceDefinitions
    .filter(resourceDefinition => resourceDefinition.local)
    .map(resourceDefinition => resourceDefinition.name);
}
