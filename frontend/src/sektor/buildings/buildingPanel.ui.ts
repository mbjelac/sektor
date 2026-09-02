import p5 from "p5";
import { parseCommands } from "../../../../shared/parseCommands";
import { applyCommands } from "../../../../shared/applyCommands";
import { drawFloor } from "../../../../shared/drawFloor";
import { BLOCK_SIZE } from "../../../../shared/constants";
import { trashIcon } from "../../icons";
import { createFunctionDisplay } from "../buildingFunctionDisplay.ui";
import { BuildingFunction, ResourceThroughput } from "./parseBuildingDefinitions";
import { BuildingLocation } from "../Sektor";
import { propertyValueColor } from "../../properties";
import { formatNumber } from "../../formatNumber";

const CAPACITY_DOT_COUNT = 10;

let panelEl: HTMLElement | null = null;
let previewP5: p5 | null = null;
let previewContainer: HTMLElement | null = null;
let currentDraw: { code: string; floorColor: [number, number, number]; showFloor: boolean } | null = null;

function ensurePreviewP5(parent: HTMLElement) {
  if (previewP5) {
    // Re-parent the existing canvas
    parent.appendChild(previewP5.canvas.parentElement ?? previewP5.canvas);
    return;
  }

  const size = 120;
  previewP5 = new p5((p: p5) => {
    p.setup = () => {
      const canvas = p.createCanvas(size, size, p.WEBGL);
      canvas.parent(parent);
      const viewSize = size / 0.7;
      p.ortho(-viewSize / 2, viewSize / 2, -viewSize / 2, viewSize / 2);

      const camDist = 800;
      const camAngleY = Math.PI / 4;
      const camAngleX = Math.PI / 6;
      const camX = camDist * Math.sin(camAngleY) * Math.cos(camAngleX);
      const camY = -camDist * Math.sin(camAngleX);
      const camZ = camDist * Math.cos(camAngleY) * Math.cos(camAngleX);
      p.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
      p.noLoop();
    };

    p.draw = () => {
      if (!currentDraw) return;
      p.background(42);
      p.ambientLight(60);
      p.pointLight(255, 255, 255, 2 * BLOCK_SIZE, -3 * BLOCK_SIZE, -2 * BLOCK_SIZE);
      p.noStroke();

      p.translate(0, BLOCK_SIZE * 0.3, 0);
      if (currentDraw.showFloor) {
        drawFloor(p, BLOCK_SIZE, currentDraw.floorColor);
      }
      const commands = parseCommands(currentDraw.code);
      applyCommands(p, commands);
    };
  });
}

export function showBuildingPanel({ name, code, buildingFunction, modifiedOutputs, capacity, locationProperties, modifierProperties, floorColor, showFloor, location, onDestroy, onIncreaseCapacity, onDecreaseCapacity }: {
  name: string,
  code: string,
  buildingFunction: BuildingFunction,
  modifiedOutputs: ResourceThroughput[],
  capacity?: number,
  locationProperties?: { [_: string]: number },
  modifierProperties?: string[],
  floorColor: [number, number, number],
  showFloor?: boolean,
  location: BuildingLocation,
  onDestroy?: () => void,
  onIncreaseCapacity?: () => void,
  onDecreaseCapacity?: () => void
}) {
  hideBuildingPanel();

  panelEl = document.createElement("div");
  panelEl.id = "building-panel";

  const topRow = document.createElement("div");
  topRow.className = "bf-top-row";

  const locationEl = document.createElement("div");
  locationEl.className = "bf-location";
  locationEl.textContent = `Location: ${location.x} , ${location.y}`;
  topRow.appendChild(locationEl);

  if (onDestroy) {
    const destroyButton = document.createElement("button");
    destroyButton.className = "bf-destroy";
    destroyButton.innerHTML = trashIcon;
    destroyButton.addEventListener("click", onDestroy);
    topRow.appendChild(destroyButton);
  }

  panelEl.appendChild(topRow);

  // Building preview canvas + name
  const header = document.createElement("div");
  header.className = "bf-header";

  previewContainer = document.createElement("div");
  previewContainer.className = "bf-preview";
  header.appendChild(previewContainer);

  const nameEl = document.createElement("div");
  nameEl.className = "bf-name";
  nameEl.textContent = name;
  header.appendChild(nameEl);

  panelEl.appendChild(header);

  if (buildingFunction.inputs.length > 0 || buildingFunction.outputs.length > 0) {
    panelEl.appendChild(createFunctionDisplay({ buildingFunction: buildingFunction, modifiedOutputs: modifiedOutputs }));
  }

  if (capacity !== undefined) {
    panelEl.appendChild(createCapacityPanel(capacity, onIncreaseCapacity, onDecreaseCapacity));
  }

  if (locationProperties) {
    const propertiesSection = document.createElement("div");
    propertiesSection.className = "bp-properties";

    const propertiesHeader = document.createElement("div");
    propertiesHeader.className = "bp-properties-header";
    propertiesHeader.textContent = "Geo survey";
    propertiesSection.appendChild(propertiesHeader);

    for (const [propertyName, propertyValue] of Object.entries(locationProperties)) {
      const row = document.createElement("div");
      row.className = "bp-property-row";
      if (modifierProperties?.includes(propertyName)) {
        row.classList.add("bp-property-modifier");
      }

      const nameCell = document.createElement("span");
      nameCell.className = "bp-property-name";
      nameCell.textContent = propertyName;
      row.appendChild(nameCell);

      const valueCell = document.createElement("span");
      valueCell.className = "bp-property-value";
      valueCell.textContent = propertyValue > 0 ? `+${formatNumber(propertyValue)}` : formatNumber(propertyValue);
      row.appendChild(valueCell);

      const swatch = document.createElement("span");
      swatch.className = "bp-property-swatch";
      const [red, green, blue] = propertyValueColor(propertyName, propertyValue);
      swatch.style.backgroundColor = `rgb(${red},${green},${blue})`;
      row.appendChild(swatch);

      propertiesSection.appendChild(row);
    }
    panelEl.appendChild(propertiesSection);
  }

  document.getElementById("canvas-container")!.appendChild(panelEl);

  // Set draw data and render
  currentDraw = { code, floorColor, showFloor: showFloor !== false };
  ensurePreviewP5(previewContainer);
  previewP5!.redraw();
}

export function hideBuildingPanel() {
  if (panelEl) {
    panelEl.remove();
    panelEl = null;
  }
  currentDraw = null;
}

// A building's capacity is shown as ten dots, one lit for each tenth the building runs at.
function createCapacityPanel(capacity: number, onIncreaseCapacity?: () => void, onDecreaseCapacity?: () => void): HTMLElement {
  const capacityPanel = document.createElement("div");
  capacityPanel.className = "bc-capacity";

  const label = document.createElement("div");
  label.className = "bc-label";
  label.textContent = "Capacity";
  capacityPanel.appendChild(label);

  const row = document.createElement("div");
  row.className = "bc-row";

  const decreaseButton = document.createElement("button");
  decreaseButton.className = "bc-button bc-decrease";
  if (onDecreaseCapacity) decreaseButton.addEventListener("click", onDecreaseCapacity);
  row.appendChild(decreaseButton);

  const dots = document.createElement("div");
  dots.className = "bc-dots";
  const litDotCount = Math.round(capacity * CAPACITY_DOT_COUNT);
  for (let dotIndex = 0; dotIndex < CAPACITY_DOT_COUNT; dotIndex++) {
    const dot = document.createElement("span");
    dot.className = dotIndex < litDotCount ? "bc-dot bc-dot-lit" : "bc-dot";
    dots.appendChild(dot);
  }
  row.appendChild(dots);

  const increaseButton = document.createElement("button");
  increaseButton.className = "bc-button bc-increase";
  if (onIncreaseCapacity) increaseButton.addEventListener("click", onIncreaseCapacity);
  row.appendChild(increaseButton);

  capacityPanel.appendChild(row);

  return capacityPanel;
}
