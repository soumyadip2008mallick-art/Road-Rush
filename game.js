const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let W;
let H;
let DPR;

function resize() {

  const game = document.getElementById("game");

  W = game.clientWidth;
  H = game.clientHeight;

  DPR = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = W * DPR;
  canvas.height = H * DPR;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

window.addEventListener("resize", resize);

resize();


// -------------------------
// GAME STATE
// -------------------------

let running = false;
let paused = false;

let score = 0;
let coins = 0;

let level = 1;

let distance = 0;

let speed = 7;

let nitro = 100;

let roadScroll = 0;

let spawnTimer = 0;

let coinTimer = 0;

let shake = 0;

let lastTime = performance.now();


// -------------------------
// LANES
// -------------------------

let currentLane = 1;
let targetLane = 1;

function laneX(lane, y = H * .75) {

  const horizon = H * .28;

  const p = Math.max(
    0,
    Math.min(
      1,
      (y - horizon) / (H - horizon)
    )
  );

  const roadHalf =
    40 +
    p * W * .42;

  return W / 2 +
    (lane - 1) *
    roadHalf *
    .42;
}


// -------------------------
// PLAYER
// -------------------------

const player = {

  y: 0,

  bounce: 0,

  tilt: 0

};


// -------------------------
// TRAFFIC
// -------------------------

let traffic = [];

const trafficTypes = [
  "car",
  "truck",
  "bus",
  "bike"
];


// -------------------------
// COINS
// -------------------------

let coinList = [];


// -------------------------
// PARTICLES
// -------------------------

let particles = [];


// -------------------------
// START
// -------------------------

function startGame() {

  running = true;
  paused = false;

  score = 0;
  coins = 0;

  level = 1;

  distance = 0;

  speed = 7;

  nitro = 100;

  currentLane = 1;
  targetLane = 1;

  traffic = [];
  coinList = [];
  particles = [];

  document
    .getElementById("startScreen")
    .classList.add("hidden");

  document
    .getElementById("gameOver")
    .classList.add("hidden");

}

document
  .getElementById("startButton")
  .addEventListener("click", startGame);

document
  .getElementById("restart")
  .addEventListener("click", startGame);


// -------------------------
// PAUSE
// -------------------------

document
  .getElementById("pause")
  .addEventListener("click", () => {

    if (!running) return;

    paused = !paused;

  });


// -------------------------
// BACKGROUND
// -------------------------

function drawBackground() {

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      H * .5
    );

  gradient.addColorStop(
    0,
    "#020716"
  );

  gradient.addColorStop(
    .6,
    "#081d42"
  );

  gradient.addColorStop(
    1,
    "#63244e"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  // CITY

  const buildings = 18;

  for (let i = 0; i < buildings; i++) {

    const bw =
      W / buildings + 3;

    const bh =
      40 +
      ((i * 43) % 130);

    const x =
      i * bw;

    ctx.fillStyle =
      i % 2
        ? "#07101d"
        : "#101a2b";

    ctx.fillRect(
      x,
      H * .28 - bh,
      bw,
      bh
    );


    // windows

    for (
      let y = H * .28 - bh + 10;
      y < H * .28 - 5;
      y += 14
    ) {

      ctx.fillStyle =
        (i + Math.floor(y)) % 3
          ? "#00d9ff"
          : "#ffcf45";

      ctx.globalAlpha = .45;

      ctx.fillRect(
        x + 6,
        y,
        4,
        5
      );

    }

    ctx.globalAlpha = 1;

  }

}


// -------------------------
// ROAD
// -------------------------

function roadAt(y) {

  const horizon = H * .28;

  const p =
    Math.max(
      0,
      Math.min(
        1,
        (y - horizon) /
        (H - horizon)
      )
    );

  const half =
    40 +
    p * W * .42;

  return {

    center: W / 2,

    half

  };

}


function drawRoad() {

  const top =
    roadAt(H * .28);

  const bottom =
    roadAt(H);


  // ROAD

  ctx.fillStyle =
    "#20252d";

  ctx.beginPath();

  ctx.moveTo(
    top.center - top.half,
    H * .28
  );

  ctx.lineTo(
    top.center + top.half,
    H * .28
  );

  ctx.lineTo(
    bottom.center + bottom.half,
    H
  );

  ctx.lineTo(
    bottom.center - bottom.half,
    H
  );

  ctx.closePath();

  ctx.fill();


  // ROAD EDGES

  ctx.strokeStyle =
    "#00cfff";

  ctx.lineWidth = 4;

  ctx.beginPath();

  ctx.moveTo(
    top.center - top.half,
    H * .28
  );

  ctx.lineTo(
    bottom.center - bottom.half,
    H
  );

  ctx.moveTo(
    top.center + top.half,
    H * .28
  );

  ctx.lineTo(
    bottom.center + bottom.half,
    H
  );

  ctx.stroke();


  // LANE LINES

  for (let l = 0; l < 2; l++) {

    for (let i = 0; i < 12; i++) {

      const t =
        (i / 12 + roadScroll) % 1;

      const y =
        H * .28 +
        t * H * .72;

      const r =
        roadAt(y);

      const x =
        r.center +
        (l === 0 ? -.5 : .5) *
        r.half *
        .84;

      const lineHeight =
        8 + t * 18;

      ctx.fillStyle =
        "rgba(255,255,255,.8)";

      ctx.fillRect(
        x - 2,
        y,
        4,
        lineHeight
      );

    }

  }

}


// -------------------------
// PLAYER CAR
// -------------------------

function drawPlayerCar() {

  const x =
    laneX(
      targetLane,
      H * .76
    );

  const y =
    H * .76 +
    Math.sin(
      performance.now() / 100
    ) * 2;


  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.scale(
    Math.min(
      1,
      W / 370
    ),
    Math.min(
      1,
      W / 370
    )
  );


  // SHADOW

  ctx.fillStyle =
    "rgba(0,0,0,.55)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    45,
    40,
    10,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // BODY

  const body =
    ctx.createLinearGradient(
      0,
      -45,
      0,
      45
    );

  body.addColorStop(
    0,
    "#ff6b70"
  );

  body.addColorStop(
    .3,
    "#ff1e38"
  );

  body.addColorStop(
    .7,
    "#b40016"
  );

  body.addColorStop(
    1,
    "#47000a"
  );

  ctx.fillStyle = body;

  ctx.beginPath();

  ctx.moveTo(
    -30,
    38
  );

  ctx.quadraticCurveTo(
    -30,
    -20,
    -15,
    -31
  );

  ctx.quadraticCurveTo(
    0,
    -50,
    15,
    -31
  );

  ctx.quadraticCurveTo(
    30,
    -20,
    30,
    38
  );

  ctx.quadraticCurveTo(
    0,
    50,
    -30,
    38
  );

  ctx.fill();


  // WINDOWS

  ctx.fillStyle =
    "#07131e";

  ctx.beginPath();

  ctx.moveTo(
    -13,
    -16
  );

  ctx.quadraticCurveTo(
    -8,
    -34,
    0,
    -37
  );

  ctx.quadraticCurveTo(
    8,
    -34,
    13,
    -16
  );

  ctx.lineTo(
    9,
    -4
  );

  ctx.lineTo(
    -9,
    -4
  );

  ctx.closePath();

  ctx.fill();


  // BLUE GLASS

  ctx.fillStyle =
    "#4b9ab9";

  ctx.globalAlpha = .6;

  ctx.beginPath();

  ctx.moveTo(
    -10,
    -17
  );

  ctx.quadraticCurveTo(
    -6,
    -28,
    0,
    -32
  );

  ctx.quadraticCurveTo(
    6,
    -28,
    10,
    -17
  );

  ctx.lineTo(
    8,
    -6
  );

  ctx.lineTo(
    -8,
    -6
  );

  ctx.closePath();

  ctx.fill();

  ctx.globalAlpha = 1;


  // WHEELS

  ctx.fillStyle =
    "#050505";

  ctx.fillRect(
    -34,
    -4,
    9,
    23
  );

  ctx.fillRect(
    25,
    -4,
    9,
    23
  );

  ctx.fillRect(
    -34,
    26,
    9,
    13
  );

  ctx.fillRect(
    25,
    26,
    9,
    13
  );


  // HEADLIGHTS

  ctx.fillStyle =
    "#ffffff";

  ctx.shadowColor =
    "#ffffff";

  ctx.shadowBlur =
    14;

  ctx.fillRect(
    -20,
    22,
    9,
    5
  );

  ctx.fillRect(
    11,
    22,
    9,
    5
  );

  ctx.shadowBlur = 0;


  // REAR LIGHT

  ctx.fillStyle =
    "#ff3047";

  ctx.fillRect(
    -18,
    31,
    36,
    4
  );


  ctx.restore();

}


// -------------------------
// TRAFFIC
// -------------------------

function spawnTraffic() {

  const lane =
    Math.floor(
      Math.random() * 3
    );

  const type =
    trafficTypes[
      Math.floor(
        Math.random() *
        trafficTypes.length
      )
    ];


  const sizes = {

    car: [42, 70],

    truck: [54, 94],

    bus: [56, 108],

    bike: [25, 65]

  };


  const size =
    sizes[type];


  const y =
    H * .28 - 80;


  traffic.push({

    lane,

    x: laneX(
      lane,
      y
    ),

    y,

    w: size[0],

    h: size[1],

    type,

    speed:
      .75 +
      Math.random() * .4

  });

}


// -------------------------
// TRAFFIC DRAW
// -------------------------

function drawTraffic(v) {

  const perspective =
    Math.max(
      .45,
      Math.min(
        1.05,
        (v.y - H*.28) /
        (H*.72)
      )
    );


  ctx.save();

  ctx.translate(
    v.x,
    v.y
  );

  ctx.scale(
    perspective,
    perspective
  );


  if (v.type === "bike") {

    drawBike(v);

  }

  else if (v.type === "truck") {

    drawTruck(v);

  }

  else if (v.type === "bus") {

    drawBus(v);

  }

  else {

    drawEnemyCar(v);

  }


  ctx.restore();

}


// -------------------------
// ENEMY CAR
// -------------------------

function drawEnemyCar(v) {

  const colors = [
    "#17a8ff",
    "#ff3548",
    "#ffc928",
    "#9d62ff"
  ];

  const color =
    colors[v.lane % colors.length];


  ctx.fillStyle =
    "rgba(0,0,0,.45)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    35,
    29,
    8,
    0,
    0,
    Math.PI*2
  );

  ctx.fill();


  const g =
    ctx.createLinearGradient(
      0,
      -35,
      0,
      40
    );

  g.addColorStop(
    0,
    "#ffffff"
  );

  g.addColorStop(
    .08,
    color
  );

  g.addColorStop(
    .8,
    color
  );

  g.addColorStop(
    1,
    "#17202b"
  );

  ctx.fillStyle = g;

  ctx.beginPath();

  ctx.roundRect(
    -v.w/2,
    -v.h/2,
    v.w,
    v.h,
    8
  );

  ctx.fill();


  // FRONT WINDOW

  ctx.fillStyle =
    "#1b3447";

  ctx.fillRect(
    -v.w*.3,
    -v.h*.32,
    v.w*.6,
    v.h*.2
  );


  // HEADLIGHTS

  ctx.fillStyle =
    "#fff";

  ctx.shadowColor =
    "#fff";

  ctx.shadowBlur =
    10;

  ctx.fillRect(
    -v.w*.38,
    -v.h*.39,
    10,
    6
  );

  ctx.fillRect(
    v.w*.38-10,
    -v.h*.39,
    10,
    6
  );

  ctx.shadowBlur = 0;

}


// -------------------------
// TRUCK
// -------------------------

function drawTruck(v) {

  ctx.fillStyle =
    "#718795";

  ctx.fillRect(
    -v.w/2,
    -v.h/2,
    v.w,
    v.h
  );


  ctx.fillStyle =
    "#d9e5ea";

  ctx.fillRect(
    -v.w*.38,
    -v.h*.3,
    v.w*.76,
    v.h*.3
  );


  ctx.fillStyle =
    "#263744";

  ctx.fillRect(
    -v.w*.3,
    -v.h*.23,
    v.w*.6,
    v.h*.16
  );


  ctx.fillStyle =
    "#fff";

  ctx.fillRect(
    -v.w*.38,
    -v.h*.4,
    10,
    6
  );

  ctx.fillRect(
    v.w*.38-10,
    -v.h*.4,
    10,
    6
  );

}


// -------------------------
// BUS
// -------------------------

function drawBus(v) {

  ctx.fillStyle =
    "#e7d9a7";

  ctx.beginPath();

  ctx.roundRect(
    -v.w/2,
    -v.h/2,
    v.w,
    v.h,
    6
  );

  ctx.fill();


  ctx.fillStyle =
    "#183142";


  for (
    let y = -v.h*.32;
    y < v.h*.2;
    y += 20
  ) {

    ctx.fillRect(
      -v.w*.38,
      y,
      v.w*.76,
      11
    );

  }


  ctx.fillStyle =
    "#fff";

  ctx.fillRect(
    -v.w*.38,
    -v.h*.41,
    10,
    6
  );

  ctx.fillRect(
    v.w*.38-10,
    -v.h*.41,
    10,
    6
  );

}


// -------------------------
// BIKE
// -------------------------

function drawBike(v) {

  ctx.fillStyle =
    "#050505";

  ctx.beginPath();

  ctx.arc(
    0,
    -25,
    8,
    0,
    Math.PI*2
  );

  ctx.arc(
    0,
    25,
    8,
    0,
    Math.PI*2
  );

  ctx.fill();


  ctx.fillStyle =
    "#ff3048";

  ctx.fillRect(
    -6,
    -18,
    12,
    36
  );


  ctx.fillStyle =
    "#fff";

  ctx.shadowColor =
    "#fff";

  ctx.shadowBlur =
    10;

  ctx.fillRect(
    -4,
    -30,
    8,
    5
  );

  ctx.shadowBlur = 0;

}


// -------------------------
// COINS
// -------------------------

function spawnCoin() {

  const lane =
    Math.floor(
      Math.random() * 3
    );

  const y =
    H*.28 - 30;


  coinList.push({

    lane,

    x: laneX(
      lane,
      y
    ),

    y,

    spin:
      Math.random() * 6

  });

}


function drawCoins() {

  for (
    const coin of coinList
  ) {

    coin.x =
      laneX(
        coin.lane,
        coin.y
      );


    const squash =
      .65 +
      Math.abs(
        Math.cos(
          coin.spin
        )
      ) * .35;


    ctx.save();

    ctx.translate(
      coin.x,
      coin.y
    );

    ctx.scale(
      squash,
      1
    );


    ctx.fillStyle =
      "#ffd21c";

    ctx.shadowColor =
      "#ffd21c";

    ctx.shadowBlur =
      15;

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      10,
      0,
      Math.PI*2
    );

    ctx.fill();


    ctx.shadowBlur = 0;

    ctx.fillStyle =
      "#754d00";

    ctx.font =
      "bold 12px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "$",
      0,
      4
    );


    ctx.restore();


    coin.spin += .08;

  }

}


// -------------------------
// PARTICLES
// -------------------------

function particleBurst(
  px,
  py
) {

  for (
    let i = 0;
    i < 15;
    i++
  ) {

    particles.push({

      x: px,

      y: py,

      vx:
        (Math.random()-.5)*7,

      vy:
        (Math.random()-.7)*7,

      life: .7

    });

  }

}


function drawParticles() {

  for (
    const p of particles
  ) {

    p.x += p.vx;

    p.y += p.vy;

    p.vy += .15;

    p.life -= .025;

    ctx.globalAlpha =
      Math.max(
        0,
        p.life
      );

    ctx.fillStyle =
      "#00eaff";

    ctx.fillRect(
      p.x,
      p.y,
      4,
      4
    );

  }

  ctx.globalAlpha = 1;

  particles =
    particles.filter(
      p => p.life > 0
    );

}


// -------------------------
// UPDATE
// -------------------------

function update(dt) {

  if (
    !running ||
    paused
  ) return;


  level =
    1 +
    Math.floor(
      distance / 1800
    );


  const multiplier =
    1 +
    level * .06;


  roadScroll =
    (
      roadScroll +
      dt *
      .75 *
      multiplier
    ) % 1;


  distance +=
    dt *
    45 *
    multiplier;


  score +=
    dt *
    120 *
    multiplier;


  speed =
    165 +
    level * 8;


  // TRAFFIC

  spawnTimer -= dt;

  if (
    spawnTimer <= 0
  ) {

    spawnTraffic();

    spawnTimer =
      Math.max(
        .38,
        1.0 -
        level*.035
      );

  }


  // COINS

  coinTimer -= dt;

  if (
    coinTimer <= 0
  ) {

    spawnCoin();

    coinTimer = .75;

  }


  // MOVE TRAFFIC

  for (
    const v of traffic
  ) {

    v.y +=
      dt *
      285 *
      multiplier *
      v.speed;


    v.x =
      laneX(
        v.lane,
        v.y
      );

  }


  // MOVE COINS

  for (
    const coin of coinList
  ) {

    coin.y +=
      dt *
      285 *
      multiplier;

  }


  // COLLISION

  const playerX =
    laneX(
      targetLane,
      H*.76
    );


  for (
    const v of traffic
  ) {

    if (

      Math.abs(
        v.x -
        playerX
      ) < 30 &&

      Math.abs(
        v.y -
        H*.76
      ) < 60

    ) {

      particleBurst(
        playerX,
        H*.76
      );

      running = false;

      finalScore.textContent =
        Math.floor(score);

      gameOver.classList.remove(
        "hidden"
      );

      break;

    }

  }


  // COINS

  for (
    const coin of coinList
  ) {

    if (

      Math.abs(
        coin.x -
        playerX
      ) < 28 &&

      Math.abs(
        coin.y -
        H*.76
      ) < 55

    ) {

      coin.y =
        H + 100;

      coins++;

      score += 250;

      particleBurst(
        coin.x,
        coin.y
      );

    }

  }


  traffic =
    traffic.filter(
      v =>
        v.y <
        H + 150
    );


  coinList =
    coinList.filter(
      c =>
        c.y <
        H + 100
    );


  drawParticles();


  document.getElementById(
    "score"
  ).textContent =
    Math.floor(score);


  document.getElementById(
    "coins"
  ).textContent =
    coins;


  document.getElementById(
    "speed"
  ).textContent =
    speed;


  document.getElementById(
    "level"
  ).textContent =
    level;


  document.getElementById(
    "levelProgress"
  ).style.width =
    (
      (distance % 1800) /
      1800 *
      100
    ) + "%";

}


// -------------------------
// DRAW
// -------------------------

function draw() {

  ctx.clearRect(
    0,
    0,
    W,
    H
  );


  ctx.save();


  if (
    shake > 0
  ) {

    ctx.translate(
      (Math.random()-.5)*6,
      (Math.random()-.5)*6
    );

    shake -= .02;

  }


  drawBackground();

  drawRoad();

  drawCoins();


  for (
    const v of traffic
  ) {

    drawTraffic(v);

  }


  drawPlayerCar();

  drawParticles();


  if (
    paused &&
    running
  ) {

    ctx.fillStyle =
      "rgba(0,0,0,.55)";

    ctx.fillRect(
      0,
      0,
      W,
      H
    );


    ctx.fillStyle =
      "white";

    ctx.font =
      "900 38px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "PAUSED",
      W/2,
      H/2
    );

  }


  ctx.restore();

}


// -------------------------
// GAME LOOP
// -------------------------

function loop(time) {

  const dt =
    Math.min(
      .035,
      (time-lastTime)/1000
    );

  lastTime = time;

  update(dt);

  draw();

  requestAnimationFrame(
    loop
  );

}

requestAnimationFrame(
  loop
);


// -------------------------
// KEYBOARD
// -------------------------

window.addEventListener(
  "keydown",
  e => {

    if (!running)
      return;


    if (
      e.key === "ArrowLeft" ||
      e.key.toLowerCase() === "a"
    ) {

      targetLane =
        Math.max(
          0,
          targetLane - 1
        );

    }


    if (
      e.key === "ArrowRight" ||
      e.key.toLowerCase() === "d"
    ) {

      targetLane =
        Math.min(
          2,
          targetLane + 1
        );

    }


    if (
      e.code === "Space"
    ) {

      nitro = Math.max(
        0,
        nitro - 25
      );

    }

  }
);


// -------------------------
// MOBILE SWIPE
// -------------------------

let touchStartX = 0;

canvas.addEventListener(
  "touchstart",
  e => {

    touchStartX =
      e.changedTouches[0]
        .clientX;

  },
  {
    passive: true
  }
);


canvas.addEventListener(
  "touchend",
  e => {

    if (!running)
      return;


    const endX =
      e.changedTouches[0]
        .clientX;


    const dx =
      endX -
      touchStartX;


    if (
      Math.abs(dx) > 35
    ) {

      if (dx < 0) {

        targetLane =
          Math.max(
            0,
            targetLane - 1
          );

      }

      else {

        targetLane =
          Math.min(
            2,
            targetLane + 1
          );

      }

    }

  },
  {
    passive: true
  }
);
