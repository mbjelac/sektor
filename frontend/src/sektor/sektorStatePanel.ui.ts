import { type SektorState } from "./Sektor";
import { scoreColor } from "../score";
import { findThroughputValue, ImportsAndExports, listedResourceNames } from "../globalImportsAndExports";
import { currentResourceScore, currentScore } from "../currentScore";
import { getNegativeScoringResources } from "../resources";
import { arrowDownTrayIcon, arrowUpTrayIcon, starIcon } from "../icons";
import { formatNumber } from "../formatNumber";
import { resourceNameText, throughputText } from "../throughputDisplay.ui";

let panelEl: HTMLElement | null = null;
let importHoverCallback: ((resourceType: string | null) => void) | null = null;

export function onImportHover(callback: (resourceType: string | null) => void) {
  importHoverCallback = callback;
}

// What this sektor brings in and sends out, and what each of those is worth as things stand on the
// planet. Nothing here is worth anything in itself: a resource is worth what moving it does for the
// planet, which is why what the planet brings in and sends out is shown alongside.
export function updateSektorStatePanel(sektorState: SektorState, planetImportsAndExports: ImportsAndExports) {
  ensurePanel();

  panelEl!.innerHTML = "";

  panelEl!.appendChild(createTitle());
  panelEl!.appendChild(createResourceList(sektorState, planetImportsAndExports));
}

// Named for the sektor it belongs to, against the planet's own imports and exports which the
// player can call up beside it.
function createTitle(): HTMLElement {
  const title = document.createElement("div");
  title.className = "panel-title";
  title.textContent = "Imports & Exports, Local";
  return title;
}

function ensurePanel() {
  if (panelEl) return;

  panelEl = document.createElement("div");
  panelEl.id = "sektor-state-panel";
  document.getElementById("right-panels")!.appendChild(panelEl);
}

function createResourceList(sektorState: SektorState, planetImportsAndExports: ImportsAndExports): HTMLElement {
  const list = document.createElement("div");
  list.className = "ss-list";

  list.appendChild(createHeaderRow());

  for (const resourceName of listedResourceNames(sektorState)) {
    list.appendChild(createResourceRow(resourceName, sektorState, planetImportsAndExports));
  }

  list.appendChild(createTotalScoreRow(sektorState, planetImportsAndExports));

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

function createResourceRow(
  resourceName: string,
  sektorState: SektorState,
  planetImportsAndExports: ImportsAndExports,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "ss-row";
  row.addEventListener("mouseenter", () => importHoverCallback?.(resourceName));
  row.addEventListener("mouseleave", () => importHoverCallback?.(null));

  const nameCell = document.createElement("span");
  nameCell.className = "ss-cell-resource";
  nameCell.textContent = resourceNameText(resourceName);
  row.appendChild(nameCell);

  row.appendChild(createValueCell(findThroughputValue(sektorState.imports, resourceName)));
  row.appendChild(createValueCell(findThroughputValue(sektorState.exports, resourceName)));
  row.appendChild(createScoreCell(
    currentResourceScore(resourceName, sektorState, planetImportsAndExports, getNegativeScoringResources()),
    "ss-cell-score",
  ));

  return row;
}

function createTotalScoreRow(sektorState: SektorState, planetImportsAndExports: ImportsAndExports): HTMLElement {
  const row = document.createElement("div");
  row.className = "ss-row ss-total";

  row.appendChild(document.createElement("span"));
  row.appendChild(document.createElement("span"));
  row.appendChild(document.createElement("span"));
  row.appendChild(createScoreCell(
    currentScore(sektorState, planetImportsAndExports, getNegativeScoringResources()),
    "ss-cell-score ss-total-score",
  ));

  return row;
}

function createScoreCell(score: number, className: string): HTMLElement {
  const cell = document.createElement("span");
  cell.className = className;
  cell.textContent = formatNumber(score);
  cell.style.color = scoreColor(score);
  return cell;
}

function createValueCell(value: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "ss-cell-value";
  cell.textContent = throughputText(value);
  return cell;
}
