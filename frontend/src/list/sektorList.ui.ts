import { requireLogin } from "../login/requireLogin";
import { showUser } from "../login/userDisplay.ui";
import { getSektorList, SektorListItem } from "./sektorList.api";
import { getUsername } from "../login/login.api";
import { getSektorSummary } from "./sektorSummary";
import { globeAsiaAustraliaIcon, userIcon } from "../icons";
import { renderLeaderboard } from "./leaderboard.ui";
import { createSektorIfNeeded, startCreatingSektors } from "../creation/sektorCreation";
import { showPurgeButton } from "./purgeButton.ui";
import { globalImportsAndExports } from "../globalImportsAndExports";
import { updateGlobalStatePanel } from "../globalStatePanel.ui";
import { createListTitle } from "../listTitle.ui";
import { showPlanetBackground } from "./planetBackground.ui";
import { getPlanet } from "./planet";
import { regionCover } from "./regionLabels";

const LIST_ROW_GAP_PIXELS = 8;

function renderList() {
  const container = document.getElementById("sektor-list")!;
  // The list is drawn again whenever a sektor appears, so whatever stands there is cleared away
  // first, or every sektor would be shown twice over.
  container.replaceChildren();
  const sektors = getSektorList();
  const summaries = sektors.map(sektor => getSektorSummary(sektor.id));
  // Every sektor there is adds to what the planet brings in and sends out, whoever owns it and
  // whether anybody owns it at all.
  const planetImportsAndExports = globalImportsAndExports(summaries);

  container.appendChild(createHeader());

  for (const sektor of sektors) {
    container.appendChild(createListItem(sektor));
  }

  updateGlobalStatePanel(planetImportsAndExports);
}

function createHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "sektor-list-header";

  header.appendChild(createListTitle("Sektors"));

  const name = document.createElement("span");
  name.className = "sektor-list-name";
  name.textContent = "Name";
  header.appendChild(name);

  const biome = document.createElement("span");
  biome.className = "sektor-list-biome";
  biome.innerHTML = globeAsiaAustraliaIcon;
  biome.title = "Biome type";
  header.appendChild(biome);

  const owner = document.createElement("span");
  owner.className = "sektor-list-owner";
  owner.innerHTML = userIcon;
  owner.title = "Owned by";
  header.appendChild(owner);

  return header;
}

function createListItem(sektorListItem: SektorListItem): HTMLElement {
  const item = document.createElement("div");
  item.className = "sektor-list-item";
  item.dataset.sektorId = sektorListItem.id;
  // A click anywhere on the row turns the planet to show the sektor in the middle of it. A sektor
  // made before sektors were put on the planet lies nowhere on it, and the planet stays as it is.
  const location = sektorListItem.location;
  if (location) item.addEventListener("click", () => planetBackground.turnToTriangle(location));
  // A double click anywhere on the row goes into the sektor, to its map.
  item.addEventListener("dblclick", () => {
    window.location.href = `/sektor.html?id=${encodeURIComponent(sektorListItem.id)}`;
  });

  item.appendChild(createName(sektorListItem));
  item.appendChild(createBiome(sektorListItem));
  item.appendChild(createOwner(sektorListItem));

  return item;
}

// A sektor chosen on the planet is brought into view on the list, below the header standing over
// the list, and its row flashes white for a moment so that the eye finds it. The list jumps rather
// than glides there, or the flash would be over before the row came into view.
function revealSektorInList(sektorId: string) {
  const item = [...document.querySelectorAll<HTMLElement>(".sektor-list-item")].find(listItem => listItem.dataset.sektorId === sektorId);
  if (!item) return;

  const header = document.querySelector<HTMLElement>(".sektor-list-header");
  item.style.scrollMarginTop = `${(header?.offsetHeight ?? 0) + LIST_ROW_GAP_PIXELS}px`;
  item.scrollIntoView({ block: "nearest" });

  // Taken off and put back, so that a row chosen twice in a row flashes the second time too.
  item.classList.remove("sektor-list-item-flash");
  void item.offsetWidth;
  item.classList.add("sektor-list-item-flash");
}

function createName(sektorListItem: SektorListItem): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-name";
  // A sektor nobody has claimed and named yet is shown as having no name, rather than by its id.
  const givenName = (sektorListItem.name ?? "").trim();
  cell.textContent = givenName || "No name";
  if (!givenName) cell.classList.add("sektor-list-no-name");
  return cell;
}

// What covers the sektor's triangle of the planet, as told with the mouse over the triangle but
// without its biome type. A sektor made before sektors were put on the planet lies nowhere on it,
// and says nothing.
function createBiome(sektorListItem: SektorListItem): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-biome";
  const location = sektorListItem.location;
  if (!location) return cell;
  const region = getPlanet().regionRings[location.ring]?.[location.index];
  if (region) cell.textContent = regionCover(region);
  return cell;
}

// A sektor nobody holds says nothing of an owner, the player's own sektors are marked as theirs,
// and the rest carry the name of the player who claimed them.
function createOwner(sektorListItem: SektorListItem): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-owner";

  const owner = sektorListItem.owner;

  if (!owner) return cell;

  if (owner === getUsername()) {
    const you = document.createElement("span");
    you.className = "sektor-list-you";
    you.textContent = "You";
    cell.appendChild(you);
    return cell;
  }

  cell.textContent = owner;
  return cell;
}

requireLogin();
showUser();
const planetBackground = showPlanetBackground(revealSektorInList);
// A list which fills by itself cannot be looked at, as a sektor may appear on it at any moment. A
// test therefore lays this out before the page loads and makes the sektors it wants by hand, one
// call at a time, rather than sitting out the second between one round of making them and the next.
// Nothing in the game lays it out, so a player's list goes on filling on its own.
const areSektorsMadeByHand = (window as unknown as { makeSektorsByHand?: boolean }).makeSektorsByHand === true;

renderList();
planetBackground.showSektors(getSektorList());
showPurgeButton();
if (areSektorsMadeByHand) {
  (window as unknown as { createSektorIfNeeded: () => boolean }).createSektorIfNeeded = createSektorIfNeeded;
} else {
  startCreatingSektors(refreshPage);
}
renderLeaderboard();

// The standings are worked out from the sektors, so they are drawn anew whenever the sektors change.
function refreshPage() {
  renderList();
  planetBackground.showSektors(getSektorList());
  renderLeaderboard();
}
