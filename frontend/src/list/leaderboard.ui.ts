import { getSektorList } from "./sektorList.api";
import { getSektorOwner } from "../sektor/sektorOwner.api";
import { getSektorSummary } from "./sektorSummary";
import { playerLevel } from "../playerLevel";
import { formatNumber } from "../formatNumber";

interface Player {
  name: string;
  score: number;
}

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

// Everyone who owns a sektor is a player, and what all of their sektors score together is what
// they are ranked by, the best standing first.
function getPlayers(): Player[] {
  const scoresByPlayerName = new Map<string, number>();

  for (const sektorListItem of getSektorList()) {
    const owner = getSektorOwner(sektorListItem.name);
    if (!owner) continue;
    const score = getSektorSummary(sektorListItem.name).score;
    scoresByPlayerName.set(owner, (scoresByPlayerName.get(owner) ?? 0) + score);
  }

  return [...scoresByPlayerName.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((player, otherPlayer) => otherPlayer.score - player.score);
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
