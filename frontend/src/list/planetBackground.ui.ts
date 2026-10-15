import p5 from "p5";
import { createIcosphere, Triangle } from "./icosphere";
import planetColorsTxt from "../assets/planet-colors.txt?raw";

const EDGE_DIVISIONS = 16;
const RADIUS_SHARE_OF_SHORTER_SIDE = 0.35;
const RADIANS_PER_DRAGGED_PIXEL = 0.01;

type ColoredTriangle = { triangle: Triangle; color: p5.Color };
// Rows of the matrix the sphere is turned by, the turns of every drag gathered into it.
type Rotation = [[number, number, number], [number, number, number], [number, number, number]];

// The planet stands behind the lists, across the whole of the window, and is turned by dragging
// wherever the lists leave it showing. Nothing on it moves of itself, so it is drawn only when it
// is dragged or the window changes size.
export function showPlanetBackground() {
  new p5(planetSketch);
}

function planetSketch(p: p5) {
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

    coloredTriangles = colorTriangles(p, createIcosphere(EDGE_DIVISIONS));

    canvas.elt.addEventListener("pointerdown", (event: PointerEvent) => {
      isDragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    });
    window.addEventListener("pointermove", (event: PointerEvent) => {
      if (!isDragging) return;
      rotation = dragRotation(event.clientX - lastPointerX, event.clientY - lastPointerY, rotation);
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      p.redraw();
    });
    window.addEventListener("pointerup", () => { isDragging = false; });
    window.addEventListener("resize", () => p.resizeCanvas(window.innerWidth, window.innerHeight));
  };

  p.draw = () => {
    p.clear();
    const radius = Math.min(p.width, p.height) * RADIUS_SHARE_OF_SHORTER_SIDE;
    p.applyMatrix(...rotationColumns(rotation));
    p.scale(radius);

    p.beginShape(p.TRIANGLES);
    for (const { triangle, color } of coloredTriangles) {
      p.fill(color);
      for (const [x, y, z] of triangle) p.vertex(x, y, z);
    }
    p.endShape();
  };
}

// The planet looks the same on every visit: each triangle takes its colour from its own line of the
// colours file, in the order the sphere is built. A file with more or fewer colours than the sphere
// has triangles was made for another sphere, which is said rather than coloured wrongly.
function colorTriangles(p: p5, triangles: Triangle[]): ColoredTriangle[] {
  const planetColors = planetColorsTxt.split("\n").map(line => line.trim()).filter(line => line !== "");
  if (planetColors.length !== triangles.length) {
    throw new Error(`planet-colors.txt has ${planetColors.length} colours, but the planet has ${triangles.length} triangles`);
  }
  return triangles.map((triangle, triangleIndex) => ({ triangle, color: p.color(planetColors[triangleIndex]!) }));
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
