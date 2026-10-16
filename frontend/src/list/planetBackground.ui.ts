import p5 from "p5";
import { PlanetGrid, PlanetTriangle, TriangleCoordinate } from "./planetGrid";
import { PlanetRegion } from "./parsePlanet";
import { getPlanet, Planet } from "./planet";
import { findTriangleAt, planetPointAt, screenSpotOf } from "./planetPicking";
import { dragRotation, Rotation, UNTURNED, uprightRotation } from "./planetRotation";
import { createPlanetRegionInfo } from "./planetRegionInfo.ui";
import { createSektorMarkers, SpotOfTriangle } from "./sektorMarkers.ui";
import { SektorListItem } from "./sektorList.api";

const RADIUS_SHARE_OF_SHORTER_SIDE = 0.35;

type ColoredTriangle = { triangle: PlanetTriangle; region: PlanetRegion; color: p5.Color };

// The planet stands behind the lists, across the whole of the window, and is turned by dragging
// wherever the lists leave it showing, or stood upright by a double click. Nothing on it moves of
// itself, so it is drawn only when it is dragged or the window changes size. Wherever the mouse is
// over it, what lies there is told along the bottom of the page. The sektors are marked where they
// lie on it, and whoever shows the planet says which sektors there are, and again whenever they
// change.
export function showPlanetBackground(): (sektors: SektorListItem[]) => void {
  const sektorMarkers = createSektorMarkers();
  new p5(p => planetSketch(p, sektorMarkers.followPlanet));
  return sektorMarkers.showSektors;
}

function planetSketch(p: p5, followPlanet: (spotOfTriangle: SpotOfTriangle) => void) {
  let grid: PlanetGrid;
  let coloredTriangles: ColoredTriangle[] = [];
  let rotation: Rotation = UNTURNED;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let isDragging = false;

  p.setup = () => {
    const container = document.getElementById("planet-background")!;
    const canvas = p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
    canvas.parent(container);
    p.noLoop();
    p.noStroke();

    const planet = getPlanet();
    grid = planet.grid;
    coloredTriangles = colorTriangles(p, planet);
    const showRegionInfo = createPlanetRegionInfo();

    canvas.elt.addEventListener("pointerdown", (event: PointerEvent) => {
      isDragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    });
    window.addEventListener("pointermove", (event: PointerEvent) => {
      if (isDragging) {
        rotation = dragRotation(event.clientX - lastPointerX, event.clientY - lastPointerY, rotation);
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        p.redraw();
      }
      // Over the lists the mouse is on them, not on the planet behind them.
      showRegionInfo(event.target === canvas.elt ? regionAt(event.clientX, event.clientY) : null);
    });
    canvas.elt.addEventListener("pointerleave", () => showRegionInfo(null));
    // A double click stands a planet turned every which way back upright.
    canvas.elt.addEventListener("dblclick", (event: MouseEvent) => {
      rotation = uprightRotation(rotation);
      p.redraw();
      showRegionInfo(regionAt(event.clientX, event.clientY));
    });
    window.addEventListener("pointerup", () => { isDragging = false; });
    window.addEventListener("resize", () => p.resizeCanvas(window.innerWidth, window.innerHeight));
  };

  p.draw = () => {
    p.clear();
    p.applyMatrix(...rotationColumns(rotation));
    // The planet's north is up its y axis, while the screen's y runs downwards, so it is turned
    // over to stand with its north pole at the top.
    p.rotateX(Math.PI);
    p.scale(planetRadius());

    p.beginShape(p.TRIANGLES);
    for (const { triangle, color } of coloredTriangles) {
      p.fill(color);
      for (const [x, y, z] of triangle.corners) p.vertex(x, y, z);
    }
    p.endShape();

    followPlanet(location => {
      const spot = screenSpotOf(grid.rings[location.ring]![location.index]!.center, planetRadius(), rotation);
      return spot && { x: p.width / 2 + spot.x, y: p.height / 2 + spot.y };
    });
  };

  function regionAt(clientX: number, clientY: number): { coordinate: TriangleCoordinate; region: PlanetRegion } | null {
    const point = planetPointAt(clientX - p.width / 2, clientY - p.height / 2, planetRadius(), rotation);
    const triangle = point && findTriangleAt(grid, point);
    if (!triangle) return null;
    const { coordinate } = triangle;
    return { coordinate, region: coloredTriangles.find(colored => colored.triangle === triangle)!.region };
  }

  function planetRadius(): number {
    return Math.min(p.width, p.height) * RADIUS_SHARE_OF_SHORTER_SIDE;
  }
}

// Every triangle is coloured as the planet has it.
function colorTriangles(p: p5, planet: Planet): ColoredTriangle[] {
  return planet.grid.rings.flatMap((ring, ringIndex) => ring.map(triangle => {
    const region = planet.regionRings[ringIndex]![triangle.coordinate.index]!;
    return { triangle, region, color: p.color(region.color) };
  }));
}

// p5 takes the sixteen numbers of a 3D matrix a column at a time.
function rotationColumns(rotation: Rotation): [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] {
  const [[a, b, c], [d, e, f], [g, h, i]] = rotation;
  return [a, d, g, 0, b, e, h, 0, c, f, i, 0, 0, 0, 0, 1];
}
