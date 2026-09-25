import buildingTagsMd from "../../assets/building-tags.md?raw";

// Every tag a building can be marked with, one per line, in the order the toolbar offers them.
export const buildingTags: string[] = parseBuildingTags(buildingTagsMd.split("\n"));

export function parseBuildingTags(lines: string[]): string[] {
  return lines.map(line => line.trim()).filter(line => line.length > 0);
}
