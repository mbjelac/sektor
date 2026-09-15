import { playerLevel } from "../playerLevel";
import { formatNumber } from "../formatNumber";
import { getPlayers, Player } from "../players";

// Next to the sektors stands the standing of everyone playing, so that a player sees at a glance
// where the sektors they are working on put them among the others.
export function renderLeaderboard() {
  const container = document.getElementById("leaderboard")!;

  container.appendChild(createLeaderboardHeader());

  for (const player of getPlayers()) {
    container.appendChild(createLeaderboardItem(player));
  }
}

function createLeaderboardHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "leaderboard-header";

  const name = document.createElement("span");
  name.className = "leaderboard-name";
  name.textContent = "Player";
  header.appendChild(name);

  const score = document.createElement("span");
  score.className = "leaderboard-score";
  score.textContent = "Score";
  header.appendChild(score);

  const level = document.createElement("span");
  level.className = "leaderboard-level";
  level.textContent = "Level";
  header.appendChild(level);

  return header;
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

  return item;
}
