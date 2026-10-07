const game = document.getElementById("game");
const cat = document.getElementById("cat");
const bombsOnCat = document.getElementById("bombs");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const levelText = document.getElementById("level");
const timeText = document.getElementById("time");
const startBtn = document.getElementById("startBtn");


let score = 0;
let lives = 3;
let level = 1;
let time = 30;

let gameRunning = false;

let catX = 50;
let catY = 50;

let timer;
let itemTimer;

let speed = 0;
let maxSpeed = 1.7;
let acceleration = 0.08;

let keys = {};


const levels = {

    1: {
        goal: 50,
        time: 30,
        spawn: 1500
    },

    2: {
        goal: 100,
        time: 35,
        spawn: 1300
    },

    3: {
        goal: 150,
        time: 40,
        spawn: 1100
    },

    4: {
        goal: 200,
        time: 45,
        spawn: 900
    },

    5: {
        goal: 250,
        time: 50,
        spawn: 700
    }

};


/* =========================
   НАЧАЛО
========================= */

function startGame() {

    score = 0;
    lives = 3;
    level = 1;
    time = levels[1].time;

    gameRunning = true;

    speed = 0;
    keys = {};

    document.querySelectorAll(".item").forEach(item => item.remove());
    document.querySelectorAll(".cat-trail").forEach(item => item.remove());

    bombsOnCat.innerHTML = "";

    catX = 50;
    catY = 50;

    cat.style.left = catX + "%";
    cat.style.top = catY + "%";
    cat.style.display = "block";

    scoreText.textContent = score;
    livesText.textContent = lives;
    levelText.textContent = level;
    timeText.textContent = time;

    startBtn.textContent = "Игра идёт...";
    startBtn.disabled = true;

    clearInterval(timer);
    clearInterval(itemTimer);

    timer = setInterval(() => {

        if (!gameRunning) return;

        time--;

        timeText.textContent = time;

        if (time <= 0) {
            finishLevel();
        }

    }, 1000);


    itemTimer = setInterval(() => {
        createItem();
    }, levels[level].spawn);


    createItem();

    setTimeout(createItem, 500);
    setTimeout(createItem, 1000);
}


/* =========================
   СОЗДАНИЕ ПРЕДМЕТОВ
========================= */

function createItem() {

    if (!gameRunning) return;

    const item = document.createElement("div");

    item.classList.add("item");


    let type = Math.random();


    /* Рыбка */

    if (type < 0.45) {

        const fishColors = [
            "fish-pink",
            "fish-blue",
            "fish-gold",
            "fish-purple"
        ];

        const color =
            fishColors[
                Math.floor(Math.random() * fishColors.length)
            ];

        item.innerHTML = '<div class="fish ' + color + '"></div>';

        item.dataset.type = "fish";
    }


    /* Клубок */

    else if (type < 0.8) {

        const yarnColors = [
            "yarn-pink",
            "yarn-blue",
            "yarn-purple"
        ];

        const color =
            yarnColors[
                Math.floor(Math.random() * yarnColors.length)
            ];

        item.innerHTML = '<div class="yarn ' + color + '"></div>';

        item.dataset.type = "yarn";
    }


    /* Бомба */

    else {

        item.innerHTML = '<div class="bomb"></div>';

        item.dataset.type = "bomb";
    }


    /* На уровнях 3+ больше бомб */

    if (level >= 3 && Math.random() < 0.45) {

        item.innerHTML = '<div class="bomb"></div>';

        item.dataset.type = "bomb";
    }


    let x;
    let y;
    let attempts = 0;


    do {

        x = Math.random() * 85 + 5;
        y = Math.random() * 75 + 10;

        attempts++;

    } while (
        isTooClose(x, y) &&
        attempts < 30
    );


    item.style.left = x + "%";
    item.style.top = y + "%";

    game.appendChild(item);


    setTimeout(() => {

        if (item.parentElement) {
            item.remove();
        }

    }, 7000);
}


/* =========================
   РАССТОЯНИЕ
========================= */

function isTooClose(x, y) {

    const items = document.querySelectorAll(".item");

    for (const item of items) {

        const itemX = parseFloat(item.style.left);
        const itemY = parseFloat(item.style.top);

        const distance = Math.sqrt(
            Math.pow(x - itemX, 2) +
            Math.pow(y - itemY, 2)
        );

        if (distance < 12) {
            return true;
        }
    }


    const catDistance = Math.sqrt(
        Math.pow(x - catX, 2) +
        Math.pow(y - catY, 2)
    );


    return catDistance < 15;
}


/* =========================
   УПРАВЛЕНИЕ
========================= */

document.addEventListener("keydown", event => {

    if (!gameRunning) return;

    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {

        event.preventDefault();

        keys[event.key] = true;
    }

});


document.addEventListener("keyup", event => {

    keys[event.key] = false;

    speed = 0;
});


/* =========================
   ПЛАВНОЕ ДВИЖЕНИЕ
========================= */

function moveCatSmoothly() {

    if (gameRunning) {

        const moving =
            keys["ArrowUp"] ||
            keys["ArrowDown"] ||
            keys["ArrowLeft"] ||
            keys["ArrowRight"];


        if (moving) {

            speed += acceleration;

            if (speed > maxSpeed) {
                speed = maxSpeed;
            }


            if (keys["ArrowUp"]) {
                moveCat(0, -speed);
            }

            if (keys["ArrowDown"]) {
                moveCat(0, speed);
            }

            if (keys["ArrowLeft"]) {
                moveCat(-speed, 0);
            }

            if (keys["ArrowRight"]) {
                moveCat(speed, 0);
            }


            createCatTrail();
        }
    }


    requestAnimationFrame(moveCatSmoothly);
}


/* =========================
   ШЛЕЙФ
========================= */

function createCatTrail() {

    const trail = document.createElement("div");

    trail.className = "cat-trail";

    trail.style.left = catX + "%";
    trail.style.top = catY + "%";

    game.appendChild(trail);


    setTimeout(() => {

        trail.remove();

    }, 800);
}


/* =========================
   ДВИЖЕНИЕ
========================= */

function moveCat(x, y) {

    if (!gameRunning) return;

    catX += x;
    catY += y;

    catX = Math.max(5, Math.min(95, catX));
    catY = Math.max(8, Math.min(92, catY));

    cat.style.left = catX + "%";
    cat.style.top = catY + "%";

    checkCollision();
}


/* =========================
   СТОЛКНОВЕНИЕ
========================= */

function checkCollision() {

    const catRect = cat.getBoundingClientRect();


    document.querySelectorAll(".item").forEach(item => {

        const itemRect = item.getBoundingClientRect();


        const collision =
            catRect.left < itemRect.right &&
            catRect.right > itemRect.left &&
            catRect.top < itemRect.bottom &&
            catRect.bottom > itemRect.top;


        if (!collision) return;


        if (item.dataset.type === "fish") {

            score += 10;
        }


        if (item.dataset.type === "yarn") {

            score += 5;
        }


        if (item.dataset.type === "bomb") {

            lives--;

            const bomb = document.createElement("span");

            bomb.textContent = "💣";

            bomb.classList.add("bomb-on-cat");

            bombsOnCat.appendChild(bomb);


            if (lives <= 0) {

                item.remove();

                scoreText.textContent = score;
                livesText.textContent = lives;

                explodeCat();

                return;
            }
        }


        item.remove();

        scoreText.textContent = score;
        livesText.textContent = lives;

        checkLevel();

    });
}


/* =========================
   УРОВЕНЬ
========================= */

function checkLevel() {

    if (!gameRunning) return;

    if (score >= levels[level].goal) {

        if (level < 5) {
            nextLevel();
        } else {
            winGame();
        }
    }
}


/* =========================
   СЛЕДУЮЩИЙ УРОВЕНЬ
========================= */

function nextLevel() {

    gameRunning = false;

    clearInterval(timer);
    clearInterval(itemTimer);

    level++;

    levelText.textContent = level;

    document.querySelectorAll(".item").forEach(item => item.remove());

    showLevelMessage();


    setTimeout(() => {

        time = levels[level].time;

        timeText.textContent = time;

        gameRunning = true;


        timer = setInterval(() => {

            if (!gameRunning) return;

            time--;

            timeText.textContent = time;

            if (time <= 0) {
                finishLevel();
            }

        }, 1000);


        itemTimer = setInterval(
            createItem,
            levels[level].spawn
        );


        createItem();
        createItem();

    }, 1500);
}


/* =========================
   СООБЩЕНИЕ
========================= */

function showLevelMessage() {

    const message = document.createElement("div");

    message.className = "level-up";

    message.innerHTML =
        "🎉 УРОВЕНЬ " +
        level +
        "<br><br>Ты молодец! 🐱";

    game.appendChild(message);


    setTimeout(() => {
        message.remove();
    }, 1300);
}


/* =========================
   ВРЕМЯ
========================= */

function finishLevel() {

    if (!gameRunning) return;


    if (score >= levels[level].goal) {

        if (level < 5) {
            nextLevel();
        } else {
            winGame();
        }

    } else {

        gameOver();
    }
}


/* =========================
   ВЗРЫВ
========================= */

function explodeCat() {

    gameRunning = false;

    clearInterval(timer);
    clearInterval(itemTimer);


    const explosion = document.createElement("div");

    explosion.className = "explosion";

    explosion.textContent = "💥";

    explosion.style.left = catX + "%";
    explosion.style.top = catY + "%";

    game.appendChild(explosion);

    cat.style.display = "none";


    setTimeout(() => {

        explosion.remove();

        cat.style.display = "block";

        gameOver();

    }, 700);
}


/* =========================
   ПРОИГРЫШ
========================= */

function gameOver() {

    gameRunning = false;

    clearInterval(timer);
    clearInterval(itemTimer);

    startBtn.disabled = false;

    startBtn.textContent = "Играть снова";


    setTimeout(() => {

        alert(
            "💥 Игра окончена!\n\n" +
            "🐱 Уровень: " + level +
            "\n⭐ Очки: " + score
        );

    }, 100);
}


/* =========================
   ПОБЕДА
========================= */

function winGame() {

    gameRunning = false;

    clearInterval(timer);
    clearInterval(itemTimer);

    startBtn.disabled = false;

    startBtn.textContent = "Играть снова";


    setTimeout(() => {

        alert(
            "🏆 ПОБЕДА!\n\n" +
            "🐱 Ты прошла все 5 уровней!\n\n" +
            "⭐ Очки: " + score
        );

    }, 100);
}


/* =========================
   КНОПКА
========================= */

startBtn.addEventListener("click", startGame);


/* Запуск управления */

moveCatSmoothly();