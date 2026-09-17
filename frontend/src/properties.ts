import propertiesMd from "./assets/properties.md?raw";
import testPropertiesMd from "./assets/properties.test.md?raw";
import { MODIFIER_MIN, MODIFIER_MAX } from "../../shared/modifierLimits";
import { isTestMode } from "./testMode";

const source = isTestMode ? testPropertiesMd : propertiesMd;

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
const FLOOR_LOW_COLOR = "#E3CA86";

// How high ground can stand and still have things growing on it. Up to here a location is colored
// by its soil, however high it lies; above it the ground is bare rock and the snow lying on it.
const TREE_LINE_ALTITUDE = 6;

// The pairs of colors the bare ground above the tree line lies between, the first pair for the
// first altitude above it and so on up: stone going pale, then the cold of it, then snow. A pair
// rather than a color, so that no two locations of such ground are quite the same shade.
const COLORS_ABOVE_THE_TREE_LINE: [string, string][] = [
  ["#d9d8b8", "#d6d6c5"],
  ["#d5e0e0", "#cae3e3"],
  ["#dff5f5", "#ffffff"],
];

// A floor is colored by its soil: the lowest value is sandy, the highest is soil's own color, and
// values in between are the color in between. That holds however high the ground stands, up to the
// tree line; above it the ground takes its color from its height instead, spreading over a pair of
// colors so that a mountainside is not one flat sheet of the same shade. Where a location falls in
// that spread is what colorVariation says, from 0 for the first color to 1 for the second.
export function floorColor(soilValue: number, altitude: number, colorVariation: number): [number, number, number] {
  if (altitude > TREE_LINE_ALTITUDE) return spreadBetween(colorsAt(altitude), colorVariation);
  return soilFloorColor(soilValue);
}

// Ground standing higher than there are colors laid out for is colored like the highest there is.
function colorsAt(altitude: number): [string, string] {
  const stepsAboveTheTreeLine = altitude - TREE_LINE_ALTITUDE - 1;
  return COLORS_ABOVE_THE_TREE_LINE[Math.min(stepsAboveTheTreeLine, COLORS_ABOVE_THE_TREE_LINE.length - 1)];
}

function soilFloorColor(soilValue: number): [number, number, number] {
  const soil = propertyDefinitions.find(property => property.name === FLOOR_PROPERTY);
  if (!soil) return [128, 128, 128];
  return interpolateColors(parseHexColor(FLOOR_LOW_COLOR), parseHexColor(soil.color), valueFraction(soilValue));
}

function spreadBetween([fromColor, toColor]: [string, string], colorVariation: number): [number, number, number] {
  return interpolateColors(parseHexColor(fromColor), parseHexColor(toColor), colorVariation);
}

// The lowest property value is black, the highest is the property's own color,
// and values in between are the color in between.
export function propertyValueColor(propertyName: string, value: number): [number, number, number] {
  const property = propertyDefinitions.find(property => property.name === propertyName);
  if (!property) return [128, 128, 128];
  return interpolateColors([0, 0, 0], parseHexColor(property.color), valueFraction(value));
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
