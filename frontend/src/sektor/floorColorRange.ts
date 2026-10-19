import { TerrainStyle } from "./terrainStyle";

// The colors a floor runs between, from the poorest soil to the richest. Temperate ground runs from
// sand up to soil's own color; tropical ground from a warmer sand to a lusher green; polar ground
// from a frosted gray to a cold green; desert ground from a pale lime sand to a golden one.
export function floorColorRange(terrainStyle: TerrainStyle, soilColor: string): { poorest: string; richest: string } {
  if (terrainStyle === "tropical") return { poorest: "#E3C286", richest: "#99EB73" };
  if (terrainStyle === "polar") return { poorest: "#AFCCC1", richest: "#86EBC4" };
  if (terrainStyle === "desert") return { poorest: "#D7E07E", richest: "#F0C756" };
  return { poorest: "#E3CA86", richest: soilColor };
}
