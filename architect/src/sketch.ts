import p5 from "p5";
import {drawFloor} from "../../shared/drawFloor";
import {readCommands} from "./readCommands";
import {applyCommands} from "../../shared/applyCommands";
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

    if (wireframeOn) {
      p.stroke(150);
    } else {
      p.noStroke();
    }
    if (floorOn) {
      drawFloor(p, BLOCK_SIZE);
    }

    const commands = readCommands();
    applyCommands(p, commands, p.millis());

    document.getElementById("canvas-container")!.dataset.rendered = "true";
  };
};

new p5(sketch);
initEditorPanel();
