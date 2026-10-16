import { TriangleCoordinate } from "./planetGrid";
import { SektorListItem } from "./sektorList.api";

// Where on the page a triangle of the planet is seen, or nowhere while it is on the far side.
export type SpotOfTriangle = (location: TriangleCoordinate) => { x: number; y: number } | null;

// Every sektor lying on the planet is marked where it lies: a small hollow square, its name under
// it. The marks lie over the planet, under the lists, and go round with the planet as it is turned,
// out of sight while their sektor is on the far side of it. They are placed afresh whenever the
// planet is drawn and whenever the sektors change.
export function createSektorMarkers(): { showSektors: (sektors: SektorListItem[]) => void; followPlanet: (spotOfTriangle: SpotOfTriangle) => void } {
  const layer = document.createElement("div");
  layer.id = "sektor-markers";
  document.getElementById("planet-background")!.appendChild(layer);

  let sektors: SektorListItem[] = [];
  let spotOfTriangle: SpotOfTriangle | null = null;

  const placeMarkers = () => {
    layer.replaceChildren(...sektors.flatMap(sektor => {
      const spot = sektor.location && spotOfTriangle?.(sektor.location);
      return spot ? [createMarker(sektor, spot)] : [];
    }));
  };

  return {
    showSektors: shownSektors => {
      sektors = shownSektors;
      placeMarkers();
    },
    followPlanet: followedSpotOfTriangle => {
      spotOfTriangle = followedSpotOfTriangle;
      placeMarkers();
    },
  };
}

function createMarker(sektor: SektorListItem, spot: { x: number; y: number }): HTMLElement {
  const marker = document.createElement("div");
  marker.className = "sektor-marker";
  marker.style.left = `${spot.x}px`;
  marker.style.top = `${spot.y}px`;

  const square = document.createElement("div");
  square.className = "sektor-marker-square";

  const name = document.createElement("div");
  name.className = "sektor-marker-name";
  name.textContent = (sektor.name ?? "").trim() || "No name";

  marker.append(square, name);
  return marker;
}
