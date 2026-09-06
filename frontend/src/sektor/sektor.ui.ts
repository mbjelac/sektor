import p5 from "p5";
import {drawFloor} from "../../../shared/drawFloor";
import {parseCommands} from "../../../shared/parseCommands";
import {BakedBodies, bakeCommands, drawBakedBodies} from "../../../shared/bakeCommands";
import {BLOCK_SIZE} from "../../../shared/constants";
import {initToolbar, getSelectedBuilding, onBuildingSelected, deselectBuilding, getBuildingCode, DESTRUCTION_TOOL} from "./buildingToolbar.ui";
import { BuildingLocation, Location, Sektor } from "./Sektor";
import { buildingDefinitions } from "./buildings/buildings";
import {showBuildingPanel, hideBuildingPanel} from "./buildings/buildingPanel.ui";
import {updateSektorStatePanel, onImportHover, onLeave} from "./sektorStatePanel.ui";
import { getSektorData, saveSektorData } from "./sektor.api";
import { locationPropertiesToLocations } from "./locationProperties";
import { initPropertyToggler, getSelectedProperty, selectProperty } from "./propertyToggler.ui";
import { floorColor as soilFloorColor, propertyValueColor } from "../properties";
import { getNegativeScoringResources } from "../resources";
import { MODIFIER_MIN } from "../../../shared/modifierLimits";

const GRID_SIZE = 10;
const FLOOR_PROPERTY = "soil";
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

const sektor = new Sektor(getLocations(), buildingDefinitions, getRestrictionsRequirements(), getNegativeScoringResources());
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
  });
}

function loadSavedState() {
  if (!sektorName) return;
  const sektorData = getSektorData(sektorName);
  if (!sektorData) return;
  sektor.loadState({ buildings: sektorData.buildings });
  for (const building of sektorData.buildings) {
    const code = getBuildingCode(building.type);
    if (code) {
      placedBuildings.push({ type: building.type, location: building.location, code });
      floorGeometryNeedsRebaking = true;
    }
  }
  updateSektorStatePanel(sektor.getSektorState());
}

let selectedBuildingLocation: BuildingLocation | null = null;
let hoveredImportResource: string | null = null;
function openBuildingPanel(placed: { type: string; location: BuildingLocation; code: string }) {
  const buildingState = sektor.getBuildingState(placed.location);
  if (!buildingState) return;
  const code = getBuildingCode(placed.type);
  if (!code) return;
  const floorColor = soilFloorColor(locations[placed.location.x][placed.location.y].properties[FLOOR_PROPERTY] ?? 0);
  selectedBuildingLocation = placed.location;
  const definition = buildingDefinitions.find(definition => definition.name === placed.type);
  showBuildingPanel({
    name: placed.type,
    code: code,
    buildingFunctions: buildingState.buildingFunctions,
    locationProperties: locations[placed.location.x]?.[placed.location.y]?.properties,
    modifierProperties: definition?.outputModifiers.map(modifier => modifier.property),
    floorColor: floorColor,
    showFloor: definition?.properties.showFloor,
    location: placed.location,
    onDestroy: () => destroyBuilding(placed.location),
    onIncreaseCapacity: (functionIndex: number) => {
      sektor.increaseBuildingCapacity(placed.location, functionIndex);
      changeBuildingCapacity(placed);
    },
    onDecreaseCapacity: (functionIndex: number) => {
      sektor.decreaseBuildingCapacity(placed.location, functionIndex);
      changeBuildingCapacity(placed);
    },
    onIncreaseCapacityCompletely: (functionIndex: number) => {
      sektor.increaseBuildingCapacity(placed.location, functionIndex, true);
      changeBuildingCapacity(placed);
    },
    onDecreaseCapacityCompletely: (functionIndex: number) => {
      sektor.decreaseBuildingCapacity(placed.location, functionIndex, true);
      changeBuildingCapacity(placed);
    }
  });
}

function destroyBuilding(location: BuildingLocation) {
  const result = sektor.destroyBuilding(location);
  if (!result.success) {
    showError(result.error ?? "Cannot destroy");
    return;
  }
  const index = placedBuildings.findIndex(building => building.location.x === location.x && building.location.y === location.y);
  if (index !== -1) placedBuildings.splice(index, 1);
  floorGeometryNeedsRebaking = true;
  hideBuildingPanel();
  selectedBuildingLocation = null;
  updateSektorStatePanel(sektor.getSektorState());
  saveState();
}

// The panel shows the capacity it was opened with, so it is reopened to show the new one.
function changeBuildingCapacity(placed: { type: string; location: BuildingLocation; code: string }) {
  updateSektorStatePanel(sektor.getSektorState());
  saveState();
  openBuildingPanel(placed);
}

function openEmptyLocationPanel(location: BuildingLocation) {
  const floorColor = soilFloorColor(locations[location.x]?.[location.y]?.properties[FLOOR_PROPERTY] ?? 0);
  selectedBuildingLocation = location;
  showBuildingPanel({
    name: "Empty",
    code: "",
    buildingFunctions: [],
    locationProperties: locations[location.x]?.[location.y]?.properties,
    modifierProperties: [],
    floorColor: floorColor,
    location: location,
  });
}

// The property selected in the geography panel is shown on every floor, whose edges are
// colored by that location's property value. The floors themselves already show the soil
// property, so soil needs no overlay.
function getOverlayProperty(): string | null {
  const selectedProperty = getSelectedProperty();
  return selectedProperty === FLOOR_PROPERTY ? null : selectedProperty;
}

// Selecting a building in the toolbar selects the location property its output depends on,
// so that the overlay shows where the building produces the most; deselecting it, or
// selecting a building whose output depends on nothing, goes back to plain soil floors.
function selectBuildingProperty(buildingName: string | null) {
  const buildingDefinition = buildingDefinitions.find(definition => definition.name === buildingName);
  selectProperty(buildingDefinition?.outputModifiers[0]?.property ?? FLOOR_PROPERTY);
}

function drawPropertyOverlay(p: p5, propertyName: string) {
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const propertyValue = locations[x]?.[y]?.properties[propertyName] ?? 0;
      drawLocationHighlight(p, { x, y }, propertyValueColor(propertyName, propertyValue));
    }
  }
}

// The highlight sits clear above the floor rather than on it, so that the two do not fight
// over the same depth, which shows up as the floor's wireframe stippling through it.
function drawLocationHighlight(p: p5, location: BuildingLocation, color: [number, number, number]) {
  const { wx, wz } = gridToWorld(location.x, location.y);
  const borderWidth = BLOCK_SIZE * 0.04;
  const thickness = BLOCK_SIZE * 0.01;
  const heightAboveFloor = BLOCK_SIZE * 0.01;
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
    p.translate(side.x, -FLOOR_HEIGHT / 2 - heightAboveFloor - thickness / 2, side.z);
    p.box(side.w, thickness, side.d);
    p.pop();
  }
}

// Drawing the hundred floors one by one costs p5 a geometry rebuild and a GPU upload per
// floor per frame, which dwarfs everything else on the canvas. The grid only changes when a
// building that hides its floor is built or destroyed, so it is baked into a single geometry
// and rebaked only then.
let floorGeometry: p5.Geometry | null = null;
let floorGeometryNeedsRebaking = true;

function rebakeFloorGeometry(p: p5) {
  if (floorGeometry) {
    p.freeGeometry(floorGeometry);
  }
  floorGeometry = p.buildGeometry(() => {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if (!isFloorVisible(x, z)) continue;
        p.push();
        const { wx, wz } = gridToWorld(x, z);
        p.translate(wx, 0, wz);
        drawFloor(p, BLOCK_SIZE, soilFloorColor(locations[x][z].properties[FLOOR_PROPERTY] ?? 0));
        p.pop();
      }
    }
  });
  floorGeometryNeedsRebaking = false;
}

function isFloorVisible(x: number, z: number): boolean {
  const placedBuilding = placedBuildings.find(building => building.location.x === x && building.location.y === z);
  if (!placedBuilding) return true;
  const buildingDefinition = buildingDefinitions.find(definition => definition.name === placedBuilding.type);
  return buildingDefinition?.properties.showFloor !== false;
}

// Every building of a type draws the same bodies, so one bake serves all of its locations.
const bakedBuildings = new Map<string, BakedBodies>();

function bakedBuildingBodies(p: p5, type: string, renderingCode: string): BakedBodies {
  const alreadyBaked = bakedBuildings.get(type);
  if (alreadyBaked) return alreadyBaked;
  const bakedBodies = bakeCommands(p, parseCommands(renderingCode));
  bakedBuildings.set(type, bakedBodies);
  return bakedBodies;
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

    const grid = findClickedTile(p, zoom);

    if (!grid) {
      hideBuildingPanel();
      selectedBuildingLocation = null;
      deselectBuilding();
      return;
    }

    const selected = getSelectedBuilding();

    if (!selected) {
      // No building tool selected — check if there's a placed building to inspect
      const placed = placedBuildings.find(b => b.location.x === grid.x && b.location.y === grid.y);
      if (placed) {
        openBuildingPanel(placed);
      } else {
        openEmptyLocationPanel({ x: grid.x, y: grid.y });
      }
      return;
    }

    if (selected === DESTRUCTION_TOOL) {
      destroyBuilding({ x: grid.x, y: grid.y });
      return;
    }

    const result = sektor.createBuilding({ type: selected, location: { x: grid.x, y: grid.y } });

    for (const building of result.addedBuildings) {
      const code = getBuildingCode(building.type);
      if (code) {
        placedBuildings.push({ type: building.type, location: building.location, code });
        floorGeometryNeedsRebaking = true;
      }
    }

    if (result.error === undefined) {
      updateSektorStatePanel(sektor.getSektorState());
      saveState();
      const newBuilding = placedBuildings.find(building => building.location.x === grid.x && building.location.y === grid.y);
      if (newBuilding) openBuildingPanel(newBuilding);
    }

    if (result.error !== undefined) {
      showError(result.error);
    }
  };

  p.draw = () => {
    p.background(30);

    p.ambientLight(60);
    p.pointLight(255, 255, 255, 2 * BLOCK_SIZE, -3 * BLOCK_SIZE, -2 * BLOCK_SIZE);

    // Stroke has to be set before baking, so that the floor edges end up in the geometry.
    p.stroke(150, 150, 150, 80);
    if (floorGeometryNeedsRebaking) {
      rebakeFloorGeometry(p);
    }
    if (floorGeometry) {
      p.model(floorGeometry);
    }

    const overlayProperty = getOverlayProperty();
    if (overlayProperty) {
      drawPropertyOverlay(p, overlayProperty);
    }

    if (selectedBuildingLocation) {
      drawLocationHighlight(p, selectedBuildingLocation, [255, 255, 0]);
    }

    if (hoveredImportResource) {
      for (const building of placedBuildings) {
        const def = buildingDefinitions.find(d => d.name === building.type);
        const needsResource = def?.buildingFunctions.some(
          buildingFunction => buildingFunction.inputs.some(input => input.name === hoveredImportResource)
        );
        if (!needsResource) continue;
        if (!sektor.doesBuildingNeedInput(building.location, hoveredImportResource)) continue;
        drawLocationHighlight(p, building.location, [255, 165, 0]);
      }
    }

    p.noStroke();
    for (const building of placedBuildings) {
      p.push();
      const { wx, wz } = gridToWorld(building.location.x, building.location.y);
      p.translate(wx, 0, wz);
      drawBakedBodies(p, bakedBuildingBodies(p, building.type, building.code), p.millis());
      p.pop();
    }

    document.getElementById("canvas-container")!.dataset.rendered = "true";
  };
};

new p5(sektorUi);
initToolbar();
initPropertyToggler();
onBuildingSelected(selectBuildingProperty);
onImportHover(resourceType => { hoveredImportResource = resourceType; });
onLeave(() => { window.location.href = "/"; });
if (!isTestMode) {
  loadSavedState();
}
if (isTestMode) {
  (window as any).updateSektorStatePanel = updateSektorStatePanel;
  (window as any).showBuildingPanel = showBuildingPanel;
}
