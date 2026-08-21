
import { getResourceIcon } from "../resources";
import { BuildingFunction, ResourceThroughput } from "./buildings/parseBuildingDefinitions";
import { arrowRightIcon } from "../icons";

export function createFunctionDisplay({ buildingFunction, modifiedOutputs }: {
  buildingFunction: BuildingFunction,
  modifiedOutputs?: ResourceThroughput[],
}): HTMLElement {
  const functionDisplay = document.createElement("div");
  functionDisplay.className = "bf-function";

  functionDisplay.appendChild(createInputsTable(buildingFunction.inputs));

  const arrowEl = document.createElement("div");
  arrowEl.className = "bf-arrow";
  arrowEl.innerHTML = arrowRightIcon;
  functionDisplay.appendChild(arrowEl);

  functionDisplay.appendChild(createOutputColumn(buildingFunction.outputs, modifiedOutputs));

  return functionDisplay;
}

function createInputsTable(inputs: ResourceThroughput[]): HTMLElement {
  const table = document.createElement("div");
  table.className = "bf-inputs-table";

  const headerRow = document.createElement("div");
  headerRow.className = "bf-inputs-row bf-inputs-header";

  const resourceHeader = document.createElement("div");
  resourceHeader.className = "bf-inputs-cell";
  resourceHeader.textContent = "Inputs";
  headerRow.appendChild(resourceHeader);

  const amountHeader = document.createElement("div");
  amountHeader.className = "bf-inputs-cell";
  headerRow.appendChild(amountHeader);

  table.appendChild(headerRow);

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
    amountCell.textContent = `${input.value}`;
    row.appendChild(amountCell);

    table.appendChild(row);
  }

  return table;
}

function createOutputColumn(outputs: ResourceThroughput[], modifiedOutputs?: ResourceThroughput[]): HTMLElement {
  const table = document.createElement("div");
  table.className = "bf-outputs-table";

  const headerRow = document.createElement("div");
  headerRow.className = "bf-outputs-row bf-outputs-header";

  const resourceHeader = document.createElement("div");
  resourceHeader.className = "bf-outputs-cell";
  resourceHeader.textContent = "Outputs";
  headerRow.appendChild(resourceHeader);

  const amountHeader = document.createElement("div");
  amountHeader.className = "bf-outputs-cell";
  headerRow.appendChild(amountHeader);

  table.appendChild(headerRow);

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
    const modifiedOutput = modifiedOutputs?.find(modifiedOutput => modifiedOutput.name === output.name);
    if (modifiedOutput && modifiedOutput.value !== output.value) {
      const modifiedValue = document.createElement("span");
      modifiedValue.textContent = `${modifiedOutput.value}`;
      modifiedValue.className = modifiedOutput.value > output.value ? "bf-output-boosted" : "bf-output-reduced";
      amountCell.append(modifiedValue, ` (${output.value})`);
    } else {
      amountCell.textContent = `${output.value}`;
    }
    row.appendChild(amountCell);

    table.appendChild(row);
  }

  return table;
}
