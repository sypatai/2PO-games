"use strict";

const introScreen = document.querySelector("#intro-screen");
const playScreen = document.querySelector("#play-screen");
const endingScreen = document.querySelector("#ending-screen");
const roomScene = document.querySelector("#room-scene");
const roomTitle = document.querySelector("#game-room-title");
const storyText = document.querySelector("#story-text");
const storyPrompt = document.querySelector("#story-prompt");
const actionList = document.querySelector("#action-list");
const clueList = document.querySelector("#clue-list");
const chapterLabel = document.querySelector("#chapter-label");
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector("#progress-bar");
const progressFill = document.querySelector("#progress-fill");
const objectiveLabel = document.querySelector("#objective-label");
const mistakeCount = document.querySelector("#mistake-count");
const panelTitle = document.querySelector("#panel-title");
const systemStatus = document.querySelector("#system-status");
const shadowHotspot = document.querySelector("#shadow-hotspot");
const soundToggle = document.querySelector("#sound-toggle");
const soundLabel = document.querySelector("#sound-label");

const state = {
  room: "404",
  clues: new Set(),
  archiveClues: new Set(),
  mistakes: 0,
  mirrorInspections: 0,
  terminalSolved: false,
  radioSolved: false,
  signalFound: false,
  switchSequence: [],
  powerRestored: false,
  memoryChoice: null,
  ending: null,
  soundEnabled: false,
  audioContext: null
};

const roomInfo = {
  "404": { chapter: "ГЛАВА 01", subtitle: "ПРОБУЖДЕНИЕ", title: "Комната", label: "0 / 3 УЛИКИ", max: 3, objective: "Найди зацепки в комнате", objects: ["ОКНО", "ВЫХОД 404"] },
  "405": { chapter: "ГЛАВА 02", subtitle: "АРХИВ", title: "Архив", label: "0 / 3 ФАЙЛА", max: 3, objective: "Изучи архивные записи", objects: ["АРХИВ", "ВЫХОД 405"] },
  "406": { chapter: "ГЛАВА 03", subtitle: "СЕРВЕРНАЯ", title: "Серверная", label: "0 / 1 ЗАДАНИЕ", max: 1, objective: "Восстанови питание", objects: ["СИСТЕМА", "ВЫХОД 406"] },
  "000": { chapter: "ГЛАВА 04", subtitle: "КОРИДОР БЕЗ КОНЦА", title: "Комната", label: "ФИНАЛ", max: 1, objective: "Реши, как закончится история", objects: ["КОРИДОР", "ВЫХОД 000"] }
};

const clueNames = {
  clock: "Время: 04:04",
  note: "Частота: 87,6",
  mirror: "Отражение не совпадает",
  archiveDate: "Архив: 17 октября",
  archivePhoto: "Фото: три тени",
  archiveAudio: "Запись: код 2–1–3"
};

function playTone(frequency = 520, duration = 0.07) {
  if (!state.soundEnabled || !window.AudioContext) return;
  if (!state.audioContext) state.audioContext = new window.AudioContext();
  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.045, state.audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(state.audioContext.destination);
  oscillator.start();
  oscillator.stop(state.audioContext.currentTime + duration);
}

function setStory(title, text, prompt = "") {
  panelTitle.textContent = title;
  storyText.textContent = text;
  storyPrompt.textContent = prompt;
}

function makeAction(label, handler, className = "", disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `action-button ${className}`.trim();
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", () => {
    if (!disabled) playTone();
    handler();
  });
  actionList.append(button);
  return button;
}

function addMessage(text) {
  const message = document.createElement("p");
  message.className = "system-message";
  message.textContent = text;
  actionList.append(message);
}

function renderClues() {
  clueList.replaceChildren();
  const found = [...state.clues, ...state.archiveClues];
  for (const clue of found) {
    const tag = document.createElement("span");
    tag.className = "clue-tag";
    tag.textContent = clueNames[clue];
    clueList.append(tag);
  }
  if (state.signalFound) {
    const tag = document.createElement("span");
    tag.className = "clue-tag";
    tag.textContent = "Скрытый знак";
    clueList.append(tag);
  }
}

function updateRoomLook() {
  const info = roomInfo[state.room];
  roomScene.dataset.room = state.room;
  roomTitle.innerHTML = `${info.title} <span>${state.room}</span>`;
  document.querySelector("#scene-label-window").textContent = info.objects[0];
  document.querySelector("#scene-label-door").textContent = info.objects[1];
  document.querySelector(".door-label").textContent = state.room;
  const is404 = state.room === "404";
  const isArchive = state.room === "405";
  const isServer = state.room === "406";
  const isFinal = state.room === "000";
  document.querySelector(".paper-note").classList.toggle("is-hidden", !is404);
  document.querySelector(".archive-photo").classList.toggle("is-hidden", is404 || isFinal);
  document.querySelector(".terminal-screen span").textContent = is404
    ? state.terminalSolved ? "ACCESS OK" : "NO SIGNAL"
    : isArchive ? "ARCHIVE" : isServer ? state.powerRestored ? "ONLINE" : "OFFLINE" : "NO EXIT";
  document.querySelector('[data-object="clock"]').setAttribute("aria-label", is404 ? "Осмотреть часы" : isArchive ? "Изучить архивный каталог" : isServer ? "Проверить индикаторы" : "Осмотреть знак на стене");
  document.querySelector('[data-object="note"]').setAttribute("aria-label", is404 ? "Прочитать записку на столе" : isArchive ? "Изучить фотографию" : isServer ? "Прочитать схему переключателей" : "Осмотреть надпись");
  document.querySelector('[data-object="mirror"]').setAttribute("aria-label", is404 ? "Осмотреть зеркало" : isArchive ? "Прослушать аудиозапись" : isServer ? "Проверить кабели" : "Осмотреть отражение");
  document.querySelector('[data-object="window"]').setAttribute("aria-label", is404 ? "Осмотреть окно" : isArchive ? "Осмотреть дальние полки" : isServer ? "Проверить аварийный свет" : "Исследовать коридор");
  document.querySelector('[data-object="terminal"]').setAttribute("aria-label", is404 ? "Проверить терминал" : isArchive ? "Открыть личное дело" : isServer ? "Проверить главный сервер" : "Осмотреть терминал в конце коридора");
  document.querySelector('[data-object="radio"]').setAttribute("aria-label", is404 ? "Настроить радио" : isArchive ? "Осмотреть диктофон" : isServer ? "Управлять переключателями" : "Прислушаться к голосу");
  document.querySelector('[data-object="door"]').setAttribute("aria-label", is404 ? "Осмотреть дверь" : isArchive ? "Выйти из архива" : isServer ? "Открыть дверь серверной" : "Выбрать выход");
  shadowHotspot.classList.toggle("is-hidden", !is404 || !state.radioSolved || state.signalFound);
  shadowHotspot.setAttribute("aria-label", is404 ? "Исследовать мерцание в окне" : "Исследовать скрытый знак");
  document.querySelectorAll(".hotspot-final").forEach((hotspot) => {
    hotspot.classList.toggle("is-hidden", !isFinal);
  });
  systemStatus.textContent = is404 ? "СИСТЕМА ГОТОВА" : isArchive ? "АРХИВ ОТКРЫТ" : isServer ? state.powerRestored ? "ПИТАНИЕ ВОССТАНОВЛЕНО" : "НЕТ ПИТАНИЯ" : "ПОСЛЕДНИЙ ВЫБОР";
  document.querySelector("#scene-hint").innerHTML = isFinal
    ? '<span class="hint-key">КЛИК</span> ВЫБЕРИ ДВЕРЬ'
    : '<span class="hint-key">КЛИК</span> ИССЛЕДУЙ ОБЪЕКТЫ';
  const clockNumbers = document.querySelectorAll(".wall-clock span");
  if (isArchive) {
    clockNumbers[0].textContent = "17";
    clockNumbers[1].textContent = "10";
    document.querySelector(".wall-clock i").textContent = "/";
  } else {
    clockNumbers[0].textContent = "04";
    clockNumbers[1].textContent = "04";
    document.querySelector(".wall-clock i").textContent = ":";
  }
  for (const object of ["clock", "note", "mirror", "window", "terminal", "radio", "door"]) {
    const hotspot = document.querySelector(`[data-object="${object}"]`);
    hotspot.classList.toggle("is-hidden", isFinal);
  }
}

function updateProgress() {
  const info = roomInfo[state.room];
  let completed = 0;
  let label = info.label;
  let objective = info.objective;
  if (state.room === "404") {
    completed = state.clues.size;
    label = `${completed} / 3 УЛИКИ`;
    objective = completed === 3 ? "Улики собраны — проверь терминал" : info.objective;
  } else if (state.room === "405") {
    completed = state.archiveClues.size;
    label = `${completed} / 3 ФАЙЛА`;
    objective = state.memoryChoice ? "Решение принято — найди выход" : completed === 3 ? "Все материалы собраны — открой дело" : info.objective;
  } else if (state.room === "406") {
    completed = Number(state.powerRestored);
    label = state.powerRestored ? "1 / 1 ГОТОВО" : "0 / 1 ЗАДАНИЕ";
    objective = state.powerRestored ? "Питание есть — открой коридор" : info.objective;
  } else {
    completed = 1;
    label = "ФИНАЛ";
  }
  chapterLabel.innerHTML = `${info.chapter} <b>·</b> ${info.subtitle}`;
  progressLabel.textContent = label;
  progressBar.setAttribute("aria-valuenow", String(completed));
  progressBar.setAttribute("aria-valuemax", String(info.max));
  progressFill.style.width = `${Math.round((completed / info.max) * 100)}%`;
  objectiveLabel.textContent = objective;
  mistakeCount.textContent = `ОШИБКИ: ${state.mistakes}`;
  renderClues();
  updateRoomLook();
  if (state.room === "404") {
    const terminalAction = [...actionList.querySelectorAll(".action-button")]
      .find((button) => button.textContent.includes("Проверить терминал"));
    if (terminalAction) terminalAction.disabled = state.clues.size < 3;
  }
  if (state.room === "405") {
    const archiveAction = [...actionList.querySelectorAll(".action-button")]
      .find((button) => button.textContent.includes("Открыть личное дело"));
    if (archiveAction) archiveAction.disabled = state.archiveClues.size < 3 || Boolean(state.memoryChoice);
  }
}

function showOverview() {
  actionList.replaceChildren();
  updateProgress();
  if (state.room === "404") {
    setStory("Тишина отвечает", "Воздух пахнет пылью и озоном. Перед тобой — дверь, окно, старое зеркало и терминал. Где-то в стене едва слышно потрескивает радио.", "Собери улики и открой терминал.");
    makeAction("Проверить терминал", openTerminal, "primary-action", state.clues.size < 3);
    if (state.clues.size < 3) addMessage(`Терминал ждёт. Найдено улик: ${state.clues.size} из 3.`);
  } else if (state.room === "405") {
    setStory("Архив забытых", state.signalFound
      ? "За дверью — архив с тысячами папок. На одной из них написано твоё имя, хотя оно зачёркнуто. Из динамика шепчет знакомый голос: «Не стирай меня снова»."
      : "За дверью — архив с тысячами папок. На одной из них написано твоё имя, хотя оно зачёркнуто. Пыль на полу ведёт к столу с личными делами."
    , "Изучи каталог, фотографию и запись. Потом реши, что делать со своим делом.");
    makeAction("Открыть личное дело", openArchiveFile, "primary-action", state.archiveClues.size < 3 || Boolean(state.memoryChoice));
    makeAction("Покинуть архив", () => state.memoryChoice
      ? enterRoom("406")
      : setStory("Выход заперт", "Дверь не откроется, пока ты не решишь, что делать с личным делом.", "Сначала изучи архив и сделай выбор.")
    , "small-action", !state.memoryChoice);
    if (state.archiveClues.size < 3) addMessage(`Найдено материалов: ${state.archiveClues.size} из 3.`);
  } else if (state.room === "406") {
    setStory("Серверная не спит", "В стойках тлеют красные огни. На аварийной схеме сохранилась последовательность: «Ближний. Средний. Дальний». Три переключателя ждут питания.", "Порядок узнаешь, если собрал архивные материалы.");
    makeAction(state.powerRestored ? "Питание восстановлено" : "Включить переключатели", runSwitchPuzzle, "primary-action", state.powerRestored);
    if (state.powerRestored) makeAction("Открыть коридор 000", () => enterRoom("000"), "warning-action");
  } else {
    setStory("Коридор без конца", "Коридор уходит в темноту и возвращается к самому себе. На стене — три двери: одна ведёт наружу, другая зовёт знакомым голосом. Последняя открывается только тому, кто помнит, кем был.", "Твой выбор определит, что останется за дверью.");
    makeAction("Выйти и забыть эту ночь", () => finishGame("ordinary"), "primary-action");
    if (state.signalFound) makeAction("Ответить голосу за стеной", () => finishGame("secret"), "warning-action");
    if (state.signalFound && state.memoryChoice === "kept") makeAction("Восстановить настоящее имя", () => finishGame("truth"), "truth-action");
    if (!state.signalFound || state.memoryChoice !== "kept") {
      addMessage("Некоторые двери молчат. Возможно, в комнатах остались важные улики.");
    }
  }
}

function enterRoom(room) {
  state.room = room;
  playTone(720, 0.13);
  showOverview();
}

function inspectObject(name) {
  if (state.ending) return;
  playTone();
  actionList.replaceChildren();
  if (state.room === "404") inspect404(name);
  else if (state.room === "405") inspect405(name);
  else if (state.room === "406") inspect406(name);
  else inspect000(name);
}

function inspect404(name) {
  switch (name) {
    case "clock":
      setStory("Часы остановились", "Стрелки замерли на 04:04. Под стеклом выцарапано: «Время не идёт дальше, пока его не назовут».", "Запомни время. Оно может пригодиться.");
      addClue("clock");
      break;
    case "note":
      setStory("Записка на столе", "На пожелтевшей бумаге: «Сначала назови застывшее время. Потом слушай на 87,6. Не верь тому, кто повторяет тебя».", "Ты сложил записку и оставил её при себе.");
      addClue("note");
      break;
    case "mirror":
      state.mirrorInspections += 1;
      setStory("Старое зеркало", state.mirrorInspections < 3
        ? "Отражение запаздывает на долю секунды. На миг тебе кажется, что оно смотрит на что-то за твоим плечом."
        : "Отражение остаётся на месте, даже когда ты отворачиваешься. На запотевшем стекле проступает знак: звезда внутри круга."
      , state.mirrorInspections < 3 ? "Зеркало будто хочет что-то показать." : "В отражении вспыхивает тихий зелёный свет.");
      addClue("mirror");
      break;
    case "window":
      setStory("Окно без улицы", "За стеклом нет ни города, ни неба — только бесконечная темнота и несколько неподвижных огней. На стекле видны следы ладоней с внутренней стороны.", "Кажется, здесь давно никто не бывал.");
      break;
    case "terminal": openTerminal(); break;
    case "radio":
      if (state.terminalSolved) openRadio();
      else setStory("Радио в стене", "Сквозь помехи слышится короткая последовательность тонов. Записка может подсказать нужную частоту.", "Поищи подсказку.");
      break;
    case "door": inspectDoor(); break;
    case "shadow":
      state.signalFound = true;
      setStory("Знак в помехах", "В оконном стекле проступает тот же знак, что был в зеркале. Сквозь шум голос шепчет: «Я не копия. Я жду тебя по ту сторону».", "Запомни этот сигнал. Он понадобится в конце.");
      updateProgress();
      makeAction("Продолжить исследование", showOverview, "small-action");
      break;
    default: showOverview();
  }
}

function addClue(name) {
  if (state.clues.has(name)) {
    updateProgress();
    if (state.clues.size === 3) makeAction("Проверить терминал", openTerminal, "primary-action");
    return;
  }
  state.clues.add(name);
  playTone(720, 0.1);
  const messages = {
    clock: "Улика добавлена: застывшее время — 04:04.",
    note: "Улика добавлена: частота радио — 87,6.",
    mirror: "Улика добавлена: отражение ведёт себя странно."
  };
  updateProgress();
  addMessage(messages[name]);
  if (state.clues.size === 3) addMessage("Все улики на месте. Терминал ждёт код.");
}

function openTerminal() {
  actionList.replaceChildren();
  if (state.clues.size < 3) {
    setStory("Доступ закрыт", "Терминал не реагирует на прикосновения. На корпусе мигает надпись: «СНАЧАЛА УЛИКИ».", "Исследуй комнату внимательнее.");
    makeAction("Вернуться к комнате", showOverview, "small-action");
    return;
  }
  setStory("Терминал просит код", "На экране четыре пустых символа. Часы замерли на нужном времени — введи то, что они показывают.", "Введи четырёхзначный код.");
  const form = document.createElement("form");
  form.className = "code-form";
  const input = document.createElement("input");
  input.className = "code-input";
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.maxLength = 4;
  input.pattern = "[0-9]{4}";
  input.setAttribute("aria-label", "Четырёхзначный код");
  input.placeholder = "· · · ·";
  input.required = true;
  const submit = document.createElement("button");
  submit.className = "code-submit";
  submit.type = "submit";
  submit.textContent = "ВВОД";
  form.append(input, submit);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input.value.trim() !== "0404") {
      state.mistakes += 1;
      updateProgress();
      addMessage("Код не подходит. Прислушайся к часам и записке.");
      input.value = "";
      input.focus();
      return;
    }
    state.terminalSolved = true;
    playTone(790, 0.18);
    setStory("Доступ получен", "Терминал оживает. Радио ловит голос: «Ты нашёл меня. Теперь настрой частоту, прежде чем решишь, кому верить».", "Сначала настрой радио.");
    document.querySelector(".terminal-screen span").textContent = "ACCESS OK";
    document.querySelector("#door-art").classList.add("door-unlocked");
    actionList.replaceChildren();
    makeAction("Настроить радио", openRadio, "primary-action");
    updateProgress();
  });
  actionList.append(form);
  input.focus();
}

function openRadio() {
  actionList.replaceChildren();
  if (state.radioSolved) {
    setStory("Радио настроено", "На частоте 87,6 голос становится ясным: «Дверь открыта. Но сначала посмотри в окно». В стекле мерцает знакомый знак.", "Теперь ты знаешь, что ответить.");
    makeAction("Вернуться к комнате", showOverview, "small-action");
    return;
  }
  setStory("Настройка частоты", "Ты медленно крутишь регулятор. На 87,6 помехи складываются в слова. На других частотах — только шипение.", "Выбери частоту:");
  const choices = document.createElement("div");
  choices.className = "frequency-actions";
  for (const frequency of ["86,2", "87,6", "91,3"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "frequency-button";
    button.textContent = frequency;
    button.addEventListener("click", () => {
      if (frequency === "87,6") {
        state.radioSolved = true;
        setStory("Сигнал найден", "На частоте 87,6 голос становится ясным. В окне на миг мелькает тот же знак, что и в зеркале.", "Что-то мерцает в окне.");
        updateProgress();
        actionList.replaceChildren();
        makeAction("Вернуться к комнате", showOverview, "small-action");
      } else {
        state.mistakes += 1;
        updateProgress();
        addMessage("Только резкое шипение. Записка называла другую частоту.");
      }
    });
    choices.append(button);
  }
  actionList.append(choices);
}

function inspectDoor() {
  actionList.replaceChildren();
  if (!state.radioSolved) {
    setStory("Дверь не поддаётся", "Ручка холодная, а замок не принимает твою руку. Из-за двери доносится слабый стук — три раза.", "Сначала разберись с сигналом.");
    makeAction("Настроить радио", openRadio, "primary-action");
    return;
  }
  setStory("Выход открыт", "За дверью — новый коридор, а не улица. На стене табличка: «АРХИВ · 405».", "История продолжается.");
  makeAction("Перейти в архив 405", () => enterRoom("405"), "primary-action");
  if (state.signalFound) addMessage("Знак в окне отвечает на твой взгляд.");
}

function inspect405(name) {
  if (name === "door") {
    if (state.memoryChoice) enterRoom("406");
    else {
      setStory("Дверь заперта", "Архив не отпустит тебя, пока ты не решишь судьбу личного дела.", "Сначала открой дело и сделай выбор.");
      makeAction("Вернуться к материалам", showOverview, "small-action");
    }
    return;
  }
  if (name === "terminal") {
    openArchiveFile();
    return;
  }
  const entries = {
    clock: ["Каталог дат", "В журнале указано: «17 октября. Перенос пациента в комнату 404». В графе имени — пустое место.", "Дата совпадает с пометкой на твоём запястье.", "archiveDate"],
    note: ["Фотография", "На снимке — трое у двери 404. Двое смотрят в камеру. Третий отвернулся; на стекле за ним видна звезда в круге.", "Кто-то вырвал лицо с оборота фотографии.", "archivePhoto"],
    mirror: ["Аудиозапись", "Шипение, затем твой голос: «Если я забуду — переключатели: ближний, средний, дальний». На заднем плане кто-то повторяет последнее слово.", "Последовательность: 2 → 1 → 3.", "archiveAudio"],
    window: ["Дальние полки", "Ты замечаешь папки с такими же номерами, как комнаты. Между делами 405 и 406 спрятана схема серверной.", "На полях схемы: сначала ближний переключатель.", null],
    terminal: ["Личный архив", "Чтобы открыть личное дело, изучи три материала и реши, что делать со стёртой записью.", "Каталог, фото и диктофон содержат три части истории.", null],
    radio: ["Диктофон", "Старый диктофон воспроизводит короткий фрагмент: «Ближний. Средний. Дальний».", "Собери полную запись у стола.", null]
  };
  const [title, text, prompt, clue] = entries[name] || entries.window;
  setStory(title, text, prompt);
  if (clue) addArchiveClue(clue);
  else {
    if (state.archiveClues.has("archiveAudio") && name === "radio") addMessage("Последовательность переключателей: 2 → 1 → 3.");
    makeAction("Вернуться к архиву", showOverview, "small-action");
  }
}

function addArchiveClue(clue) {
  if (state.archiveClues.has(clue)) {
    updateProgress();
    addMessage("Эта запись уже сохранена в журнале.");
    if (state.archiveClues.size === 3) makeAction("Открыть личное дело", openArchiveFile, "primary-action");
    return;
  }
  state.archiveClues.add(clue);
  playTone(720, 0.1);
  updateProgress();
  addMessage("Материал добавлен в архивный журнал.");
  if (state.archiveClues.size === 3) {
    addMessage("Все материалы собраны. Можно открыть личное дело.");
    makeAction("Открыть личное дело", openArchiveFile, "primary-action");
  }
}

function openArchiveFile() {
  actionList.replaceChildren();
  if (state.archiveClues.size < 3) {
    setStory("Личное дело закрыто", "Замок папки щёлкает, но не открывается. В трёх разделах архива ещё остались незаполненные поля.", "Найди каталог, фотографию и запись.");
    makeAction("Вернуться к архиву", showOverview, "small-action");
    return;
  }
  if (state.memoryChoice) {
    setStory("Решение уже принято", state.memoryChoice === "kept"
      ? "Ты сохранил своё настоящее имя. Чернила в папке чуть посветлели."
      : "Ты стёр запись. Имя исчезло из папки — и из памяти."
    , "Можно продолжить путь.");
    makeAction("В серверную 406", () => enterRoom("406"), "primary-action");
    return;
  }
  setStory("Личное дело", "На последней странице проступает твоё настоящее имя. Голос из динамика умолкает. У тебя есть выбор: сохранить память о себе или стереть её навсегда.", "Это решение повлияет на последнюю комнату.");
  makeAction("Сохранить своё имя", () => chooseMemory("kept"), "primary-action");
  makeAction("Стереть запись", () => chooseMemory("erased"), "warning-action");
}

function chooseMemory(choice) {
  state.memoryChoice = choice;
  playTone(choice === "kept" ? 760 : 260, 0.18);
  setStory(choice === "kept" ? "Имя сохранено" : "Страница пуста",
    choice === "kept"
      ? "Ты произносишь своё имя вслух. Архивные лампы загораются одна за другой. Где-то далеко звучит ответ."
      : "Ты стираешь запись. На миг становится легче — но теперь ты не можешь вспомнить, чьим голосом говорило радио."
    , "Впереди серверная 406.");
  updateProgress();
  actionList.replaceChildren();
  makeAction("Перейти в серверную 406", () => enterRoom("406"), "primary-action");
}

function inspect406(name) {
  if (name === "door") {
    if (state.powerRestored) enterRoom("000");
    else {
      setStory("Дверь обесточена", "Электронный замок не отвечает. Сначала восстанови питание серверной.", "Проверь схему переключателей.");
      makeAction("Включить переключатели", runSwitchPuzzle, "primary-action");
    }
    return;
  }
  if (name === "radio" || name === "terminal") {
    runSwitchPuzzle();
    return;
  }
  if (name === "note") {
    setStory("Схема серверной", "Три переключателя расположены по глубине: 1 — средний, 2 — ближний, 3 — дальний. Голос в записи назвал порядок: ближний, средний, дальний.", "Нажми переключатели в последовательности 2 → 1 → 3.");
    makeAction("Начать настройку", runSwitchPuzzle, "primary-action");
    return;
  }
  if (name === "clock") {
    setStory("Панель индикаторов", state.powerRestored ? "Все три индикатора горят зелёным. Серверная снова подключена к сети." : `Горит ${state.switchSequence.length} из 3 индикаторов.`, "Нужный порядок — 2 → 1 → 3.");
    makeAction("Продолжить", showOverview, "small-action");
    return;
  }
  if (name === "window") {
    setStory("Аварийный свет", "Красный свет бьётся в металлических стенах. В стекле шкафа видно отражение двери, которой здесь нет.", "Серверная ждёт правильной последовательности.");
    makeAction("Проверить схему", runSwitchPuzzle, "primary-action");
    return;
  }
  setStory("Кабели под полом", "Кабели сходятся к главному щиту. На каждом закреплена бирка с номером.", "Не торопись с переключателями.");
  makeAction("Вернуться к серверной", showOverview, "small-action");
}

function runSwitchPuzzle() {
  actionList.replaceChildren();
  if (state.powerRestored) {
    setStory("Питание восстановлено", "Серверы загудели. На главном экране появляется надпись: «КОРИДОР 000 — ДОСТУП РАЗРЕШЁН».", "Путь к финалу открыт.");
    makeAction("Открыть коридор 000", () => enterRoom("000"), "primary-action");
    return;
  }
  setStory("Переключатели", `Последовательность: ${state.switchSequence.length ? state.switchSequence.join(" → ") : "—"}.`, "Включи ближний, средний и дальний переключатели: 2 → 1 → 3.");
  const choices = document.createElement("div");
  choices.className = "frequency-actions";
  for (const switchNumber of [1, 2, 3]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "frequency-button";
    button.textContent = `ЩИТОК ${switchNumber}`;
    button.addEventListener("click", () => {
      state.switchSequence.push(switchNumber);
      const expected = [2, 1, 3];
      const index = state.switchSequence.length - 1;
      if (state.switchSequence[index] !== expected[index]) {
        state.mistakes += 1;
        state.switchSequence = [];
        playTone(180, 0.16);
        updateProgress();
        setStory("Сбой питания", "Неверный порядок. Все переключатели вернулись в исходное положение.", "Вспомни запись из архива: ближний, средний, дальний.");
        actionList.replaceChildren();
        addMessage("Схема: 1 — средний, 2 — ближний, 3 — дальний.");
        makeAction("Попробовать снова", runSwitchPuzzle, "primary-action");
        return;
      }
      playTone(640 + state.switchSequence.length * 80, 0.1);
      if (state.switchSequence.length === expected.length) {
        state.powerRestored = true;
        updateProgress();
        setStory("Серверы ожили", "Переключатели щёлкают один за другим. Свет становится белым, на экране появляется номер 000.", "Теперь можно идти в последний коридор.");
        actionList.replaceChildren();
        makeAction("Открыть коридор 000", () => enterRoom("000"), "primary-action");
      } else {
        setStory("Порядок верный", `Переключатель ${switchNumber} зафиксирован.`, "Продолжи последовательность.");
        actionList.replaceChildren();
        makeAction("Продолжить", runSwitchPuzzle, "small-action");
      }
    });
    choices.append(button);
  }
  actionList.append(choices);
}

function inspect000(name) {
  if (name === "final-exit") {
    finishGame("ordinary");
    return;
  }
  if (name === "final-voice") {
    if (state.signalFound) finishGame("secret");
    else {
      setStory("Дверь молчит", "Ты не нашёл скрытый сигнал в комнате 404. За этой дверью только помехи.", "Исследуй знак в окне в комнате 404 или выбери другой выход.");
      makeAction("Вернуться к дверям", showOverview, "small-action");
    }
    return;
  }
  if (name === "final-memory") {
    if (state.signalFound && state.memoryChoice === "kept") finishGame("truth");
    else {
      setStory("Память не отвечает", "Для этой двери нужно сохранить своё имя в архиве 405 и найти скрытый знак в комнате 404.", "Ты можешь уйти или вернуться к исследованиям.");
      makeAction("Вернуться к дверям", showOverview, "small-action");
    }
    return;
  }
  if (name === "door") {
    showOverview();
    return;
  }
  if (name === "mirror" && state.signalFound && state.memoryChoice === "kept") {
    setStory("Настоящее отражение", "Ты смотришь в стекло и впервые видишь не пустую комнату и не чужой силуэт, а себя. Знак звезды складывается с именем на странице из архива.", "Теперь ты можешь восстановить правду.");
    makeAction("Восстановить настоящее имя", () => finishGame("truth"), "truth-action");
    return;
  }
  if (name === "window" && state.signalFound) {
    setStory("Голос за стеной", "Он больше не просит впустить его. Теперь он повторяет твоё имя — настоящее, не вычеркнутое из архива.", "Ответить ему или уйти?");
    makeAction("Ответить голосу", () => finishGame("secret"), "warning-action");
    makeAction("Вернуться к выбору", showOverview, "small-action");
    return;
  }
  if (name === "mirror") {
    setStory("Отражение в конце пути", state.memoryChoice === "kept"
      ? "В отражении проступает твоё настоящее имя — то самое, которое ты сохранил в архиве."
      : "Стекло отражает пустой коридор. Без имени лицо кажется чужим."
    , "Выбери дверь, которой готов довериться.");
    makeAction("Посмотреть на три двери", showOverview, "small-action");
    return;
  }
  setStory("Коридор возвращается", "Ты проходишь до самого конца и снова оказываешься у тех же трёх дверей. На полу — свежий след, ведущий только в одну сторону: к твоему решению.", "Выбери дверь в журнале.");
  makeAction("Вернуться к выбору", showOverview, "small-action");
}

function finishGame(ending) {
  state.ending = ending;
  playTone(ending === "truth" ? 1040 : ending === "secret" ? 920 : 440, 0.28);
  playScreen.classList.add("is-hidden");
  introScreen.classList.add("is-hidden");
  endingScreen.classList.remove("is-hidden");
  const title = document.querySelector("#ending-title");
  const kicker = document.querySelector("#ending-kicker");
  const copy = document.querySelector("#ending-copy");
  const mark = document.querySelector("#ending-mark");
  if (ending === "truth") {
    mark.textContent = "✦";
    kicker.textContent = "КОНЦОВКА 03 · НАСТОЯЩЕЕ ИМЯ";
    title.textContent = "Ты вспомнил";
    copy.textContent = "Имя возвращается вместе с воспоминанием: ты сам записал сигнал, чтобы не забыть дорогу обратно. Голос за стеной — не чужой. Это ты из другого круга времени. Двери исчезают, и часы наконец идут вперёд.";
  } else if (ending === "secret") {
    mark.textContent = "✧";
    kicker.textContent = "КОНЦОВКА 02 · ПО ТУ СТОРОНУ";
    title.textContent = "Ты ответил";
    copy.textContent = "Ты произносишь своё имя — и слышишь его в ответ уже не из комнаты. Коридор исчезает. На стекле остаётся знак звезды, а рядом появляется надпись: «Теперь нас двое».";
  } else {
    mark.textContent = "↗";
    kicker.textContent = "КОНЦОВКА 01 · ВЫХОД";
    title.textContent = "Ты выбрался";
    copy.textContent = "Ты выходишь на улицу. За спиной закрывается дверь 404, а часы наконец начинают идти. В кармане остаётся записка, хотя ты помнишь, что оставил её на столе.";
  }
  const stats = document.querySelector("#ending-stats");
  stats.replaceChildren();
  for (const text of [
    `УЛИКИ: ${state.clues.size}/3`,
    `АРХИВ: ${state.archiveClues.size}/3`,
    `ОШИБКИ: ${state.mistakes}`,
    `ПАМЯТЬ: ${state.memoryChoice === "kept" ? "СОХРАНЕНА" : state.memoryChoice === "erased" ? "СТЁРТА" : "—"}`
  ]) {
    const item = document.createElement("span");
    item.textContent = text;
    stats.append(item);
  }
}

function startGame() {
  state.room = "404";
  state.clues.clear();
  state.archiveClues.clear();
  state.mistakes = 0;
  state.mirrorInspections = 0;
  state.terminalSolved = false;
  state.radioSolved = false;
  state.signalFound = false;
  state.switchSequence = [];
  state.powerRestored = false;
  state.memoryChoice = null;
  state.ending = null;
  document.querySelector(".terminal-screen span").textContent = "NO SIGNAL";
  document.querySelector("#door-art").classList.remove("door-unlocked");
  endingScreen.classList.add("is-hidden");
  introScreen.classList.add("is-hidden");
  playScreen.classList.remove("is-hidden");
  showOverview();
}

document.querySelector("#start-button").addEventListener("click", startGame);
document.querySelector("#restart-button").addEventListener("click", startGame);
document.querySelector("#play-again-button").addEventListener("click", startGame);
document.querySelectorAll(".hotspot").forEach((button) => {
  button.addEventListener("click", () => inspectObject(button.dataset.object));
});
soundToggle.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
  soundLabel.textContent = state.soundEnabled ? "Звук вкл." : "Звук выкл.";
  if (state.soundEnabled) playTone(660, 0.11);
});
