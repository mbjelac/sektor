import p5 from "p5";
import { parseCommands } from "../../../../shared/parseCommands";
import { applyCommands } from "../../../../shared/applyCommands";
import { drawFloor } from "../../../../shared/drawFloor";
import { BLOCK_SIZE } from "../../../../shared/constants";
import { trashIcon } from "../../icons";
import { createFunctionDisplay } from "../buildingFunctionDisplay.ui";
import { BuildingFunction, ResourceThroughput } from "./parseBuildingDefinitions";
import { BuildingLocation } from "../Sektor";
import { propertyDefinitions } from "../../properties";
import { MODIFIER_MIN, MODIFIER_MAX } from "../../../../shared/modifierLimits";

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

export function showBuildingPanel({ name, code, buildingFunction, modifiedOutputs, locationProperties, modifierProperties, floorColor, showFloor, location, onDestroy }: {
  name: string,
  code: string,
  buildingFunction: BuildingFunction,
  modifiedOutputs: ResourceThroughput[],
  locationProperties?: { [_: string]: number },
  modifierProperties?: string[],
  floorColor: [number, number, number],
  showFloor?: boolean,
  location: BuildingLocation,
  onDestroy?: () => void
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
      valueCell.textContent = propertyValue > 0 ? `+${propertyValue}` : `${propertyValue}`;
      row.appendChild(valueCell);

      const swatch = document.createElement("span");
      swatch.className = "bp-property-swatch";
      const propertyDefinition = propertyDefinitions.find(definition => definition.name === propertyName);
      if (propertyDefinition) {
        const t = (propertyValue - MODIFIER_MIN) / (MODIFIER_MAX - MODIFIER_MIN);
        const minColor = parseHexColorForSwatch(propertyDefinition.minColor);
        const maxColor = parseHexColorForSwatch(propertyDefinition.maxColor);
        const r = Math.round(minColor[0] + (maxColor[0] - minColor[0]) * t);
        const g = Math.round(minColor[1] + (maxColor[1] - minColor[1]) * t);
        const b = Math.round(minColor[2] + (maxColor[2] - minColor[2]) * t);
        swatch.style.backgroundColor = `rgb(${r},${g},${b})`;
      }
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

function parseHexColorForSwatch(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function hideBuildingPanel() {
  if (panelEl) {
    panelEl.remove();
    panelEl = null;
  }
  currentDraw = null;
}
