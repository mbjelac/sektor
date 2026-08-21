export type { ResourceThroughput } from "../../../../shared/sektorData";

export interface BuildingFunction {
  inputs: ResourceThroughput[];
  outputs: ResourceThroughput[];
}

export interface BuildingProperties {
  showFloor?: boolean;
}

export interface OutputModifier {
  resource: string;
  property: string;
}

export interface BuildingDefinition {
  name: string;
  renderingCode: string;
  buildingFunction: BuildingFunction;
  outputModifiers: OutputModifier[];
  properties: BuildingProperties;
}

export function parseBuildingDefinitions(lines: string[]): BuildingDefinition[] {
  const buildings: BuildingDefinition[] = [];

  let currentName: string | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let functionLines: string[] = [];
  let propertyLines: string[] = [];
  let section: "none" | "render" | "function" | "properties" = "none";

  function pushBuilding() {
    if (currentName && codeLines.length > 0) {
      const parsed = parseBuildingFunction(functionLines);
      buildings.push({
        name: currentName,
        renderingCode: codeLines.join("\n"),
        buildingFunction: parsed.buildingFunction,
        outputModifiers: parsed.outputModifiers,
        properties: parseProperties(propertyLines),
      });
    }
  }

  for (const line of lines) {
    const headingMatch = line.match(/^#\s+(.+)/);
    if (headingMatch) {
      pushBuilding();
      currentName = headingMatch[1].trim();
      codeLines = [];
      functionLines = [];
      propertyLines = [];
      inCodeBlock = false;
      section = "none";
      continue;
    }

    if (line.match(/^##\s+Render/)) {
      section = "render";
      continue;
    }

    if (line.match(/^##\s+Function/)) {
      section = "function";
      continue;
    }

    if (line.match(/^##\s+Properties/)) {
      section = "properties";
      continue;
    }

    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock && section === "render") {
      codeLines.push(line);
    } else if (section === "properties") {
      propertyLines.push(line);
    } else if (section === "function") {
      functionLines.push(line);
    }
  }

  pushBuilding();

  return buildings;
}

function parseProperties(lines: string[]): BuildingProperties {
  const props: BuildingProperties = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\w+)=(.+)$/);
    if (!match) continue;
    if (match[1] === "showFloor" && match[2] === "false") {
      props.showFloor = false;
    }
  }
  return props;
}

function parseBuildingFunction(lines: string[]): { buildingFunction: BuildingFunction; outputModifiers: OutputModifier[] } {
  const inputs: ResourceThroughput[] = [];
  const outputs: ResourceThroughput[] = [];
  const outputModifiers: OutputModifier[] = [];
  let seenEquals = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === "=") {
      seenEquals = true;
      continue;
    }
    const match = trimmed.match(/^(\S+)\s+(\d+)(?:\s+(\S+))?$/);
    if (!match) continue;
    const entry = { name: match[1], value: parseInt(match[2]) };
    if (seenEquals) {
      outputs.push(entry);
      if (match[3]) {
        outputModifiers.push({ resource: match[1], property: match[3] });
      }
    } else {
      inputs.push(entry);
    }
  }

  if (inputs.length === 0 && outputs.length === 0) {
    console.error("Building function has no inputs or outputs:", lines.join("\n"));
    return { buildingFunction: { inputs: [], outputs: [] }, outputModifiers: [] };
  }

  return { buildingFunction: { inputs, outputs }, outputModifiers };
}
