const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Размеры канваса
const width = 2500;
const height = 1200;
canvas.width = width;
canvas.height = height;

// Игровые переменные
let player = { x: width / 2, y: height / 2, size: 20, color: 'red', speed: 2.5, health: 10, lvl: 0 }; // Замедлена скорость
let monsters = [];
let bullets = [];
let pickups = [];
let score = 0;
let weaponCost = 100;
let bulletDelay = 500; // Задержка между выстрелами в миллисекундах
let lastShotTime = 0;
let spawnInterval = 1000;
let lastSpawnTime = 0;
let startTime = Date.now();

// Движение игрока
let keys = {};

// Создание монстров
function createMonster() {
    const hp = Math.floor(Math.random() * player.lvl/2) + 1;
    const size = 10+ 10 * (Math.floor(hp / 5) + 1);
    const x = Math.random() * (width - size);
    const y = Math.random() * (height - size);
    const dx = player.x - x;
    const dy = player.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if(distance<player.size*5)return createMonster();
    const monster = { x, y, size, color: 'green', speed: 1, hp, lastHitMobTime: 0 ,sthp:hp};
    monsters.push(monster);
}

// Создание пули
function createBullet(target) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const angle = Math.atan2(dy, dx);
    const speed = 5;
    const penit = player.lvl / 10;
    let bullet = {
        x: player.x,
        y: player.y,
        size: 5,
        color: 'yellow',
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        pen: penit,
    };
    bullets.push(bullet);
}

// Создание выпадения очков
function createPickup(x, y, xp) {
    const pickup = { x, y, size: 9+xp, color: 'blue', xp };
    pickups.push(pickup);
}

// Обновление игрового состояния
function update() {
    const currentTime = Date.now();

    // Обновление позиции игрока
    if (keys['KeyW']) player.y -= player.speed * (player.y > 0);
    if (keys['KeyS']) player.y += player.speed * (player.y < height);
    if (keys['KeyA']) player.x -= player.speed * (player.x > 0);
    if (keys['KeyD']) player.x += player.speed * (player.x < width);

    // Обновление позиции монстров
    monsters.forEach(monster => {
        const dx = player.x - monster.x;
        const dy = player.y - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            monster.x += (dx / distance) * monster.speed;
            monster.y += (dy / distance) * monster.speed;
        }
    });

    // Обновление позиции очков
    pickups.forEach(pickup => {
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.size * 16) {
            if (distance > 0) {
                pickup.x += (dx / distance) * 4;
                pickup.y += (dy / distance) * 4;
            }
        }
    });

    // Обновление позиции пуль
    bullets.forEach(bullet => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
    });

    // Проверка столкновений пуль с монстрами
    bullets.forEach(bullet => {
        bullet.pen -= !monsters.every((monster, index) => {
            let bobo = true;
            const dx = monster.x - bullet.x;
            const dy = monster.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < monster.size && monster.lastHitMobTime + 100 < currentTime) {
                monster.hp--;
                bobo = false;
                monster.lastHitMobTime = currentTime;
            }
            if (monster.hp <= 0) {
                createPickup(monster.x, monster.y, monster.sthp); // Создаем выпадение очков
                monsters.splice(index, 1);
                return false;
            }
            return bobo;
        });
        bullets = bullets.filter(bullet => {
            if (bullet.x < 0 || bullet.x > width) {
                return false;
            }
            if (bullet.y < 0 || bullet.y > height) {
                return false;
            }
            return bullet.pen >= 0;
        });
    });

    // Проверка столкновений игрока с монстрами
    monsters = monsters.filter(monster => {
        const dx = monster.x - player.x;
        const dy = monster.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < monster.size+player.size) {
            player.health--;
            return false; // Удалить монстра
        }
        return true;
    });

    // Проверка столкновений игрока с выпадающими очками
    pickups = pickups.filter(pickup => {
        const dx = pickup.x - player.x;
        const dy = pickup.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < pickup.size) {
            score+=pickup.xp;
            return false; // Удалить pickup
        }
        return true;
    });
}

// Рендеринг игры
function render() {
    ctx.clearRect(0, 0, width, height);
    // Отрисовка выпадения очков
    pickups.forEach(pickup => {
        ctx.fillStyle = pickup.color;
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, pickup.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Отрисовка монстров
    monsters.forEach(monster => {
        ctx.fillStyle = monster.color;
        ctx.beginPath();
        ctx.arc(monster.x, monster.y, monster.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText(monster.hp, monster.x - 5, monster.y + 7);
    });

    // Отрисовка пуль
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Отрисовка игрока
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    // Отображение счета, стоимости оружия и здоровья игрока
    ctx.fillStyle = 'white';
    ctx.font = '20px Impact'; // Шрифт Impact
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Upgrade Cost: ${Math.round(weaponCost)}`, 10, 50);
    ctx.fillText(`Health: ${player.health}`, 10, 80);
    ctx.fillText(`Level: ${player.lvl}`, 10, 110);
    ctx.fillText(`Enemy Spawn Cooldown: ${spawnInterval}`, 10, 140);
    ctx.fillText(`X: ${player.x}`, 10, 200);
    ctx.fillText(`Y: ${player.y}`, 10, 230);

    // Отображение таймера
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    ctx.fillText(`Time: ${elapsedTime}s`, width - 100, 20);
}

// Обработчик нажатия клавиш
document.addEventListener('keydown', event => {
    keys[event.code] = true;
    if (event.code === 'Space') {
        if (score >= weaponCost) {
            score -= weaponCost;
            bulletDelay = parseInt(Math.max(0, bulletDelay - bulletDelay / 10));
            weaponCost += parseInt(weaponCost / 5);
            player.lvl++;
            spawnInterval = parseInt(spawnInterval / 1.02);
        }
    }
});

// Обработчик отпускания клавиш
document.addEventListener('keyup', event => {
    keys[event.code] = false;
});

// Главный игровой цикл
function gameLoop() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime > bulletDelay) {
        if (monsters.length > 0) {
            // Найти ближайшего монстра
            const nearestMonster = monsters.reduce((closest, monster) => {
                const dx = monster.x - player.x;
                const dy = monster.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < closest.distance) {
                    return { monster, distance };
                }
                return closest;
            }, { monster: null, distance: Infinity }).monster;

            if (nearestMonster) {
                createBullet(nearestMonster); // Стрельба по ближайшему монстру
            }
        }
        lastShotTime = currentTime;
    }

    update();
    render();
    if (player.health > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = 'white';
        ctx.font = '40px Impact';
        ctx.fillText('Game Over', width / 2 - 100, height / 2);
    }
}

// Запуск игры
setInterval(createMonster, spawnInterval); // Создаем монстра по интервалу
gameLoop();
