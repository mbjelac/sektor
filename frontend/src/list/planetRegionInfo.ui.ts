import { TriangleCoordinate } from "./planetGrid";
import { PlanetRegion } from "./parsePlanet";
import { regionLabels } from "./regionLabels";
import { oreColor } from "./oreMarks.ui";

// A line along the bottom of the page telling what lies under the mouse on the planet: where it is,
// by its ring and its place on the ring, then its biome type and what covers the land there, then the
// ore it is rich in, if any, by a swatch of the ore's color and its name. It is empty while the mouse
// is off the planet.
export function createPlanetRegionInfo(): (shown: { coordinate: TriangleCoordinate; region: PlanetRegion } | null) => void {
  const info = document.createElement("div");
  info.id = "planet-region-info";
  const coordinates = document.createElement("span");
  const labels = document.createElement("span");
  labels.className = "planet-region-labels";
  info.append(coordinates, labels);
  document.body.appendChild(info);

  return shown => {
    info.classList.toggle("planet-region-info-shown", shown !== null);
    coordinates.textContent = shown ? `${shown.coordinate.ring} : ${shown.coordinate.index}` : "";
    const labelElements = (shown ? regionLabels(shown.region) : []).map(label => {
      const labelElement = document.createElement("span");
      labelElement.textContent = label;
      return labelElement;
    });
    const richOre = shown?.region.richOre;
    labels.replaceChildren(...labelElements, ...(richOre ? [createOreLabel(richOre)] : []));
  };
}

function createOreLabel(oreName: string): HTMLElement {
  const oreLabel = document.createElement("span");
  oreLabel.className = "planet-region-ore";
  const swatch = document.createElement("span");
  swatch.className = "planet-region-ore-swatch";
  swatch.style.backgroundColor = oreColor(oreName);
  oreLabel.append(swatch, document.createTextNode(oreName.charAt(0).toUpperCase() + oreName.slice(1)));
  return oreLabel;
}
