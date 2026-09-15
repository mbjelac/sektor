import { addSektorToList, getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";
import { saveSektorData } from "../sektor/sektor.api";
import { buildingDefinitions } from "../sektor/buildings/buildings";
import { getLocalResources, getNegativeScoringResources } from "../resources";
import { getPlayers } from "../players";
import { LOWEST_LEVEL, playerLevel } from "../playerLevel";
import { createSektor } from "./createSektor";

const CREATION_INTERVAL_MILLISECONDS = 1000;
// Sektors nobody has taken up pile up if they are made faster than they are claimed, so no more are
// made once there are this many waiting.
const MAXIMUM_UNCLAIMED_EMPTY_SEKTORS = 10;

let creationTimer: ReturnType<typeof setInterval> | null = null;

export function startCreatingSektors(onSektorCreated: () => void) {
  creationTimer = setInterval(() => {
    if (createSektorIfNeeded()) onSektorCreated();
  }, CREATION_INTERVAL_MILLISECONDS);
}

// Stopping is harmless when nothing was ever started, which is the case on a page opened by a test.
export function stopCreatingSektors() {
  if (creationTimer === null) return;
  clearInterval(creationTimer);
  creationTimer = null;
}

// Returns whether a sektor was made, so that a list already on screen can be drawn again.
export function createSektorIfNeeded(): boolean {
  if (countUnclaimedEmptySektors() >= MAXIMUM_UNCLAIMED_EMPTY_SEKTORS) return false;

  const levels = neededLevels();
  const level = levels[Math.floor(Math.random() * levels.length)];
  const sektorId = `${nextSektorId()}`;

  saveSektorData(sektorId, createSektor(
    level, buildingDefinitions, getLocalResources(), getNegativeScoringResources()
  ));
  addSektorToList(sektorId);

  return true;
}

// A sektor is waiting for somebody as long as nobody owns it and nothing has been built in it.
function countUnclaimedEmptySektors(): number {
  return getSektorList().filter(sektorListItem =>
    sektorListItem.owner === null && getSektorSummary(sektorListItem.id).buildingCount === 0
  ).length;
}

// Every player needs sektors of their own level to work on, and a couple of the level above so that
// there is something waiting for them the moment they climb. Before anyone owns anything there are
// no players to go by, and the sektors made are the easiest there are, for whoever arrives first.
function neededLevels(): number[] {
  const players = getPlayers();
  if (players.length === 0) return [LOWEST_LEVEL];

  const levels = new Set<number>();
  for (const player of players) {
    const level = playerLevel(player.score);
    levels.add(level);
    levels.add(level + 1);
  }

  return [...levels];
}

// Sektors are numbered, and the number carries on above the highest one already made so that a
// reload never hands out a number twice. The number is the sektor's id, not its name — a name is
// what the player gives it when they claim it.
function nextSektorId(): number {
  const sektorIds = getSektorList()
    .map(sektorListItem => Number(sektorListItem.id))
    .filter(sektorId => Number.isInteger(sektorId) && sektorId >= 0);

  return sektorIds.length === 0 ? 0 : Math.max(...sektorIds) + 1;
}
