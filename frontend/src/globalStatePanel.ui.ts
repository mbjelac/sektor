import { findThroughputValue, ImportsAndExports, listedResourceNames } from "./globalImportsAndExports";
import { arrowDownTrayIcon, arrowUpTrayIcon } from "./icons";
import { resourceNameText, throughputText } from "./throughputDisplay.ui";
import { createListTitle } from "./listTitle.ui";

// What the whole planet brings in and sends out, standing beside the sektors and the standings as
// the third of the three lists on the page. It carries no score: what the planet is short of and
// what it has over is the same for everybody playing, and a score is a thing of a single sektor.
export function updateGlobalStatePanel(globalImportsAndExports: ImportsAndExports) {
  const panel = document.getElementById("global-state-panel")!;
  // Drawn again whenever the sektors change, so what stands there is cleared away first.
  panel.replaceChildren();

  panel.appendChild(createHeader());

  for (const resourceName of listedResourceNames(globalImportsAndExports)) {
    panel.appendChild(createResourceItem(resourceName, globalImportsAndExports));
  }
}

// The name of the list and the names of its columns are one header, which stays at the top of the
// resources while they are scrolled past it.
function createHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "global-state-header";

  header.appendChild(createListTitle("Imports/Exports"));
  header.appendChild(createResourceCell("Resource"));
  header.appendChild(createHeaderIcon(arrowDownTrayIcon, "Imported"));
  header.appendChild(createHeaderIcon(arrowUpTrayIcon, "Exported"));

  return header;
}

// The columns are named by a picture rather than a word, so each carries the word it stands for to
// be read on hovering it.
function createHeaderIcon(icon: string, tooltip: string): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "global-state-value";
  cell.innerHTML = icon;
  cell.title = tooltip;
  return cell;
}

function createResourceItem(resourceName: string, globalImportsAndExports: ImportsAndExports): HTMLElement {
  const item = document.createElement("div");
  item.className = "global-state-item";

  item.appendChild(createResourceCell(resourceNameText(resourceName)));
  item.appendChild(createValueCell(findThroughputValue(globalImportsAndExports.imports, resourceName)));
  item.appendChild(createValueCell(findThroughputValue(globalImportsAndExports.exports, resourceName)));

  return item;
}

function createResourceCell(text: string): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "global-state-resource";
  cell.textContent = text;
  return cell;
}

function createValueCell(value: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "global-state-value";
  cell.textContent = throughputText(value);
  return cell;
}
