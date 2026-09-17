export type { ResourceThroughput } from "../../../../shared/sektorData";

// An output is produced either in an amount the building makes wherever it stands, or in the
// amount the location it stands on has of a location property, and never in both.
export interface BuildingFunctionOutput {
  name: string;
  value?: number;
  locationProperty?: string;
}

export interface BuildingFunction {
  name?: string;
  // A function the building always does: the player cannot turn it off, and it runs from the
  // moment the building is built even when it is not the building's first function.
  alwaysActive?: boolean;
  inputs: ResourceThroughput[];
  outputs: BuildingFunctionOutput[];
}

const ALWAYS_ACTIVE_VALUE = "always";

export interface BuildingProperties {
  showFloor?: boolean;
  // The highest ground the building may stand on. A building whose definition names none may be
  // put up at any altitude.
  maxAltitude?: number;
}

export interface BuildingDefinition {
  name: string;
  renderingCode: string;
  buildingFunctions: BuildingFunction[];
  properties: BuildingProperties;
}

// A building can do several things at once, so every Function section of its definition
// becomes a separate building function.
export function parseBuildingDefinitions(lines: string[]): BuildingDefinition[] {
  const buildings: BuildingDefinition[] = [];

  let currentName: string | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let functionLineGroups: string[][] = [];
  let propertyLines: string[] = [];
  let section: "none" | "render" | "function" | "properties" = "none";

  function pushBuilding() {
    if (currentName && codeLines.length > 0) {
      buildings.push({
        name: currentName,
        renderingCode: codeLines.join("\n"),
        buildingFunctions: functionLineGroups.map(functionLines => parseBuildingFunction(functionLines)),
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
      functionLineGroups = [];
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
      functionLineGroups.push([]);
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
      functionLineGroups[functionLineGroups.length - 1].push(line);
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
    if (match[1] === "maxAltitude" && isAmount(match[2])) {
      props.maxAltitude = parseInt(match[2]);
    }
  }
  return props;
}

function parseBuildingFunction(lines: string[]): BuildingFunction {
  const inputs: ResourceThroughput[] = [];
  const outputs: BuildingFunctionOutput[] = [];
  let functionName: string | undefined = undefined;
  let alwaysActive = false;
  let seenEquals = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === "=") {
      seenEquals = true;
      continue;
    }
    const nameMatch = trimmed.match(/^Name:\s*(.+)$/);
    if (nameMatch) {
      functionName = nameMatch[1].trim();
      continue;
    }
    const activeMatch = trimmed.match(/^Active:\s*(.+)$/);
    if (activeMatch) {
      alwaysActive = activeMatch[1].trim() === ALWAYS_ACTIVE_VALUE;
      continue;
    }
    const match = trimmed.match(/^(\S+)\s+(\S+)$/);
    if (!match) continue;
    const resourceName = match[1];
    const amountOrProperty = match[2];
    if (seenEquals) {
      outputs.push(parseOutput(resourceName, amountOrProperty));
    } else if (isAmount(amountOrProperty)) {
      inputs.push({ name: resourceName, value: parseInt(amountOrProperty) });
    }
  }

  if (inputs.length === 0 && outputs.length === 0) {
    console.error("Building function has no inputs or outputs:", lines.join("\n"));
    return { inputs: [], outputs: [] };
  }

  const buildingFunction: BuildingFunction = { inputs, outputs };
  if (functionName !== undefined) buildingFunction.name = functionName;
  if (alwaysActive) buildingFunction.alwaysActive = true;

  return buildingFunction;
}

// An output is written either with the amount it produces or with the name of the location
// property whose value on the building's location is the amount it produces.
function parseOutput(resourceName: string, amountOrProperty: string): BuildingFunctionOutput {
  return isAmount(amountOrProperty)
    ? { name: resourceName, value: parseInt(amountOrProperty) }
    : { name: resourceName, locationProperty: amountOrProperty };
}

function isAmount(amountOrProperty: string): boolean {
  return /^\d+$/.test(amountOrProperty);
}
