import { type ScoredThroughput, type SektorState } from "./Sektor";
import { getResourceIcon } from "../resources";
import { scoreColor } from "../score";
import { ResourceThroughput } from "../../../shared/sektorData";
import { arrowDownTrayIcon, arrowUpTrayIcon, exclamationTriangleIcon, checkCircleIcon, starIcon } from "../icons";
import { formatNumber } from "../formatNumber";

const LESS_OR_EQUAL = "≤";
const GREATER_OR_EQUAL = "≥";

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
  panelEl!.appendChild(createResourceList(sektorState));

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

function createResourceList(sektorState: SektorState): HTMLElement {
  const list = document.createElement("div");
  list.className = "ss-list";

  list.appendChild(createHeaderRow());

  for (const resourceName of listedResourceNames(sektorState)) {
    list.appendChild(createResourceRow(resourceName, sektorState));
  }

  list.appendChild(createTotalScoreRow(sektorState));

  return list;
}

function createHeaderRow(): HTMLElement {
  const headerRow = document.createElement("div");
  headerRow.className = "ss-row ss-header";

  const resourceHeader = document.createElement("span");
  resourceHeader.className = "ss-cell-resource";
  resourceHeader.textContent = "Resource";
  headerRow.appendChild(resourceHeader);

  const importHeader = document.createElement("span");
  importHeader.className = "ss-cell-value";
  importHeader.innerHTML = arrowDownTrayIcon;
  importHeader.title = "Imported";
  headerRow.appendChild(importHeader);

  const exportHeader = document.createElement("span");
  exportHeader.className = "ss-cell-value";
  exportHeader.innerHTML = arrowUpTrayIcon;
  exportHeader.title = "Exported";
  headerRow.appendChild(exportHeader);

  const limitHeader = document.createElement("span");
  limitHeader.className = "ss-cell-limit";
  limitHeader.innerHTML = exclamationTriangleIcon;
  limitHeader.title = "Restrictions and requirements";
  headerRow.appendChild(limitHeader);

  const scoreHeader = document.createElement("span");
  scoreHeader.className = "ss-cell-score";
  scoreHeader.innerHTML = starIcon;
  scoreHeader.title = "Score";
  headerRow.appendChild(scoreHeader);

  return headerRow;
}

function createResourceRow(resourceName: string, sektorState: SektorState): HTMLElement {
  const importValue = findThroughputValue(sektorState.imports, resourceName);
  const exportValue = findThroughputValue(sektorState.exports, resourceName);
  const restriction = sektorState.importRestrictions.find(restriction => restriction.name === resourceName);
  const requirement = sektorState.exportRequirements.find(requirement => requirement.name === resourceName);

  const row = document.createElement("div");
  row.className = "ss-row";
  row.addEventListener("mouseenter", () => importHoverCallback?.(resourceName));
  row.addEventListener("mouseleave", () => importHoverCallback?.(null));

  const nameCell = document.createElement("span");
  nameCell.className = "ss-cell-resource";
  const icon = getResourceIcon(resourceName);
  nameCell.textContent = `${resourceName} ${icon ?? ""}`;
  row.appendChild(nameCell);

  row.appendChild(createImportCell(importValue, restriction));
  row.appendChild(createExportCell(exportValue, requirement));

  const limitCell = document.createElement("span");
  limitCell.className = "ss-cell-limit";
  limitCell.textContent = limitText(restriction, requirement);
  row.appendChild(limitCell);

  const score = resourceScore(resourceName, sektorState);
  const scoreCell = document.createElement("span");
  scoreCell.className = "ss-cell-score";
  scoreCell.textContent = formatNumber(score);
  scoreCell.style.color = scoreColor(score);
  row.appendChild(scoreCell);

  return row;
}

function resourceScore(resourceName: string, sektorState: SektorState): number {
  return findThroughputScore(sektorState.imports, resourceName) + findThroughputScore(sektorState.exports, resourceName);
}

function findThroughputScore(throughputs: ScoredThroughput[], resourceName: string): number {
  return throughputs.find(throughput => throughput.name === resourceName)?.score ?? 0;
}

function createTotalScoreRow(sektorState: SektorState): HTMLElement {
  const row = document.createElement("div");
  row.className = "ss-row ss-total";

  row.appendChild(document.createElement("span"));
  row.appendChild(document.createElement("span"));
  row.appendChild(document.createElement("span"));
  row.appendChild(document.createElement("span"));

  const score = totalScore(sektorState);
  const totalScoreCell = document.createElement("span");
  totalScoreCell.className = "ss-cell-score ss-total-score";
  totalScoreCell.textContent = formatNumber(score);
  totalScoreCell.style.color = scoreColor(score);
  row.appendChild(totalScoreCell);

  return row;
}

function totalScore(sektorState: SektorState): number {
  return [...sektorState.imports, ...sektorState.exports]
    .reduce((total, throughput) => total + throughput.score, 0);
}

function createImportCell(importValue: number, restriction: ResourceThroughput | undefined): HTMLElement {
  const importCell = document.createElement("span");
  importCell.className = "ss-cell-value";

  if (restriction === undefined) {
    importCell.textContent = importValue !== 0 ? formatNumber(importValue) : "";
    return importCell;
  }

  if (importValue === 0) {
    importCell.innerHTML = checkCircleIcon;
  } else {
    importCell.textContent = formatNumber(importValue);
  }
  importCell.classList.add(importValue <= restriction.value ? "ss-met" : "ss-exceeded");

  return importCell;
}

function createExportCell(exportValue: number, requirement: ResourceThroughput | undefined): HTMLElement {
  const exportCell = document.createElement("span");
  exportCell.className = "ss-cell-value";

  if (requirement === undefined) {
    exportCell.textContent = exportValue !== 0 ? formatNumber(exportValue) : "";
    return exportCell;
  }

  exportCell.textContent = formatNumber(exportValue);
  exportCell.classList.add(exportValue >= requirement.value ? "ss-met" : "ss-exceeded");

  return exportCell;
}

function limitText(restriction: ResourceThroughput | undefined, requirement: ResourceThroughput | undefined): string {
  const limits: string[] = [];
  if (restriction !== undefined) limits.push(`${LESS_OR_EQUAL} ${formatNumber(restriction.value)}`);
  if (requirement !== undefined) limits.push(`${GREATER_OR_EQUAL} ${formatNumber(requirement.value)}`);
  return limits.join(" ");
}

function listedResourceNames(sektorState: SektorState): string[] {
  const resourceNames = new Set<string>();
  for (const throughput of [...sektorState.imports, ...sektorState.exports]) {
    if (throughput.value !== 0) resourceNames.add(throughput.name);
  }
  for (const threshold of [...sektorState.importRestrictions, ...sektorState.exportRequirements]) {
    resourceNames.add(threshold.name);
  }
  return Array.from(resourceNames).sort((first, second) => first.localeCompare(second));
}

function findThroughputValue(throughputs: ResourceThroughput[], resourceName: string): number {
  return throughputs.find(throughput => throughput.name === resourceName)?.value ?? 0;
}
