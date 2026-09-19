import {
  findThroughputValue,
  ImportsAndExports,
  ResourceSortOrder,
  sortedResourceNames,
} from "./globalImportsAndExports";
import { arrowDownTrayIcon, arrowUpTrayIcon } from "./icons";
import { resourceNameText, throughputText } from "./throughputDisplay.ui";
import { createListTitle } from "./listTitle.ui";

// Which column the resources are put in order by. A player looking for what the planet is shortest
// of asks for it by the column it stands in, and the list stays in that order until they ask for
// another, whatever happens to the sektors under it. Only one list of the planet is ever on a page
// — the one beside the sektors, or the one called up over a map — so the two never disagree.
let sortOrder: ResourceSortOrder = "resource";

// What the whole planet brings in and sends out, standing beside the sektors and the standings as
// the third of the three lists on the page.
export function updateGlobalStatePanel(globalImportsAndExports: ImportsAndExports) {
  fillGlobalStateList(document.getElementById("global-state-panel")!, globalImportsAndExports, "Imports/Exports");
}

// The header and every resource under it, put into whoever is showing the list: the list of the page
// itself, or the dialog which calls the same list up over a sektor's map. Each names the list as its
// own page has room to: beside the sektors it stands among lists which are all of the planet, and
// over a map it has to say which of the two lists there it is. The list carries no score: what the
// planet is short of and what it has over is the same for everybody playing, and a score is a thing
// of a single sektor.
export function fillGlobalStateList(list: HTMLElement, globalImportsAndExports: ImportsAndExports, title: string) {
  // Drawn again whenever the sektors change or the player asks for another order, so what stands
  // there is cleared away first.
  list.replaceChildren(
    createHeader(title, () => fillGlobalStateList(list, globalImportsAndExports, title)),
    ...sortedResourceNames(globalImportsAndExports, sortOrder)
      .map(resourceName => createResourceItem(resourceName, globalImportsAndExports)),
  );
}

// The name of the list and the names of its columns are one header, which stays at the top of the
// resources while they are scrolled past it. Every column name is asked for by clicking it, which
// puts the resources in the order of that column.
function createHeader(title: string, onSorted: () => void): HTMLElement {
  const header = document.createElement("div");
  header.className = "global-state-header";

  header.appendChild(createListTitle(title));
  header.appendChild(createSortButton("resource", "Resource", "global-state-resource", onSorted));
  header.appendChild(createSortButton("imported", arrowDownTrayIcon, "global-state-value", onSorted, "Imported"));
  header.appendChild(createSortButton("exported", arrowUpTrayIcon, "global-state-value", onSorted, "Exported"));

  return header;
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
  sortButton.className = `${className} global-state-sort`;
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
