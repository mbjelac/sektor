import { getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";
import { getUsername } from "../login/login.api";
import { getResourceIcon } from "../resources";
import { arrowDownTrayIcon, arrowUpTrayIcon, xMarkIcon } from "../icons";
import { createListTitle } from "../listTitle.ui";
import { throughputText } from "../throughputDisplay.ui";
import { getPlanet } from "../list/planet";
import { regionCover, regionCoverIcon } from "../list/regionLabels";
import { TriangleCoordinate } from "../list/planetGrid";
import {
  PlayerSektor,
  ResourceMovingSektor,
  SektorSortOrder,
  sektorsMovingResource,
  sortSektorsMovingResource,
  ResourceTotal,
  resourceTotal,
} from "./sektorsMovingResource";
import { formatNumber } from "../formatNumber";

const DIALOG_ID = "resource-sektors-dialog";

// A player's sektor, along with the triangle of the planet it lies on, whose biome stands beside it.
type LocatedPlayerSektor = PlayerSektor & { location?: TriangleCoordinate };

// Which of the player's sektors bring in or send out a resource a mandate asks for, and how much,
// called up over the map so that a player sees where to do something about it. It looks as the list
// of the planet's imports and exports does, but has a row to a sektor instead of to a resource, and a
// sektor double clicked is opened in place of the one on the map, or, being the one on the map
// already, the list is put away to show it. It is as high as a mandate opened in
// full, and begins with the sektors bringing in most of the resource, as the planet's list does.
export function showResourceSektorsDialog(resourceName: string) {
  if (document.getElementById(DIALOG_ID)) return;

  const overlay = document.createElement("div");
  overlay.id = `${DIALOG_ID}-overlay`;
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = DIALOG_ID;
  dialog.className = "dialog global-state-dialog resource-sektors-dialog";
  dialog.dataset.resourceName = resourceName;
  overlay.appendChild(dialog);

  dialog.appendChild(createCloseButton(() => overlay.remove()));

  const list = document.createElement("div");
  list.className = "global-state-list";
  const playerSektors = getPlayerSektors();
  fillList(list, resourceName, playerSektors, "imported", () => overlay.remove());
  dialog.appendChild(list);

  document.body.appendChild(overlay);
}

// Every sektor the player owns, as it stands stored, which is how the map stores it on every change.
function getPlayerSektors(): LocatedPlayerSektor[] {
  const playerName = getUsername();
  return getSektorList()
    .filter(sektorListItem => playerName !== null && sektorListItem.owner === playerName)
    .map(sektorListItem => ({
      sektorId: sektorListItem.id,
      sektorName: sektorListItem.name ?? sektorListItem.id,
      importsAndExports: getSektorSummary(sektorListItem.id),
      location: sektorListItem.location,
    }));
}

// Drawn again whenever the player asks for another order, so what stands there is cleared away first.
function fillList(
  list: HTMLElement,
  resourceName: string,
  playerSektors: LocatedPlayerSektor[],
  sortOrder: SektorSortOrder,
  onClosed: () => void,
) {
  const resourceMovingSektors = sektorsMovingResource(playerSektors, resourceName);
  const sortedSektors = sortSektorsMovingResource(resourceMovingSektors, sortOrder);
  list.replaceChildren(
    createHeader(resourceName, resourceTotal(resourceMovingSektors), sortOrder, chosenSortOrder => fillList(list, resourceName, playerSektors, chosenSortOrder, onClosed)),
    ...sortedSektors.map(resourceMovingSektor => createSektorItem(
      resourceMovingSektor,
      playerSektors.find(playerSektor => playerSektor.sektorId === resourceMovingSektor.sektorId)?.location,
      onClosed,
    )),
  );
}

function createCloseButton(onClosed: () => void): HTMLElement {
  const closeButton = document.createElement("button");
  closeButton.id = "resource-sektors-close-button";
  closeButton.className = "global-state-close";
  closeButton.title = "Hide";
  closeButton.innerHTML = xMarkIcon;
  closeButton.addEventListener("click", onClosed);
  return closeButton;
}

// The title names the list as the planet's is named, with the resource it is about under it, over
// the same columns as the planet's list has, the first of them naming sektors rather than resources.
// Every column name is clicked to put the sektors in its order, and the one they stand in the order
// of is named in white.
function createHeader(
  resourceName: string,
  total: ResourceTotal,
  sortOrder: SektorSortOrder,
  onSorted: (chosenSortOrder: SektorSortOrder) => void,
): HTMLElement {
  const header = document.createElement("div");
  header.className = "global-state-header";

  header.appendChild(createListTitle("Imports/Exports"));
  header.appendChild(createResourceName(resourceName, total));
  header.appendChild(createSortButton("sektor", sortOrder, "Sektor", "global-state-resource", onSorted));
  header.appendChild(createSortButton("imported", sortOrder, arrowDownTrayIcon, "global-state-value", onSorted, "Imported"));
  header.appendChild(createSortButton("exported", sortOrder, arrowUpTrayIcon, "global-state-value", onSorted, "Exported"));

  return header;
}

// The resource is followed by what the player's sektors move of it between them, told by the tray of
// the way it goes and the amount, or by a bare nought where what comes in and what goes out cancel out.
function createResourceName(resourceName: string, total: ResourceTotal): HTMLElement {
  const resource = document.createElement("div");
  resource.className = "resource-sektors-resource";
  resource.textContent = `${getResourceIcon(resourceName) ?? ""} ${resourceName}`;

  const totalElement = document.createElement("span");
  totalElement.className = "resource-sektors-total";
  if (total.direction !== null) {
    const direction = document.createElement("span");
    direction.className = "resource-sektors-total-direction";
    direction.innerHTML = total.direction === "export" ? arrowUpTrayIcon : arrowDownTrayIcon;
    direction.title = total.direction === "export" ? "Export" : "Import";
    totalElement.appendChild(direction);
  }
  totalElement.append(formatNumber(total.amount));
  resource.appendChild(totalElement);

  return resource;
}

// A column is named by a picture where a word would not fit, and then carries the word it stands for
// to be read on hovering it.
function createSortButton(
  columnSortOrder: SektorSortOrder,
  sortOrder: SektorSortOrder,
  nameOrIcon: string,
  className: string,
  onSorted: (chosenSortOrder: SektorSortOrder) => void,
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
  sortButton.addEventListener("click", () => onSorted(columnSortOrder));
  return sortButton;
}

function createSektorItem(
  resourceMovingSektor: ResourceMovingSektor,
  location: TriangleCoordinate | undefined,
  onClosed: () => void,
): HTMLElement {
  const item = document.createElement("div");
  item.className = "global-state-item resource-sektor-item";
  item.dataset.sektorId = resourceMovingSektor.sektorId;

  item.appendChild(createSektorCell(resourceMovingSektor.sektorName, location));
  item.appendChild(createValueCell(resourceMovingSektor.imported));
  item.appendChild(createValueCell(resourceMovingSektor.exported));

  item.addEventListener("dblclick", () => {
    if (resourceMovingSektor.sektorId === getShownSektorId()) {
      onClosed();
      return;
    }
    window.location.href = `/sektor.html?id=${encodeURIComponent(resourceMovingSektor.sektorId)}`;
  });

  return item;
}

// The sektor whose map the list is called up over.
function getShownSektorId(): string | null {
  return new URLSearchParams(window.location.search).get("id");
}

// The sektor's name, followed by the picture of what covers its triangle of the planet, as the list
// of sektors tells it, with the cover in words to be read on hovering it. A sektor made before
// sektors were put on the planet lies nowhere on it, and has no picture.
function createSektorCell(sektorName: string, location: TriangleCoordinate | undefined): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "global-state-resource";
  cell.textContent = sektorName;

  const region = location ? getPlanet().regionRings[location.ring]?.[location.index] : undefined;
  if (region) {
    const biome = document.createElement("span");
    biome.className = "resource-sektor-biome";
    biome.textContent = regionCoverIcon(region);
    biome.title = regionCover(region);
    cell.append(" ", biome);
  }

  return cell;
}

function createValueCell(value: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "global-state-value";
  cell.textContent = throughputText(value);
  return cell;
}
