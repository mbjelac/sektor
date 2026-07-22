import p5 from "p5";
import {drawFloor} from "../../../shared/drawFloor";
import {parseCommands} from "../../../shared/parseCommands";
import {applyCommands} from "../../../shared/applyCommands";
import {BLOCK_SIZE} from "../../../shared/constants";
import {initToolbar, getSelectedBuilding, deselectBuilding, getBuildingCode} from "./buildingToolbar.ui";
import { BuildingConnection, BuildingLocation, Location, PossibleConnection, Sektor } from "./Sektor";
import { getResourceColor, getResourceIcon } from "../resources";
import { buildingDefinitions } from "./buildings/buildings";
import {showBuildingPanel, hideBuildingPanel} from "./buildings/buildingPanel.ui";
import { BoosterInputDisplay } from "./buildingFunctionDisplay.ui";
import {updateSektorStatePanel, onImportHover, onLeave} from "./sektorStatePanel.ui";
import { getSektorData, saveSektorData } from "./sektor.api";
import { initPropertyToggler, getSelectedProperty } from "./propertyToggler.ui";
import { propertyDefinitions } from "../properties";
import { MODIFIER_MIN, MODIFIER_MAX } from "../../../shared/modifierLimits";
import { trashIcon } from "../icons";

const GRID_SIZE = 10;
const PANEL_FLOOR_PROPERTY = "soil";
const isTestMode = new URLSearchParams(window.location.search).get("test") === "true";
const sektorName = new URLSearchParams(window.location.search).get("name");

if (!isTestMode && (!sektorName || !getSektorData(sektorName))) {
  showSektorNotFound();
}

function showSektorNotFound() {
  document.body.innerHTML = "";
  const message = document.createElement("div");
  message.id = "sektor-not-found";
  message.textContent = "Sektor not found";
  document.body.appendChild(message);
  throw new Error("Sektor not found");
}

function createTestLocations(gridSize: number): Location[][] {
  return Array.from({ length: gridSize }, (_, x) =>
    Array.from({ length: gridSize }, (_, z) => ({
      properties: {
        soil: ((x * 17 + z * 31) % 13) + MODIFIER_MIN,
        groundwater: ((x * 13 + z * 23) % 13) + MODIFIER_MIN,
        ore: ((x * 7 + z * 41) % 13) + MODIFIER_MIN,
        insolation: ((x * 29 + z * 11) % 13) + MODIFIER_MIN,
        wind: ((x * 37 + z * 19) % 13) + MODIFIER_MIN,
      },
    }))
  );
}

function locationPropertiesToLocations(locationProperties: { [key: string]: number[][] }): Location[][] {
  const propertyNames = Object.keys(locationProperties);
  const rows = locationProperties[propertyNames[0]].length;
  const cols = locationProperties[propertyNames[0]][0].length;
  return Array.from({ length: rows }, (_, x) =>
    Array.from({ length: cols }, (_, z) => ({
      properties: Object.fromEntries(
        propertyNames.map(name => [name, locationProperties[name][x][z]])
      ),
    }))
  );
}

function getLocations(): Location[][] {
  if (isTestMode) {
    return createTestLocations(GRID_SIZE);
  }
  if (sektorName) {
    const sektorData = getSektorData(sektorName);
    if (sektorData) {
      return locationPropertiesToLocations(sektorData.locationProperties);
    }
  }
  return [];
}

function getRestrictionsRequirements() {
  if (isTestMode) {
    return {
      importRestrictions: [
        { name: "Water", value: 4 },
        { name: "Energy", value: 3 },
        { name: "Ore", value: 5 },
      ],
      exportRequirements: [
        { name: "Food", value: 4 },
        { name: "Work", value: 5 },
        { name: "Metal", value: 8 },
      ],
    };
  }
  if (sektorName) {
    const sektorData = getSektorData(sektorName);
    if (sektorData) {
      return {
        importRestrictions: sektorData.importRestrictions,
        exportRequirements: sektorData.exportRequirements,
      };
    }
  }
  return { importRestrictions: [], exportRequirements: [] };
}

const sektor = new Sektor(getLocations(), buildingDefinitions, getRestrictionsRequirements());
const locations = sektor.getLocations();
const placedBuildings: { type: string; location: BuildingLocation; code: string }[] = [];
let errorTimeout: ReturnType<typeof setTimeout> | null = null;

function locationsToLocationProperties(locationMatrix: Location[][]): { [key: string]: number[][] } {
  if (locationMatrix.length === 0) return {};
  const propertyNames = Object.keys(locationMatrix[0][0].properties);
  return Object.fromEntries(
    propertyNames.map(name => [
      name,
      locationMatrix.map(row => row.map(location => location.properties[name])),
    ])
  );
}

function saveState() {
  if (!sektorName) return;
  const state = sektor.getState();
  const { importRestrictions, exportRequirements } = sektor.getSektorState();
  saveSektorData(sektorName, {
    locationProperties: locationsToLocationProperties(locations),
    importRestrictions,
    exportRequirements,
    buildings: state.buildings,
    connections: state.connections,
  });
}

function loadSavedState() {
  if (!sektorName) return;
  const sektorData = getSektorData(sektorName);
  if (!sektorData) return;
  sektor.loadState({ buildings: sektorData.buildings, connections: sektorData.connections });
  for (const building of sektorData.buildings) {
    const code = getBuildingCode(building.type);
    if (code) {
      placedBuildings.push({ type: building.type, location: building.location, code });
    }
  }
  updateSektorStatePanel(sektor.getSektorState());
}

let selectedBuildingLocation: BuildingLocation | null = null;
let hoveredImportResource: string | null = null;
let displayedConnections: { connections: BuildingConnection[]; buildingLocation: BuildingLocation; labels: HTMLElement[]; outputConnections: BuildingConnection[]; outputLabels: HTMLElement[] } | null = null;

let selectMode: {
  possibleConnections: PossibleConnection[];
  targetLocation: BuildingLocation;
  resourceType: string;
  connectButtons: HTMLElement[];
} | null = null;

function enterSelectMode(targetLocation: BuildingLocation, resourceType: string) {
  const possibleConnections = sektor.getPossibleConnectionsForInput(targetLocation, resourceType);
  if (possibleConnections.length === 0) {
    showError("noPossibleConnections");
    return;
  }

  const container = document.getElementById("canvas-container")!;
  const connectButtons: HTMLElement[] = [];

  for (const connection of possibleConnections) {
    const button = document.createElement("button");
    button.className = "connect-button";
    const icon = getResourceIcon(resourceType) ?? "";
    button.textContent = `${icon} ${connection.remainingOutput}/${connection.totalOutput}`;
    button.addEventListener("click", () => {
      handleConnectButtonClick(connection.location);
    });
    container.appendChild(button);
    connectButtons.push(button);
  }

  selectMode = { possibleConnections, targetLocation, resourceType, connectButtons };

  const banner = document.createElement("div");
  banner.id = "select-banner";
  banner.textContent = "Select building";

  const closeButton = document.createElement("button");
  closeButton.className = "select-banner-close";
  closeButton.textContent = "X";
  closeButton.addEventListener("click", exitSelectMode);
  banner.appendChild(closeButton);

  container.appendChild(banner);
  document.getElementById("toolbar")!.style.pointerEvents = "none";
}

function handleConnectButtonClick(sourceLocation: BuildingLocation) {
  if (!selectMode) return;
  const targetLocation = selectMode.targetLocation;
  const resourceType = selectMode.resourceType;
  exitSelectMode();

  const connectionResult = sektor.addConnection(targetLocation, sourceLocation, resourceType);

  if (!connectionResult.success) {
    showError(connectionResult.error ?? "Connection failed");
    return;
  }

  const targetPlaced = placedBuildings.find(b => b.location.x === targetLocation.x && b.location.y === targetLocation.y);
  if (targetPlaced) openBuildingPanel(targetPlaced);
  updateSektorStatePanel(sektor.getSektorState());
  saveState();
}

function exitSelectMode() {
  if (selectMode) {
    for (const button of selectMode.connectButtons) {
      button.remove();
    }
  }
  selectMode = null;
  const banner = document.getElementById("select-banner");
  if (banner) banner.remove();
  document.getElementById("toolbar")!.style.pointerEvents = "";
}

function worldToScreen(p: p5, worldX: number, worldY: number, worldZ: number, currentZoom: number): { screenX: number; screenY: number } {
  const { rightX, rightY, rightZ, upX, upY, upZ } = getCameraBasis(p);

  // Project world position onto camera right/up axes
  const dotRight = rightX * worldX + rightY * worldY + rightZ * worldZ;
  const dotUp = upX * worldX + upY * worldY + upZ * worldZ;

  const hw = p.width * currentZoom / 2;
  const hh = p.height * currentZoom / 2;

  return {
    screenX: p.width / 2 + (dotRight / hw) * (p.width / 2),
    screenY: p.height / 2 + (dotUp / hh) * (p.height / 2),
  };
}

function updateConnectButtonPositions(p: p5, currentZoom: number) {
  if (!selectMode) return;
  for (let i = 0; i < selectMode.possibleConnections.length; i++) {
    const connection = selectMode.possibleConnections[i];
    const button = selectMode.connectButtons[i];
    const { wx, wz } = gridToWorld(connection.location.x, connection.location.y);
    const { screenX, screenY } = worldToScreen(p, wx, -BLOCK_SIZE * 0.3, wz, currentZoom);
    button.style.left = `${screenX}px`;
    button.style.top = `${screenY}px`;
  }
}

function parseHexColor(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

const MAX_GRID_DISTANCE = Math.sqrt((GRID_SIZE - 1) ** 2 + (GRID_SIZE - 1) ** 2);
const MIN_ARC_HEIGHT = BLOCK_SIZE * 0.15 * 3;
const MAX_ARC_HEIGHT = BLOCK_SIZE * 0.15 * 9;

function drawConnectionArc(p: p5, source: BuildingLocation, target: BuildingLocation, resourceType: string, dotted: boolean = false) {
  const { wx: sourceX, wz: sourceZ } = gridToWorld(source.x, source.y);
  const { wx: targetX, wz: targetZ } = gridToWorld(target.x, target.y);

  const distance = Math.sqrt((source.x - target.x) ** 2 + (source.y - target.y) ** 2);
  const normalizedDistance = distance / MAX_GRID_DISTANCE;
  const arcHeight = MIN_ARC_HEIGHT + normalizedDistance * (MAX_ARC_HEIGHT - MIN_ARC_HEIGHT);

  const colorHex = getResourceColor(resourceType);
  const [r, g, b] = parseHexColor(colorHex);

  p.push();
  p.noFill();
  p.stroke(r, g, b);
  p.strokeWeight(3);

  const arcPoint = (t: number) => ({
    x: sourceX + (targetX - sourceX) * t,
    y: -arcHeight * 4 * t * (1 - t),
    z: sourceZ + (targetZ - sourceZ) * t,
  });

  const segments = 20;
  if (dotted) {
    for (let i = 0; i < segments; i += 2) {
      const start = arcPoint(i / segments);
      const end = arcPoint((i + 1) / segments);
      p.line(start.x, start.y, start.z, end.x, end.y, end.z);
    }
  } else {
    p.beginShape();
    for (let i = 0; i <= segments; i++) {
      const point = arcPoint(i / segments);
      p.vertex(point.x, point.y, point.z);
    }
    p.endShape();
  }
  p.pop();
}

function openBuildingPanel(placed: { type: string; location: BuildingLocation; code: string }) {
  const buildingState = sektor.getBuildingState(placed.location);
  if (!buildingState) return;
  const code = getBuildingCode(placed.type);
  if (!code) return;
  const floorColor = propertyColor(PANEL_FLOOR_PROPERTY, locations[placed.location.x][placed.location.y].properties[PANEL_FLOOR_PROPERTY] ?? 0);
  if (displayedConnections) {
    for (const label of displayedConnections.labels) label.remove();
    for (const label of displayedConnections.outputLabels) label.remove();
  }
  const container = document.getElementById("canvas-container")!;
  const labels: HTMLElement[] = [];
  for (const connection of buildingState.inputConnections) {
    const label = document.createElement("div");
    label.className = "connection-label";

    const icon = getResourceIcon(connection.resourceType) ?? "";
    const amountText = document.createElement("span");
    amountText.className = "connection-amount-text";
    amountText.textContent = `${icon} ${connection.amount}`;
    label.appendChild(amountText);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "connection-amount-buttons";

    const upButton = document.createElement("button");
    upButton.className = "connection-amount-button";
    upButton.textContent = "▲";
    upButton.addEventListener("click", () => {
      const result = sektor.changeConnectionAmount(placed.location, connection.to, connection.resourceType, 1);
      if (result.success) {
        openBuildingPanel(placed);
        updateSektorStatePanel(sektor.getSektorState());
        saveState();
      } else {
        showError(result.error ?? "Cannot increase");
      }
    });
    buttonsContainer.appendChild(upButton);

    const downButton = document.createElement("button");
    downButton.className = "connection-amount-button";
    if (connection.amount === 1) {
      downButton.innerHTML = trashIcon;
    } else {
      downButton.textContent = "▼";
    }
    downButton.addEventListener("click", () => {
      if (connection.amount === 1) {
        sektor.removeInputConnection(placed.location, connection.to, connection.resourceType);
        openBuildingPanel(placed);
        updateSektorStatePanel(sektor.getSektorState());
        saveState();
        return;
      }
      const result = sektor.changeConnectionAmount(placed.location, connection.to, connection.resourceType, -1);
      if (result.success) {
        openBuildingPanel(placed);
        updateSektorStatePanel(sektor.getSektorState());
        saveState();
      } else {
        showError(result.error ?? "Cannot decrease");
      }
    });
    buttonsContainer.appendChild(downButton);

    label.appendChild(buttonsContainer);

    container.appendChild(label);
    labels.push(label);
  }
  const outputLabels: HTMLElement[] = [];
  for (const outputConnection of buildingState.outputConnections) {
    const label = document.createElement("div");
    label.className = "connection-label";

    const icon = getResourceIcon(outputConnection.resourceType) ?? "";
    const amountText = document.createElement("span");
    amountText.className = "connection-amount-text";
    amountText.textContent = `${icon} ${outputConnection.amount}`;
    label.appendChild(amountText);

    container.appendChild(label);
    outputLabels.push(label);
  }
  selectedBuildingLocation = placed.location;
  displayedConnections = { connections: buildingState.inputConnections, buildingLocation: placed.location, labels, outputConnections: buildingState.outputConnections, outputLabels };
  const definition = buildingDefinitions.find(definition => definition.name === placed.type);
  const boosters: BoosterInputDisplay[] = (definition?.boosters ?? []).map(booster => ({
    name: booster.input.name,
    maxAmount: booster.input.value,
    currentAmount: buildingState.inputConnections
      .filter(connection => connection.resourceType === booster.input.name)
      .reduce((sum, connection) => sum + connection.amount, 0),
  }));
  showBuildingPanel({
    name: placed.type,
    code: code,
    buildingFunction: buildingState.buildingFunction,
    modifiedOutputs: buildingState.modifiedOutputs,
    exports: buildingState.exports,
    imports: buildingState.imports,
    boosters: boosters,
    autoExport: definition?.properties.autoExport,
    locationProperties: locations[placed.location.x]?.[placed.location.y]?.properties,
    modifierProperties: definition?.outputModifiers.map(modifier => modifier.property),
    floorColor: floorColor,
    showFloor: definition?.properties.showFloor,
    location: placed.location,
    onAddInputConnection: (resourceType: string) => {
      enterSelectMode(placed.location, resourceType)
    },
    onDestroy: () => {
      const result = sektor.destroyBuilding(placed.location);
      if (!result.success) {
        showError(result.error ?? "Cannot destroy");
        return;
      }
      const index = placedBuildings.findIndex(b => b.location.x === placed.location.x && b.location.y === placed.location.y);
      if (index !== -1) placedBuildings.splice(index, 1);
      hideBuildingPanel();
      selectedBuildingLocation = null;
      if (displayedConnections) {
        for (const label of displayedConnections.labels) label.remove();
        for (const label of displayedConnections.outputLabels) label.remove();
      }
      displayedConnections = null;
      updateSektorStatePanel(sektor.getSektorState());
      saveState();
    }
  });
}

function openEmptyLocationPanel(location: BuildingLocation) {
  const floorColor = propertyColor(PANEL_FLOOR_PROPERTY, locations[location.x]?.[location.y]?.properties[PANEL_FLOOR_PROPERTY] ?? 0);
  selectedBuildingLocation = location;
  showBuildingPanel({
    name: "Empty",
    code: "",
    buildingFunction: { inputs: [], outputs: [] },
    modifiedOutputs: [],
    imports: [],
    locationProperties: locations[location.x]?.[location.y]?.properties,
    modifierProperties: [],
    floorColor: floorColor,
    location: location,
  });
}

function drawLocationHighlight(p: p5, location: BuildingLocation, color: [number, number, number]) {
  const { wx, wz } = gridToWorld(location.x, location.y);
  const borderWidth = BLOCK_SIZE * 0.04;
  const sides = [
    { x: wx, z: wz - HALF + borderWidth / 2, w: BLOCK_SIZE, d: borderWidth },
    { x: wx, z: wz + HALF - borderWidth / 2, w: BLOCK_SIZE, d: borderWidth },
    { x: wx - HALF + borderWidth / 2, z: wz, w: borderWidth, d: BLOCK_SIZE },
    { x: wx + HALF - borderWidth / 2, z: wz, w: borderWidth, d: BLOCK_SIZE },
  ];
  for (const side of sides) {
    p.push();
    p.noStroke();
    p.noLights();
    p.fill(color[0], color[1], color[2]);
    p.translate(side.x, -FLOOR_HEIGHT / 2 - 0.1, side.z);
    p.box(side.w, 0.1, side.d);
    p.pop();
  }
}

function showError(message: string) {
  const errorEl = document.getElementById("error-message")!;
  errorEl.textContent = message;
  errorEl.style.display = "block";
  if (errorTimeout) clearTimeout(errorTimeout);
  errorTimeout = setTimeout(() => {
    errorEl.style.display = "none";
  }, 5000);
}

function propertyColor(propertyName: string, value: number): [number, number, number] {
  const property = propertyDefinitions.find(property => property.name === propertyName);
  if (!property) return [128, 128, 128];
  const minColor = parseHexColor(property.minColor);
  const maxColor = parseHexColor(property.maxColor);
  const t = (value - MODIFIER_MIN) / (MODIFIER_MAX - MODIFIER_MIN);
  return [
    Math.round(minColor[0] + (maxColor[0] - minColor[0]) * t),
    Math.round(minColor[1] + (maxColor[1] - minColor[1]) * t),
    Math.round(minColor[2] + (maxColor[2] - minColor[2]) * t),
  ];
}

const ZOOM = 1.2;

const HALF = BLOCK_SIZE / 2;
const FLOOR_HEIGHT = BLOCK_SIZE * 0.15;

function gridToWorld(gx: number, gy: number): { wx: number; wz: number } {
  return {
    wx: (gx - GRID_SIZE / 2 + 0.5) * BLOCK_SIZE,
    wz: (gy - GRID_SIZE / 2 + 0.5) * BLOCK_SIZE,
  };
}

function rayAABB(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  minX: number, minY: number, minZ: number,
  maxX: number, maxY: number, maxZ: number,
): number | null {
  let tmin = -Infinity;
  let tmax = Infinity;

  if (Math.abs(dx) < 1e-10) {
    if (ox < minX || ox > maxX) return null;
  } else {
    let t1 = (minX - ox) / dx;
    let t2 = (maxX - ox) / dx;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (Math.abs(dy) < 1e-10) {
    if (oy < minY || oy > maxY) return null;
  } else {
    let t1 = (minY - oy) / dy;
    let t2 = (maxY - oy) / dy;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (Math.abs(dz) < 1e-10) {
    if (oz < minZ || oz > maxZ) return null;
  } else {
    let t1 = (minZ - oz) / dz;
    let t2 = (maxZ - oz) / dz;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  return tmin;
}

// Read the current view matrix from p5's renderer (includes orbit transforms).
// The view matrix is column-major. World-space camera axes are rows of the 3x3 rotation part.
// The eye position is recovered by: eye = -R^T * t (where t is the translation column).
function getCameraBasis(p: p5): {
  eyeX: number; eyeY: number; eyeZ: number;
  rightX: number; rightY: number; rightZ: number;
  upX: number; upY: number; upZ: number;
  fwdX: number; fwdY: number; fwdZ: number;
} {
  const m = (p as any)._renderer.states.uViewMatrix.mat4;

  // Column-major layout: m[col*4 + row]
  // Row 0 of rotation = right axis
  const rX = m[0], rY = m[4], rZ = m[8];
  // Row 1 = up axis
  const uX = m[1], uY = m[5], uZ = m[9];
  // Row 2 = -forward axis (camera looks along -Z in view space)
  const fX = -m[2], fY = -m[6], fZ = -m[10];

  // Translation column
  const tx = m[12], ty = m[13], tz = m[14];

  // Eye = -R^T * t
  const eyeX = -(rX * tx + uX * ty + (-fX) * tz);
  const eyeY = -(rY * tx + uY * ty + (-fY) * tz);
  const eyeZ = -(rZ * tx + uZ * ty + (-fZ) * tz);

  return {
    eyeX, eyeY, eyeZ,
    rightX: rX, rightY: rY, rightZ: rZ,
    upX: uX, upY: uY, upZ: uZ,
    fwdX: fX, fwdY: fY, fwdZ: fZ,
  };
}

function findClickedTile(p: p5, currentZoom: number): { x: number; y: number } | null {
  const { eyeX, eyeY, eyeZ, rightX, rightY, rightZ, upX, upY, upZ, fwdX, fwdY, fwdZ } = getCameraBasis(p);

  const ndcX = (p.mouseX / p.width) * 2 - 1;
  const ndcY = (p.mouseY / p.height) * 2 - 1;

  const hw = p.width * currentZoom / 2;
  const hh = p.height * currentZoom / 2;

  const ox = eyeX + rightX * ndcX * hw + upX * ndcY * hh;
  const oy = eyeY + rightY * ndcX * hw + upY * ndcY * hh;
  const oz = eyeZ + rightZ * ndcX * hw + upZ * ndcY * hh;

  let bestT = Infinity;
  let bestTile: { x: number; y: number } | null = null;

  for (let gx = 0; gx < GRID_SIZE; gx++) {
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      const { wx, wz } = gridToWorld(gx, gy);
      const t = rayAABB(
        ox, oy, oz,
        fwdX, fwdY, fwdZ,
        wx - HALF, -FLOOR_HEIGHT / 2, wz - HALF,
        wx + HALF, FLOOR_HEIGHT / 2, wz + HALF,
      );
      if (t !== null && t < bestT) {
        bestT = t;
        bestTile = { x: gx, y: gy };
      }
    }
  }

  return bestTile;
}

const CAM_DIST = 800;
const CAM_ELEVATION = Math.PI / 6;

const sektorUi = (p: p5) => {
  let camAngleY = Math.PI / 4;
  let camElevation = CAM_ELEVATION;
  let isDragging = false;
  let didDrag = false;
  let mouseDownOnCanvas = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let zoom = ZOOM;

  function updateOrtho(container: HTMLElement) {
    const hw = container.offsetWidth * zoom / 2;
    const hh = container.offsetHeight * zoom / 2;
    p.ortho(-hw, hw, -hh, hh);
  }

  p.setup = () => {
    const container = document.getElementById("canvas-container")!;
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL);
    canvas.parent(container);
    updateOrtho(container);

    updateCamera(p);

    canvas.elt.addEventListener("mousedown", (e: MouseEvent) => {
      isDragging = true;
      didDrag = false;
      mouseDownOnCanvas = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
    window.addEventListener("mouseup", () => { isDragging = false; });
    window.addEventListener("mousemove", (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      camAngleY -= dx * 0.005;
      camElevation += dy * 0.005;
      camElevation = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, camElevation));
      updateCamera(p);
    });
    canvas.elt.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      zoom *= e.deltaY > 0 ? 1.05 : 0.95;
      zoom = Math.max(0.3, Math.min(3, zoom));
      updateOrtho(container);
    }, { passive: false });
  };

  function updateCamera(p: p5) {
    const camX = CAM_DIST * Math.sin(camAngleY) * Math.cos(camElevation);
    const camY = -CAM_DIST * Math.sin(camElevation);
    const camZ = CAM_DIST * Math.cos(camAngleY) * Math.cos(camElevation);
    p.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
  }

  p.mouseReleased = () => {
    if (!mouseDownOnCanvas) return;
    mouseDownOnCanvas = false;
    if (didDrag) return;

    if (selectMode) return;

    const grid = findClickedTile(p, zoom);

    if (!grid) {
      hideBuildingPanel();
      if (displayedConnections) {
        for (const label of displayedConnections.labels) label.remove();
        for (const label of displayedConnections.outputLabels) label.remove();
      }
      selectedBuildingLocation = null;
      displayedConnections = null;
      return;
    }

    const selected = getSelectedBuilding();

    if (!selected) {
      // No building tool selected — check if there's a placed building to inspect
      const placed = placedBuildings.find(b => b.location.x === grid.x && b.location.y === grid.y);
      if (placed) {
        openBuildingPanel(placed);
      } else {
        if (displayedConnections) {
          for (const label of displayedConnections.labels) label.remove();
          for (const label of displayedConnections.outputLabels) label.remove();
        }
        displayedConnections = null;
        openEmptyLocationPanel({ x: grid.x, y: grid.y });
      }
      return;
    }

    const result = sektor.createBuilding({ type: selected, location: { x: grid.x, y: grid.y } });

    for (const building of result.addedBuildings) {
      const code = getBuildingCode(building.type);
      if (code) {
        placedBuildings.push({ type: building.type, location: building.location, code });
      }
    }

    if (result.error === undefined) {
      deselectBuilding();
      updateSektorStatePanel(sektor.getSektorState());
      saveState();
    }

    if (result.error !== undefined) {
      showError(result.error);
    }
  };

  p.draw = () => {
    p.background(30);

    p.ambientLight(60);
    p.pointLight(255, 255, 255, 2 * BLOCK_SIZE, -3 * BLOCK_SIZE, -2 * BLOCK_SIZE);

    p.stroke(150, 150, 150, 80);

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const placed = placedBuildings.find(b => b.location.x === x && b.location.y === z);
        if (placed) {
          const def = buildingDefinitions.find(d => d.name === placed.type);
          if (def?.properties.showFloor === false) continue;
        }
        p.push();
        const { wx, wz } = gridToWorld(x, z);
        p.translate(wx, 0, wz);
        const selectedProperty = getSelectedProperty();
        drawFloor(p, BLOCK_SIZE, propertyColor(selectedProperty, locations[x][z].properties[selectedProperty] ?? 0));
        p.pop();
      }
    }
    if (selectedBuildingLocation) {
      drawLocationHighlight(p, selectedBuildingLocation, [255, 255, 0]);
    }

    if (hoveredImportResource) {
      for (const building of placedBuildings) {
        const def = buildingDefinitions.find(d => d.name === building.type);
        if (!def?.buildingFunction.inputs.some(input => input.name === hoveredImportResource)) continue;
        if (!sektor.canIncreaseImport(building.location, hoveredImportResource)) continue;
        drawLocationHighlight(p, building.location, [255, 165, 0]);
      }
    }

    p.noStroke();
    for (const building of placedBuildings) {
      p.push();
      const { wx, wz } = gridToWorld(building.location.x, building.location.y);
      p.translate(wx, 0, wz);
      const commands = parseCommands(building.code);
      applyCommands(p, commands, p.millis());
      p.pop();
    }

    if (displayedConnections) {
      for (let i = 0; i < displayedConnections.connections.length; i++) {
        const connection = displayedConnections.connections[i];
        const source = connection.to;
        const target = displayedConnections.buildingLocation;
        drawConnectionArc(p, source, target, connection.resourceType);

        const { wx: sourceX, wz: sourceZ } = gridToWorld(source.x, source.y);
        const { wx: targetX, wz: targetZ } = gridToWorld(target.x, target.y);
        const distance = Math.sqrt((source.x - target.x) ** 2 + (source.y - target.y) ** 2);
        const normalizedDistance = distance / MAX_GRID_DISTANCE;
        const arcHeight = MIN_ARC_HEIGHT + normalizedDistance * (MAX_ARC_HEIGHT - MIN_ARC_HEIGHT);
        const midX = (sourceX + targetX) / 2;
        const midY = -arcHeight;
        const midZ = (sourceZ + targetZ) / 2;
        const { screenX, screenY } = worldToScreen(p, midX, midY, midZ, zoom);
        const label = displayedConnections.labels[i];
        label.style.left = `${screenX}px`;
        label.style.top = `${screenY}px`;
      }

      for (let i = 0; i < displayedConnections.outputConnections.length; i++) {
        const outputConnection = displayedConnections.outputConnections[i];
        const source = displayedConnections.buildingLocation;
        const target = outputConnection.to;
        drawConnectionArc(p, source, target, outputConnection.resourceType, true);

        const { wx: sourceX, wz: sourceZ } = gridToWorld(source.x, source.y);
        const { wx: targetX, wz: targetZ } = gridToWorld(target.x, target.y);
        const distance = Math.sqrt((source.x - target.x) ** 2 + (source.y - target.y) ** 2);
        const normalizedDistance = distance / MAX_GRID_DISTANCE;
        const arcHeight = MIN_ARC_HEIGHT + normalizedDistance * (MAX_ARC_HEIGHT - MIN_ARC_HEIGHT);
        const midX = (sourceX + targetX) / 2;
        const midY = -arcHeight;
        const midZ = (sourceZ + targetZ) / 2;
        const { screenX, screenY } = worldToScreen(p, midX, midY, midZ, zoom);
        const label = displayedConnections.outputLabels[i];
        label.style.left = `${screenX}px`;
        label.style.top = `${screenY}px`;
      }
    }

    if (selectMode) {
      updateConnectButtonPositions(p, zoom);
    }

    document.getElementById("canvas-container")!.dataset.rendered = "true";
  };
};

new p5(sektorUi);
initToolbar();
initPropertyToggler();
onImportHover(resourceType => { hoveredImportResource = resourceType; });
onLeave(() => { window.location.href = "/"; });
if (!isTestMode) {
  loadSavedState();
}
if (isTestMode) {
  (window as any).updateSektorStatePanel = updateSektorStatePanel;
  (window as any).showBuildingPanel = showBuildingPanel;
}
