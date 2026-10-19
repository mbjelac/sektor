import propertiesMd from "./assets/properties.md?raw";
import testPropertiesMd from "./assets/properties.test.md?raw";
import { MODIFIER_MIN, MODIFIER_MAX } from "../../shared/modifierLimits";
import { isTestMode } from "./testMode";
import { MOST_POLLUTION, POLLUTION_PROPERTY } from "./sektor/pollution";
import { TerrainStyle } from "./sektor/terrainStyle";
import { floorColorRange } from "./sektor/floorColorRange";

const source = isTestMode ? testPropertiesMd : propertiesMd;

// Every property the ground of a sektor is made of, which is every property described. A sektor
// carries all of them, whatever its buildings happen to draw on.
export function getLocationPropertyNames(): string[] {
  return propertyDefinitions.map(propertyDefinition => propertyDefinition.name);
}

export interface PropertyDefinition {
  name: string;
  color: string;
}

export const propertyDefinitions: PropertyDefinition[] = [];

for (const line of source.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) continue;
  propertyDefinitions.push({
    name: parts[0],
    color: parts[1],
  });
}

const FLOOR_PROPERTY = "soil";

// A floor is colored by its soil: the lowest value is the poorest color of the terrain's look, the
// highest its richest, and values in between are the color in between.
export function floorColor(soilValue: number, terrainStyle: TerrainStyle): [number, number, number] {
  const soil = propertyDefinitions.find(property => property.name === FLOOR_PROPERTY);
  if (!soil) return [128, 128, 128];
  const { poorest, richest } = floorColorRange(terrainStyle, soil.color);
  return interpolateColors(parseHexColor(poorest), parseHexColor(richest), valueFraction(soilValue));
}

// The lowest property value is black, the highest is the property's own color,
// and values in between are the color in between.
export function propertyValueColor(propertyName: string, value: number): [number, number, number] {
  const property = propertyDefinitions.find(property => property.name === propertyName);
  if (!property) return [128, 128, 128];
  return interpolateColors([0, 0, 0], parseHexColor(property.color), propertyValueFraction(propertyName, value));
}

// Pollution is a percentage of the ground fouled, not an amount the ground holds as every other
// property is, so it is measured against ground fouled all the way.
function propertyValueFraction(propertyName: string, value: number): number {
  if (propertyName === POLLUTION_PROPERTY) return value / MOST_POLLUTION;
  return valueFraction(value);
}

export function valueFraction(value: number): number {
  return (value - MODIFIER_MIN) / (MODIFIER_MAX - MODIFIER_MIN);
}

export function interpolateColors(from: [number, number, number], to: [number, number, number], fraction: number): [number, number, number] {
  return [
    Math.round(from[0] + (to[0] - from[0]) * fraction),
    Math.round(from[1] + (to[1] - from[1]) * fraction),
    Math.round(from[2] + (to[2] - from[2]) * fraction),
  ];
}

export function parseHexColor(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
