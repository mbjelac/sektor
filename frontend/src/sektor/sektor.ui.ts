import p5 from "p5";
import {drawFloor, drawFloorWireframe} from "../../../shared/drawFloor";
import {parseCommands} from "../../../shared/parseCommands";
import {BakedBodies, bakeCommands, drawBakedBodies} from "../../../shared/bakeCommands";
import {withoutDepthWrites} from "../../../shared/applyCommands";
import {BLOCK_SIZE} from "../../../shared/constants";
import {initToolbar, getSelectedBuilding, onBuildingSelected, deselectBuilding, getBuildingCode, DESTRUCTION_TOOL} from "./buildingToolbar.ui";
import { BuildingLocation, HAPINESS_RESOURCE, Location, Sektor, SektorState } from "./Sektor";
import { buildingDefinitions } from "./buildings/buildings";
import {showBuildingPanel, hideBuildingPanel} from "./buildings/buildingPanel.ui";
import { updateSektorStatePanel } from "./sektorStatePanel.ui";
import { onResourceHover } from "../resourceHover.ui";
import { getSektorData, saveSektorData } from "./sektor.api";
import { getPlanetImportsAndExportsWhileBuilding } from "../planetImportsAndExports";
import { updateMessages } from "../messages.ui";
import { LOWEST_LEVEL, playerLevel } from "../playerLevel";
import { scoreOfPlayer } from "../players";
import { getGivenSektorName, getSektorOwner, getTakenSektorNames, setGivenSektorName, setSektorOwner } from "../list/sektorList.api";
import { locationPropertiesToLocations } from "./locationProperties";
import { initPropertyToggler, getSelectedProperty, selectProperty } from "./propertyToggler.ui";
import { floorColor, propertyValueColor } from "../properties";
import { getLocalResources } from "../resources";
import { arrowDownTrayIcon, arrowLeftIcon, arrowUpTrayIcon, buildingOfficeIcon, faceSmileIcon, pencilSquareIcon, puzzlePieceIcon } from "../icons";
import { createClaimButton } from "../claimButton.ui";
import { formatNumber } from "../formatNumber";
import { MODIFIER_MIN, MODIFIER_MAX } from "../../../shared/modifierLimits";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { ELEVATION, GROUND, SEA } from "../../../shared/terrain";
import { elevationRenderingCode, elevationVariation, ELEVATION_NAME } from "./terrainFeatures";
import { drawSeaBed, drawSeaGlints, drawSeaSurface, SeaSquare, SEA_COLOR, SEA_NAME } from "./sea.ui";
import { getUsername } from "../login/login.api";
import { requireLogin } from "../login/requireLogin";
import { showClaimDialog } from "../claimDialog.ui";
import { showUser } from "../login/userDisplay.ui";
import { isTestMode } from "../testMode";
import { showRenameDialog } from "../renameDialog.ui";

requireLogin();
showUser();

const FLOOR_PROPERTY = "soil";
const sektorId = new URLSearchParams(window.location.search).get("id");
// A sektor is only opened for building by the player who claimed it. Everybody else looks at
// it without the tools for changing it, as does its owner when asking for view mode.
let isViewMode = new URLSearchParams(window.location.search).get("mode") === "view" || !isSektorOwnedByCurrentPlayer();

function isSektorOwnedByCurrentPlayer(): boolean {
  const owner = getSektorOwnerName();
  return owner !== null && owner === getUsername();
}

function getSektorOwnerName(): string | null {
  // The sektor of a test run is made up along with its locations, and belongs to whoever opened it.
  if (isTestMode) return getUsername();
  return sektorId ? getSektorOwner(sektorId) : null;
}

// The player is shown which sektor they are looking at, above the panels on the left.
function showSektorName() {
  document.getElementById("sektor-header")?.remove();

  const header = document.createElement("div");
  header.id = "sektor-header";

  const title = document.createElement("div");
  title.id = "sektor-title";
  header.appendChild(title);

  // The way back to the list sits in front of the name of the sektor being left.
  const leaveButton = document.createElement("button");
  leaveButton.id = "leave-button";
  leaveButton.title = "Back to list";
  leaveButton.innerHTML = arrowLeftIcon;
  leaveButton.addEventListener("click", () => { window.location.href = "/"; });
  title.appendChild(leaveButton);

  const nameElement = document.createElement("div");
  nameElement.id = "sektor-name";
  nameElement.textContent = getDisplayedSektorName();
  title.appendChild(nameElement);

  // A sektor is the player's to call what they like, but only while they are the one building on
  // it, so the pencil is not there for anybody looking at somebody else's sektor.
  if (!isViewMode) title.appendChild(createRenameButton());

  document.getElementById("left-panels")!.prepend(header);

  showSektorStats(sektor.getSektorState());
}

function createRenameButton(): HTMLElement {
  const renameButton = document.createElement("button");
  renameButton.id = "rename-button";
  renameButton.title = "Rename sektor";
  renameButton.innerHTML = pencilSquareIcon;
  renameButton.addEventListener("click", renameSektor);
  return renameButton;
}

// The sektor goes by its new name from the moment it is given one, so the header is drawn again
// with it.
function renameSektor() {
  showRenameDialog({
    name: getGivenSektorName(sektorId!) ?? "",
    takenNames: getTakenSektorNames(sektorId!),
    onRenamed: givenName => {
      setGivenSektorName(sektorId!, givenName);
      showSektorName();
    },
  });
}

// A sektor carries the name it was made with, so the player is only asked whether they want it.
// It is claimed without leaving the map, which then turns from being looked at into being built on.
function claimSektor() {
  showClaimDialog({
    sektorName: getGivenSektorName(sektorId!) ?? sektorId!,
    onConfirmed: () => {
      setSektorOwner(sektorId!, getUsername()!);
      // Edit mode is entered before the header is drawn again, as it is what puts the pencil for
      // renaming beside the name.
      enterEditMode();
      showSektorName();
      showSektorOwner();
    },
  });
}

function enterEditMode() {
  isViewMode = false;
  initToolbar(builderLevel);
}

// A sektor claimed by another player carries their name, so that the player knows whose sektor
// they are looking at. Their own sektor carries nothing.
function showSektorOwner() {

  const owner = getSektorOwnerName();
  if (owner === getUsername()) return;

  // A sektor nobody has claimed is offered to the player looking at it.
  if (!owner) {
    const claimButton = createClaimButton(claimSektor);
    claimButton.id = "map-claim-button";
    document.getElementById("sektor-header")!.appendChild(claimButton);
    return;
  }

  const ownerElement = document.createElement("div");
  ownerElement.id = "sektor-owner";

  const label = document.createElement("span");
  label.className = "sektor-owner-label";
  label.textContent = "Owned by:";
  ownerElement.appendChild(label);

  const ownerName = document.createElement("span");
  ownerName.className = "sektor-owner-name";
  ownerName.textContent = owner;
  ownerElement.appendChild(ownerName);

  document.getElementById("sektor-header")!.appendChild(ownerElement);
}

function getDisplayedSektorName(): string {
  // The sektor of a test run is made up along with its locations, and so is its name.
  if (isTestMode) return "Test Sektor";
  // A sektor nobody has claimed and named yet is shown as having no name, as it is in the list.
  return (getGivenSektorName(sektorId!) ?? "").trim() || "No name";
}

if (!isTestMode && (!sektorId || !getSektorData(sektorId))) {
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

// Every location gets the same properties every time the test sektor is opened, so that the
// tests always see the same map. Each value is spread over the whole range a property value
// can take, however wide that range is.
function createTestLocations(gridSize: number): Location[][] {
  const propertyValueCount = MODIFIER_MAX - MODIFIER_MIN + 1;
  return Array.from({ length: gridSize }, (_, x) =>
    Array.from({ length: gridSize }, (_, z) => ({
      properties: {
        soil: ((x * 17 + z * 31) % propertyValueCount) + MODIFIER_MIN,
        groundwater: ((x * 13 + z * 23) % propertyValueCount) + MODIFIER_MIN,
        ore: ((x * 7 + z * 41) % propertyValueCount) + MODIFIER_MIN,
        insolation: ((x * 29 + z * 11) % propertyValueCount) + MODIFIER_MIN,
        wind: ((x * 37 + z * 19) % propertyValueCount) + MODIFIER_MIN,
      },
    }))
  );
}

function getLocations(): Location[][] {
  if (isTestMode) {
    return createTestLocations(SEKTOR_SIZE);
  }
  if (sektorId) {
    const sektorData = getSektorData(sektorId);
    if (sektorData) {
      return locationPropertiesToLocations(sektorData.locationProperties);
    }
  }
  return [];
}

// What every square of the map is made of. A sektor made before there was any sea carries no
// terrain at all, and is taken to be dry land the whole way across.
function getTerrain(): number[][] {
  if (isTestMode) {
    return createTestTerrain();
  }
  if (sektorId) {
    const terrainOfSektor = getSektorData(sektorId)?.terrain;
    if (terrainOfSektor) return terrainOfSektor;
  }
  return Array.from({ length: SEKTOR_SIZE }, () => Array.from({ length: SEKTOR_SIZE }, () => GROUND));
}

// The test sektor has a bay in one corner, rock standing about the rim, and dry land everywhere
// else, so that the tests see water, rock, land and the coast between them, in the same place
// every time. The middle of the map is left plain ground, as that is where a test puts its
// buildings, and so are the four corners, one of which a test builds on to see the sides of a
// floor.
const TEST_TERRAIN_ROWS = [
  "~~~~....^.",
  "~~~......^",
  "~~........",
  "~.........",
  "..........",
  ".........^",
  "..........",
  "..........",
  "^.........",
  ".^........",
];

const TEST_TERRAIN_SQUARES: { [drawn: string]: number } = { "~": SEA, "^": ELEVATION, ".": GROUND };

function createTestTerrain(): number[][] {
  return TEST_TERRAIN_ROWS.map(row => [...row].map(square => TEST_TERRAIN_SQUARES[square]));
}

const builderLevel = getBuilderLevel();
const terrain = getTerrain();
const sektor = new Sektor(getLocations(), buildingDefinitions, getLocalResources(), terrain);
const locations = sektor.getLocations();
const sektorLevel = getSektorLevel();
const placedBuildings: { type: string; location: BuildingLocation; code: string }[] = [];
let notificationTimeout: ReturnType<typeof setTimeout> | null = null;

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
  if (!sektorId) return;
  const state = sektor.getState();
  saveSektorData(sektorId, {
    level: sektorLevel,
    // The terrain of a sektor is settled when it is made and never changes, so it is written back
    // on every save, which would otherwise drop it.
    terrain,
    locationProperties: locationsToLocationProperties(locations),
    buildings: state.buildings,
  });
}

// Which buildings a toolbar offers depends on how far the player building on this sektor has come.
// A sektor nobody has claimed is there for whoever is looking at it to claim, so until somebody
// does, it is the level of the player looking at it which says what its toolbar holds.
function getBuilderLevel(): number {
  return playerLevel(scoreOfPlayer(getSektorOwnerName() ?? getUsername()));
}

// The level of a sektor is set when it is made and never changes, so it is read once and written
// back on every save, which would otherwise drop it.
function getSektorLevel(): number {
  if (isTestMode) return LOWEST_LEVEL;
  if (sektorId) {
    const sektorData = getSektorData(sektorId);
    if (sektorData) return sektorData.level;
  }
  return LOWEST_LEVEL;
}

// A building whose function is starved is marked on the map, and what is starved only changes
// with the sektor state, so the marked buildings are worked out there rather than every frame.
let starvedBuildingLocations: BuildingLocation[] = [];

function updateSektorState() {
  const sektorState = sektor.getSektorState();
  // What this sektor moves is worth what it does for the planet, so the planet is worked out anew
  // with this sektor as it now stands every time anything here changes.
  const planetImportsAndExports = getPlanetImportsAndExportsWhileBuilding(sektorId, sektorState);
  updateSektorStatePanel(sektorState, planetImportsAndExports);
  updateMessages(sektorState, planetImportsAndExports, sektorState.habitatShortages);
  starvedBuildingLocations = sektorState.starvedFunctions
    .map(starvedFunction => starvedFunction.buildingLocation)
    .filter((location, index, locations) =>
      locations.findIndex(other => other.x === location.x && other.y === location.y) === index
    );
  refreshOpenBuildingPanel();
  showSektorStats(sektorState);
}

// What a building is starved of can change with anything built or switched elsewhere in the
// sektor, so an open panel is redrawn from the new state rather than left showing the old one.
function refreshOpenBuildingPanel() {
  if (!selectedBuildingLocation) return;
  const openedBuilding = placedBuildings.find(building =>
    building.location.x === selectedBuildingLocation!.x && building.location.y === selectedBuildingLocation!.y
  );
  if (openedBuilding) openBuildingPanel(openedBuilding);
}

// A player looking at a sektor from the outside is told the same things about it as the list tells
// them, by the same icons in the same order, so the two read as one. What the sektor is worth is
// left out: a sektor being built on is scored resource by resource in the panel on the right.
function showSektorStats(sektorState: SektorState) {
  document.getElementById("sektor-stats")?.remove();

  const stats = document.createElement("div");
  stats.id = "sektor-stats";
  stats.appendChild(createStat(puzzlePieceIcon, "Difficulty", `${sektorLevel}`));
  stats.appendChild(createStat(buildingOfficeIcon, "Buildings", formatNumber(sektor.getState().buildings.length)));
  stats.appendChild(createStat(arrowDownTrayIcon, "Imports", formatNumber(sumThroughputs(sektorState.imports))));
  stats.appendChild(createStat(arrowUpTrayIcon, "Exports", formatNumber(sumThroughputs(sektorState.exports))));
  // A sektor nobody lives in has no people to be happy or unhappy, so it is not said how happy they
  // are. A sektor with habitats standing empty of what they need says so by standing at nothing.
  if (hasHabitats()) {
    stats.appendChild(createStat(faceSmileIcon, "Hapiness", formatNumber(sektorState.hapiness)));
  }

  document.getElementById("sektor-title")!.appendChild(stats);
}

// A habitat is any building made to give off Hapiness, whether or not it is giving off any at the
// moment: a habitat whose people are going without is still somewhere people live.
function hasHabitats(): boolean {
  return placedBuildings.some(building => buildingDefinitions
    .find(definition => definition.name === building.type)
    ?.buildingFunctions.some(buildingFunction =>
      buildingFunction.outputs.some(output => output.name === HAPINESS_RESOURCE)));
}

function createStat(icon: string, tooltip: string, value: string): HTMLElement {
  const stat = document.createElement("div");
  stat.className = "sektor-stat";

  const iconElement = document.createElement("span");
  iconElement.className = "sektor-stat-icon";
  iconElement.innerHTML = icon;
  iconElement.title = tooltip;
  stat.appendChild(iconElement);

  const valueElement = document.createElement("span");
  valueElement.className = "sektor-stat-value";
  valueElement.textContent = value;
  stat.appendChild(valueElement);

  return stat;
}

function sumThroughputs(throughputs: { value: number }[]): number {
  return throughputs.reduce((total, throughput) => total + throughput.value, 0);
}

function loadSavedState() {
  if (!sektorId) return;
  const sektorData = getSektorData(sektorId);
  if (!sektorData) return;
  sektor.loadState({ buildings: sektorData.buildings });
  for (const building of sektorData.buildings) {
    const code = getBuildingCode(building.type);
    if (code) {
      placedBuildings.push({ type: building.type, location: building.location, code });
      floorGeometryNeedsRebaking = true;
    }
  }
  updateSektorState();
}

let selectedBuildingLocation: BuildingLocation | null = null;
// Pointing at a resource marks what the sektor does with it: the buildings taking it in stand out in
// red, and the ones making it in green, neither of which anything else on the map is drawn in.
const IMPORT_HIGHLIGHT_COLOR: [number, number, number] = [255, 0, 0];
const EXPORT_HIGHLIGHT_COLOR: [number, number, number] = [0, 192, 0];

let hoveredResource: string | null = null;
function openBuildingPanel(placed: { type: string; location: BuildingLocation; code: string }) {
  const buildingState = sektor.getBuildingState(placed.location);
  if (!buildingState) return;
  const code = getBuildingCode(placed.type);
  if (!code) return;
  const placedFloorColor = floorColorAt(placed.location.x, placed.location.y);
  selectedBuildingLocation = placed.location;
  const definition = buildingDefinitions.find(definition => definition.name === placed.type);
  showBuildingPanel({
    name: placed.type,
    code: code,
    buildingFunctions: buildingState.buildingFunctions,
    locationProperties: locations[placed.location.x]?.[placed.location.y]?.properties,
    floorColor: placedFloorColor,
    showFloor: definition?.properties.showFloor,
    location: placed.location,
    // A sektor being looked at rather than played is only ever read, so it is shown without the
    // controls which would change it.
    onDestroy: isViewMode ? undefined : () => destroyBuilding(placed.location),
    onToggleFunction: isViewMode ? undefined : functionIndex => toggleBuildingFunction(placed, functionIndex),
  });
}

// Turning a function on or off changes what the building consumes and produces, so the panel is
// redrawn and the sektor recalculated from the building's new set of functions.
function toggleBuildingFunction(placed: { type: string; location: BuildingLocation; code: string }, functionIndex: number) {
  const buildingState = sektor.getBuildingState(placed.location);
  if (!buildingState) return;
  if (buildingState.buildingFunctions[functionIndex].active) {
    sektor.deactivateFunction(placed.location, functionIndex);
  } else {
    sektor.activateFunction(placed.location, functionIndex);
  }
  updateSektorState();
  saveState();
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
  updateSektorState();
  saveState();
}

// A square with no building on it is shown the way a building is, so that a player clicking on it
// is told what the square is and what the ground there holds. It names whatever the square is made
// of, and it comes without the button which would take a building down: there is nothing there to
// destroy, and the sea and the rock are not the player's to remove.
function openTerrainPanel(location: BuildingLocation) {
  selectedBuildingLocation = location;
  showBuildingPanel({
    name: terrainNameAt(location.x, location.y),
    code: terrainRenderingCodeAt(location.x, location.y),
    buildingFunctions: [],
    locationProperties: locations[location.x]?.[location.y]?.properties,
    floorColor: floorColorAt(location.x, location.y),
    location: location,
  });
}

function terrainNameAt(gx: number, gy: number): string {
  if (isSeaLocation(gx, gy)) return SEA_NAME;
  if (isElevationLocation(gx, gy)) return ELEVATION_NAME;
  return EMPTY_NAME;
}

// What the panel calls a square of plain ground with nothing built on it.
const EMPTY_NAME = "Empty";

// Only rock stands on a square of its own: the sea and the bare ground are the floor and nothing
// more, so the panel shows them with no bodies over the floor.
function terrainRenderingCodeAt(gx: number, gy: number): string {
  return isElevationLocation(gx, gy) ? elevationRenderingCode(elevationVariation(gx, gy)) : "";
}

// The property selected in the geography panel is shown on every floor, whose edges are
// colored by that location's property value. The floors themselves already show the soil
// property, so soil needs no overlay.
function getOverlayProperty(): string | null {
  const selectedProperty = getSelectedProperty();
  return selectedProperty === FLOOR_PROPERTY ? null : selectedProperty;
}

// Selecting a building in the toolbar selects the location property its output is named after,
// so that the overlay shows where the building produces the most; deselecting it, or selecting
// a building whose outputs name no property, goes back to plain soil floors.
function selectBuildingProperty(buildingName: string | null) {
  const buildingDefinition = buildingDefinitions.find(definition => definition.name === buildingName);
  const outputs = buildingDefinition?.buildingFunctions.map(buildingFunction => buildingFunction.outputs).flat() ?? [];
  selectProperty(outputs.find(output => output.locationProperty !== undefined)?.locationProperty ?? FLOOR_PROPERTY);
}

function drawPropertyOverlay(p: p5, propertyName: string) {
  for (let x = 0; x < SEKTOR_SIZE; x++) {
    for (let y = 0; y < SEKTOR_SIZE; y++) {
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

const STARVATION_WARNING_SIZE = BLOCK_SIZE * 0.6;
const STARVATION_WARNING_HEIGHT = BLOCK_SIZE * 0.85;

// The warning is a flat sign standing upright over the building, like a signpost: it turns
// around its upright axis to face the camera, but never tips away from the floor.
function drawStarvationWarning(p: p5, location: BuildingLocation, cameraAngleY: number) {
  const { wx, wz } = gridToWorld(location.x, location.y);
  const half = STARVATION_WARNING_SIZE / 2;

  p.push();
  p.noStroke();
  p.noLights();
  p.translate(wx, -STARVATION_WARNING_HEIGHT, wz);
  p.rotateY(cameraAngleY);

  p.fill(255, 221, 0);
  p.beginShape();
  p.vertex(0, -half, 0);
  p.vertex(half, half * 0.8, 0);
  p.vertex(-half, half * 0.8, 0);
  p.endShape(p.CLOSE);

  // The exclamation point sits just in front of the triangle, so the two do not fight over the
  // same depth.
  p.fill(0);
  p.translate(0, 0, STARVATION_WARNING_SIZE * 0.02);
  p.push();
  p.translate(0, -STARVATION_WARNING_SIZE * 0.05, 0);
  p.plane(STARVATION_WARNING_SIZE * 0.1, STARVATION_WARNING_SIZE * 0.3);
  p.pop();
  p.translate(0, STARVATION_WARNING_SIZE * 0.22, 0);
  p.plane(STARVATION_WARNING_SIZE * 0.1, STARVATION_WARNING_SIZE * 0.1);

  p.pop();
}

// Drawing the hundred floors one by one costs p5 a geometry rebuild and a GPU upload per
// floor per frame, which dwarfs everything else on the canvas. The grid only changes when a
// building that hides its floor is built or destroyed, so it is baked into a single geometry
// and rebaked only then.
let opaqueFloorGeometry: p5.Geometry | null = null;
let waterSurfaceGeometry: p5.Geometry | null = null;
let floorGeometryNeedsRebaking = true;

// The map is baked in two parts because it has to be drawn in two passes. Everything solid goes
// into the first — the land, and the beds of the sea, which are as solid as the land is — and
// fills the depth buffer, so that nothing buried under the map shows through it. Only the surfaces
// of the water go into the second, which is laid over the first writing no depth of its own,
// because a surface half seen through must not hide the bed and the buildings standing behind it.
function rebakeFloorGeometry(p: p5) {
  if (opaqueFloorGeometry) {
    p.freeGeometry(opaqueFloorGeometry);
  }
  if (waterSurfaceGeometry) {
    p.freeGeometry(waterSurfaceGeometry);
  }
  opaqueFloorGeometry = p.buildGeometry(() => bakeOpaqueFloors(p));
  waterSurfaceGeometry = p.buildGeometry(() => bakeWaterSurfaces(p));
  floorGeometryNeedsRebaking = false;
}

function bakeOpaqueFloors(p: p5) {
  forEachLocation(p, (x, z) => {
    if (!isFloorSolid(x, z)) {
      drawFloorWireframe(p, BLOCK_SIZE);
    } else if (isSeaLocation(x, z)) {
      drawSeaBed(p);
    } else {
      drawFloor(p, BLOCK_SIZE, floorColorAt(x, z));
    }
  });
}

function bakeWaterSurfaces(p: p5) {
  forEachLocation(p, (x, z) => {
    if (!isSeaLocation(x, z) || !isFloorSolid(x, z)) return;
    drawSeaSurface(p);
  });
}

// Every location is baked where it stands on the map, so that the whole grid comes out as one
// geometry however many passes it takes to draw it.
function forEachLocation(p: p5, bakeLocation: (x: number, z: number) => void) {
  for (let x = 0; x < SEKTOR_SIZE; x++) {
    for (let z = 0; z < SEKTOR_SIZE; z++) {
      p.push();
      const { wx, wz } = gridToWorld(x, z);
      p.translate(wx, 0, wz);
      bakeLocation(x, z);
      p.pop();
    }
  }
}

function isFloorSolid(x: number, z: number): boolean {
  const placedBuilding = placedBuildings.find(building => building.location.x === x && building.location.y === z);
  if (!placedBuilding) return true;
  const buildingDefinition = buildingDefinitions.find(definition => definition.name === placedBuilding.type);
  return buildingDefinition?.properties.showFloor !== false;
}

// Outcrops standing in the same shape draw the same bodies, so one bake serves every square of
// that shape however many of them a map has. They are baked under the shape they stand in rather
// than under their own name, which every one of them shares.
function bakedElevationBodies(p: p5, location: BuildingLocation): BakedBodies {
  const variation = elevationVariation(location.x, location.y);
  return bakedBuildingBodies(p, `${ELEVATION_NAME} ${variation}`, elevationRenderingCode(variation));
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
  showNotification(message, "red");
}

// A notification says its piece over the map for a while and then goes away on its own, so that
// the player is told what happened without being stopped from building.
function showNotification(message: string, textColor: string) {
  const notificationElement = document.getElementById("notification")!;
  notificationElement.textContent = message;
  notificationElement.style.color = textColor;
  notificationElement.style.display = "block";
  if (notificationTimeout) clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notificationElement.style.display = "none";
  }, 5000);
}

// The view is set so that the map fills it.
const ZOOM = 1.2;

const HALF = BLOCK_SIZE / 2;
const FLOOR_HEIGHT = BLOCK_SIZE * 0.15;

function gridToWorld(gx: number, gy: number): { wx: number; wz: number } {
  return {
    wx: (gx - SEKTOR_SIZE / 2 + 0.5) * BLOCK_SIZE,
    wz: (gy - SEKTOR_SIZE / 2 + 0.5) * BLOCK_SIZE,
  };
}

// What the top of a location is colored: the sea where the map is under water, otherwise its soil.
function floorColorAt(gx: number, gy: number): [number, number, number] {
  if (isSeaLocation(gx, gy)) return SEA_COLOR;
  return floorColor(locations[gx]?.[gy]?.properties[FLOOR_PROPERTY] ?? 0);
}

function isSeaLocation(gx: number, gy: number): boolean {
  return terrain[gx]?.[gy] === SEA;
}

function isElevationLocation(gx: number, gy: number): boolean {
  return terrain[gx]?.[gy] === ELEVATION;
}

// Every square of rock on the map. Rock is not built and never taken down, so the list is made
// once and stands for as long as the sektor is open.
const elevationLocations: BuildingLocation[] = everyElevationLocation();

function everyElevationLocation(): BuildingLocation[] {
  const locationsOfRock: BuildingLocation[] = [];
  for (let gx = 0; gx < SEKTOR_SIZE; gx++) {
    for (let gy = 0; gy < SEKTOR_SIZE; gy++) {
      if (isElevationLocation(gx, gy)) locationsOfRock.push({ x: gx, y: gy });
    }
  }
  return locationsOfRock;
}

// Every square of the sea, ready to be shimmered over: where it lies on the map, and where the
// middle of it stands in the world. The sea does not move, so the list is made once.
const seaSquares: SeaSquare[] = everySeaSquare();

function everySeaSquare(): SeaSquare[] {
  const squares: SeaSquare[] = [];
  for (let gx = 0; gx < SEKTOR_SIZE; gx++) {
    for (let gy = 0; gy < SEKTOR_SIZE; gy++) {
      if (!isSeaLocation(gx, gy)) continue;
      const { wx, wz } = gridToWorld(gx, gy);
      squares.push({ x: gx, z: gy, centerX: wx, centerZ: wz });
    }
  }
  return squares;
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

  for (let gx = 0; gx < SEKTOR_SIZE; gx++) {
    for (let gy = 0; gy < SEKTOR_SIZE; gy++) {
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

const LEFT_MOUSE_BUTTON = 0;
const MIDDLE_MOUSE_BUTTON = 1;

// Two presses of the panning button count as a doubleclick when they come this close together and
// land this near one another. The browser's own doubleclick is no use here, as it is only raised
// for the left button, never for the middle one.
const DOUBLECLICK_MILLIS = 400;
const DOUBLECLICK_PIXELS = 5;

const sektorUi = (p: p5) => {
  let camAngleY = Math.PI / 4;
  let camElevation = CAM_ELEVATION;
  // How far the map has been dragged is kept in screen pixels rather than in world units, so that
  // the map follows the mouse by as many pixels as the mouse moved, whatever angle it is looked at
  // from and however far it is zoomed in.
  let panScreenX = 0;
  let panScreenY = 0;
  let dragMode: "rotate" | "pan" | null = null;
  let isSpacePressed = false;
  let didDrag = false;
  let mouseDownOnCanvas = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let lastPanPressMillis = -Infinity;
  let lastPanPressX = 0;
  let lastPanPressY = 0;
  let zoom = ZOOM;

  // Asking the page how big the canvas is makes the browser lay the whole page out there and then,
  // before it can answer. The wheel fires many times over a single frame, so reading the size on
  // every turn of it laid the page out over and over for one frame of zooming — which is why
  // zooming dragged while turning the map, which reads nothing, never did. The size is read only
  // when it can have changed, and zooming works off what was read.
  let containerWidth = 0;
  let containerHeight = 0;

  function readContainerSize(container: HTMLElement) {
    containerWidth = container.offsetWidth;
    containerHeight = container.offsetHeight;
  }

  function updateOrtho() {
    const hw = containerWidth * zoom / 2;
    const hh = containerHeight * zoom / 2;
    p.ortho(-hw, hw, -hh, hh);
  }

  p.setup = () => {
    const container = document.getElementById("canvas-container")!;
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL);
    canvas.parent(container);
    readContainerSize(container);
    updateOrtho();

    // The canvas keeps the size it was made at, but the view it carries is cut to the size of the
    // page, so a resized window has to be read afresh rather than left to the next zoom to notice.
    window.addEventListener("resize", () => {
      readContainerSize(container);
      updateOrtho();
    });

    updateCamera(p);

    window.addEventListener("keydown", (event: KeyboardEvent) => {
      if (!isSpaceOnTheMap(event)) return;
      isSpacePressed = true;
      // Left alone, space scrolls the page and takes the map out of view.
      event.preventDefault();
    });
    window.addEventListener("keyup", (event: KeyboardEvent) => {
      if (!isSpaceOnTheMap(event)) return;
      isSpacePressed = false;
    });

    canvas.elt.addEventListener("mousedown", (event: MouseEvent) => {
      const isPanDrag = event.button === MIDDLE_MOUSE_BUTTON
        || (event.button === LEFT_MOUSE_BUTTON && isSpacePressed);
      if (!isPanDrag && event.button !== LEFT_MOUSE_BUTTON) return;
      // The middle button starts the browser's own scrolling, which has to be called off for it
      // to drag the map instead.
      if (isPanDrag) event.preventDefault();
      if (isPanDrag && isSecondPressOfDoubleclick(event)) centreMap();
      dragMode = isPanDrag ? "pan" : "rotate";
      didDrag = false;
      // Only a plain left press is a press on a location: dragging the map around is not building
      // on the location the drag happened to start over.
      mouseDownOnCanvas = dragMode === "rotate";
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    });
    window.addEventListener("mouseup", () => { dragMode = null; });
    window.addEventListener("mousemove", (event: MouseEvent) => {
      if (dragMode === null) return;
      const dx = event.clientX - lastMouseX;
      const dy = event.clientY - lastMouseY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      if (dragMode === "pan") {
        panScreenX += dx;
        panScreenY += dy;
      } else {
        camAngleY -= dx * 0.005;
        camElevation += dy * 0.005;
        camElevation = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, camElevation));
      }
      keepMapWithinReach();
      updateCamera(p);
    });
    canvas.elt.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      zoom *= e.deltaY > 0 ? 1.05 : 0.95;
      zoom = Math.max(0.3, Math.min(3, zoom));
      updateOrtho();
      keepMapWithinReach();
      updateCamera(p);
    }, { passive: false });
  };

  // The map is never dragged off the screen: however far it is pushed, the middle of the screen
  // stays over it, so the corner square the map is being dragged away from comes to rest there.
  // Turning the map or zooming it moves the corners on the screen too, so the same limit is put on
  // the map after those as after a drag.
  function keepMapWithinReach() {
    const cornersAcrossScreen = cornerSquaresOnScreen();
    panScreenX = Math.max(
      -Math.max(...cornersAcrossScreen.map(corner => corner.screenX)),
      Math.min(-Math.min(...cornersAcrossScreen.map(corner => corner.screenX)), panScreenX),
    );
    panScreenY = Math.max(
      -Math.max(...cornersAcrossScreen.map(corner => corner.screenY)),
      Math.min(-Math.min(...cornersAcrossScreen.map(corner => corner.screenY)), panScreenY),
    );
  }

  // Where the four corner squares of the map sit on the screen, in pixels away from the middle of
  // the screen, as they would sit with the map not dragged at all.
  function cornerSquaresOnScreen(): { screenX: number; screenY: number }[] {
    const right = screenRightAxis();
    const down = screenDownAxis();
    const lastLocation = SEKTOR_SIZE - 1;
    return [
      gridToWorld(0, 0),
      gridToWorld(lastLocation, 0),
      gridToWorld(0, lastLocation),
      gridToWorld(lastLocation, lastLocation),
    ].map(({ wx, wz }) => ({
      screenX: (right.x * wx + right.z * wz) / zoom,
      screenY: (down.x * wx + down.z * wz) / zoom,
    }));
  }

  // The map goes back to sitting in the middle of the screen, looked at from the same side and
  // from as near as before: a player who has dragged themselves into a corner is given the whole
  // map back without losing the angle and the zoom they had picked.
  function centreMap() {
    panScreenX = 0;
    panScreenY = 0;
    updateCamera(p);
  }

  // Whether this press of the panning button finishes a doubleclick: the press before it was on
  // the same spot and only a moment ago. Every press is remembered as the one to measure the next
  // against, so a third press doubleclicks with the second.
  function isSecondPressOfDoubleclick(event: MouseEvent): boolean {
    const isDoubleclick = p.millis() - lastPanPressMillis < DOUBLECLICK_MILLIS
      && Math.abs(event.clientX - lastPanPressX) <= DOUBLECLICK_PIXELS
      && Math.abs(event.clientY - lastPanPressY) <= DOUBLECLICK_PIXELS;
    lastPanPressMillis = p.millis();
    lastPanPressX = event.clientX;
    lastPanPressY = event.clientY;
    return isDoubleclick;
  }

  // Space is the map's to take only while the player is on the map itself — while they are typing
  // a name into a field it is theirs to type with.
  function isSpaceOnTheMap(event: KeyboardEvent): boolean {
    if (event.code !== "Space") return false;
    const target = event.target as HTMLElement | null;
    const tagName = target?.tagName;
    return tagName !== "INPUT" && tagName !== "TEXTAREA";
  }

  function updateCamera(p: p5) {
    const lookedAt = pannedCentre();
    const camX = lookedAt.wx + CAM_DIST * Math.sin(camAngleY) * Math.cos(camElevation);
    const camY = lookedAt.wy - CAM_DIST * Math.sin(camElevation);
    const camZ = lookedAt.wz + CAM_DIST * Math.cos(camAngleY) * Math.cos(camElevation);
    p.camera(camX, camY, camZ, lookedAt.wx, lookedAt.wy, lookedAt.wz, 0, 1, 0);
  }

  // The point the camera is pointed at. The map is to move with the mouse, so the camera moves
  // against it: the dragged pixels are laid out along the screen axes in world space and subtracted.
  function pannedCentre(): { wx: number; wy: number; wz: number } {
    const right = screenRightAxis();
    const down = screenDownAxis();
    return {
      wx: -(right.x * panScreenX + down.x * panScreenY) * zoom,
      wy: -(right.y * panScreenX + down.y * panScreenY) * zoom,
      wz: -(right.z * panScreenX + down.z * panScreenY) * zoom,
    };
  }

  // The world direction a pixel to the right on the screen goes in. The camera is never rolled, so
  // screen right stays level with the floor.
  function screenRightAxis(): { x: number; y: number; z: number } {
    return { x: Math.cos(camAngleY), y: 0, z: -Math.sin(camAngleY) };
  }

  // The world direction a pixel down the screen goes in. Y grows downwards in p5's world, so the
  // more the map is looked at from above, the more screen-down runs along the floor.
  function screenDownAxis(): { x: number; y: number; z: number } {
    return {
      x: Math.sin(camAngleY) * Math.sin(camElevation),
      y: Math.cos(camElevation),
      z: Math.cos(camAngleY) * Math.sin(camElevation),
    };
  }

  p.mouseReleased = (event?: MouseEvent) => {
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
        openTerrainPanel({ x: grid.x, y: grid.y });
      }
      return;
    }

    // The buildings of a sektor belonging to somebody else are there to be looked at, so a
    // player without the sektor is told why the one they picked does not go up.
    if (isViewMode) {
      showError("noOwnership");
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
      updateSektorState();
      saveState();
      // After putting a building up a player more often looks at what they built than builds another
      // of the same, so the tool is put down while the new building stays selected on the map. A
      // player who does want a row of the same building holds SHIFT to keep the tool in hand.
      if (!event?.shiftKey) deselectBuilding();
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
    const bakedOpaqueFloors = opaqueFloorGeometry;
    const bakedWaterSurfaces = waterSurfaceGeometry;
    if (bakedOpaqueFloors) {
      p.model(bakedOpaqueFloors);
    }
    if (bakedWaterSurfaces) {
      withoutDepthWrites(p, () => p.model(bakedWaterSurfaces));
    }

    // The glints swell and fade by the clock, so a test run would catch the sea at a different
    // moment every time and no two screenshots of the same map would come out alike. A test is
    // shown the water standing still instead.
    if (!isTestMode) {
      drawSeaGlints(p, seaSquares, p.millis());
    }

    const overlayProperty = getOverlayProperty();
    if (overlayProperty) {
      drawPropertyOverlay(p, overlayProperty);
    }

    if (selectedBuildingLocation) {
      drawLocationHighlight(p, selectedBuildingLocation, [255, 255, 0]);
    }

    // A building doing both with the same resource is marked as taking it in: what a sektor is short
    // of is the more pressing of the two to find.
    if (hoveredResource) {
      for (const building of placedBuildings) {
        if (sektor.doesBuildingNeedInput(building.location, hoveredResource)) {
          drawLocationHighlight(p, building.location, IMPORT_HIGHLIGHT_COLOR);
        } else if (sektor.doesBuildingHaveOutput(building.location, hoveredResource)) {
          drawLocationHighlight(p, building.location, EXPORT_HIGHLIGHT_COLOR);
        }
      }
    }

    p.noStroke();
    // Rock stands on the map the way a building does, on a floor drawn like any other ground, so
    // it is drawn the way a building is — baked once per kind and stamped wherever it stands.
    for (const location of elevationLocations) {
      p.push();
      const { wx, wz } = gridToWorld(location.x, location.y);
      p.translate(wx, 0, wz);
      drawBakedBodies(p, bakedElevationBodies(p, location), p.millis());
      p.pop();
    }

    for (const building of placedBuildings) {
      p.push();
      const { wx, wz } = gridToWorld(building.location.x, building.location.y);
      p.translate(wx, 0, wz);
      drawBakedBodies(p, bakedBuildingBodies(p, building.type, building.code), p.millis());
      p.pop();
    }

    for (const location of starvedBuildingLocations) {
      drawStarvationWarning(p, location, camAngleY);
    }

    document.getElementById("canvas-container")!.dataset.rendered = "true";
  };
};

new p5(sektorUi);
showSektorName();
showSektorOwner();
initToolbar(builderLevel, isViewMode);
initPropertyToggler();
onBuildingSelected(selectBuildingProperty);
onResourceHover(resourceName => { hoveredResource = resourceName; });
if (!isTestMode) {
  loadSavedState();
}
// A player is told what would most help the planet from the moment the map is open, before they
// have built anything at all: what the planet is short of is the doing of every sektor there is.
const openedSektorState = sektor.getSektorState();
updateMessages(
  openedSektorState,
  getPlanetImportsAndExportsWhileBuilding(sektorId, openedSektorState),
  openedSektorState.habitatShortages,
);
if (isTestMode) {
  (window as any).updateSektorStatePanel = updateSektorStatePanel;
  (window as any).showBuildingPanel = showBuildingPanel;
}
