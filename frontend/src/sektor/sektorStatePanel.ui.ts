import { type SektorState } from "./Sektor";
import { getResourceIcon } from "../resources";
import { ResourceThroughput } from "../../../shared/sektorData";
import { arrowDownTrayIcon, arrowUpTrayIcon, exclamationTriangleIcon, checkCircleIcon } from "../icons";

let panelEl: HTMLElement | null = null;
let importHoverCallback: ((resourceType: string | null) => void) | null = null;
let leaveCallback: (() => void) | null = null;
let previousStatus: SektorState["status"] | null = null;

export function onImportHover(callback: (resourceType: string | null) => void) {
  importHoverCallback = callback;
}

export function onLeave(callback: () => void) {
  leaveCallback = callback;
}

export function updateSektorStatePanel(sektorState: SektorState) {
  ensurePanel();

  panelEl!.innerHTML = "";

  panelEl!.appendChild(createStatusRow(sektorState.status));

  const columns = document.createElement("div");
  columns.className = "ss-columns";
  columns.appendChild(createImportColumn(sektorState.imports, sektorState.importRestrictions));
  columns.appendChild(createExportColumn(sektorState.exports, sektorState.exportRequirements));
  panelEl!.appendChild(columns);

  if (leaveCallback) {
    const leaveButton = document.createElement("button");
    leaveButton.className = "ss-leave";
    leaveButton.textContent = "Leave";
    leaveButton.addEventListener("click", () => leaveCallback!());
    panelEl!.appendChild(leaveButton);
  }

  if (previousStatus !== null && previousStatus !== sektorState.status) {
    flashPanel(sektorState.status);
  }
  previousStatus = sektorState.status;
}

function flashPanel(status: SektorState["status"]) {
  const flashColor = status === "Done" ? "var(--color-good)" : status === "RestrictionsExceeded" ? "var(--color-bad)" : "var(--color-neutral)";
  panelEl!.style.setProperty("--ss-flash-color", flashColor);
  panelEl!.classList.remove("ss-flash");
  void panelEl!.offsetWidth;
  panelEl!.classList.add("ss-flash");
}

function createStatusRow(status: SektorState["status"]): HTMLElement {
  const row = document.createElement("div");
  row.className = "ss-status";

  const label = document.createElement("span");
  label.textContent = "Status: ";
  row.appendChild(label);

  const value = document.createElement("span");
  if (status === "InProgress") {
    value.textContent = "In progress";
    value.style.color = "var(--color-neutral)";
  } else if (status === "Done") {
    value.textContent = "Done";
    value.style.color = "var(--color-good)";
    value.style.fontWeight = "bold";
  } else {
    value.textContent = "Restrictions exceeded";
    value.style.color = "var(--color-bad)";
    value.style.fontWeight = "bold";
  }
  row.appendChild(value);

  return row;
}

function ensurePanel() {
  if (panelEl) return;

  panelEl = document.createElement("div");
  panelEl.id = "sektor-state-panel";
  document.getElementById("canvas-container")!.appendChild(panelEl);
}

function createImportColumn(imports: ResourceThroughput[], restrictions: ResourceThroughput[]): HTMLElement {
  const col = document.createElement("div");
  col.className = "ss-col";

  const header = document.createElement("div");
  header.className = "ss-header";

  const resourceHeader = document.createElement("span");
  resourceHeader.className = "ss-header-resource";
  resourceHeader.textContent = "Imports";
  header.appendChild(resourceHeader);

  const importHeader = document.createElement("span");
  importHeader.className = "ss-header-value";
  importHeader.innerHTML = arrowDownTrayIcon;
  importHeader.title = "Amount imported";
  header.appendChild(importHeader);

  if (restrictions.length > 0) {
    const restrictionHeader = document.createElement("span");
    restrictionHeader.className = "ss-header-value";
    restrictionHeader.innerHTML = exclamationTriangleIcon;
    restrictionHeader.title = "Maximum";
    header.appendChild(restrictionHeader);
  }

  col.appendChild(header);

  const resourceNames = mergedResourceNames(imports, restrictions);

  for (const name of resourceNames) {
    const importValue = imports.find(item => item.name === name)?.value ?? 0;
    const restriction = restrictions.find(item => item.name === name);

    const row = document.createElement("div");
    row.className = "ss-row ss-import-row";
    row.addEventListener("mouseenter", () => importHoverCallback?.(name));
    row.addEventListener("mouseleave", () => importHoverCallback?.(null));

    const nameCell = document.createElement("span");
    nameCell.className = "ss-cell-resource";
    const icon = getResourceIcon(name);
    nameCell.textContent = `${name} ${icon ?? ""}`;
    row.appendChild(nameCell);

    const valueCell = document.createElement("span");
    valueCell.className = "ss-cell-value";
    valueCell.textContent = `${importValue}`;
    if (restriction !== undefined && importValue > restriction.value) {
      valueCell.classList.add("ss-exceeded");
    }
    row.appendChild(valueCell);

    if (restrictions.length > 0) {
      const restrictionCell = document.createElement("span");
      restrictionCell.className = "ss-cell-value";
      restrictionCell.textContent = restriction !== undefined ? `${restriction.value}` : "";
      row.appendChild(restrictionCell);
    }

    col.appendChild(row);
  }

  return col;
}

function createExportColumn(exports: ResourceThroughput[], requirements: ResourceThroughput[]): HTMLElement {
  const col = document.createElement("div");
  col.className = "ss-col";

  const header = document.createElement("div");
  header.className = "ss-header";

  const resourceHeader = document.createElement("span");
  resourceHeader.className = "ss-header-resource";
  resourceHeader.textContent = "Exports";
  header.appendChild(resourceHeader);

  const exportHeader = document.createElement("span");
  exportHeader.className = "ss-header-value";
  exportHeader.innerHTML = arrowUpTrayIcon;
  exportHeader.title = "Amount exported";
  header.appendChild(exportHeader);

  if (requirements.length > 0) {
    const requirementHeader = document.createElement("span");
    requirementHeader.className = "ss-header-value";
    requirementHeader.innerHTML = checkCircleIcon;
    requirementHeader.title = "Minimum";
    header.appendChild(requirementHeader);
  }

  col.appendChild(header);

  const resourceNames = mergedResourceNames(exports, requirements);

  for (const name of resourceNames) {
    const exportValue = exports.find(item => item.name === name)?.value ?? 0;
    const requirement = requirements.find(item => item.name === name);

    const row = document.createElement("div");
    row.className = "ss-row";

    const nameCell = document.createElement("span");
    nameCell.className = "ss-cell-resource";
    const icon = getResourceIcon(name);
    nameCell.textContent = `${name} ${icon ?? ""}`;
    row.appendChild(nameCell);

    const valueCell = document.createElement("span");
    valueCell.className = "ss-cell-value";
    valueCell.textContent = `${exportValue}`;
    if (requirement !== undefined && exportValue >= requirement.value) {
      valueCell.classList.add("ss-met");
    }
    row.appendChild(valueCell);

    if (requirements.length > 0) {
      const requirementCell = document.createElement("span");
      requirementCell.className = "ss-cell-value";
      requirementCell.textContent = requirement !== undefined ? `${requirement.value}` : "";
      row.appendChild(requirementCell);
    }

    col.appendChild(row);
  }

  return col;
}

function mergedResourceNames(values: ResourceThroughput[], thresholds: ResourceThroughput[]): string[] {
  const names = new Set<string>();
  for (const item of values) {
    if (item.value !== 0) names.add(item.name);
  }
  for (const item of thresholds) {
    names.add(item.name);
  }
  return Array.from(names).sort((first, second) => first.localeCompare(second));
}

