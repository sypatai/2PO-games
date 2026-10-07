// ============================================================
// STRAWBERRY CAFÉ
// ============================================================


// ============================================================
// ELEMENTS
// ============================================================

const cafe = document.getElementById("cafe");
const canvas = document.getElementById("cafeCanvas");
const ctx = canvas.getContext("2d");

const orderText = document.getElementById("orderText");

const basement = document.getElementById("basement");
const keysText = document.getElementById("keysText");
const staminaBar = document.getElementById("staminaBar");
const flashlightText = document.getElementById("flashlightText");
const hiddenMessage = document.getElementById("hiddenMessage");

const ending = document.getElementById("ending");
const endingTitle = document.getElementById("endingTitle");
const endingText = document.getElementById("endingText");


// ============================================================
// CANVAS
// ============================================================

function resizeCafe() {
    canvas.width = 1000;
    canvas.height = 650;
}

resizeCafe();


// ============================================================
// DESSERTS
// ============================================================

const desserts = {

    cake: {
        icon: "🍰",
        name: "Клубничный пирог"
    },

    coffee: {
        icon: "☕",
        name: "Кофе"
    },

    cookie: {
        icon: "🍪",
        name: "Печенье"
    },

    cupcake: {
        icon: "🧁",
        name: "Кекс"
    },

    donut: {
        icon: "🍩",
        name: "Пончик"
    },

    pie: {
        icon: "🥧",
        name: "Яблочный пирог"
    },

    pudding: {
        icon: "🍮",
        name: "Пудинг"
    },

    tea: {
        icon: "🫖",
        name: "Чай"
    }

};


// ============================================================
// CUSTOMERS
// ============================================================

const normalCustomers = [

    {
        animal: "🐰",
        name: "Кролик",
        order: "cake",
        table: 0
    },

    {
        animal: "🐱",
        name: "Котик",
        order: "coffee",
        table: 1
    },

    {
        animal: "🦔",
        name: "Ёжик",
        order: "cookie",
        table: 2
    },

    {
        animal: "🐰",
        name: "Крольчиха",
        order: "cupcake",
        table: 3
    },

    {
        animal: "🐱",
        name: "Котик",
        order: "donut",
        table: 1
    },

    {
        animal: "🦔",
        name: "Ёжик",
        order: "pie",
        table: 0
    },

    {
        animal: "🐰",
        name: "Кролик",
        order: "pudding",
        table: 2
    },

    {
        animal: "🐱",
        name: "Котик",
        order: "tea",
        table: 3
    }

];


const predators = [

    {
        animal: "🐺",
        name: "Волк",
        order: "coffee",
        table: 1
    },

    {
        animal: "🦊",
        name: "Лиса",
        order: "cake",
        table: 2
    },

    {
        animal: "🐻",
        name: "Медведь",
        order: "pie",
        table: 0
    }

];


// ============================================================
// CAFE PLAYER
// ============================================================

const player = {

    x: 500,
    y: 540,

    speed: 3.3,

    holding: null

};


let activeCustomer = normalCustomers[0];
let customerIndex = 0;
let predatorIndex = 0;

let cafePhase = "cute";

let basementRunning = false;


// ============================================================
// KEYBOARD
// ============================================================

const keys = {};

window.addEventListener("keydown", function (e) {

    keys[e.key.toLowerCase()] = true;

    if (
        e.key.toLowerCase() === "e" &&
        !basementRunning
    ) {
        cafeInteract();
    }

});

window.addEventListener("keyup", function (e) {

    keys[e.key.toLowerCase()] = false;

});


// ============================================================
// ORDER
// ============================================================

function updateOrder() {

    if (!activeCustomer) {
        orderText.textContent = "ГОТОВО";
        return;
    }

    const dessert = desserts[activeCustomer.order];

    orderText.textContent =
        dessert.icon + " " + dessert.name;

}


// ============================================================
// CAFE DRAW
// ============================================================

function drawCafe() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // FLOOR

    ctx.fillStyle =
        cafePhase === "cute"
            ? "#ffe6f0"
            : "#b8a3ad";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // TILES

    ctx.strokeStyle =
        cafePhase === "cute"
            ? "#f2cbd9"
            : "#8e7c85";

    ctx.lineWidth = 2;

    for (
        let x = 0;
        x < canvas.width;
        x += 50
    ) {

        for (
            let y = 0;
            y < canvas.height;
            y += 50
        ) {

            ctx.strokeRect(
                x,
                y,
                50,
                50
            );

        }

    }


    // BACK WALL

    ctx.fillStyle =
        cafePhase === "cute"
            ? "#ffd0e2"
            : "#99858f";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        95
    );


    // WINDOWS

    drawWindow(80, 20);
    drawWindow(805, 20);


    // DOOR

    ctx.fillStyle =
        cafePhase === "cute"
            ? "#a87869"
            : "#62555d";

    ctx.fillRect(
        455,
        0,
        90,
        95
    );

    ctx.fillStyle = "#ddd";

    ctx.font = "14px monospace";
    ctx.textAlign = "center";

    ctx.fillText(
        "DOOR",
        500,
        50
    );


    // COUNTER

    drawCounter();


    // TABLES

    drawTable(300, 210);
    drawTable(700, 210);
    drawTable(300, 410);
    drawTable(700, 410);


    // CUSTOMER

    if (activeCustomer) {

        const positions = [
            [300, 210],
            [700, 210],
            [300, 410],
            [700, 410]
        ];

        const position =
            positions[activeCustomer.table];

        ctx.font = "52px Arial";

        ctx.fillText(
            activeCustomer.animal,
            position[0],
            position[1] - 35
        );

    }


    // PLAYER

    ctx.font = "48px Arial";

    ctx.fillText(
        "🐰",
        player.x,
        player.y
    );


    // HELD DESSERT

    if (player.holding) {

        const dessert =
            desserts[player.holding];

        ctx.font = "25px Arial";

        ctx.fillText(
            dessert.icon,
            player.x + 35,
            player.y - 25
        );

    }


    // WOLF

    if (cafePhase === "chase") {

        ctx.font = "55px Arial";

        ctx.fillText(
            "🐺",
            player.x - 130,
            player.y
        );

    }

}


// ============================================================
// WINDOW
// ============================================================

function drawWindow(x, y) {

    ctx.fillStyle = "#bde7f2";

    ctx.fillRect(
        x,
        y,
        110,
        55
    );

    ctx.strokeStyle = "#fff";

    ctx.lineWidth = 5;

    ctx.strokeRect(
        x,
        y,
        110,
        55
    );

}


// ============================================================
// COUNTER
// ============================================================

function drawCounter() {

    ctx.fillStyle =
        cafePhase === "cute"
            ? "#ca91aa"
            : "#77636d";

    ctx.fillRect(
        30,
        120,
        205,
        105
    );


    ctx.fillStyle = "#fff0f6";

    ctx.font = "bold 15px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "DESSERTS",
        132,
        145
    );


    const icons = [
        "🍰",
        "☕",
        "🍪",
        "🧁",
        "🍩",
        "🥧",
        "🍮",
        "🫖"
    ];


    icons.forEach(function (icon, i) {

        ctx.font = "28px Arial";

        ctx.fillText(
            icon,
            62 + (i % 4) * 42,
            180 + Math.floor(i / 4) * 36
        );

    });

}


// ============================================================
// TABLE
// ============================================================

function drawTable(x, y) {

    ctx.fillStyle =
        cafePhase === "cute"
            ? "#d59b7b"
            : "#796971";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        60,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "#fff0f5";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.font = "25px Arial";

    ctx.fillText(
        "🌷",
        x,
        y + 8
    );

}


// ============================================================
// PLAYER MOVEMENT
// ============================================================

function movePlayer() {

    let dx = 0;
    let dy = 0;


    if (keys["arrowleft"]) {
        dx--;
    }

    if (keys["arrowright"]) {
        dx++;
    }

    if (keys["arrowup"]) {
        dy--;
    }

    if (keys["arrowdown"]) {
        dy++;
    }


    if (dx !== 0 || dy !== 0) {

        const length =
            Math.hypot(dx, dy);

        dx /= length;
        dy /= length;


        player.x += dx * player.speed;
        player.y += dy * player.speed;

    }


    player.x = Math.max(
        250,
        Math.min(940, player.x)
    );

    player.y = Math.max(
        110,
        Math.min(575, player.y)
    );

}


// ============================================================
// NEAR COUNTER
// ============================================================

function nearCounter() {

    return (
        player.x < 260 &&
        player.y > 110 &&
        player.y < 250
    );

}


// ============================================================
// NEAR TABLE
// ============================================================

function nearTable() {

    if (!activeCustomer) {
        return false;
    }

    const positions = [
        [300, 210],
        [700, 210],
        [300, 410],
        [700, 410]
    ];

    const p =
        positions[activeCustomer.table];

    return (
        Math.hypot(
            player.x - p[0],
            player.y - p[1]
        ) < 105
    );

}


// ============================================================
// CAFE INTERACTION
// ============================================================

function cafeInteract() {

    if (
        cafePhase === "chase" ||
        cafePhase === "transition"
    ) {
        return;
    }


    // TAKE DESSERT

    if (
        nearCounter() &&
        !player.holding
    ) {

        player.holding =
            activeCustomer.order;

        return;

    }


    // GIVE DESSERT

    if (
        nearTable() &&
        player.holding &&
        activeCustomer
    ) {

        if (
            player.holding ===
            activeCustomer.order
        ) {

            player.holding = null;

            nextCustomer();

        }

    }

}


// ============================================================
// NEXT CUSTOMER
// ============================================================

function nextCustomer() {

    if (cafePhase === "cute") {

        customerIndex++;

        if (
            customerIndex >=
            normalCustomers.length
        ) {

            startPredators();

        }
        else {

            activeCustomer =
                normalCustomers[customerIndex];

            updateOrder();

        }

        return;
    }


    if (cafePhase === "predators") {

        predatorIndex++;

        if (
            predatorIndex >=
            predators.length
        ) {

            startWolfChase();

        }
        else {

            activeCustomer =
                predators[predatorIndex];

            updateOrder();

        }

    }

}


// ============================================================
// PREDATORS
// ============================================================

function startPredators() {

    cafePhase = "predators";

    predatorIndex = 0;

    activeCustomer =
        predators[0];

    cafe.classList.add("horror");

    updateOrder();

}


// ============================================================
// CHASE
// ============================================================

function startWolfChase() {

    cafePhase = "transition";

    cafe.classList.add("horror");

    setTimeout(function () {

        startBasement();

    }, 1500);

}


// ============================================================
// CAFE LOOP
// ============================================================

function cafeLoop() {

    if (!basementRunning) {

        movePlayer();

        drawCafe();

    }

    requestAnimationFrame(cafeLoop);

}

updateOrder();
cafeLoop();


// ============================================================
// THREE.JS BASEMENT
// ============================================================

let scene = null;
let camera = null;
let renderer = null;

let flashlight = null;
let wolf = null;

let basementKeys = [];
let closets = [];

let collectedKeys = 0;

let stamina = 100;

let flashlightOn = true;
let hiding = false;

let yaw = 0;
let pitch = 0;

let endingShown = false;

const basementPlayer = {
    x: 0,
    y: 1.6,
    z: 13,

    walkSpeed: 2.7,
    runSpeed: 5.2
};

const basementKeysPressed = {};


// ============================================================
// START BASEMENT
// ============================================================

function startBasement() {

    if (basementRunning) {
        return;
    }

    basementRunning = true;

    cafe.style.display = "none";
    basement.style.display = "block";

    create3DWorld();

}


// ============================================================
// CREATE WORLD
// ============================================================

function create3DWorld() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x030405);

    scene.fog =
        new THREE.FogExp2(
            0x050608,
            0.065
        );


    camera =
        new THREE.PerspectiveCamera(
            75,
            window.innerWidth /
            window.innerHeight,
            0.05,
            100
        );


    camera.position.set(
        basementPlayer.x,
        basementPlayer.y,
        basementPlayer.z
    );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            1.5
        )
    );


    basement.appendChild(
        renderer.domElement
    );


    // LIGHT

    scene.add(
        new THREE.AmbientLight(
            0x25252d,
            0.25
        )
    );


    flashlight =
        new THREE.SpotLight(
            0xffffff,
            5,
            16,
            Math.PI / 7,
            0.5,
            1
        );


    scene.add(flashlight);
    scene.add(flashlight.target);


    buildBasement();
    createBasementKeys();
    createClosets();
    createWolf();


    window.addEventListener(
        "resize",
        resizeBasement
    );


    document.addEventListener(
        "mousemove",
        lookAround
    );


    document.addEventListener(
        "keydown",
        basementDown
    );


    document.addEventListener(
        "keyup",
        basementUp
    );


    basement.addEventListener(
        "click",
        function () {

            if (
                document.pointerLockElement !==
                basement
            ) {

                basement.requestPointerLock();

            }

        }
    );


    previousTime =
        performance.now();


    renderer.setAnimationLoop(
        basementLoop
    );

}


// ============================================================
// WALL
// ============================================================

function makeWall(
    x,
    y,
    z,
    sx,
    sy,
    sz
) {

    const geometry =
        new THREE.BoxGeometry(
            sx,
            sy,
            sz
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x292a2f,
            roughness: 1
        });


    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );


    mesh.position.set(
        x,
        y,
        z
    );


    scene.add(mesh);

    return mesh;

}


// ============================================================
// BASEMENT
// ============================================================

function buildBasement() {

    // FLOOR

    const floor =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                50,
                50
            ),

            new THREE.MeshStandardMaterial({
                color: 0x111216,
                roughness: 1
            })
        );


    floor.rotation.x =
        -Math.PI / 2;

    scene.add(floor);


    // CEILING

    makeWall(
        0,
        4,
        0,
        50,
        0.2,
        50
    );


    // OUTER WALLS

    makeWall(
        0,
        2,
        -18,
        40,
        4,
        0.5
    );

    makeWall(
        0,
        2,
        18,
        40,
        4,
        0.5
    );

    makeWall(
        -20,
        2,
        0,
        0.5,
        4,
        36
    );

    makeWall(
        20,
        2,
        0,
        0.5,
        4,
        36
    );


    // INNER WALLS

    const walls = [

        [0, 2, 5, 30, 4, 0.5],

        [-10, 2, -3, 0.5, 4, 16],

        [8, 2, -2, 24, 4, 0.5],

        [12, 2, 7, 0.5, 4, 18],

        [-4, 2, 12, 18, 4, 0.5],

        [-14, 2, 9, 0.5, 4, 10],

        [0, 2, -10, 18, 4, 0.5],

        [4, 2, -14, 0.5, 4, 8],

        [-7, 2, -14, 0.5, 4, 8],

        [15, 2, -10, 10, 4, 0.5]

    ];


    walls.forEach(function (wall) {

        makeWall(...wall);

    });

}


// ============================================================
// KEYS
// ============================================================

function createBasementKeys() {

    const positions = [

        [-15, 0.9, -13],
        [14, 0.9, -7],
        [-15, 0.9, 14],
        [14, 0.9, 13]

    ];


    positions.forEach(function (position, index) {

        const geometry =
            new THREE.TorusGeometry(
                0.2,
                0.06,
                8,
                16
            );


        const material =
            new THREE.MeshStandardMaterial({
                color: 0xd9d69a,
                emissive: 0x444422
            });


        const key =
            new THREE.Mesh(
                geometry,
                material
            );


        key.position.set(
            position[0],
            position[1],
            position[2]
        );


        key.rotation.x =
            Math.PI / 2;


        key.userData.index = index;

        scene.add(key);

        basementKeys.push(key);

    });

}


// ============================================================
// CLOSETS
// ============================================================

function createClosets() {

    const positions = [

        [-16, 1.5, 0],
        [16, 1.5, 3],
        [-2, 1.5, -16],
        [5, 1.5, 15]

    ];


    positions.forEach(function (position) {

        const group =
            new THREE.Group();


        const body =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1.6,
                    3,
                    0.8
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x30262a
                })
            );


        body.position.set(
            0,
            0,
            0
        );


        group.add(body);


        group.position.set(
            position[0],
            position[1],
            position[2]
        );


        scene.add(group);

        closets.push(group);

    });

}


// ============================================================
// WOLF
// ============================================================

function createWolf() {

    wolf =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.1,
                1.5,
                0.8
            ),

            new THREE.MeshStandardMaterial({
                color: 0x36373d
            })
        );


    body.position.y = 1;

    wolf.add(body);


    const head =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.95,
                0.85,
                0.85
            ),

            new THREE.MeshStandardMaterial({
                color: 0x47484e
            })
        );


    head.position.y = 2;

    wolf.add(head);


    wolf.position.set(
        0,
        0,
        -8
    );


    scene.add(wolf);

}


// ============================================================
// BASEMENT INPUT
// ============================================================

function basementDown(e) {

    const key =
        e.key.toLowerCase();

    basementKeysPressed[key] = true;


    if (key === "q") {

        flashlightOn =
            !flashlightOn;

        flashlight.visible =
            flashlightOn;

        flashlightText.textContent =
            flashlightOn
                ? "ON [Q]"
                : "OFF [Q]";

    }


    if (key === "e") {

        toggleCloset();

    }

}


function basementUp(e) {

    basementKeysPressed[
        e.key.toLowerCase()
    ] = false;

}


// ============================================================
// MOUSE LOOK
// ============================================================

function lookAround(e) {

    if (!basementRunning) {
        return;
    }


    if (
        document.pointerLockElement !==
        basement
    ) {
        return;
    }


    yaw -=
        e.movementX * 0.002;


    pitch -=
        e.movementY * 0.002;


    pitch =
        Math.max(
            -1.3,
            Math.min(
                1.3,
                pitch
            )
        );

}


// ============================================================
// MOVEMENT
// ============================================================

function move3D(dt) {

    if (hiding) {
        return;
    }


    const forward =
        new THREE.Vector3(
            Math.sin(yaw),
            0,
            Math.cos(yaw)
        );


    const right =
        new THREE.Vector3(
            Math.cos(yaw),
            0,
            -Math.sin(yaw)
        );


    const direction =
        new THREE.Vector3();


    if (basementKeysPressed["w"]) {
        direction.add(forward);
    }

    if (basementKeysPressed["s"]) {
        direction.sub(forward);
    }

    if (basementKeysPressed["d"]) {
        direction.add(right);
    }

    if (basementKeysPressed["a"]) {
        direction.sub(right);
    }


    if (direction.lengthSq() === 0) {

        stamina =
            Math.min(
                100,
                stamina + 15 * dt
            );

        return;

    }


    direction.normalize();


    const running =
        basementKeysPressed["shift"] &&
        stamina > 0;


    const speed =
        running
            ? basementPlayer.runSpeed
            : basementPlayer.walkSpeed;


    if (running) {

        stamina -=
            28 * dt;

    }
    else {

        stamina +=
            12 * dt;

    }


    stamina =
        Math.max(
            0,
            Math.min(
                100,
                stamina
            )
        );


    basementPlayer.x +=
        direction.x *
        speed *
        dt;


    basementPlayer.z +=
        direction.z *
        speed *
        dt;


    basementPlayer.x =
        Math.max(
            -18.5,
            Math.min(
                18.5,
                basementPlayer.x
            )
        );


    basementPlayer.z =
        Math.max(
            -16.5,
            Math.min(
                16.5,
                basementPlayer.z
            )
        );

}


// ============================================================
// WOLF AI
// ============================================================

function moveWolf(dt) {

    if (
        hiding ||
        !wolf
    ) {
        return;
    }


    const dx =
        basementPlayer.x -
        wolf.position.x;


    const dz =
        basementPlayer.z -
        wolf.position.z;


    const distance =
        Math.hypot(
            dx,
            dz
        );


    if (distance > 1.2) {

        const wolfSpeed = 1.5;


        wolf.position.x +=
            (dx / distance) *
            wolfSpeed *
            dt;


        wolf.position.z +=
            (dz / distance) *
            wolfSpeed *
            dt;

    }


    wolf.lookAt(
        basementPlayer.x,
        wolf.position.y,
        basementPlayer.z
    );


    if (distance < 1.15) {

        caught();

    }

}


// ============================================================
// COLLECT KEYS
// ============================================================

function collectBasementKeys() {

    basementKeys.forEach(function (key) {

        if (!key.visible) {
            return;
        }


        const distance =
            Math.hypot(
                basementPlayer.x -
                key.position.x,

                basementPlayer.z -
                key.position.z
            );


        if (distance < 1.25) {

            key.visible = false;

            collectedKeys++;


            keysText.textContent =
                collectedKeys + " / 4";


            if (collectedKeys >= 4) {

                escape();

            }

        }

    });

}


// ============================================================
// CLOSET
// ============================================================

function toggleCloset() {

    if (hiding) {

        hiding = false;

        hiddenMessage.style.opacity = "0";

        return;

    }


    let closest = null;
    let closestDistance = Infinity;


    closets.forEach(function (closet) {

        const distance =
            Math.hypot(
                basementPlayer.x -
                closet.position.x,

                basementPlayer.z -
                closet.position.z
            );


        if (
            distance < closestDistance
        ) {

            closestDistance = distance;
            closest = closet;

        }

    });


    if (
        closest &&
        closestDistance < 2.4
    ) {

        hiding = true;

        hiddenMessage.style.opacity = "1";

    }

}


// ============================================================
// ESCAPE
// ============================================================

function escape() {

    if (endingShown) {
        return;
    }


    endingShown = true;

    basementRunning = false;

    renderer.setAnimationLoop(null);


    endingTitle.textContent =
        "ТЫ СБЕЖАЛА";


    endingText.textContent =
        "Ты нашла четыре ключа и выбралась из подвала. " +
        "Но когда ты обернулась, двери кафе уже не было.";


    ending.style.display = "flex";

}


// ============================================================
// CAUGHT
// ============================================================

function caught() {

    if (endingShown) {
        return;
    }


    endingShown = true;

    basementRunning = false;

    renderer.setAnimationLoop(null);


    endingTitle.textContent =
        "ТЫ ПОПАЛАСЬ";


    endingText.textContent =
        "Волк оказался быстрее. " +
        "Темнота подвала поглотила тебя.";


    ending.style.display = "flex";

}


// ============================================================
// BASEMENT LOOP
// ============================================================

let previousTime =
    performance.now();


function basementLoop(now) {

    if (!basementRunning) {
        return;
    }


    const dt =
        Math.min(
            (now - previousTime) / 1000,
            0.05
        );


    previousTime = now;


    move3D(dt);
    moveWolf(dt);
    collectBasementKeys();


    camera.position.set(
        basementPlayer.x,
        basementPlayer.y,
        basementPlayer.z
    );


    camera.rotation.order = "YXZ";

    camera.rotation.y = yaw;
    camera.rotation.x = pitch;


    flashlight.position.copy(
        camera.position
    );


    flashlight.target.position.set(

        basementPlayer.x -
        Math.sin(yaw) * 5,

        basementPlayer.y -
        Math.sin(pitch) * 2,

        basementPlayer.z -
        Math.cos(yaw) * 5

    );


    staminaBar.style.width =
        stamina + "%";


    renderer.render(
        scene,
        camera
    );

}


// ============================================================
// RESIZE
// ============================================================

function resizeBasement() {

    if (!renderer || !camera) {
        return;
    }


    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

}
