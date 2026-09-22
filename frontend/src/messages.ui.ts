import {
  ImportsAndExports,
  mostImportedResourceNames,
  mostImportedScarceResourceNames,
} from "./globalImportsAndExports";
import { resourceNameText } from "./throughputDisplay.ui";
import { getNegativeScoringResources } from "./resources";

// More than a few things to do at once is no advice at all, so only the most telling are named.
const MOST_TOLD_RESOURCE_COUNT = 3;

const MOST_IMPORTED_MESSAGE_ID = "most-imported-message";
const MOST_IMPORTED_SCARCE_MESSAGE_ID = "most-imported-scarce-message";

// What a player could do here which would help the planet most, told to them as the map opens and
// whenever anything changes what this sektor or the planet moves. What the planet wants of anybody
// is said first, and what this sektor is doing against it under that.
export function updateMessages(
  sektorImportsAndExports: ImportsAndExports,
  planetImportsAndExports: ImportsAndExports,
) {
  showMostImportedMessage(planetImportsAndExports);
  showMostImportedScarceMessage(sektorImportsAndExports, planetImportsAndExports);
}

// Whatever the planet is shortest of is what a player can do most good by sending out. A planet
// short of nothing is a planet with nothing to ask for, and the message goes.
function showMostImportedMessage(planetImportsAndExports: ImportsAndExports) {
  showOrHideMessage(
    MOST_IMPORTED_MESSAGE_ID,
    "This planet needs:",
    mostImportedResourceNames(planetImportsAndExports, getNegativeScoringResources(), MOST_TOLD_RESOURCE_COUNT),
  );
}

// Bringing in what the planet is short of takes it from everybody else, so a sektor doing it is
// told which of its own imports those are.
function showMostImportedScarceMessage(
  sektorImportsAndExports: ImportsAndExports,
  planetImportsAndExports: ImportsAndExports,
) {
  showOrHideMessage(
    MOST_IMPORTED_SCARCE_MESSAGE_ID,
    "Avoid importing scarse resources",
    mostImportedScarceResourceNames(
      sektorImportsAndExports,
      planetImportsAndExports,
      getNegativeScoringResources(),
      MOST_TOLD_RESOURCE_COUNT,
    ),
  );
}

// Advice with no resources left to name has nothing to say, so it is taken off the screen rather
// than left standing empty.
function showOrHideMessage(messageId: string, advice: string, resourceNames: string[]) {
  if (resourceNames.length === 0) {
    hideMessage(messageId);
    return;
  }

  showMessage(messageId, `${advice} ${resourceNames.map(resourceNameText).join(", ")}`);
}

// A message of a kind the player is already being told is written over rather than stood beside, so
// that the same advice is never on the screen twice over.
function showMessage(messageId: string, text: string) {
  const shownMessage = document.getElementById(messageId);

  if (shownMessage) {
    shownMessage.textContent = text;
    return;
  }

  const message = document.createElement("div");
  message.id = messageId;
  message.className = "message";
  message.textContent = text;
  document.getElementById("messages")!.appendChild(message);
}

function hideMessage(messageId: string) {
  document.getElementById(messageId)?.remove();
}
