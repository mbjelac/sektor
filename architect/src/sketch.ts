import p5 from "p5";
import {drawFloor} from "../../shared/drawFloor";
import {readCommandsText} from "./readCommands";
import {parseCommands} from "../../shared/parseCommands";
import {BakedBodies, bakeCommands, drawBakedBodies, freeBakedBodies} from "../../shared/bakeCommands";
import {BLOCK_SIZE} from "../../shared/constants";
import {initEditorPanel} from "./editor/editorPanel";

const sketch = (p: p5) => {
  let wireframeOn = false;
  let floorOn = true;

  p.setup = () => {
    const container = document.getElementById("canvas-container")!;
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL);
    canvas.parent(container);
    p.ortho();

    const camDist = 800;
    const camAngleY = Math.PI / 4;
    const camAngleX = Math.PI / 4;
    const camX = camDist * Math.sin(camAngleY) * Math.cos(camAngleX);
    const camY = -camDist * Math.sin(camAngleX);
    const camZ = camDist * Math.cos(camAngleY) * Math.cos(camAngleX);
    p.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);

    const wireframeToggle = document.getElementById("wireframe-toggle")!;
    wireframeToggle.addEventListener("click", () => {
      wireframeOn = !wireframeOn;
      wireframeToggle.classList.toggle("on", wireframeOn);
    });

    const floorToggle = document.getElementById("floor-toggle")!;
    floorToggle.addEventListener("click", () => {
      floorOn = !floorOn;
      floorToggle.classList.toggle("on", floorOn);
    });
  };

  p.draw = () => {
    p.background(30);

    // Lighting: fixed world-space position
    // 3 max translation heights up, 2 max translation lengths back and to the right
    p.ambientLight(60);
    p.pointLight(255, 255, 255, 2 * BLOCK_SIZE, -3 * BLOCK_SIZE, -2 * BLOCK_SIZE);

    p.orbitControl();

    // Stroke has to be set before baking, so that the wireframe ends up in the geometry.
    if (wireframeOn) {
      p.stroke(150);
    } else {
      p.noStroke();
    }
    if (floorOn) {
      drawFloor(p, BLOCK_SIZE);
    }

    drawBakedBodies(p, bakedBodies(p, wireframeOn), p.millis());

    document.getElementById("canvas-container")!.dataset.rendered = "true";
  };
};

// Drawing every body anew each frame made turning and zooming a shape of any size crawl, because
// each body cost p5 a geometry rebuild and a fresh upload to the graphics card. Bodies which stand
// still are therefore baked into a geometry which is drawn as it is, frame after frame. The bake
// only has to be redone when the shape being designed changes, which is when the editor text
// changes, or when the wireframe is toggled, since the wireframe is baked into the geometry.
let baked: BakedBodies | null = null;
let bakedCommandsText: string | null = null;
let bakedWireframe = false;

function bakedBodies(p: p5, wireframeOn: boolean): BakedBodies {
  const commandsText = readCommandsText();
  if (baked && commandsText === bakedCommandsText && wireframeOn === bakedWireframe) return baked;

  if (baked) {
    freeBakedBodies(p, baked);
  }
  baked = bakeCommands(p, parseCommands(commandsText));
  bakedCommandsText = commandsText;
  bakedWireframe = wireframeOn;
  return baked;
}

new p5(sketch);
initEditorPanel();
