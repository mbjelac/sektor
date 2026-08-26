import { Location } from "../../../shared/sektorData";

export function locationPropertiesToLocations(locationProperties: { [key: string]: number[][] }): Location[][] {
  const propertyNames = Object.keys(locationProperties);
  if (propertyNames.length === 0) return [];
  const rows = locationProperties[propertyNames[0]].length;
  const cols = locationProperties[propertyNames[0]][0].length;
  return Array.from({ length: rows }, (_, x) =>
    Array.from({ length: cols }, (_, z) => ({
      properties: Object.fromEntries(
        propertyNames.map(name => [name, locationProperties[name][x][z]])
      ),
    }))
  );
}
