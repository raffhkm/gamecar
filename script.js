// === Elemen-elemen penting ===
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const carSelect = document.getElementById("carSelect");
const gameArea = document.getElementById("gameArea");
const car = document.getElementById("car");
const explosion = document.getElementById("explosion");
const gameOverText = document.getElementById("gameOver");
const scoreDisplay = document.getElementById("score");
const lines = document.querySelectorAll(".line");
const btnUp = document.getElementById("up");
const btnDown = document.getElementById("down");
const btnLeft = document.getElementById("left");
const btnRight = document.getElementById("right");
const bgMusic = document.getElementById("bgMusic");
const moveSound = document.getElementById("moveSound");
const crashSound = document.getElementById("crashSound");
const levelSelect = document.getElementById("levelSelect");
const shieldTimer = document.getElementById("shieldTimer");
const coinCountDisplay = document.getElementById("coinCount");
const shopButton = document.getElementById("shopButton");
const shopModal = document.getElementById("shopModal");
const shopItems = document.getElementById("shopItems");
const selectedCarButton = document.getElementById("selectedCarButton");
const selectedLevelButton = document.getElementById("selectedLevelButton");
const resetButton = document.getElementById("resetButton");
const coinSound = new Audio('coin.mp3');

// === Data dan Variabel Global ===
let coins = parseInt(localStorage.getItem("coins")) || 0;
coinCountDisplay.textContent = "Koin: " + coins;

const shopData = [
  { id: "car2", name: "Mobil Merah", price: 50, img: "car2.png" },
  { id: "car3", name: "Mobil Kuning", price: 100, img: "car3.png" },
  { id: "upgrade_shield", name: "Shield Lebih Lama 2 Detik", price: 35, img: "upshield.png", type: "upgrade" },
];

let ownedUpgrades = JSON.parse(localStorage.getItem("ownedUpgrades")) || [];

let ownedCars = JSON.parse(localStorage.getItem("ownedCars")) || ["car1"];
let shieldCountdown = null;
let currentLevel = "medium";
let shieldActive = false;
let shieldInterval = null;
let coinInterval = null;
let carLeft = 175;
let carTop = 490;
let selectedCar = "car1.png";
let score = 0;
let gameRunning = false;
let obstacleInterval, lineInterval, sideInterval;
let speed = 10;
// Variabel untuk mengatur kecepatan latar belakang
let citySpeed = 2;
let natureSpeed = 1;

// Fungsi untuk memindahkan latar belakang
function moveBackground() {
  let cityTop = parseInt(document.getElementById("backgroundCity").style.top) || 0;
  let natureTop = parseInt(document.getElementById("backgroundNature").style.top) || -600;

  // Update posisi latar belakang
  cityTop += citySpeed;
  natureTop += natureSpeed;

  // Reset posisi jika latar belakang mencapai batas bawah
  if (cityTop >= 600) cityTop = -600; // Jika sudah melewati batas bawah, reset ke atas
  if (natureTop >= 600) natureTop = -600;

  // Perbarui posisi latar belakang
  document.getElementById("backgroundCity").style.top = cityTop + "px";
  document.getElementById("backgroundNature").style.top = natureTop + "px";
}

// Panggil fungsi moveBackground setiap 50ms
setInterval(moveBackground, 50);


// === Inisialisasi Mobil ===
car.style.backgroundImage = `url('${selectedCar}')`;
car.style.left = carLeft + "px";
car.style.top = carTop + "px";

function updateCarOptions() {
  carSelect.innerHTML = "";
  ownedCars.forEach(id => {
    const option = document.createElement("option");
    option.value = `${id}.png`;
    option.textContent = id.toUpperCase();
    carSelect.appendChild(option);
  });
}
updateCarOptions();

// === Event Listener ===
carSelect.addEventListener("change", () => {
  selectedCar = carSelect.value;
  selectedCarButton.textContent = "Mobil yang Dipilih: " + carSelect.options[carSelect.selectedIndex].text;
});

levelSelect.addEventListener("change", () => {
  const selectedLevel = levelSelect.options[levelSelect.selectedIndex].text;
  selectedLevelButton.textContent = "Level yang Dipilih: " + selectedLevel;
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

btnUp.addEventListener("click", () => moveCar("up"));
btnDown.addEventListener("click", () => moveCar("down"));
btnLeft.addEventListener("click", () => moveCar("left"));
btnRight.addEventListener("click", () => moveCar("right"));

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  if (e.key === "ArrowLeft" && carLeft > 0) carLeft -= 25;
  else if (e.key === "ArrowRight" && carLeft < 350) carLeft += 25;
  else if (e.key === "ArrowUp" && carTop > 0) carTop -= 25;
  else if (e.key === "ArrowDown" && carTop < 500) carTop += 25;
  moveSound.currentTime = 0;
  moveSound.play();
  updateCarPosition();
});

resetButton.addEventListener("click", () => {
  if (confirm("Apakah Anda yakin ingin mereset data? Semua koin dan mobil yang dibeli akan hilang!")) {
    localStorage.removeItem("coins");
    localStorage.removeItem("ownedCars");
    coins = 0;
    ownedCars = ["car1"];
    coinCountDisplay.textContent = "Koin: " + coins;
    updateCarOptions();
    alert("Data berhasil direset!");
  }
});

// === Fungsi Utama Game ===
function startGame() {
  bgMusic.currentTime = 0;
  bgMusic.play();
  gameRunning = true;
  score = 0;
  carLeft = 175;
  carTop = 490;
  updateCarPosition();
  car.style.backgroundImage = `url('${selectedCar}')`;
  scoreDisplay.textContent = "Score: 0";
  explosion.style.display = "none";
  gameOverText.style.display = "none";
  startScreen.style.display = "none";
  shieldInterval = setInterval(createShieldPowerUp, 10000);
  shieldTimer.textContent = "";
  shieldTimer.style.display = "none";
  coinInterval = setInterval(createCoin, 4000);

  currentLevel = levelSelect.value;
  setSpeedByLevel();

  document.querySelectorAll(".obstacle, .object-side, .power-up, .coin").forEach(el => el.remove());

  obstacleInterval = setInterval(createObstacle, 1500);
  lineInterval = setInterval(moveLines, 50);
  sideInterval = setInterval(() => {
    const type = Math.random() < 0.5 ? "tree" : "building";
    const side = Math.random() < 0.5 ? "left" : "right";
    createSideObject(type, side);
  }, 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(obstacleInterval);
  clearInterval(lineInterval);
  clearInterval(sideInterval);
  clearInterval(shieldInterval);
  clearInterval(coinInterval);
  clearInterval(shieldCountdown);
  shieldTimer.style.display = "none";
  gameOverText.style.display = "block";
  explosion.style.display = "block";
  crashSound.currentTime = 0;
  crashSound.play();
  shieldTimer.textContent = "";
}

function updateCarPosition() {
  car.style.left = carLeft + "px";
  car.style.top = carTop + "px";
}

function moveCar(dir) {
  if (!gameRunning) return;
  moveSound.currentTime = 0;
  moveSound.play();
  if (dir === "left" && carLeft > 0) carLeft -= 25;
  else if (dir === "right" && carLeft < 350) carLeft += 25;
  else if (dir === "up" && carTop > 0) carTop -= 25;
  else if (dir === "down" && carTop < 500) carTop += 25;
  updateCarPosition();
}

function setSpeedByLevel() {
  if (currentLevel === "easy") speed = 5;
  else if (currentLevel === "medium") speed = 8;
  else if (currentLevel === "hard") speed = 12;
}

// === Shield Power-up ===
function createShieldPowerUp() {
  const shield = document.createElement("div");
  shield.classList.add("power-up");
  shield.style.backgroundImage = "url('shield.png')";
  shield.style.left = Math.floor(Math.random() * 7) * 50 + "px";
  shield.style.top = "0px";
  gameArea.appendChild(shield);
  const interval = setInterval(() => {
    if (!gameRunning) {
      clearInterval(interval);
      shield.remove();
      return;
    }
    let top = parseInt(shield.style.top);
    top += 5;
    shield.style.top = top + "px";
    if (
      parseInt(shield.style.left) < carLeft + 50 &&
      parseInt(shield.style.left) + 50 > carLeft &&
      top < carTop + 100 &&
      top + 50 > carTop
    ) {
      activateShield();
      clearInterval(interval);
      shield.remove();
    }
    if (top > 600) {
      clearInterval(interval);
      shield.remove();
    }
  }, 30);
}

function activateShield() {
  shieldActive = true;
  car.classList.add("shielded");
  let duration = ownedUpgrades.includes("upgrade_shield") ? 6 : 4;
  shieldTimer.style.display = "block";
  shieldCountdown = setInterval(() => {
    duration--;
    if (duration > 0) {
      shieldTimer.textContent = `Shield habis dalam ${duration} detik`;
    } else {
      clearInterval(shieldCountdown);
      deactivateShield();
    }
  }, 1000);
}


function deactivateShield() {
  shieldActive = false;
  car.classList.remove("shielded");
  shieldTimer.textContent = "";
  shieldTimer.style.display = "none";
}

// === Obstacle ===
function createObstacle() {
  const obstacle = document.createElement("div");
  obstacle.classList.add("obstacle");
  let left = Math.floor(Math.random() * 7) * 50;
  let top = 0;
  let direction = Math.floor(Math.random() * 3) - 1;
  obstacle.style.left = left + "px";
  obstacle.style.top = top + "px";
  gameArea.appendChild(obstacle);

  const interval = setInterval(() => {
    if (!gameRunning) {
      clearInterval(interval);
      obstacle.remove();
      return;
    }
    top += speed;
    left += direction * 2;
    if (left <= 0 || left >= 350) direction *= -1;
    obstacle.style.top = top + "px";
    obstacle.style.left = left + "px";
    if (isCollision(left, top)) {
      if (shieldActive) {
        clearInterval(interval);
        obstacle.remove();
        deactivateShield();
      } else {
        explosion.style.left = (carLeft - 25) + "px";
        explosion.style.top = (carTop - 20) + "px";
        explosion.style.display = "block";
        clearInterval(interval);
        endGame();
      }
    }
    if (top > 600) {
      clearInterval(interval);
      obstacle.remove();
      if (gameRunning) {
        score++;
        scoreDisplay.textContent = "Score: " + score;
      }
    }
  }, 30);
}

function isCollision(objLeft, objTop) {
  const objRight = objLeft + 50;
  const objBottom = objTop + 100;
  const carRight = carLeft + 50;
  const carBottom = carTop + 100;
  return (
    carLeft < objRight &&
    carRight > objLeft &&
    carTop < objBottom &&
    carBottom > objTop
  );
}

// === Koin ===
function createCoin() {
  const coin = document.createElement("div");
  coin.classList.add("coin");
  coin.style.left = Math.floor(Math.random() * 7) * 50 + "px";
  coin.style.top = "0px";
  gameArea.appendChild(coin);

  const interval = setInterval(() => {
    if (!gameRunning) {
      clearInterval(interval);
      coin.remove();
      return;
    }

    let top = parseInt(coin.style.top);
    top += 5;
    coin.style.top = top + "px";

    if (
      parseInt(coin.style.left) < carLeft + 50 &&
      parseInt(coin.style.left) + 50 > carLeft &&
      top < carTop + 100 &&
      top + 50 > carTop
    ) {
      coins++;
      localStorage.setItem("coins", coins);
      coinCountDisplay.textContent = "Koin: " + coins;
      coinSound.currentTime = 0;
      coinSound.play();
      clearInterval(interval);
      coin.remove();
    }

    if (top > 600) {
      clearInterval(interval);
      coin.remove();
    }
  }, 30);
}

// === Jalan & Objek Samping ===
function moveLines() {
  lines.forEach((line) => {
    let top = parseInt(line.style.top) || 0;
    top += 5;
    if (top >= 600) top = -100;
    line.style.top = top + "px";
  });
}

function createSideObject(type, side) {
  const obj = document.createElement("div");
  obj.classList.add("object-side");
  obj.style.backgroundImage = type === "tree" ? "url('tree.png')" : "url('building.png')";
  obj.style.left = side === "left" ? "10px" : "330px";
  obj.style.top = "0px";
  gameArea.appendChild(obj);
  const interval = setInterval(() => {
    if (!gameRunning) {
      clearInterval(interval);
      obj.remove();
      return;
    }
    let top = parseInt(obj.style.top);
    top += speed;
    obj.style.top = top + "px";
    if (top > 600) {
      clearInterval(interval);
      obj.remove();
    }
  }, 30);
}

// === Shop ===
shopButton.addEventListener("click", openShop);

function openShop() {
  shopModal.style.display = "block";
  shopItems.innerHTML = "";
  shopData.forEach(item => {
    const owned = ownedCars.includes(item.id);
    const div = document.createElement("div");
    div.classList.add("shop-item");
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <p>${item.name}</p>
      <p>${item.price} Koin</p>
      <button ${owned ? "disabled" : ""} onclick="buyItem('${item.id}', ${item.price})">
        ${owned ? "Dimiliki" : "Beli"}
      </button>
    `;
    shopItems.appendChild(div);
  });
}

function closeShop() {
  shopModal.style.display = "none";
}

function buyItem(id, price) {
  if (coins >= price) {
    coins -= price;
    coinCountDisplay.textContent = "Koin: " + coins;
    localStorage.setItem("coins", coins);

    const item = shopData.find(i => i.id === id);
    if (item.type === "upgrade") {
      ownedUpgrades.push(id);
      localStorage.setItem("ownedUpgrades", JSON.stringify(ownedUpgrades));
    } else {
      ownedCars.push(id);
      localStorage.setItem("ownedCars", JSON.stringify(ownedCars));
      updateCarOptions();
    }

    alert("Berhasil membeli!");
    openShop();
  } else {
    alert("Koin tidak cukup!");
  }
}

