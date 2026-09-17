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

// The kinds of ground a floor can be, by how high it stands. Plains and elevated plains are ground
// things grow on and are colored by their soil; from the low mountains up there is less and less
// growing on the ground and it is colored more and more by the height it stands at.
const LOW_MOUNTAIN_ALTITUDE = 2;
const HIGH_MOUNTAIN_ALTITUDE = 3;
const SNOWY_MOUNTAIN_ALTITUDE = 4;

// Where a low mountain's soil color is pulled towards, and how far: enough of the blue of cold and
// distance to tell a mountain from the plain below it, not so much that its soil stops showing.
const LOW_MOUNTAIN_BLUE = "#6E8FB5";
const LOW_MOUNTAIN_BLUE_SKEW = 0.45;

// The two colors the bare stone of a high mountain lies between, and the two the snow of the
// highest ground lies between. No two locations of such ground are quite the same shade.
const HIGH_MOUNTAIN_COLORS: [string, string] = ["#b8d9d1", "#c3d4d1"];
const SNOWY_MOUNTAIN_COLORS: [string, string] = ["#ffffff", "#ddf0ed"];

// A floor is colored by the kind of ground it is. The two lowest kinds show the soil property: the
// lowest value is sandy, the highest is soil's own color, and values in between are the color in
// between. Higher ground takes its color from its height instead, the two highest kinds spreading
// over a pair of colors so that a mountainside is not one flat sheet of the same shade. Where a
// location falls in that spread is what colorVariation says, from 0 for the first color to 1 for
// the second.
export function floorColor(soilValue: number, altitude: number, colorVariation: number): [number, number, number] {
  if (altitude >= SNOWY_MOUNTAIN_ALTITUDE) return spreadBetween(SNOWY_MOUNTAIN_COLORS, colorVariation);
  if (altitude >= HIGH_MOUNTAIN_ALTITUDE) return spreadBetween(HIGH_MOUNTAIN_COLORS, colorVariation);
  if (altitude >= LOW_MOUNTAIN_ALTITUDE) {
    return interpolateColors(soilFloorColor(soilValue), parseHexColor(LOW_MOUNTAIN_BLUE), LOW_MOUNTAIN_BLUE_SKEW);
  }
  return soilFloorColor(soilValue);
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
