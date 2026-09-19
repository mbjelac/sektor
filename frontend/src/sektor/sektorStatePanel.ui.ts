import { type ScoredThroughput, type SektorState } from "./Sektor";
import { scoreColor } from "../score";
import { arrowDownTrayIcon, arrowUpTrayIcon, starIcon } from "../icons";
import { formatNumber } from "../formatNumber";
import { findThroughputValue, listedResourceNames, resourceNameText, throughputText } from "../throughputDisplay.ui";

let panelEl: HTMLElement | null = null;
let importHoverCallback: ((resourceType: string | null) => void) | null = null;

export function onImportHover(callback: (resourceType: string | null) => void) {
  importHoverCallback = callback;
}

export function updateSektorStatePanel(sektorState: SektorState) {
  ensurePanel();

  panelEl!.innerHTML = "";

  panelEl!.appendChild(createResourceList(sektorState));
}

function ensurePanel() {
  if (panelEl) return;

  panelEl = document.createElement("div");
  panelEl.id = "sektor-state-panel";
  document.getElementById("right-panels")!.appendChild(panelEl);
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

  const row = document.createElement("div");
  row.className = "ss-row";
  row.addEventListener("mouseenter", () => importHoverCallback?.(resourceName));
  row.addEventListener("mouseleave", () => importHoverCallback?.(null));

  const nameCell = document.createElement("span");
  nameCell.className = "ss-cell-resource";
  nameCell.textContent = resourceNameText(resourceName);
  row.appendChild(nameCell);

  row.appendChild(createValueCell(importValue));
  row.appendChild(createValueCell(exportValue));

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

function createValueCell(value: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "ss-cell-value";
  cell.textContent = throughputText(value);
  return cell;
}
