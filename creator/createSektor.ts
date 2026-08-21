import { SektorData } from "../shared/sektorData";
import { MODIFIER_MIN, MODIFIER_MAX } from "../shared/modifierLimits";
import restrictionsRequirements from "./restrictions_requirements";

const GRID_SIZE = 10;
const PROPERTY_NAMES = ["soil", "groundwater", "ore", "insolation", "wind"];

function createSektor(): SektorData {
  return {
    locationProperties: generateLocationProperties(),
    importRestrictions: restrictionsRequirements.importRestrictions,
    exportRequirements: restrictionsRequirements.exportRequirements,
    buildings: [],
  };
}

function generateLocationProperties(): { [key: string]: number[][] } {
  return Object.fromEntries(
    PROPERTY_NAMES.map(name => [name, generatePropertyMatrix()])
  );
}

function generatePropertyMatrix(): number[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => generatePropertyValue())
  );
}

function generatePropertyValue(): number {
  return Math.floor(Math.random() * (MODIFIER_MAX - MODIFIER_MIN + 1)) + MODIFIER_MIN;
}

console.log(formatSektorData(createSektor()));

function formatSektorData(sektorData: SektorData): string {
  return JSON.stringify(sektorData, null, 2).replace(
    /\[[\s\d.,]+]/g,
    numberArray => numberArray.replace(/\s+/g, " ").replace(/\[ /, "[").replace(/ ]/, "]")
  );
}
