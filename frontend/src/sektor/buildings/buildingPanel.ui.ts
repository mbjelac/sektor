import p5 from "p5";
import { parseCommands } from "../../../../shared/parseCommands";
import { applyCommands } from "../../../../shared/applyCommands";
import { drawFloor } from "../../../../shared/drawFloor";
import { BLOCK_SIZE } from "../../../../shared/constants";
import { trashIcon } from "../../icons";
import { createFunctionDisplay } from "../buildingFunctionDisplay.ui";
import { BuildingFunctionState, BuildingLocation } from "../Sektor";
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

export function showBuildingPanel({ name, code, buildingFunctions, locationProperties, modifierProperties, floorColor, showFloor, location, onDestroy, onIncreaseCapacity, onDecreaseCapacity, onIncreaseCapacityCompletely, onDecreaseCapacityCompletely }: {
  name: string,
  code: string,
  buildingFunctions: BuildingFunctionState[],
  locationProperties?: { [_: string]: number },
  modifierProperties?: string[],
  floorColor: [number, number, number],
  showFloor?: boolean,
  location: BuildingLocation,
  onDestroy?: () => void,
  onIncreaseCapacity?: (functionIndex: number) => void,
  onDecreaseCapacity?: (functionIndex: number) => void,
  onIncreaseCapacityCompletely?: (functionIndex: number) => void,
  onDecreaseCapacityCompletely?: (functionIndex: number) => void
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

  // Each of the building's functions runs at its own capacity, so each is shown with its own
  // capacity panel underneath it.
  for (const [functionIndex, buildingFunctionState] of buildingFunctions.entries()) {
    panelEl.appendChild(createFunctionDisplay({
      buildingFunction: buildingFunctionState.buildingFunction,
      modifiedOutputs: buildingFunctionState.modifiedOutputs,
    }));
    panelEl.appendChild(createCapacityPanel({
      capacity: buildingFunctionState.capacity,
      onIncreaseCapacity: () => onIncreaseCapacity?.(functionIndex),
      onDecreaseCapacity: () => onDecreaseCapacity?.(functionIndex),
      onIncreaseCapacityCompletely: () => onIncreaseCapacityCompletely?.(functionIndex),
      onDecreaseCapacityCompletely: () => onDecreaseCapacityCompletely?.(functionIndex),
    }));
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

  // The panel is the first of the right panels, above the sektor state panel.
  document.getElementById("right-panels")!.prepend(panelEl);

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
// The buttons around the dots change the capacity by a tenth, the double ones all the way
// down to nothing or up to the full capacity.
function createCapacityPanel({ capacity, onIncreaseCapacity, onDecreaseCapacity, onIncreaseCapacityCompletely, onDecreaseCapacityCompletely }: {
  capacity: number,
  onIncreaseCapacity?: () => void,
  onDecreaseCapacity?: () => void,
  onIncreaseCapacityCompletely?: () => void,
  onDecreaseCapacityCompletely?: () => void
}): HTMLElement {
  const capacityPanel = document.createElement("div");
  capacityPanel.className = "bc-capacity";

  const label = document.createElement("div");
  label.className = "bc-label";
  label.textContent = "Capacity";
  capacityPanel.appendChild(label);

  const row = document.createElement("div");
  row.className = "bc-row";

  row.appendChild(createCapacityButton("bc-decrease-completely", "bc-triangle-left", 2, onDecreaseCapacityCompletely));
  row.appendChild(createCapacityButton("bc-decrease", "bc-triangle-left", 1, onDecreaseCapacity));

  const dots = document.createElement("div");
  dots.className = "bc-dots";
  const litDotCount = Math.round(capacity * CAPACITY_DOT_COUNT);
  for (let dotIndex = 0; dotIndex < CAPACITY_DOT_COUNT; dotIndex++) {
    const dot = document.createElement("span");
    dot.className = dotIndex < litDotCount ? "bc-dot bc-dot-lit" : "bc-dot";
    dots.appendChild(dot);
  }
  row.appendChild(dots);

  row.appendChild(createCapacityButton("bc-increase", "bc-triangle-right", 1, onIncreaseCapacity));
  row.appendChild(createCapacityButton("bc-increase-completely", "bc-triangle-right", 2, onIncreaseCapacityCompletely));

  capacityPanel.appendChild(row);

  return capacityPanel;
}

function createCapacityButton(buttonClassName: string, triangleClassName: string, triangleCount: number, onClick?: () => void): HTMLElement {
  const button = document.createElement("button");
  button.className = `bc-button ${buttonClassName}`;
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex++) {
    const triangle = document.createElement("span");
    triangle.className = triangleClassName;
    button.appendChild(triangle);
  }
  if (onClick) button.addEventListener("click", onClick);
  return button;
}
