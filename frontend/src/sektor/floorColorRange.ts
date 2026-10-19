import { TerrainStyle } from "./terrainStyle";

// The colors a floor runs between, from the poorest soil to the richest. Temperate ground runs from
// sand up to soil's own color; tropical ground from a warmer sand to a lusher green.
export function floorColorRange(terrainStyle: TerrainStyle, soilColor: string): { poorest: string; richest: string } {
  if (terrainStyle === "tropical") return { poorest: "#E3C286", richest: "#99EB73" };
  return { poorest: "#E3CA86", richest: soilColor };
}
