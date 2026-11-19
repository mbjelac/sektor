import { TriangleCoordinate } from "./planetGrid";
import { Planet } from "./planet";
import { SpotOfTriangle } from "./sektorMarkers.ui";
import { planetPropertyDefinitions } from "../properties";

// Two pixels narrower than the 10 pixel square marking a sektor.
const ORE_MARK_DIAMETER = 8;

type OreMark = { coordinate: TriangleCoordinate; color: string };

// Every area rich in an ore is marked by a filled circle in the ore's color, on the middle of its
// triangle. The marks lie over the planet and under the sektors' marks, take no part in the mouse,
// and go round with the planet as it is turned, out of sight while their area is on the far side.
export function createOreMarks(planet: Planet): (spotOfTriangle: SpotOfTriangle) => void {
  const canvas = document.createElement("canvas");
  canvas.id = "ore-marks";
  document.getElementById("planet-background")!.appendChild(canvas);
  const oreMarks = findOreMarks(planet);

  return spotOfTriangle => {
    const pixelRatio = window.devicePixelRatio;
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;
    const context = canvas.getContext("2d")!;
    context.scale(pixelRatio, pixelRatio);
    for (const { coordinate, color } of oreMarks) {
      const spot = spotOfTriangle(coordinate);
      if (!spot) continue;
      context.fillStyle = color;
      context.beginPath();
      context.arc(spot.x, spot.y, ORE_MARK_DIAMETER / 2, 0, 2 * Math.PI);
      context.fill();
    }
  };
}

function findOreMarks(planet: Planet): OreMark[] {
  return planet.regionRings.flatMap((regionRing, ring) => regionRing.flatMap((region, index) => {
    if (!region.richOre) return [];
    return [{ coordinate: { ring, index }, color: oreColor(region.richOre) }];
  }));
}

export function oreColor(oreName: string): string {
  return planetPropertyDefinitions.find(property => property.name === oreName)?.color ?? "#808080";
}
