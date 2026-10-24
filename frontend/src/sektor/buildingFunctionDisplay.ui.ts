
import { getResourceIcon } from "../resources";
import { BuildingFunction, BuildingFunctionOutput, ResourceThroughput } from "./buildings/parseBuildingDefinitions";
import { exclamationTriangleSolidIcon } from "../icons";
import { formatNumber } from "../formatNumber";
import { propertyDefinitions } from "../properties";
import { isOutputAffectedByPollution } from "./pollution";

// Only a building with several functions can have them turned on and off, so a function shown
// without an activation gets no activity label. A function which is only being looked at, not
// played, gets the label without a toggle to change it by.
// A building which is not on the map yet stands on no location, so it is shown without output
// amounts, which only a location it stands on can decide, and without the pollution of one.
// A function of a disabled building consumes and produces nothing, so every amount of it is shown
// as nothing beside what it would be.
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

export function createFunctionDisplay({ buildingFunction, outputAmounts, pollution, activation, starved, disabled }: {
  buildingFunction: BuildingFunction,
  outputAmounts?: ResourceThroughput[],
  pollution?: number,
  activation?: { active: boolean, onToggle?: () => void },
  starved?: boolean,
  disabled?: boolean,
}): HTMLElement {
  const functionBlock = document.createElement("div");
  functionBlock.className = "bf-function-block";
  if (activation && !activation.active) {
    functionBlock.classList.add("bf-function-inactive");
  }

  if (buildingFunction.name || activation || starved) {
    functionBlock.appendChild(createFunctionHeader(buildingFunction.name, activation, starved));
  }

  const functionDisplay = document.createElement("div");
  functionDisplay.className = "bf-function";
  functionBlock.appendChild(functionDisplay);

  functionDisplay.appendChild(createInputsTable(buildingFunction.inputs, disabled ?? false));

  functionDisplay.appendChild(createOutputColumn(buildingFunction.outputs, outputAmounts, pollution ?? 0, disabled ?? false));

  return functionBlock;
}

// The name of the function goes on the left of the header row and its activity on the right, so
// a function is labelled and switched on the same line it starts with. A function going without
// a local resource is warned about beside its name.
function createFunctionHeader(name: string | undefined, activation?: { active: boolean, onToggle?: () => void }, starved?: boolean): HTMLElement {
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
    starvationWarning.title = "Not enough of a local resource";
    starvationWarning.innerHTML = exclamationTriangleSolidIcon;
    functionHeader.appendChild(starvationWarning);
  }

  if (activation) {
    functionHeader.appendChild(createActivityRow(activation));
  }

  return functionHeader;
}

function createActivityRow({ active, onToggle }: { active: boolean, onToggle?: () => void }): HTMLElement {
  const activityRow = document.createElement("div");
  activityRow.className = "bf-activity";

  const activityLabel = document.createElement("span");
  activityLabel.className = "bf-activity-label";
  activityLabel.textContent = active ? "Active" : "Inactive";
  activityRow.appendChild(activityLabel);

  if (!onToggle) return activityRow;

  const toggle = document.createElement("button");
  toggle.className = active ? "bf-toggle bf-toggle-on" : "bf-toggle";
  toggle.type = "button";
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-checked", String(active));
  toggle.addEventListener("click", onToggle);

  const toggleKnob = document.createElement("span");
  toggleKnob.className = "bf-toggle-knob";
  toggle.appendChild(toggleKnob);

  activityRow.appendChild(toggle);

  return activityRow;
}

function createInputsTable(inputs: ResourceThroughput[], disabled: boolean): HTMLElement {
  const table = document.createElement("div");
  table.className = "bf-inputs-table";

  for (const input of inputs) {
    const row = document.createElement("div");
    row.className = "bf-inputs-row";

    const icon = getResourceIcon(input.name);
    const resourceCell = document.createElement("div");
    resourceCell.className = "bf-inputs-cell";
    resourceCell.textContent = `${input.name} ${icon ?? ""}`;
    row.appendChild(resourceCell);

    const amountCell = document.createElement("div");
    amountCell.className = "bf-inputs-cell bf-inputs-amount";
    amountCell.textContent = disabled ? disabledAmountText(formatNumber(input.value)) : formatNumber(input.value);
    row.appendChild(amountCell);

    table.appendChild(row);
  }

  return table;
}

function createOutputColumn(outputs: BuildingFunctionOutput[], outputAmounts: ResourceThroughput[] | undefined, pollution: number, disabled: boolean): HTMLElement {
  const table = document.createElement("div");
  table.className = "bf-outputs-table";

  for (const output of outputs) {
    const row = document.createElement("div");
    row.className = "bf-outputs-row";

    const resourceCell = document.createElement("div");
    resourceCell.className = "bf-outputs-cell";
    const icon = getResourceIcon(output.name);
    resourceCell.textContent = `${output.name} ${icon ?? ""}`;
    row.appendChild(resourceCell);

    const amountCell = document.createElement("div");
    amountCell.className = "bf-outputs-cell bf-outputs-amount";
    amountCell.textContent = disabled
      ? disabledAmountText(findOutputAmount(output, outputAmounts))
      : outputAmountText(output, outputAmounts, pollution);
    row.appendChild(amountCell);

    table.appendChild(row);

    if (output.locationProperty !== undefined) {
      table.appendChild(createOutputPropertyRow(output.locationProperty, output.locationPropertyDivisor));
    }
  }

  return table;
}

function disabledAmountText(amount: string): string {
  return `0 / ${amount}`;
}

// An output pollution has cut down is shown as what is left of it beside what the building makes
// on clean ground, with a warning, so the player sees what the pollution costs them.
function outputAmountText(output: BuildingFunctionOutput, outputAmounts: ResourceThroughput[] | undefined, pollution: number): string {
  const outputAmount = findOutputAmount(output, outputAmounts);
  if (!isOutputAffectedByPollution(output, pollution)) return outputAmount;
  return `${outputAmount} / ${formatNumber(output.value ?? 0)} ⚠️`;
}

// The amount of an output named after a location property is the property's value on the
// building's location, so an output is left without an amount until the building stands
// somewhere.
function findOutputAmount(output: BuildingFunctionOutput, outputAmounts?: ResourceThroughput[]): string {
  if (outputAmounts) {
    const outputAmount = outputAmounts.find(outputAmount => outputAmount.name === output.name);
    if (outputAmount) return formatNumber(outputAmount.value);
  }
  return output.value === undefined ? "" : formatNumber(output.value);
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
