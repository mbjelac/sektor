import p5 from "p5";
import { buildingDefinitions } from "./buildings/buildings";
import { createFunctionDisplay } from "./buildingFunctionDisplay.ui";
import { parseCommands } from "../../../shared/parseCommands";
import { applyCommands } from "../../../shared/applyCommands";
import { drawFloor } from "../../../shared/drawFloor";
import { BLOCK_SIZE } from "../../../shared/constants";
import { BuildingDefinition, BuildingFunction, OutputModifier } from "./buildings/parseBuildingDefinitions";
import { propertyDefinitions } from "../properties";
import { getResourceIcon } from "../resources";
import { arrowLeftIcon } from "../icons";

const TOOLBAR_FUNCTION_PANEL_MARGIN = 8;
const THUMBNAIL_WIDTH = 100;
const THUMBNAIL_HEIGHT = 70;

// The destruction tool sits among the buildings in the toolbar and is selected like one,
// but clicking the map with it destroys the building there instead of constructing.
export const DESTRUCTION_TOOL = "Destroy";

let selectedBuilding: string | null = null;
// The code of a building is needed to draw it on the map, also when the map is shown without the
// toolbar, so it is looked up straight from the definitions.
const buildingCodeMap = new Map(buildingDefinitions.map(building => [building.name, building.renderingCode]));
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

// A building can do several things, each of them affected by a different location property, so
// every function is followed by the list of its own outputs which a property affects.
function showToolbarFunctionPanel(buildingFunctions: BuildingFunction[]) {
  hideToolbarFunctionPanel();

  toolbarFnPanel = document.createElement("div");
  toolbarFnPanel.id = "toolbar-function-panel";

  for (const buildingFunction of buildingFunctions) {
    const functionBlock = createFunctionDisplay({ buildingFunction: buildingFunction });
    const outputModifiers = buildingFunction.outputModifiers ?? [];
    if (outputModifiers.length > 0) {
      functionBlock.appendChild(createModifierList(outputModifiers));
    }
    toolbarFnPanel.appendChild(functionBlock);
  }

  document.body.appendChild(toolbarFnPanel);

  // The panel is always shown beside the top of the construction panel, so it stays in the
  // same place whichever building is selected and however many functions that building has.
  const constructionPanel = document.getElementById("construction-panel")!;
  const constructionPanelRect = constructionPanel.getBoundingClientRect();
  toolbarFnPanel.style.left = `${constructionPanelRect.right + TOOLBAR_FUNCTION_PANEL_MARGIN}px`;
  toolbarFnPanel.style.top = `${constructionPanelRect.top}px`;
}

function createModifierList(outputModifiers: OutputModifier[]): HTMLElement {
  const modifierList = document.createElement("div");
  modifierList.className = "tf-modifier-list";

  const modifierHeader = document.createElement("div");
  modifierHeader.className = "tf-modifier-header";
  modifierHeader.textContent = "Affected by";
  modifierList.appendChild(modifierHeader);

  for (const modifier of outputModifiers) {
    const item = document.createElement("div");
    item.className = "tf-modifier-item";

    const resourceSpan = document.createElement("span");
    resourceSpan.className = "tf-modifier-resource";
    const icon = getResourceIcon(modifier.resource);
    resourceSpan.textContent = `${modifier.resource} ${icon ?? ""}`;
    item.appendChild(resourceSpan);

    const arrowElement = document.createElement("span");
    arrowElement.className = "tf-modifier-arrow";
    arrowElement.innerHTML = arrowLeftIcon;
    item.appendChild(arrowElement);

    const propertySpan = document.createElement("span");
    propertySpan.textContent = modifier.property;
    item.appendChild(propertySpan);

    const propertyDefinition = propertyDefinitions.find(definition => definition.name === modifier.property);
    if (propertyDefinition) {
      const swatch = document.createElement("span");
      swatch.className = "tf-modifier-swatch";
      swatch.style.backgroundColor = propertyDefinition.color;
      item.appendChild(swatch);
    }

    modifierList.appendChild(item);
  }

  return modifierList;
}

function hideToolbarFunctionPanel() {
  if (toolbarFnPanel) {
    toolbarFnPanel.remove();
    toolbarFnPanel = null;
  }
}

export function initToolbar() {
  const toolbar = document.getElementById("toolbar")!;
  const thumbnails: Thumbnail[] = [];

  for (const building of buildingDefinitions) {
    const item = document.createElement("div");
    item.className = "building-item";
    if (building.name === DESTRUCTION_TOOL) {
      item.classList.add("destruction-tool");
    }
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
        hideToolbarFunctionPanel();
        if (building.buildingFunctions.length > 0) {
          showToolbarFunctionPanel(building.buildingFunctions);
        }
      }
      selectionCallback?.(selectedBuilding);
    });

    toolbar.appendChild(item);

    thumbnails.push({building, canvasContainer});
  }

  showBuildingThumbnails(thumbnails);
}

interface Thumbnail {
  building: BuildingDefinition;
  canvasContainer: HTMLElement;
}

// A browser lends out only so many WebGL canvases at once, and one canvas per building in the
// toolbar took so many of them that the map lost its own canvas and went blank. Every thumbnail is
// therefore drawn on one single canvas, one building after another, and each drawing is kept as a
// picture, which never has to change once it is taken. The canvas is handed back once the last
// building has been drawn on it.
function showBuildingThumbnails(thumbnails: Thumbnail[]) {
  if (thumbnails.length === 0) return;

  new p5((sketch: p5) => {
    let thumbnailCanvas: HTMLCanvasElement;

    sketch.setup = () => {
      const canvas = sketch.createCanvas(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, sketch.WEBGL);
      canvas.parent(offscreenCanvasContainer());
      thumbnailCanvas = canvas.elt as HTMLCanvasElement;
      const viewWidth = THUMBNAIL_WIDTH / 0.7;
      const viewHeight = viewWidth * THUMBNAIL_HEIGHT / THUMBNAIL_WIDTH;
      sketch.ortho(-viewWidth / 2, viewWidth / 2, -viewHeight / 2, viewHeight / 2);

      const cameraDistance = 800;
      const cameraAngleY = Math.PI / 4;
      const cameraAngleX = Math.PI / 6;
      const cameraX = cameraDistance * Math.sin(cameraAngleY) * Math.cos(cameraAngleX);
      const cameraY = -cameraDistance * Math.sin(cameraAngleX);
      const cameraZ = cameraDistance * Math.cos(cameraAngleY) * Math.cos(cameraAngleX);
      sketch.camera(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0);
      sketch.noLoop();
    };

    sketch.draw = () => {
      for (const thumbnail of thumbnails) {
        // Every building is drawn on the canvas the one before it was drawn on, so each of them
        // starts from the state the canvas was set up in, and its picture is taken before the
        // next building paints over it.
        sketch.push();
        drawBuildingThumbnail(sketch, thumbnail.building);
        sketch.pop();
        keepThumbnailAsImage(thumbnailCanvas, thumbnail.canvasContainer);
      }

      // Giving up the canvas waits until the frame it was drawn in is over, so that p5 is done
      // with the sketch before the sketch is taken away from it.
      setTimeout(() => {
        releaseWebGlContext(thumbnailCanvas);
        sketch.remove();
      }, 0);
    };
  });
}

// The one canvas the thumbnails are drawn on shows none of them in the end, so it is kept out of
// sight while it is being drawn on.
function offscreenCanvasContainer(): HTMLElement {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);
  return container;
}

function drawBuildingThumbnail(sketch: p5, building: BuildingDefinition) {
  sketch.background(42);
  sketch.ambientLight(60);
  sketch.pointLight(255, 255, 255, 2 * BLOCK_SIZE, -3 * BLOCK_SIZE, -2 * BLOCK_SIZE);
  sketch.noStroke();

  sketch.translate(0, BLOCK_SIZE * 0.15, 0);
  if (building.properties.showFloor !== false) {
    drawFloor(sketch, BLOCK_SIZE, [162, 220, 134]);
  }
  const commands = parseCommands(building.renderingCode);
  applyCommands(sketch, commands);
}

function keepThumbnailAsImage(thumbnailCanvas: HTMLCanvasElement, canvasContainer: HTMLElement) {
  const thumbnailImage = document.createElement("img");
  thumbnailImage.className = "building-thumbnail";
  thumbnailImage.width = THUMBNAIL_WIDTH;
  thumbnailImage.height = THUMBNAIL_HEIGHT;
  thumbnailImage.src = thumbnailCanvas.toDataURL();
  canvasContainer.appendChild(thumbnailImage);
}

// Taking the canvas out of the page leaves the browser to free its WebGL context whenever it gets
// around to it, which is too late for the canvases waiting for one, so the context is given up
// explicitly.
function releaseWebGlContext(thumbnailCanvas: HTMLCanvasElement) {
  const webGlContext = thumbnailCanvas.getContext("webgl2") ?? thumbnailCanvas.getContext("webgl");
  if (!webGlContext) return;
  webGlContext.getExtension("WEBGL_lose_context")?.loseContext();
}
