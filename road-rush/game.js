const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const finalScoreElement = document.getElementById("finalScore");

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");


// ================================
// CANVAS
// ================================

canvas.width = 400;
canvas.height = 650;


// ================================
// ROAD SETTINGS
// ================================

const roadWidth = 300;
const roadX = (canvas.width - roadWidth) / 2;
const laneWidth = roadWidth / 3;


// ================================
// GAME VARIABLES
// ================================

let gameRunning = false;

let score = 0;
let highScore = 0;

let speed = 5;

let roadOffset = 0;

let enemyTimer = 0;

let enemies = [];


// ================================
// PLAYER
// ================================

const player = {

    lane: 1,

    width: 45,
    height: 75,

    y: canvas.height - 110,

    color: "#ffffff"

};


// ================================
// GET LANE POSITION
// ================================

function getLaneX(lane) {

    return (
        roadX +
        lane * laneWidth +
        laneWidth / 2
    );

}


// ================================
// DRAW PLAYER
// ================================

function drawPlayer() {

    const x = getLaneX(player.lane);

    const y = player.y;

    ctx.save();

    ctx.translate(x, y);


    // Main body

    ctx.fillStyle = player.color;

    ctx.beginPath();

    ctx.roundRect(
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height,
        8
    );

    ctx.fill();


    // Front window

    ctx.fillStyle = "#222";

    ctx.fillRect(
        -15,
        -25,
        30,
        18
    );


    // Rear window

    ctx.fillRect(
        -15,
        10,
        30,
        18
    );


    // Wheels

    ctx.fillStyle = "#050505";


    ctx.fillRect(
        -player.width / 2 - 4,
        -25,
        7,
        18
    );


    ctx.fillRect(
        player.width / 2 - 3,
        -25,
        7,
        18
    );


    ctx.fillRect(
        -player.width / 2 - 4,
        15,
        7,
        18
    );


    ctx.fillRect(
        player.width / 2 - 3,
        15,
        7,
        18
    );


    ctx.restore();

}


// ================================
// DRAW ENEMY
// ================================

function drawEnemy(enemy) {

    ctx.save();

    ctx.translate(enemy.x, enemy.y);


    ctx.fillStyle = enemy.color;

    ctx.beginPath();

    ctx.roundRect(
        -enemy.width / 2,
        -enemy.height / 2,
        enemy.width,
        enemy.height,
        8
    );

    ctx.fill();


    // Windows

    ctx.fillStyle = "#222";


    ctx.fillRect(
        -15,
        -25,
        30,
        18
    );


    ctx.fillRect(
        -15,
        10,
        30,
        18
    );


    // Wheels

    ctx.fillStyle = "#050505";


    ctx.fillRect(
        -enemy.width / 2 - 4,
        -25,
        7,
        18
    );


    ctx.fillRect(
        enemy.width / 2 - 3,
        -25,
        7,
        18
    );


    ctx.fillRect(
        -enemy.width / 2 - 4,
        15,
        7,
        18
    );


    ctx.fillRect(
        enemy.width / 2 - 3,
        15,
        7,
        18
    );


    ctx.restore();

}


// ================================
// DRAW ROAD
// ================================

function drawRoad() {

    // Grass

    ctx.fillStyle = "#176b32";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Road

    ctx.fillStyle = "#333";

    ctx.fillRect(
        roadX,
        0,
        roadWidth,
        canvas.height
    );


    // Road edges

    ctx.fillStyle = "#eeeeee";


    ctx.fillRect(
        roadX,
        0,
        5,
        canvas.height
    );


    ctx.fillRect(
        roadX + roadWidth - 5,
        0,
        5,
        canvas.height
    );


    // Lane lines

    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 4;

    ctx.setLineDash([35, 35]);


    // IMPORTANT:
    // Negative offset makes the road markings
    // move DOWN toward the player.

    ctx.lineDashOffset = -roadOffset;


    for (let i = 1; i < 3; i++) {

        const x =
            roadX +
            i * laneWidth;


        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(x, canvas.height);

        ctx.stroke();

    }


    ctx.setLineDash([]);

}


// ================================
// CREATE ENEMY
// ================================

function createEnemy() {

    const lane =
        Math.floor(Math.random() * 3);


    const colors = [

        "#e74c3c",
        "#3498db",
        "#f1c40f",
        "#9b59b6",
        "#2ecc71"

    ];


    enemies.push({

        lane: lane,

        x: getLaneX(lane),

        y: -80,

        width: 45,

        height: 75,

        color:
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ],

        speed:
            speed +
            Math.random() * 2

    });

}


// ================================
// COLLISION
// ================================

function checkCollision(
    playerCar,
    enemy
) {

    const px =
        getLaneX(playerCar.lane);

    const py =
        playerCar.y;


    const playerLeft =
        px -
        playerCar.width / 2;


    const playerRight =
        px +
        playerCar.width / 2;


    const playerTop =
        py -
        playerCar.height / 2;


    const playerBottom =
        py +
        playerCar.height / 2;


    const enemyLeft =
        enemy.x -
        enemy.width / 2;


    const enemyRight =
        enemy.x +
        enemy.width / 2;


    const enemyTop =
        enemy.y -
        enemy.height / 2;


    const enemyBottom =
        enemy.y +
        enemy.height / 2;


    return (

        playerLeft < enemyRight &&

        playerRight > enemyLeft &&

        playerTop < enemyBottom &&

        playerBottom > enemyTop

    );

}


// ================================
// UPDATE GAME
// ================================

function update() {

    // Road moves DOWN

    roadOffset += speed;


    if (roadOffset > 70) {

        roadOffset = 0;

    }


    // Enemy spawning

    enemyTimer++;


    if (enemyTimer > 55) {

        createEnemy();

        enemyTimer = 0;

    }


    // Move enemies DOWN

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        enemy.y += enemy.speed;


        // Collision

        if (
            checkCollision(
                player,
                enemy
            )
        ) {

            endGame();

            return;

        }


        // Enemy passed player

        if (
            enemy.y >
            canvas.height + 100
        ) {

            enemies.splice(i, 1);


            score++;


            scoreElement.textContent =
                score;


            // Increase speed

            if (
                score % 10 === 0
            ) {

                speed += 0.5;

            }

        }

    }

}


// ================================
// DRAW GAME
// ================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawRoad();


    for (
        const enemy of enemies
    ) {

        drawEnemy(enemy);

    }


    drawPlayer();

}


// ================================
// GAME LOOP
// ================================

function gameLoop() {

    if (!gameRunning) {

        return;

    }


    update();

    draw();


    requestAnimationFrame(
        gameLoop
    );

}


// ================================
// START GAME
// ================================

function startGame() {

    score = 0;

    speed = 5;

    enemyTimer = 0;

    enemies = [];


    // Start in CENTER lane

    player.lane = 1;


    scoreElement.textContent =
        "0";


    startScreen.classList.add(
        "hidden"
    );


    gameOverScreen.classList.add(
        "hidden"
    );


    gameRunning = true;


    gameLoop();

}


// ================================
// GAME OVER
// ================================

function endGame() {

    gameRunning = false;


    finalScoreElement.textContent =
        score;


    if (score > highScore) {

        highScore = score;

        highScoreElement.textContent =
            highScore;

    }


    gameOverScreen.classList.remove(
        "hidden"
    );

}


// ================================
// MOVE LEFT
// ================================

function moveLeft() {

    if (!gameRunning) {

        return;

    }


    // LEFT = smaller lane number

    if (player.lane > 0) {

        player.lane--;

    }

}


// ================================
// MOVE RIGHT
// ================================

function moveRight() {

    if (!gameRunning) {

        return;

    }


    // RIGHT = larger lane number

    if (player.lane < 2) {

        player.lane++;

    }

}


// ================================
// KEYBOARD
// ================================

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "ArrowLeft"
        ) {

            moveLeft();

        }


        if (
            event.key ===
            "ArrowRight"
        ) {

            moveRight();

        }

    }
);


// ================================
// MOBILE BUTTONS
// ================================

leftButton.addEventListener(
    "click",
    moveLeft
);


rightButton.addEventListener(
    "click",
    moveRight
);


// ================================
// START / RESTART BUTTONS
// ================================

startButton.addEventListener(
    "click",
    startGame
);


restartButton.addEventListener(
    "click",
    startGame
);


// ================================
// INITIAL DRAW
// ================================

draw();