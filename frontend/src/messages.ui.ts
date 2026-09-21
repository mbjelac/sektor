import { ImportsAndExports, mostImportedResourceNames } from "./globalImportsAndExports";
import { resourceNameText } from "./throughputDisplay.ui";

// More than a few things to do at once is no advice at all, so only the most telling are named.
const MOST_TOLD_RESOURCE_COUNT = 3;

const MOST_IMPORTED_MESSAGE_ID = "most-imported-message";

// Whatever the planet is shortest of is what a player can do most good by sending out, so that is
// what they are told as the map opens and whenever anything changes what the planet moves. A planet
// short of nothing is a planet with nothing to say, and the message goes.
export function showMostImportedMessage(planetImportsAndExports: ImportsAndExports) {
  const resourceNames = mostImportedResourceNames(planetImportsAndExports, MOST_TOLD_RESOURCE_COUNT);

  if (resourceNames.length === 0) {
    hideMessage(MOST_IMPORTED_MESSAGE_ID);
    return;
  }

  showMessage(MOST_IMPORTED_MESSAGE_ID, `This planet needs: ${resourceNames.map(resourceNameText).join(", ")}`);
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
