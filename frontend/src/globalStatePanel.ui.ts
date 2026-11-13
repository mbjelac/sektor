import {
  findThroughputValue,
  ImportsAndExports,
  ResourceSortOrder,
  sortedResourceNames,
} from "./globalImportsAndExports";
import { arrowDownTrayIcon, arrowUpTrayIcon, globeAltIcon, userIcon } from "./icons";
import { resourceNameText, throughputText } from "./throughputDisplay.ui";
import { createListTitle } from "./listTitle.ui";

// Which column the resources are put in order by. A player looking for what the planet is shortest
// of asks for it by the column it stands in, and the list stays in that order until they ask for
// another, whatever happens to the sektors under it. It begins with what the planet brings in most
// of, which is what a player can do the most for. Only one list of the planet is ever on a page —
// the one beside the sektors, or the one called up over a map — so the two never disagree.
let sortOrder: ResourceSortOrder = "imported";

// Whose imports and exports the list shows: the whole planet's, or only those of the player's own
// sektors, set against each other just as the planet's are. Like the order, it is kept until the
// player asks for the other, and begins with the planet's.
type ImportsAndExportsFilter = "global" | "own";
let importsAndExportsFilter: ImportsAndExportsFilter = "global";

// The list is named after whose imports and exports it is showing.
const LIST_TITLES: Record<ImportsAndExportsFilter, string> = {
  global: "Global Imports/Exports",
  own: "My Imports/Exports",
};

// What the whole planet, or the player's own sektors, bring in and send out.
export interface GlobalAndPlayerImportsAndExports {
  globalImportsAndExports: ImportsAndExports;
  playerImportsAndExports: ImportsAndExports;
}

// What the whole planet brings in and sends out, standing beside the sektors and the standings as
// the third of the three lists on the page.
export function updateGlobalStatePanel(globalAndPlayerImportsAndExports: GlobalAndPlayerImportsAndExports) {
  fillGlobalStateList(document.getElementById("global-state-panel")!, globalAndPlayerImportsAndExports);
}

// The header and every resource under it, put into whoever is showing the list: the list of the page
// itself, or the dialog which calls the same list up over a sektor's map.
export function fillGlobalStateList(list: HTMLElement, globalAndPlayerImportsAndExports: GlobalAndPlayerImportsAndExports) {
  const shownImportsAndExports = importsAndExportsFilter === "global"
    ? globalAndPlayerImportsAndExports.globalImportsAndExports
    : globalAndPlayerImportsAndExports.playerImportsAndExports;
  // Drawn again whenever the sektors change or the player asks for another order or another filter,
  // so what stands there is cleared away first.
  list.replaceChildren(
    createHeader(() => fillGlobalStateList(list, globalAndPlayerImportsAndExports)),
    ...sortedResourceNames(shownImportsAndExports, sortOrder)
      .map(resourceName => createResourceItem(resourceName, shownImportsAndExports)),
  );
}

// The name of the list and the names of its columns are one header, which stays at the top of the
// resources while they are scrolled past it. Every column name is asked for by clicking it, which
// puts the resources in the order of that column, and the column they stand in the order of is
// named in white, so the player sees what order they are looking at. The buttons choosing whose
// imports and exports are listed stand at the other end of the name.
function createHeader(onChanged: () => void): HTMLElement {
  const header = document.createElement("div");
  header.className = "global-state-header";

  header.appendChild(createTitleRow(onChanged));
  header.appendChild(createSortButton("resource", "Resource", "global-state-resource", onChanged));
  header.appendChild(createSortButton("imported", arrowDownTrayIcon, "global-state-value", onChanged, "Imported"));
  header.appendChild(createSortButton("exported", arrowUpTrayIcon, "global-state-value", onChanged, "Exported"));

  return header;
}

function createTitleRow(onFiltered: () => void): HTMLElement {
  const titleRow = document.createElement("div");
  titleRow.className = "global-state-title-row";
  titleRow.appendChild(createListTitle(LIST_TITLES[importsAndExportsFilter]));

  const filterButtons = document.createElement("div");
  filterButtons.className = "global-state-filter-buttons";
  filterButtons.appendChild(createFilterButton("global", globeAltIcon, "Whole planet", onFiltered));
  filterButtons.appendChild(createFilterButton("own", userIcon, "Yours", onFiltered));
  titleRow.appendChild(filterButtons);

  return titleRow;
}

// A button is only a picture, carrying whose imports and exports it lists to be read on hovering it.
// The ones being listed are told by the line under their button.
function createFilterButton(
  buttonFilter: ImportsAndExportsFilter,
  icon: string,
  tooltip: string,
  onFiltered: () => void,
): HTMLElement {
  const filterButton = document.createElement("button");
  filterButton.className = "global-state-filter-button";
  filterButton.classList.toggle("selected", buttonFilter === importsAndExportsFilter);
  filterButton.dataset.importsAndExportsFilter = buttonFilter;
  filterButton.title = tooltip;
  filterButton.innerHTML = icon;
  filterButton.addEventListener("click", () => {
    importsAndExportsFilter = buttonFilter;
    onFiltered();
  });
  return filterButton;
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
  sortButton.classList.toggle("global-state-sort-selected", columnSortOrder === sortOrder);
  sortButton.dataset.sortOrder = columnSortOrder;
  if (tooltip) {
    sortButton.innerHTML = nameOrIcon;
    sortButton.title = tooltip;
  } else {
    sortButton.textContent = nameOrIcon;
    sortButton.title = nameOrIcon;
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
