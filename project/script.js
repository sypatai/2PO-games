const CONFIG = {
  // Для адреса username.github.io/repository/ значения определяются автоматически.
  // При использовании собственного домена заполните owner и repository вручную.
  owner: "",
  repository: "",
  branch: "",
  gamesDirectory: "games",
};

const palette = ["#ffcc4d", "#77e3b4", "#9c8cff", "#ff8e72", "#70b8ff", "#f080c0"];
const symbols = ["✦", "◆", "●", "▲", "✺", "■"];

const catalog = document.querySelector("#catalog");
const gamesCount = document.querySelector("#games-count");
const cardTemplate = document.querySelector("#game-card-template");

document.querySelector("#year").textContent = new Date().getFullYear();

function getRepositoryDetails() {
  if (CONFIG.owner && CONFIG.repository) {
    return { owner: CONFIG.owner, repository: CONFIG.repository };
  }

  const isGitHubPages = window.location.hostname.endsWith(".github.io");
  const owner = window.location.hostname.replace(".github.io", "");
  const [repository = `${owner}.github.io`] = window.location.pathname.split("/").filter(Boolean);

  if (!isGitHubPages) return null;

  return {
    owner,
    repository,
  };
}

function formatTitle(folderName) {
  return folderName
    .replace(/[-_]+/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("ru"));
}

function gameUrl(folderName) {
  const root = new URL("./", window.location.href);
  return new URL(`${CONFIG.gamesDirectory}/${encodeURIComponent(folderName)}/`, root).href;
}

function showStatus(type, title, message) {
  const icons = { empty: "+", error: "!", local: "⌂" };
  catalog.innerHTML = `
    <div class="status-card">
      <span class="status-icon" aria-hidden="true">${icons[type] ?? "·"}</span>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
  catalog.setAttribute("aria-busy", "false");
  gamesCount.textContent = "0 игр";
}

function renderGames(games) {
  catalog.innerHTML = "";

  games.forEach((game, index) => {
    const card = cardTemplate.content.cloneNode(true);
    const title = formatTitle(game.name);
    const visual = card.querySelector(".game-visual");

    visual.style.setProperty("--card-color", palette[index % palette.length]);
    card.querySelector(".game-number").textContent = String(index + 1).padStart(2, "0");
    card.querySelector(".game-symbol").textContent = symbols[index % symbols.length];
    card.querySelector(".game-title").textContent = title;
    card.querySelector(".play-link").href = gameUrl(game.name);

    catalog.append(card);
  });

  catalog.setAttribute("aria-busy", "false");
  gamesCount.textContent = `${games.length} ${gameWord(games.length)}`;
}

function gameWord(amount) {
  const lastTwo = amount % 100;
  const last = amount % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return "игр";
  if (last === 1) return "игра";
  if (last >= 2 && last <= 4) return "игры";
  return "игр";
}

async function loadGames() {
  const repositoryDetails = getRepositoryDetails();

  if (!repositoryDetails) {
    showStatus(
      "local",
      "Каталог готов",
      "После публикации на GitHub Pages игры из папки games появятся здесь автоматически.",
    );
    return;
  }

  const { owner, repository } = repositoryDetails;
  const branchQuery = CONFIG.branch ? `?ref=${encodeURIComponent(CONFIG.branch)}` : "";
  const endpoint = `https://api.github.com/repos/${owner}/${repository}/contents/${CONFIG.gamesDirectory}${branchQuery}`;

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      throw new Error(`GitHub API: ${response.status}`);
    }

    const contents = await response.json();
    const games = contents
      .filter((item) => item.type === "dir")
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));

    if (games.length === 0) {
      showStatus(
        "empty",
        "Игры скоро появятся",
        "Добавьте первую папку с игрой в games — карточка автоматически появится в каталоге.",
      );
      return;
    }

    renderGames(games);
  } catch (error) {
    console.error(error);
    showStatus(
      "error",
      "Не удалось загрузить игры",
      "Обновите страницу чуть позже. Если ошибка повторяется, проверьте настройки репозитория в script.js.",
    );
  }
}

loadGames();
