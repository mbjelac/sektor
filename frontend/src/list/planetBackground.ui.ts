import p5 from "p5";
import { PlanetGrid, PlanetTriangle, TriangleCoordinate } from "./planetGrid";
import { PlanetRegion } from "./parsePlanet";
import { getPlanet, Planet } from "./planet";
import { findTriangleAt, planetPointAt, screenSpotOf } from "./planetPicking";
import { dragRotation, facingRotation, Rotation, rotationBetween, uprightRotation } from "./planetRotation";
import { getPlanetRotation, savePlanetRotation } from "./planetRotation.api";
import { createPlanetRegionInfo } from "./planetRegionInfo.ui";
import { createSektorMarkers, SpotOfTriangle } from "./sektorMarkers.ui";
import { SektorListItem } from "./sektorList.api";

const RADIUS_SHARE_OF_SHORTER_SIDE = 0.35;
const TURN_TO_TRIANGLE_MILLISECONDS = 1000;

type ColoredTriangle = { triangle: PlanetTriangle; region: PlanetRegion; color: p5.Color };

// The planet stands behind the lists, across the whole of the window, and is turned by dragging
// wherever the lists leave it showing, or stood upright by a double click. Nothing on it moves of
// itself, so it is drawn only when it is dragged or the window changes size. It is kept turned as
// it was last drawn, so that it is turned the same way when the page is come back to. Wherever the
// mouse is over it, what lies there is told along the bottom of the page. The sektors are marked where they
// lie on it, and whoever shows the planet says which sektors there are, and again whenever they
// change, and may turn the planet to show any triangle of it. A sektor clicked on the planet is
// handed back to whoever shows it.
export function showPlanetBackground(onSektorChosen: (sektorId: string) => void): {
  showSektors: (sektors: SektorListItem[]) => void;
  turnToTriangle: (location: TriangleCoordinate) => void;
} {
  const sektorMarkers = createSektorMarkers(onSektorChosen);
  let turnToTriangle: (location: TriangleCoordinate) => void = () => {};
  new p5(p => { turnToTriangle = planetSketch(p, sektorMarkers.followPlanet); });
  return { showSektors: sektorMarkers.showSektors, turnToTriangle: location => turnToTriangle(location) };
}

// Gives back the way of turning the planet so that a triangle of it faces the viewer from the middle
// of the screen.
function planetSketch(p: p5, followPlanet: (spotOfTriangle: SpotOfTriangle) => void): (location: TriangleCoordinate) => void {
  let grid: PlanetGrid;
  let coloredTriangles: ColoredTriangle[] = [];
  let rotation: Rotation = getPlanetRotation();
  let lastPointerX = 0;
  let lastPointerY = 0;
  let isDragging = false;
  // A turn to a triangle under way: where it set out from, where it is going, and when it set out.
  let turn: { from: Rotation; to: Rotation; startMillis: number } | null = null;

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
        stopTurning();
        rotation = dragRotation(event.clientX - lastPointerX, event.clientY - lastPointerY, rotation);
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        p.redraw();
      }
      // Over the lists the mouse is on them, not on the planet behind them. A sektor's mark is on the
      // planet, and what lies under it is told as it is anywhere else.
      const isOverPlanet = event.target === canvas.elt || (event.target instanceof Element && event.target.closest("#sektor-markers") !== null);
      showRegionInfo(isOverPlanet ? regionAt(event.clientX, event.clientY) : null);
    });
    canvas.elt.addEventListener("pointerleave", () => showRegionInfo(null));
    // A double click stands a planet turned every which way back upright.
    canvas.elt.addEventListener("dblclick", (event: MouseEvent) => {
      stopTurning();
      rotation = uprightRotation(rotation);
      p.redraw();
      showRegionInfo(regionAt(event.clientX, event.clientY));
    });
    window.addEventListener("pointerup", () => { isDragging = false; });
    window.addEventListener("resize", () => p.resizeCanvas(window.innerWidth, window.innerHeight));
  };

  p.draw = () => {
    if (turn) followTurn(turn);
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
    savePlanetRotation(rotation);

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

  // The planet turns to a triangle over a second, drawn afresh every frame of it, easing into the
  // turn and out of it. Dragging the planet or standing it upright takes over from the turn.
  function followTurn({ from, to, startMillis }: { from: Rotation; to: Rotation; startMillis: number }) {
    const progress = Math.min(1, (p.millis() - startMillis) / TURN_TO_TRIANGLE_MILLISECONDS);
    rotation = rotationBetween(from, to, progress * progress * (3 - 2 * progress));
    if (progress === 1) stopTurning();
  }

  function stopTurning() {
    if (!turn) return;
    turn = null;
    p.noLoop();
  }

  return location => {
    turn = { from: rotation, to: facingRotation(getPlanet().grid.rings[location.ring]![location.index]!.center), startMillis: p.millis() };
    p.loop();
  };
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
