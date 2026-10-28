export type { ResourceThroughput } from "../../../../shared/sektorData";

// An output is produced either in an amount the building makes wherever it stands, or in the
// amount the location it stands on has of a location property, and never in both.
export interface BuildingFunctionOutput {
  name: string;
  value?: number;
  locationProperty?: string;
  // An output named after a location property may produce only a fraction of the property's
  // value, which is that value divided by this and rounded to a whole amount.
  locationPropertyDivisor?: number;
  // An output made in an amount, which the pollution of the building's location cuts down to
  // its own percentage of that amount.
  affectedByPollution?: boolean;
}

export interface BuildingFunction {
  name?: string;
  // A function drawing on the building's pool, done as many times over as the player says, as long
  // as all such functions of the building together stay within the pool.
  pool?: boolean;
  inputs: ResourceThroughput[];
  outputs: BuildingFunctionOutput[];
}

// Written after the amount of an output which pollution affects.
const AFFECTED_BY_POLLUTION_MARKER = "pollution";

// The furthest a building can foul the ground around it.
const LARGEST_POLLUTION_AREA = 4;

// Written between a location property's name and the divisor of the fraction of its value an
// output produces.
const FRACTION_INDICATOR = "/";

// The value of the Pool property of a function drawing on the building's pool.
const POOL_VALUE = "true";

// The line separating a function's inputs from its outputs.
const OUTPUT_SEPARATOR = "->";

export interface BuildingProperties {
  showFloor?: boolean;
  // The level a player has to have reached before the building is offered to them. A building
  // whose definition names none is offered to every player from the start.
  minLevel?: number;
  // What the building is about, so the player can find it among the others in the toolbar. They
  // come from the Tags section of the definition, not from its Properties section.
  tags?: string[];
  // How far, counted in squares along and across the map, the building fouls the ground around it.
  // A building whose definition names none pollutes nothing.
  pollutionArea?: number;
  // The longest, in seconds, a building of this kind waits before it starts its animations. Each
  // building waits for a random part of it, so that buildings of a kind do not move in step. A
  // building whose definition names none starts its animations at once.
  randomizedDelayAnimationStart?: number;
  // How many times over, all together, the building can do its functions drawing on its pool.
  poolSize?: number;
}

// What stands on a building's location while the building is going up, before the building
// itself is shown there. Each variant goes up in its own way, and a variant without a way of its own
// is there finished the moment it is placed.
export interface ConstructionRender {
  // The code of every variant's construction, the first variant first, null for a variant without one.
  renderingCodes: (string | null)[];
  // How long the building takes to go up, in milliseconds.
  duration: number;
}

export interface BuildingDefinition {
  name: string;
  // The code of every variant the building can be drawn as, the first variant first.
  renderingCodes: string[];
  constructionRender?: ConstructionRender;
  buildingFunctions: BuildingFunction[];
  properties: BuildingProperties;
}

// The SGL files of every building, by their path within the buildings folder: each building has a
// folder named after it, holding the code of each variant it is drawn as.
export type BuildingRenderingFiles = Record<string, string>;

// The file in a building's folder holding the code of what stands on its location while a variant
// of it goes up, named after the variant's own file.
const CONSTRUCTION_RENDERING_FILE_SUFFIX = ".construction.sgl";

// A building can do several things at once, so every Function section of its definition
// becomes a separate building function. A building is drawn with the code of its own folder of
// SGL files, and a building without any is left out.
export function parseBuildingDefinitions(lines: string[], renderingFiles: BuildingRenderingFiles): BuildingDefinition[] {
  const buildings: BuildingDefinition[] = [];

  let currentName: string | null = null;
  let functionLineGroups: string[][] = [];
  let propertyLines: string[] = [];
  let constructionPropertyLines: string[] = [];
  let tagLines: string[] = [];
  let section: "none" | "construction" | "function" | "properties" | "tags" = "none";

  function pushBuilding() {
    const renderingCodes = currentName ? variantRenderingCodes(currentName, renderingFiles) : [];
    if (currentName && renderingCodes.length > 0) {
      const building: BuildingDefinition = {
        name: currentName,
        renderingCodes,
        buildingFunctions: functionLineGroups.map(functionLines => parseBuildingFunction(functionLines)),
        properties: parseProperties(propertyLines),
      };
      const tags = parseTags(tagLines);
      if (tags.length > 0) building.properties.tags = tags;
      const constructionRender = parseConstructionRender(
        constructionRenderingCodes(currentName, renderingCodes.length, renderingFiles),
        constructionPropertyLines,
      );
      if (constructionRender) building.constructionRender = constructionRender;
      buildings.push(building);
    }
  }

  for (const line of lines) {
    const headingMatch = line.match(/^#\s+(.+)/);
    if (headingMatch) {
      pushBuilding();
      currentName = headingMatch[1].trim();
      functionLineGroups = [];
      propertyLines = [];
      constructionPropertyLines = [];
      tagLines = [];
      section = "none";
      continue;
    }

    if (line.match(/^##\s+Construction\s*$/)) {
      section = "construction";
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

    if (line.match(/^##\s+Tags/)) {
      section = "tags";
      continue;
    }

    if (section === "construction") {
      constructionPropertyLines.push(line);
    } else if (section === "properties") {
      propertyLines.push(line);
    } else if (section === "tags") {
      tagLines.push(line);
    } else if (section === "function") {
      functionLineGroups[functionLineGroups.length - 1].push(line);
    }
  }

  pushBuilding();

  return buildings;
}

// The variants of a building are the files of its folder numbered from 0 up, and they end at the
// first number without a file, so that every variant up to their count has its code.
function variantRenderingCodes(buildingName: string, renderingFiles: BuildingRenderingFiles): string[] {
  const renderingCodes: string[] = [];
  for (let variantNumber = 0; renderingFiles[`${buildingName}/${variantNumber}.sgl`] !== undefined; variantNumber++) {
    renderingCodes.push(renderingFiles[`${buildingName}/${variantNumber}.sgl`].trim());
  }
  return renderingCodes;
}

// Only a variant the building has can go up, so a construction file of a variant beyond them is left out.
function constructionRenderingCodes(buildingName: string, numberOfVariants: number, renderingFiles: BuildingRenderingFiles): (string | null)[] {
  return Array.from({ length: numberOfVariants }, (_, variantNumber) =>
    renderingFiles[`${buildingName}/${variantNumber}${CONSTRUCTION_RENDERING_FILE_SUFFIX}`]?.trim() ?? null
  );
}

// A building without both the code of a construction and how long it lasts goes up at once.
function parseConstructionRender(renderingCodes: (string | null)[], propertyLines: string[]): ConstructionRender | undefined {
  if (renderingCodes.every(renderingCode => renderingCode === null)) return undefined;
  const durationMatch = propertyLines
    .map(line => line.trim().match(/^duration=(.+)$/))
    .find(match => match !== null && isAmount(match[1]));
  if (!durationMatch) return undefined;
  return { renderingCodes, duration: parseInt(durationMatch[1]) };
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
    if (match[1] === "minLevel" && isAmount(match[2])) {
      props.minLevel = parseInt(match[2]);
    }
    if (match[1] === "pollutionArea" && isAmount(match[2])) {
      const pollutionArea = parseInt(match[2]);
      if (pollutionArea >= 1 && pollutionArea <= LARGEST_POLLUTION_AREA) props.pollutionArea = pollutionArea;
    }
    if (match[1] === "randomizedDelayAnimationStart" && /^\d+(\.\d+)?$/.test(match[2])) {
      props.randomizedDelayAnimationStart = parseFloat(match[2]);
    }
    if (match[1] === "poolSize" && isAmount(match[2])) {
      props.poolSize = parseInt(match[2]);
    }
  }
  return props;
}

// Each line of the Tags section holds one tag.
function parseTags(lines: string[]): string[] {
  return lines.map(line => line.trim()).filter(tag => tag.length > 0);
}

function parseBuildingFunction(lines: string[]): BuildingFunction {
  const inputs: ResourceThroughput[] = [];
  const outputs: BuildingFunctionOutput[] = [];
  let functionName: string | undefined = undefined;
  let pool = false;
  let seenOutputSeparator = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === OUTPUT_SEPARATOR) {
      seenOutputSeparator = true;
      continue;
    }
    const nameMatch = trimmed.match(/^Name:\s*(.+)$/);
    if (nameMatch) {
      functionName = nameMatch[1].trim();
      continue;
    }
    const poolMatch = trimmed.match(/^Pool:\s*(.+)$/);
    if (poolMatch) {
      pool = poolMatch[1].trim() === POOL_VALUE;
      continue;
    }
    const match = trimmed.match(/^(\S+)\s+(\S+)(?:\s+(\S+))?$/);
    if (!match) continue;
    const resourceName = match[1];
    const amountOrProperty = match[2];
    const marker = match[3];
    if (seenOutputSeparator) {
      outputs.push(parseOutput(resourceName, amountOrProperty, marker));
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
  if (pool) buildingFunction.pool = true;

  return buildingFunction;
}

// An output is written either with the amount it produces or with the name of the location
// property whose value on the building's location is the amount it produces. An amount may be
// followed by the marker of an output pollution affects, and a property name by the fraction
// indicator and the divisor of the fraction of the property's value it produces.
function parseOutput(resourceName: string, amountOrProperty: string, marker: string | undefined): BuildingFunctionOutput {
  if (!isAmount(amountOrProperty)) return parseLocationPropertyOutput(resourceName, amountOrProperty);
  return marker === AFFECTED_BY_POLLUTION_MARKER
    ? { name: resourceName, value: parseInt(amountOrProperty), affectedByPollution: true }
    : { name: resourceName, value: parseInt(amountOrProperty) };
}

function parseLocationPropertyOutput(resourceName: string, propertyWithFraction: string): BuildingFunctionOutput {
  const [locationProperty, divisor] = propertyWithFraction.split(FRACTION_INDICATOR);
  return divisor !== undefined && isAmount(divisor) && parseInt(divisor) > 0
    ? { name: resourceName, locationProperty, locationPropertyDivisor: parseInt(divisor) }
    : { name: resourceName, locationProperty };
}

function isAmount(amountOrProperty: string): boolean {
  return /^\d+$/.test(amountOrProperty);
}
