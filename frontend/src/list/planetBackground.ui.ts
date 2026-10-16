import p5 from "p5";
import { createPlanetGrid, PlanetGrid, PlanetTriangle, TriangleCoordinate } from "./planetGrid";
import planetMd from "../assets/planet.md?raw";
import { parsePlanet, PlanetRegion } from "./parsePlanet";
import { findTriangleAt, planetPointAt, Rotation } from "./planetPicking";
import { createPlanetRegionInfo } from "./planetRegionInfo.ui";

const EDGE_DIVISIONS = 16;
const RADIUS_SHARE_OF_SHORTER_SIDE = 0.35;
const RADIANS_PER_DRAGGED_PIXEL = 0.01;

type ColoredTriangle = { triangle: PlanetTriangle; region: PlanetRegion; color: p5.Color };

// The planet stands behind the lists, across the whole of the window, and is turned by dragging
// wherever the lists leave it showing. Nothing on it moves of itself, so it is drawn only when it
// is dragged or the window changes size. Wherever the mouse is over it, what lies there is told
// along the bottom of the page.
export function showPlanetBackground() {
  new p5(planetSketch);
}

function planetSketch(p: p5) {
  let grid: PlanetGrid;
  let coloredTriangles: ColoredTriangle[] = [];
  let rotation: Rotation = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  let lastPointerX = 0;
  let lastPointerY = 0;
  let isDragging = false;

  p.setup = () => {
    const container = document.getElementById("planet-background")!;
    const canvas = p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
    canvas.parent(container);
    p.noLoop();
    p.noStroke();

    grid = createPlanetGrid(EDGE_DIVISIONS);
    coloredTriangles = colorTriangles(p, grid);
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

// The planet looks the same on every visit, every triangle coloured as planet.md has it. A file
// shaped for another planet is said rather than coloured wrongly.
function colorTriangles(p: p5, grid: PlanetGrid): ColoredTriangle[] {
  const regionRings = parsePlanet(planetMd);
  if (regionRings.length !== grid.rings.length) {
    throw new Error(`planet.md has ${regionRings.length} rings, but the planet has ${grid.rings.length}`);
  }
  return grid.rings.flatMap((ring, ringIndex) => {
    const regionRing = regionRings[ringIndex] ?? [];
    if (regionRing.length !== ring.length) {
      throw new Error(`planet.md has ${regionRing.length} triangles on ring ${ringIndex}, but the ring has ${ring.length}`);
    }
    return ring.map(triangle => {
      const region = regionRing[triangle.coordinate.index]!;
      return { triangle, region, color: p.color(region.color) };
    });
  });
}

// The sphere turns the way it is dragged, whichever way it has already been turned: a drag sideways
// turns it about the upright of the screen and a drag up or down about the level of the screen, the
// screen's y running downwards. The turn of the drag is put before the turns already gathered.
function dragRotation(draggedX: number, draggedY: number, rotation: Rotation): Rotation {
  const aboutUpright = draggedX * RADIANS_PER_DRAGGED_PIXEL;
  const aboutLevel = -draggedY * RADIANS_PER_DRAGGED_PIXEL;
  const turnAboutUpright: Rotation = [
    [Math.cos(aboutUpright), 0, Math.sin(aboutUpright)],
    [0, 1, 0],
    [-Math.sin(aboutUpright), 0, Math.cos(aboutUpright)],
  ];
  const turnAboutLevel: Rotation = [
    [1, 0, 0],
    [0, Math.cos(aboutLevel), -Math.sin(aboutLevel)],
    [0, Math.sin(aboutLevel), Math.cos(aboutLevel)],
  ];
  return multiply(turnAboutLevel, multiply(turnAboutUpright, rotation));
}

function multiply(left: Rotation, right: Rotation): Rotation {
  return [0, 1, 2].map(row =>
    [0, 1, 2].map(column => left[row]![0] * right[0]![column]! + left[row]![1] * right[1]![column]! + left[row]![2] * right[2]![column]!),
  ) as Rotation;
}

// p5 takes the sixteen numbers of a 3D matrix a column at a time.
function rotationColumns(rotation: Rotation): [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] {
  const [[a, b, c], [d, e, f], [g, h, i]] = rotation;
  return [a, d, g, 0, b, e, h, 0, c, f, i, 0, 0, 0, 0, 1];
}
