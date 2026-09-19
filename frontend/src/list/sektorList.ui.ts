import { requireLogin } from "../login/requireLogin";
import { showUser } from "../login/userDisplay.ui";
import { getSektorList, removeSektorOwner, SektorListItem, setSektorOwner } from "./sektorList.api";
import { arrowDownTrayIcon, arrowRightIcon, arrowUpTrayIcon, buildingOfficeIcon, puzzlePieceIcon, starIcon, userIcon } from "../icons";
import { showClaimDialog } from "../claimDialog.ui";
import { createClaimButton } from "../claimButton.ui";
import { showAbandonDialog } from "./abandonDialog.ui";
import { getUsername } from "../login/login.api";
import { getSektorSummary, SektorSummary } from "./sektorSummary";
import { renderLeaderboard } from "./leaderboard.ui";
import { scoreColor } from "../score";
import { formatNumber } from "../formatNumber";
import { createSektorIfNeeded, startCreatingSektors } from "../creation/sektorCreation";
import { showPurgeButton } from "./purgeButton.ui";
import { globalImportsAndExports } from "../globalImportsAndExports";
import { updateGlobalStatePanel } from "../globalStatePanel.ui";
import { createListTitle } from "../listTitle.ui";
import { currentScore } from "../currentScore";
import { getNegativeScoringResources } from "../resources";
import { ImportsAndExports } from "../globalImportsAndExports";

// A player may only hold so many sektors at a time, so that they build on the ones they have
// claimed before claiming more.
const MAXIMUM_CLAIMED_SEKTORS = 5;

function renderList() {
  const container = document.getElementById("sektor-list")!;
  // The list is drawn again whenever a sektor appears, so whatever stands there is cleared away
  // first, or every sektor would be shown twice over.
  container.replaceChildren();
  const sektors = getSektorList();
  const summaries = sektors.map(sektor => getSektorSummary(sektor.id));
  const claimingAllowed = countClaimedSektors(sektors) < MAXIMUM_CLAIMED_SEKTORS;
  // Every sektor there is adds to what the planet brings in and sends out, whoever owns it and
  // whether anybody owns it at all. A sektor is then worth what it does for the planet, so this is
  // worked out before any sektor is scored against it.
  const planetImportsAndExports = globalImportsAndExports(summaries);

  container.appendChild(createHeader());

  for (const [sektorIndex, sektor] of sektors.entries()) {
    container.appendChild(createListItem(sektor, summaries[sektorIndex], planetImportsAndExports, claimingAllowed));
  }

  updateGlobalStatePanel(planetImportsAndExports);
}

// Every sektor the player holds counts towards the limit.
function countClaimedSektors(sektors: SektorListItem[]): number {
  return sektors.filter(sektor => sektor.owner === getUsername()).length;
}

function createHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "sektor-list-header";

  header.appendChild(createListTitle("Sektors"));

  const name = document.createElement("span");
  name.className = "sektor-list-name";
  name.textContent = "Name";
  header.appendChild(name);

  const level = document.createElement("span");
  level.className = "sektor-list-level";
  level.innerHTML = puzzlePieceIcon;
  level.title = "Difficulty";
  header.appendChild(level);

  const owner = document.createElement("span");
  owner.className = "sektor-list-owner";
  owner.innerHTML = userIcon;
  owner.title = "Owned by";
  header.appendChild(owner);

  header.appendChild(createHeaderIcon(buildingOfficeIcon, "Buildings"));
  header.appendChild(createHeaderIcon(arrowDownTrayIcon, "Imports"));
  header.appendChild(createHeaderIcon(arrowUpTrayIcon, "Exports"));
  header.appendChild(createHeaderIcon(starIcon, "Score"));

  // Nor is the column of buttons for taking a sektor up or giving it up, as the buttons say it.
  header.appendChild(document.createElement("span"));

  return header;
}

function createHeaderIcon(icon: string, tooltip?: string): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-number";
  cell.innerHTML = icon;
  if (tooltip) cell.title = tooltip;
  return cell;
}

function createListItem(
  sektorListItem: SektorListItem,
  summary: SektorSummary,
  planetImportsAndExports: ImportsAndExports,
  claimingAllowed: boolean,
): HTMLElement {
  const item = document.createElement("div");
  item.className = "sektor-list-item";

  item.appendChild(createName(sektorListItem));
  item.appendChild(createLevel(summary.level));
  item.appendChild(createOwner(sektorListItem));
  item.appendChild(createNumber(summary.buildingCount));
  item.appendChild(createNumber(summary.importTotal));
  item.appendChild(createNumber(summary.exportTotal));
  item.appendChild(createScore(currentScore(summary, planetImportsAndExports, getNegativeScoringResources())));
  item.appendChild(createClaimOrAbandonButton(sektorListItem, claimingAllowed));

  return item;
}

// The way into a sektor stands against the name of the sektor it leads to, rather than in a column
// of its own: a column would have to be as wide as the longest name to hold its arrows in line, and
// what it took to do that is taken from the columns after it.
function createName(sektorListItem: SektorListItem): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-name";

  const name = document.createElement("span");
  name.className = "sektor-list-name-text";
  // A sektor nobody has claimed and named yet is shown as having no name, rather than by its id.
  const givenName = (sektorListItem.name ?? "").trim();
  name.textContent = givenName || "No name";
  if (!givenName) name.classList.add("sektor-list-no-name");
  cell.appendChild(name);

  cell.appendChild(createGoButton(sektorListItem));

  return cell;
}

function createGoButton(sektorListItem: SektorListItem): HTMLElement {
  const goButton = document.createElement("button");
  goButton.className = "sektor-list-go";
  goButton.innerHTML = arrowRightIcon;
  goButton.addEventListener("click", () => {
    window.location.href = `/sektor.html?id=${encodeURIComponent(sektorListItem.id)}`;
  });
  return goButton;
}

// Taking a sektor up and giving it up are the one thing a player does to a whole sektor rather than
// to anything in it, so whichever of them is open to them stands in the same place at the end of
// the row. A sektor somebody else holds offers neither.
function createClaimOrAbandonButton(sektorListItem: SektorListItem, claimingAllowed: boolean): HTMLElement {
  if (!sektorListItem.owner) return createListClaimButton(sektorListItem, claimingAllowed);
  if (sektorListItem.owner === getUsername()) return createAbandonButton(sektorListItem);
  return document.createElement("span");
}

function createLevel(level: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-level";
  cell.textContent = `${level}`;
  return cell;
}

function createAbandonButton(sektorListItem: SektorListItem): HTMLElement {
  const abandonButton = document.createElement("button");
  abandonButton.className = "sektor-list-abandon";
  abandonButton.textContent = "Abandon";
  abandonButton.addEventListener("click", () => abandonSektor(sektorListItem));
  return abandonButton;
}

function abandonSektor(sektorListItem: SektorListItem) {
  showAbandonDialog({
    sektorName: sektorListItem.name ?? sektorListItem.id,
    onConfirmed: () => {
      removeSektorOwner(sektorListItem.id);
      // The abandoned sektor is up for claiming again, which the list shows once drawn anew.
      window.location.reload();
    },
  });
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

function createListClaimButton(sektorListItem: SektorListItem, claimingAllowed: boolean): HTMLElement {
  const claimButton = createClaimButton(() => claimSektor(sektorListItem));
  claimButton.classList.add("sektor-list-claim");
  claimButton.disabled = !claimingAllowed;
  return claimButton;
}

// A sektor carries the name it was made with, so the player is only asked whether they want it.
// Saying yes makes it theirs and opens it for building on.
function claimSektor(sektorListItem: SektorListItem) {
  showClaimDialog({
    sektorName: sektorListItem.name ?? sektorListItem.id,
    onConfirmed: () => {
      setSektorOwner(sektorListItem.id, getUsername()!);
      window.location.href = `/sektor.html?id=${encodeURIComponent(sektorListItem.id)}`;
    },
  });
}

function createNumber(value: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-number";
  cell.textContent = formatNumber(value);
  return cell;
}

function createScore(score: number): HTMLElement {
  const cell = createNumber(score);
  cell.style.color = scoreColor(score);
  return cell;
}

requireLogin();
showUser();
// A list which fills by itself cannot be looked at, as a sektor may appear on it at any moment. A
// test therefore lays this out before the page loads and makes the sektors it wants by hand, one
// call at a time, rather than sitting out the second between one round of making them and the next.
// Nothing in the game lays it out, so a player's list goes on filling on its own.
const areSektorsMadeByHand = (window as unknown as { makeSektorsByHand?: boolean }).makeSektorsByHand === true;

renderList();
showPurgeButton();
if (areSektorsMadeByHand) {
  (window as unknown as { createSektorIfNeeded: () => Promise<boolean> }).createSektorIfNeeded = createSektorIfNeeded;
} else {
  startCreatingSektors(refreshPage);
}
renderLeaderboard();

// The standings are worked out from the sektors, so they are drawn anew whenever the sektors change.
function refreshPage() {
  renderList();
  renderLeaderboard();
}
