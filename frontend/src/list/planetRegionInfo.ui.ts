import { TriangleCoordinate } from "./planetGrid";
import { PlanetRegion } from "./parsePlanet";
import { regionLabels } from "./regionLabels";

// A line along the bottom of the page telling what lies under the mouse on the planet: where it is,
// by its ring and its place on the ring, then its biome type and what covers the land there. It is
// empty while the mouse is off the planet.
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
    labels.replaceChildren(...(shown ? regionLabels(shown.region) : []).map(label => {
      const labelElement = document.createElement("span");
      labelElement.textContent = label;
      return labelElement;
    }));
  };
}
