// The location property telling how fouled the ground of a location is, as a percentage.
export const POLLUTION_PROPERTY = "pollution";
// Ground cannot be fouled more than all the way.
export const MOST_POLLUTION = 100;

// What fouled ground spoils: whatever is drawn out of the ground itself. Wind, sunlight and what
// lies deep in the rock are none the worse for it.
const POLLUTION_AFFECTED_PROPERTIES = ["soil", "groundwater"];

// The properties of a location as they are once its pollution has spoiled them: ground fouled by
// some percentage keeps only the rest of what it held of every property pollution spoils.
export function pollutedLocationProperties(locationProperties: { [propertyName: string]: number }): { [propertyName: string]: number } {
  const pollution = locationProperties[POLLUTION_PROPERTY] ?? 0;
  return Object.fromEntries(Object.entries(locationProperties).map(([propertyName, propertyValue]) => [
    propertyName,
    isAffectedByPollution(propertyName, pollution)
      ? Math.round(propertyValue * (MOST_POLLUTION - pollution) / MOST_POLLUTION)
      : propertyValue,
  ]));
}

// A property pollution spoils is only affected at a location which is fouled at all.
export function isAffectedByPollution(propertyName: string, pollution: number): boolean {
  return pollution > 0 && POLLUTION_AFFECTED_PROPERTIES.includes(propertyName);
}
