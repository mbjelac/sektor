import p5 from "p5";
import { parseCommands } from "../../../../shared/parseCommands";
import { applyCommands } from "../../../../shared/applyCommands";
import { drawFloor, drawFloorWireframe } from "../../../../shared/drawFloor";
import { BLOCK_SIZE } from "../../../../shared/constants";
import { trashIcon } from "../../icons";
import { createFunctionDisplay } from "../buildingFunctionDisplay.ui";
import { BuildingFunctionState, BuildingLocation } from "../Sektor";
import { POLLUTION_PROPERTY, isAffectedByPollution, pollutedLocationProperties } from "../pollution";
import { propertyDefinitions } from "../../properties";
import { formatNumber } from "../../formatNumber";

let panelEl: HTMLElement | null = null;
let panelLocation: BuildingLocation | null = null;
let previewP5: p5 | null = null;
let previewContainer: HTMLElement | null = null;
// A floor which is not a plain block of ground — the bed of a river — is drawn by whoever opened the
// panel, in place of the block, as only they know what it is.
let currentDraw: {
  code: string;
  floorColor: [number, number, number];
  showFloor: boolean;
  drawFloorInstead?: (p: p5) => void;
} | null = null;

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
      if (currentDraw.drawFloorInstead) {
        currentDraw.drawFloorInstead(p);
      } else if (currentDraw.showFloor) {
        drawFloor(p, BLOCK_SIZE, currentDraw.floorColor);
      } else {
        drawFloorWireframe(p, BLOCK_SIZE);
      }
      const commands = parseCommands(currentDraw.code);
      applyCommands(p, commands);
    };
  });
}

export function showBuildingPanel({ name, code, buildingFunctions, disabled, outputDecreasedByPollution, locationProperties, floorColor, showFloor, drawFloorInstead, location, onDestroy, onToggleFunction }: {
  name: string,
  code: string,
  buildingFunctions: BuildingFunctionState[],
  disabled?: boolean,
  outputDecreasedByPollution?: boolean,
  locationProperties?: { [_: string]: number },
  floorColor: [number, number, number],
  showFloor?: boolean,
  drawFloorInstead?: (p: p5) => void,
  location: BuildingLocation,
  onDestroy?: () => void,
  onToggleFunction?: (functionIndex: number) => void
}) {
  // Reopening the panel of a location would put back a panel scrolled to its top, so the
  // scroll position is carried over to the panel of the same location.
  const scrollTop = panelEl && panelLocation?.x === location.x && panelLocation?.y === location.y
    ? panelEl.scrollTop
    : 0;

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

  // A disabled building is warned of right under its name, since nothing it is shown to consume or
  // produce below holds while it stands idle.
  if (disabled) {
    const disabledWarning = document.createElement("div");
    disabledWarning.className = "bp-disabled-warning";
    disabledWarning.textContent = "⚠️ Building missing required inputs!";
    panelEl.appendChild(disabledWarning);
  }

  // Only a building doing several things can be told which of them to do, so a building with a
  // single function gets no activity label and no toggle, and neither does a function the
  // building always does.
  buildingFunctions.forEach((buildingFunctionState, functionIndex) => {
    const switchable = buildingFunctions.length > 1 && !buildingFunctionState.buildingFunction.alwaysActive;
    const functionBlock = createFunctionDisplay({
      buildingFunction: buildingFunctionState.buildingFunction,
      outputAmounts: buildingFunctionState.outputAmounts,
      pollution: locationProperties?.[POLLUTION_PROPERTY],
      activation: switchable
        ? {
          active: buildingFunctionState.active,
          onToggle: onToggleFunction && (() => onToggleFunction(functionIndex)),
        }
        : undefined,
      starved: buildingFunctionState.starved,
      disabled,
    });
    functionBlock.dataset.functionIndex = String(functionIndex);
    panelEl!.appendChild(functionBlock);
  });

  // However many of its outputs pollution has decreased, the building is warned of it once, under
  // everything it consumes and produces.
  if (outputDecreasedByPollution) {
    const pollutionWarning = document.createElement("div");
    pollutionWarning.className = "bp-pollution-warning";
    pollutionWarning.textContent = "⚠️ Output decreased due to pollution!";
    panelEl.appendChild(pollutionWarning);
  }

  if (locationProperties) {
    const propertiesSection = document.createElement("div");
    propertiesSection.className = "bp-properties";

    const propertiesHeader = document.createElement("div");
    propertiesHeader.className = "bp-properties-header";
    propertiesHeader.textContent = "Geography";
    propertiesSection.appendChild(propertiesHeader);

    for (const [propertyName, propertyValue] of Object.entries(locationProperties)) {
      const row = document.createElement("div");
      row.className = "bp-property-row";

      const nameCell = document.createElement("span");
      nameCell.className = "bp-property-name";
      nameCell.textContent = propertyName;
      row.appendChild(nameCell);

      // The swatch says which property the row is about, so it is the property's own color,
      // the same on every location, and not the shade the location's value is drawn in.
      const swatch = document.createElement("span");
      swatch.className = "bp-property-swatch";
      const propertyDefinition = propertyDefinitions.find(definition => definition.name === propertyName);
      if (propertyDefinition) {
        swatch.style.backgroundColor = propertyDefinition.color;
      }
      row.appendChild(swatch);

      const valueCell = document.createElement("span");
      valueCell.className = "bp-property-value";
      valueCell.textContent = propertyValueText(propertyName, propertyValue, locationProperties);
      row.appendChild(valueCell);

      propertiesSection.appendChild(row);
    }
    panelEl.appendChild(propertiesSection);
  }

  // The panel is the first of the right panels, above the sektor state panel.
  document.getElementById("right-panels")!.prepend(panelEl);

  // Set draw data and render
  currentDraw = { code, floorColor, showFloor: showFloor !== false, drawFloorInstead };
  ensurePreviewP5(previewContainer);
  previewP5!.redraw();

  panelLocation = location;
  panelEl.scrollTop = scrollTop;
}

// Pollution is how much of a location is fouled rather than how much it holds, so it is a
// percentage. A property pollution has spoiled is shown as what is left of it beside what the
// ground held before, with a warning, so the player sees what the pollution costs them.
function propertyValueText(propertyName: string, propertyValue: number, locationProperties: { [_: string]: number }): string {
  if (propertyName === POLLUTION_PROPERTY) return `${formatNumber(propertyValue)} %`;
  if (isAffectedByPollution(propertyName, locationProperties[POLLUTION_PROPERTY] ?? 0)) {
    const pollutedValue = pollutedLocationProperties(locationProperties)[propertyName];
    return `${formatNumber(pollutedValue)} / ${formatNumber(propertyValue)} ⚠️`;
  }
  return formatNumber(propertyValue);
}

export function hideBuildingPanel() {
  if (panelEl) {
    panelEl.remove();
    panelEl = null;
  }
  panelLocation = null;
  currentDraw = null;
}
