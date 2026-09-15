import { playerLevel, pointsToNextLevel } from "../playerLevel";
import { formatNumber } from "../formatNumber";
import { getPlayers, Player } from "../players";
import { arrowUpIcon, starIcon, trophyIcon, userIcon } from "../icons";

// Next to the sektors stands the standing of everyone playing, so that a player sees at a glance
// where the sektors they are working on put them among the others.
export function renderLeaderboard() {
  const container = document.getElementById("leaderboard")!;
  // Drawn again whenever the sektors change, so what stands there is cleared away first.
  container.replaceChildren();

  container.appendChild(createLeaderboardHeader());

  for (const player of getPlayers()) {
    container.appendChild(createLeaderboardItem(player));
  }
}

function createLeaderboardHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "leaderboard-header";

  header.appendChild(createHeaderIcon("leaderboard-name", userIcon, "Player"));
  header.appendChild(createHeaderIcon("leaderboard-score", starIcon, "Score"));
  header.appendChild(createHeaderIcon("leaderboard-level", trophyIcon, "Level"));
  header.appendChild(createHeaderIcon("leaderboard-points", arrowUpIcon, "Points to next level"));

  return header;
}

// The columns are named by a picture rather than a word, so each carries the word it stands for to
// be read on hovering it.
function createHeaderIcon(className: string, icon: string, tooltip: string): HTMLElement {
  const cell = document.createElement("span");
  cell.className = className;
  cell.innerHTML = icon;
  cell.title = tooltip;
  return cell;
}

function createLeaderboardItem(player: Player): HTMLElement {
  const item = document.createElement("div");
  item.className = "leaderboard-item";

  const name = document.createElement("span");
  name.className = "leaderboard-name";
  name.textContent = player.name;
  item.appendChild(name);

  const score = document.createElement("span");
  score.className = "leaderboard-score";
  score.textContent = formatNumber(player.score);
  item.appendChild(score);

  const level = document.createElement("span");
  level.className = "leaderboard-level";
  level.textContent = `${playerLevel(player.score)}`;
  item.appendChild(level);

  item.appendChild(createPointsToNextLevel(player.score));

  return item;
}

// A player on the highest level there is has no next level to climb to, and so nothing left to
// score towards.
function createPointsToNextLevel(playerScore: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "leaderboard-points";
  const points = pointsToNextLevel(playerScore);
  cell.textContent = points === null ? "—" : formatNumber(points);
  return cell;
}
