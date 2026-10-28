
import { getResourceIcon } from "../resources";
import { BuildingFunction, BuildingFunctionOutput, ResourceThroughput } from "./buildings/parseBuildingDefinitions";
import { formatNumber } from "../formatNumber";
import { propertyDefinitions } from "../properties";
import { isOutputAffectedByPollution } from "./pollution";
import { pointAtResourceWhileHovered } from "../resourceHover.ui";
import { poolUnusedIcon, poolUsedIcon, xMarkIcon } from "../icons";

// How many times over a function drawing on its building's pool is done, how much of the pool no
// function draws on yet, and what to do when the player sets another multiplier. A function which is
// only being looked at, not played, is shown its pool without being able to change it.
export interface FunctionPool {
  multiplier: number;
  unusedPool: number;
  onSetMultiplier?: (multiplier: number) => void;
}

// Every function of a building consumes and produces in the same two columns, so they are
// labelled once for all of them, above the first function.
export function createColumnHeaders(): HTMLElement {
  const columnHeaders = document.createElement("div");
  columnHeaders.className = "bf-column-headers";

  for (const columnName of ["Inputs", "Outputs"]) {
    const columnHeader = document.createElement("div");
    columnHeader.textContent = columnName;
    columnHeaders.appendChild(columnHeader);
  }

  return columnHeaders;
}

// A building which is not on the map yet stands on no location, so it is shown without output
// amounts, which only a location it stands on can decide, and without the pollution of one.
// A function starved of a local resource, or of a building disabled for want of imports, consumes
// and produces nothing, so it is grayed out, marked as starved, and its amounts are shown as what
// it would consume and produce.
// A function of a building on the map can have its resources pointed at, which marks where in the
// sektor each is consumed and produced, as pointing at it in the imports and exports panel does.
// A function drawing on the pool of a building on the map is shown how much of the pool it draws on.
export function createFunctionDisplay({ buildingFunction, outputAmounts, pollution, pool, starved, disabled, pointAtResources }: {
  buildingFunction: BuildingFunction,
  outputAmounts?: ResourceThroughput[],
  pollution?: number,
  pool?: FunctionPool,
  starved?: boolean,
  disabled?: boolean,
  pointAtResources?: boolean,
}): HTMLElement {
  const functionBlock = document.createElement("div");
  functionBlock.className = "bf-function-block";
  const stopped = (starved ?? false) || (disabled ?? false);
  // A function drawing on the pool which is done no times over does nothing, so it is grayed out
  // like a stopped one, without being marked as starved.
  if (stopped || pool?.multiplier === 0) {
    functionBlock.classList.add("bf-function-inactive");
  }

  if (buildingFunction.name || stopped || pool) {
    functionBlock.appendChild(createFunctionHeader(buildingFunction.name, stopped, pool));
  }

  const functionDisplay = document.createElement("div");
  functionDisplay.className = "bf-function";
  functionBlock.appendChild(functionDisplay);

  const multiplier = pool?.multiplier ?? 1;
  functionDisplay.appendChild(createInputsTable(buildingFunction.inputs, multiplier, pointAtResources ?? false));

  functionDisplay.appendChild(createOutputColumn(buildingFunction.outputs, outputAmounts, pollution ?? 0, multiplier, pointAtResources ?? false));

  return functionBlock;
}

// The name of the function goes on the left of the header row and its pool on the right, and a
// starved function is marked so right after its name.
function createFunctionHeader(name: string | undefined, starved: boolean, pool: FunctionPool | undefined): HTMLElement {
  const functionHeader = document.createElement("div");
  functionHeader.className = "bf-function-header";

  if (name) {
    const functionName = document.createElement("div");
    functionName.className = "bf-function-name";
    functionName.textContent = name;
    functionHeader.appendChild(functionName);
  }

  if (starved) {
    const starvationWarning = document.createElement("span");
    starvationWarning.className = "bf-function-warning";
    starvationWarning.textContent = "⚠️ Starved";
    functionHeader.appendChild(starvationWarning);
  }

  if (pool) {
    functionHeader.appendChild(createPoolWidget(pool));
  }

  return functionHeader;
}

// A circle for every time over the function is done, filled, then an empty one for every share of
// the pool no function draws on yet, so every function of the building shows the same empty ones.
// Clicking a circle has the function done as many times over as the circle's place in the row, and
// a function done at all can be stopped altogether by the cross before the circles.
function createPoolWidget({ multiplier, unusedPool, onSetMultiplier }: FunctionPool): HTMLElement {
  const poolWidget = document.createElement("div");
  poolWidget.className = "bf-pool";

  if (multiplier > 0) {
    poolWidget.appendChild(createPoolButton("bf-pool-clear", xMarkIcon, onSetMultiplier && (() => onSetMultiplier(0))));
  }

  const circles = document.createElement("div");
  circles.className = "bf-pool-circles";
  for (let circleIndex = 0; circleIndex < multiplier + unusedPool; circleIndex++) {
    const used = circleIndex < multiplier;
    circles.appendChild(createPoolButton(
      used ? "bf-pool-used" : "bf-pool-unused",
      used ? poolUsedIcon : poolUnusedIcon,
      onSetMultiplier && (() => onSetMultiplier(circleIndex + 1)),
    ));
  }
  poolWidget.appendChild(circles);

  return poolWidget;
}

function createPoolButton(className: string, icon: string, onClick: (() => void) | undefined): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `bf-pool-button ${className}`;
  button.innerHTML = icon;
  if (onClick) {
    button.addEventListener("click", onClick);
  } else {
    button.disabled = true;
  }
  return button;
}

function createInputsTable(inputs: ResourceThroughput[], multiplier: number, pointAtResources: boolean): HTMLElement {
  const table = document.createElement("div");
  table.className = "bf-inputs-table";

  for (const input of inputs) {
    const row = document.createElement("div");
    row.className = "bf-inputs-row";
    if (pointAtResources) makeResourceRowPointable(row, input.name);

    const icon = getResourceIcon(input.name);
    const resourceCell = document.createElement("div");
    resourceCell.className = "bf-inputs-cell";
    resourceCell.textContent = `${input.name} ${icon ?? ""}`;
    row.appendChild(resourceCell);

    const amountCell = document.createElement("div");
    amountCell.className = "bf-inputs-cell bf-inputs-amount";
    amountCell.textContent = multipliedAmountText(input.value, multiplier);
    row.appendChild(amountCell);

    table.appendChild(row);
  }

  return table;
}

function createOutputColumn(outputs: BuildingFunctionOutput[], outputAmounts: ResourceThroughput[] | undefined, pollution: number, multiplier: number, pointAtResources: boolean): HTMLElement {
  const table = document.createElement("div");
  table.className = "bf-outputs-table";

  for (const output of outputs) {
    const row = document.createElement("div");
    row.className = "bf-outputs-row";
    if (pointAtResources) makeResourceRowPointable(row, output.name);

    const resourceCell = document.createElement("div");
    resourceCell.className = "bf-outputs-cell";
    const icon = getResourceIcon(output.name);
    resourceCell.textContent = `${output.name} ${icon ?? ""}`;
    row.appendChild(resourceCell);

    const amountCell = document.createElement("div");
    amountCell.className = "bf-outputs-cell bf-outputs-amount";
    amountCell.textContent = outputAmountText(output, outputAmounts, pollution, multiplier);
    row.appendChild(amountCell);

    table.appendChild(row);

    if (output.locationProperty !== undefined) {
      table.appendChild(createOutputPropertyRow(output.locationProperty, output.locationPropertyDivisor));
    }
  }

  return table;
}

function makeResourceRowPointable(row: HTMLElement, resourceName: string) {
  row.classList.add("bf-resource-row-pointable");
  pointAtResourceWhileHovered(row, resourceName, true);
}

// An output pollution has cut down is shown as what is left of it beside what the building makes
// on clean ground, with a warning, so the player sees what the pollution costs them.
function outputAmountText(output: BuildingFunctionOutput, outputAmounts: ResourceThroughput[] | undefined, pollution: number, multiplier: number): string {
  const outputAmount = findOutputAmount(output, outputAmounts);
  if (outputAmount === undefined) return "";
  const amountText = multipliedAmountText(outputAmount, multiplier);
  if (!isOutputAffectedByPollution(output, pollution)) return amountText;
  return `${amountText} / ${formatNumber(output.value ?? 0)} ⚠️`;
}

// The amount of an output named after a location property is the property's value on the
// building's location, so an output is left without an amount until the building stands
// somewhere.
function findOutputAmount(output: BuildingFunctionOutput, outputAmounts?: ResourceThroughput[]): number | undefined {
  const placedAmount = outputAmounts?.find(outputAmount => outputAmount.name === output.name);
  return placedAmount ? placedAmount.value : output.value;
}

// A function done several times over consumes and produces as much over, which is shown beside the
// amount it is written with, so the player sees both what it does and what one of it does.
function multipliedAmountText(amount: number, multiplier: number): string {
  if (multiplier <= 1) return formatNumber(amount);
  return `${formatNumber(amount * multiplier)} (${formatNumber(amount)})`;
}

// The location property an output is named after is shown under that output, indented, so it
// reads as belonging to the output above it. An output producing only a fraction of the property
// has that fraction marked after the property.
function createOutputPropertyRow(locationProperty: string, locationPropertyDivisor: number | undefined): HTMLElement {
  const propertyRow = document.createElement("div");
  propertyRow.className = "bf-output-property";

  const propertyName = document.createElement("span");
  propertyName.textContent = locationProperty;
  propertyRow.appendChild(propertyName);

  const propertyDefinition = propertyDefinitions.find(definition => definition.name === locationProperty);
  if (propertyDefinition) {
    const swatch = document.createElement("span");
    swatch.className = "bf-output-property-swatch";
    swatch.style.backgroundColor = propertyDefinition.color;
    propertyRow.appendChild(swatch);
  }

  if (locationPropertyDivisor !== undefined) {
    const fraction = document.createElement("span");
    fraction.className = "bf-output-property-fraction";
    fraction.textContent = `/${locationPropertyDivisor}`;
    propertyRow.appendChild(fraction);
  }

  return propertyRow;
}
