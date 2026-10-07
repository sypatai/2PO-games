// ==========================
// СОСТОЯНИЕ ИГРЫ
// ==========================

let money = 20;

let day = 1;

let time = 9;


// Получаем элементы страницы

const customer =
    document.getElementById("customer");

const customerName =
    document.getElementById("customer-name");

const dialogueText =
    document.getElementById("dialogue-text");

const moneyText =
    document.getElementById("money");

const timeText =
    document.getElementById("time");

const statusText =
    document.getElementById("status");


// ==========================
// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ==========================

function updateUI() {

    moneyText.textContent =
        "💰 " + money;

    timeText.textContent =
        String(time).padStart(2, "0") + ":00";

}


// ==========================
// КОТЁНОК
// ==========================

function serveCake() {

    money += 5;

    time++;

    customerName.textContent =
        "Котёнок";

    dialogueText.textContent =
        "Мяу! Спасибо! Этот пирог был очень вкусный! 🍓";

    statusText.textContent =
        "Ты заработала 5 монет ♡";

    updateUI();

    setTimeout(nextCustomer, 1500);
}


// ==========================
// РАЗГОВОР
// ==========================

function talkToCustomer() {

    time++;

    customerName.textContent =
        "Котёнок";

    dialogueText.textContent =
        "Я люблю это кафе! Здесь так уютно. Надеюсь, оно будет работать всегда! 🐱💕";

    statusText.textContent =
        "Посетитель доволен ♡";

    updateUI();

}


// ==========================
// СЛЕДУЮЩИЙ ПОСЕТИТЕЛЬ
// ==========================

function nextCustomer() {

    customer.textContent =
        "🦔";

    customerName.textContent =
        "Ёжик";

    dialogueText.textContent =
        "Здравствуйте! Можно мне чашечку тёплого чая? ☕";

    statusText.textContent =
        "Новый посетитель!";

    updateUI();

}