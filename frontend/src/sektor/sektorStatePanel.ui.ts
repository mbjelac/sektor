import { type SektorState } from "./Sektor";
import {
  findThroughputValue,
  ImportsAndExports,
  listedResourceNames,
  ResourceSortOrder,
  sortResourceNames,
} from "../globalImportsAndExports";
import { arrowDownTrayIcon, arrowUpTrayIcon, globeAltIcon } from "../icons";
import { showGlobalStateDialog } from "../globalStateDialog.ui";
import { formatNumber } from "../formatNumber";
import { resourceNameText, throughputText } from "../throughputDisplay.ui";
import { pointAtResourceWhileHovered } from "../resourceHover.ui";

let panelEl: HTMLElement | null = null;
// Which column the sektor's resources are put in order by, kept while the player builds on, until
// they ask for another. It begins with the order their names put them in.
let sortOrder: ResourceSortOrder = "resource";

// What this sektor brings in and sends out, with what the whole planet brings in and sends out a
// click away.
export function updateSektorStatePanel(sektorState: SektorState, planetImportsAndExports: ImportsAndExports) {
  ensurePanel();

  panelEl!.innerHTML = "";

  panelEl!.appendChild(createTitle(planetImportsAndExports));
  panelEl!.appendChild(createResourceList(sektorState, () => updateSektorStatePanel(sektorState, planetImportsAndExports)));
}

// What this sektor moves stands under the name of the panel, and the globe at the end of the same
// row calls up what the whole planet moves.
function createTitle(planetImportsAndExports: ImportsAndExports): HTMLElement {
  const title = document.createElement("div");
  title.className = "panel-title sektor-state-title";

  const titleText = document.createElement("span");
  titleText.textContent = "Imports/Exports";
  title.appendChild(titleText);

  title.appendChild(createGlobeButton(planetImportsAndExports));

  return title;
}

function createGlobeButton(planetImportsAndExports: ImportsAndExports): HTMLElement {
  const globeButton = document.createElement("button");
  globeButton.id = "global-state-button";
  globeButton.className = "sektor-state-globe";
  globeButton.title = "Imports & exports of the whole planet";
  globeButton.innerHTML = globeAltIcon;
  globeButton.addEventListener("click", () => showGlobalStateDialog(planetImportsAndExports));
  return globeButton;
}

function ensurePanel() {
  if (panelEl) return;

  panelEl = document.createElement("div");
  panelEl.id = "sektor-state-panel";
  document.getElementById("right-panels")!.appendChild(panelEl);
}

// Every resource the sektor moves, or would move were nothing cut down, in the order of what it
// actually moves.
function createResourceList(sektorState: SektorState, onSorted: () => void): HTMLElement {
  const list = document.createElement("div");
  list.className = "ss-list";

  list.appendChild(createHeaderRow(onSorted));

  const resourceNames = listedResourceNames({
    imports: [...sektorState.imports, ...sektorState.uncroppedImports],
    exports: [...sektorState.exports, ...sektorState.uncroppedExports],
  });
  for (const resourceName of sortResourceNames(resourceNames, sektorState, sortOrder)) {
    list.appendChild(createResourceRow(resourceName, sektorState));
  }

  list.appendChild(createTotalRow(sektorState));

  return list;
}

// Every column name is clicked to put the resources in the order of that column, as in the list of
// the whole planet, and the column they stand in the order of is named in white.
function createHeaderRow(onSorted: () => void): HTMLElement {
  const headerRow = document.createElement("div");
  headerRow.className = "ss-row ss-header";

  headerRow.appendChild(createSortButton("resource", "Resource", "ss-cell-resource", onSorted));
  headerRow.appendChild(createSortButton("imported", arrowDownTrayIcon, "ss-cell-value", onSorted, "Imported"));
  headerRow.appendChild(createSortButton("exported", arrowUpTrayIcon, "ss-cell-value", onSorted, "Exported"));

  return headerRow;
}

// A column is named by a picture where a word would not fit, and then carries the word it stands for
// to be read on hovering it.
function createSortButton(
  columnSortOrder: ResourceSortOrder,
  nameOrIcon: string,
  className: string,
  onSorted: () => void,
  tooltip?: string,
): HTMLElement {
  const sortButton = document.createElement("button");
  sortButton.className = `${className} ss-sort`;
  sortButton.classList.toggle("ss-sort-selected", columnSortOrder === sortOrder);
  sortButton.dataset.sortOrder = columnSortOrder;
  if (tooltip) {
    sortButton.innerHTML = nameOrIcon;
    sortButton.title = `${tooltip} — sort by this`;
  } else {
    sortButton.textContent = nameOrIcon;
    sortButton.title = `${nameOrIcon} — sort by this`;
  }
  sortButton.addEventListener("click", () => {
    sortOrder = columnSortOrder;
    onSorted();
  });
  return sortButton;
}

function createResourceRow(resourceName: string, sektorState: SektorState): HTMLElement {
  const row = document.createElement("div");
  row.className = "ss-row";
  pointAtResourceWhileHovered(row, resourceName);

  const nameCell = document.createElement("span");
  nameCell.className = "ss-cell-resource";
  nameCell.textContent = resourceNameText(resourceName);
  row.appendChild(nameCell);

  row.appendChild(createValueCell(
    findThroughputValue(sektorState.imports, resourceName),
    findThroughputValue(sektorState.uncroppedImports, resourceName),
  ));
  row.appendChild(createValueCell(
    findThroughputValue(sektorState.exports, resourceName),
    findThroughputValue(sektorState.uncroppedExports, resourceName),
  ));

  return row;
}

function createTotalRow(sektorState: SektorState): HTMLElement {
  const row = document.createElement("div");
  row.className = "ss-row ss-total";

  row.appendChild(document.createElement("span"));
  row.appendChild(createAmountCell(sumThroughputValues(sektorState.uncroppedImports), sektorState.importExportCapacity));
  row.appendChild(createAmountCell(sumThroughputValues(sektorState.uncroppedExports), sektorState.importExportCapacity));

  return row;
}

// All the sektor would import or export is told against what its hubs can carry, and stands out
// when it is more than that, as then buildings are disabled or exports wasted.
function createAmountCell(amount: number, capacity: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = amount > capacity ? "ss-cell-value ss-total-amount ss-capacity-exceeded" : "ss-cell-value ss-total-amount";
  cell.textContent = `${formatNumber(amount)} / ${formatNumber(capacity)}`;
  return cell;
}

// An import cut down by disabling the buildings taking it in, or an export cut short because the
// hubs cannot carry it all out, is told by what is moved, followed by what would have been, and
// stands out as the import or export total over capacity does. Disabling a building can also raise
// an import, of what it made for the buildings left running, which is no cutting down at all.
function createValueCell(value: number, uncroppedValue: number): HTMLElement {
  const isCropped = uncroppedValue > value;
  const cell = document.createElement("span");
  cell.className = isCropped ? "ss-cell-value ss-capacity-exceeded" : "ss-cell-value";
  cell.textContent = isCropped
    ? `${formatNumber(value)} (${formatNumber(uncroppedValue)})`
    : throughputText(value);
  return cell;
}

function sumThroughputValues(throughputs: { value: number }[]): number {
  return throughputs.reduce((total, throughput) => total + throughput.value, 0);
}
