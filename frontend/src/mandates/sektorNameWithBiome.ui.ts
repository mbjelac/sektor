import { getPlanet } from "../list/planet";
import { regionCover, regionCoverIcon } from "../list/regionLabels";
import { TriangleCoordinate } from "../list/planetGrid";

// The sektor's name, followed by the picture of what covers its triangle of the planet, as the list
// of sektors tells it, with the cover in words to be read on hovering it. A sektor made before
// sektors were put on the planet lies nowhere on it, and has no picture.
export function createSektorNameWithBiome(sektorName: string, location: TriangleCoordinate | undefined, className: string): HTMLElement {
  const cell = document.createElement("span");
  cell.className = className;
  cell.textContent = sektorName;

  const region = location ? getPlanet().regionRings[location.ring]?.[location.index] : undefined;
  if (region) {
    const biome = document.createElement("span");
    biome.className = "sektor-biome";
    biome.textContent = regionCoverIcon(region);
    biome.title = regionCover(region);
    cell.append(" ", biome);
  }

  return cell;
}
