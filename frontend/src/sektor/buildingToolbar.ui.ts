import p5 from "p5";
import {buildingDefinitions} from "./buildings/buildings";
import {createFunctionDisplay} from "./buildingFunctionDisplay.ui";
import {parseCommands} from "../../../shared/parseCommands";
import {applyCommands} from "../../../shared/applyCommands";
import {drawFloor} from "../../../shared/drawFloor";
import {BLOCK_SIZE} from "../../../shared/constants";
import { BuildingFunction, OutputModifier } from "./buildings/parseBuildingDefinitions";
import { propertyDefinitions } from "../properties";

let selectedBuilding: string | null = null;
let buildingCodeMap: Map<string, string> = new Map();
let selectionCallback: ((buildingName: string | null) => void) | null = null;

export function getSelectedBuilding(): string | null {
  return selectedBuilding;
}

export function onBuildingSelected(callback: (buildingName: string | null) => void) {
  selectionCallback = callback;
}

export function getBuildingCode(name: string): string | null {
  return buildingCodeMap.get(name) ?? null;
}

export function deselectBuilding(): void {
  selectedBuilding = null;
  document.querySelectorAll(".building-item").forEach((buildingItem) => buildingItem.classList.remove("selected"));
  hideToolbarFunctionPanel();
  selectionCallback?.(null);
}

let toolbarFnPanel: HTMLElement | null = null;

function showToolbarFunctionPanel(buildingFunction: BuildingFunction, outputModifiers: OutputModifier[], anchorEl: HTMLElement) {
  hideToolbarFunctionPanel();

  toolbarFnPanel = document.createElement("div");
  toolbarFnPanel.id = "toolbar-function-panel";

  toolbarFnPanel.appendChild(createFunctionDisplay({ buildingFunction: buildingFunction }));

  if (outputModifiers.length > 0) {
    const modifierList = document.createElement("div");
    modifierList.className = "tf-modifier-list";

    const modifierHeader = document.createElement("div");
    modifierHeader.className = "tf-modifier-header";
    modifierHeader.textContent = "Affected by";
    modifierList.appendChild(modifierHeader);

    for (const modifier of outputModifiers) {
      const item = document.createElement("div");
      item.className = "tf-modifier-item";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = modifier.property;
      item.appendChild(nameSpan);

      const propertyDefinition = propertyDefinitions.find(definition => definition.name === modifier.property);
      if (propertyDefinition) {
        const swatch = document.createElement("span");
        swatch.className = "tf-modifier-swatch";
        swatch.style.backgroundColor = propertyDefinition.color;
        item.appendChild(swatch);
      }

      modifierList.appendChild(item);
    }
    toolbarFnPanel.appendChild(modifierList);
  }

  document.body.appendChild(toolbarFnPanel);

  // Position to the right of the toolbar, at the anchor's vertical position
  const rect = anchorEl.getBoundingClientRect();
  const toolbar = document.getElementById("toolbar")!;
  const toolbarRect = toolbar.getBoundingClientRect();
  toolbarFnPanel.style.left = `${toolbarRect.right + 4}px`;
  toolbarFnPanel.style.top = `${rect.top}px`;
}

function hideToolbarFunctionPanel() {
  if (toolbarFnPanel) {
    toolbarFnPanel.remove();
    toolbarFnPanel = null;
  }
}

export function initToolbar() {
  const toolbar = document.getElementById("toolbar")!;
  const buildings = buildingDefinitions;

  for (const building of buildings) {
    buildingCodeMap.set(building.name, building.renderingCode);
  }

  for (const building of buildings) {
    const item = document.createElement("div");
    item.className = "building-item";
    item.dataset.buildingName = building.name;

    const canvasContainer = document.createElement("div");
    canvasContainer.style.height = "70px";
    item.appendChild(canvasContainer);

    const label = document.createElement("div");
    label.className = "building-name";
    label.textContent = building.name;
    item.appendChild(label);

    item.addEventListener("click", () => {
      if (selectedBuilding === building.name) {
        selectedBuilding = null;
        item.classList.remove("selected");
        hideToolbarFunctionPanel();
      } else {
        toolbar.querySelectorAll(".building-item").forEach((el) => el.classList.remove("selected"));
        selectedBuilding = building.name;
        item.classList.add("selected");
        if (building.buildingFunction) {
          showToolbarFunctionPanel(building.buildingFunction, building.outputModifiers, item);
        }
      }
      selectionCallback?.(selectedBuilding);
    });

    toolbar.appendChild(item);

    const size = 100;
    const height = 70;
    new p5((p: p5) => {
      p.setup = () => {
        const canvas = p.createCanvas(size, height, p.WEBGL);
        canvas.parent(canvasContainer);
        const viewSize = size / 0.7;
        const vh = viewSize * height / size;
        p.ortho(-viewSize / 2, viewSize / 2, -vh / 2, vh / 2);

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
        p.background(42);
        p.ambientLight(60);
        p.pointLight(255, 255, 255, 2 * BLOCK_SIZE, -3 * BLOCK_SIZE, -2 * BLOCK_SIZE);
        p.noStroke();

        p.translate(0, BLOCK_SIZE * 0.15, 0);
        if (building.properties.showFloor !== false) {
          drawFloor(p, BLOCK_SIZE, [162, 220, 134]);
        }
        const commands = parseCommands(building.renderingCode);
        applyCommands(p, commands);
      };
    });
  }
}
