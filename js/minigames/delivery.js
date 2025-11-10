/**
 * RUNNER GAME - Курьер на велосипеде
 * Механика: Тап для прыжка, избегай препятствий
 * Длительность: 10 секунд
 */

class DeliveryGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🚴 RunnerGame: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = gameManager.sound;
        
        // Игровые параметры
        this.gameTime = 5; // 5 секунд - быстрый раннер
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;
        
        // Игрок (курьер)
        this.player = {
            x: 100,
            y: 580,
            width: 45,
            height: 70,
            velocityY: 0,
            gravity: 1.3,
            jumpPower: -23,
            isJumping: false,
            groundY: 580,
            legPhase: 0, // Анимация бега
            armPhase: 0
        };
        
        // Препятствия (разные типы)
        this.obstacles = [];
        this.obstacleSpeed = 7;
        this.obstacleSpawnTimer = 0;
        this.obstacleSpawnInterval = 70; // Чаще для динамики
        this.obstacleTypes = ['box', 'hole', 'barrier'];
        
        // Фон (симуляция движения)
        this.backgroundOffset = 0;
        this.backgroundSpeed = 6;
        
        // Счет
        this.score = 0;
        this.distanceTraveled = 0;
        
        // Тач контроль
        this.setupControls();
        
        console.log('✅ RunnerGame: Готов');
    }
    
    /**
     * Настроить управление
     */
    setupControls() {
        // Тап/клик для прыжка
        this.jumpHandler = (e) => {
            e.preventDefault();
            this.jump();
        };
        
        this.canvas.addEventListener('touchstart', this.jumpHandler);
        this.canvas.addEventListener('mousedown', this.jumpHandler);

        console.log('🎮 Управление: Тап/клик = прыжок');
    }
    
    /**
     * Убрать управление
     */
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.jumpHandler);
        this.canvas.removeEventListener('mousedown', this.jumpHandler);
    }
    
    /**
     * Прыжок
     */
    jump() {
        if (!this.isRunning) return;
        
        // Прыгать только с земли
        if (!this.player.isJumping) {
            this.player.velocityY = this.player.jumpPower;
            this.player.isJumping = true;
            console.log('🦘 Прыжок!');
            if (this.sound) this.sound.playEffect('jump');
        }
    }
    
    /**
     * Запустить игру
     */
    start() {
        console.log('▶️ RunnerGame: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    /**
     * Остановить игру
     */
    stop() {
        console.log('⏹️ RunnerGame: Стоп');
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.removeControls();
    }
    
    /**
     * Главный игровой цикл
     */
    update(currentTime) {
        if (!this.isRunning) return;
        
        // Delta time для независимости от FPS
        if (!this.lastFrameTime) {
            this.lastFrameTime = currentTime;
            // На первом кадре используем 1/60 секунды
            var deltaTime = 1/60;
        } else {
            var deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
            this.lastFrameTime = currentTime;
        }
        
        // Очистить экран
        this.ctx.fillStyle = '#87ceeb'; // Небо
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Отрисовать фон (дорога)
        this.drawBackground();
        
        // Обновить физику игрока
        this.updatePlayer(deltaTime);
        
        // Обновить препятствия
        this.updateObstacles(deltaTime);
        
        // Отрисовать игрока
        this.drawPlayer();
        
        // Отрисовать препятствия
        this.drawObstacles();
        
        // Проверить коллизии
        this.checkCollisions();
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            this.win();
            return;
        }
        
        // Debug
        this.gameManager.updateDebug(`
            Time: ${(this.gameTime - elapsed).toFixed(1)}s<br>
            Score: ${this.score}<br>
            Obstacles: ${this.obstacles.length}<br>
            Jumping: ${this.player.isJumping}
        `);
        
        // Следующий кадр
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    /**
     * Отрисовать фон (дорога)
     */
    drawBackground() {
        // Тротуар/обочина
        const roadGrad = this.ctx.createLinearGradient(0, 650, 0, this.canvas.height);
        roadGrad.addColorStop(0, '#8B7355');
        roadGrad.addColorStop(1, '#6B5345');
        this.ctx.fillStyle = roadGrad;
        this.ctx.fillRect(0, 650, this.canvas.width, this.canvas.height - 650);
        
        // Асфальт дороги с градиентом
        const asphaltGrad = this.ctx.createLinearGradient(0, 660, 0, 730);
        asphaltGrad.addColorStop(0, '#4A4A4A');
        asphaltGrad.addColorStop(1, '#2A2A2A');
        this.ctx.fillStyle = asphaltGrad;
        this.ctx.fillRect(0, 660, this.canvas.width, 70);
        
        // Разметка дороги (движущиеся полосы)
        this.backgroundOffset += this.backgroundSpeed;
        if (this.backgroundOffset > 80) this.backgroundOffset = 0;
        
        this.ctx.fillStyle = '#FFD700';
        for (let i = -1; i < 8; i++) {
            const x = i * 80 - this.backgroundOffset;
            this.ctx.fillRect(x, 693, 50, 4);
        }
        
        // Тень под дорогой
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(0, 730, this.canvas.width, 3);
    }
    
    /**
     * Обновить игрока
     */
    updatePlayer(deltaTime) {
        const p = this.player;
        
        // Анимация бега (независимо от FPS)
        if (!p.isJumping) {
            p.legPhase += 0.3 * deltaTime * 60;
            p.armPhase += 0.25 * deltaTime * 60;
        }
        
        // Гравитация (умножаем на 60 для совместимости со старыми значениями)
        if (p.isJumping) {
            p.velocityY += p.gravity * deltaTime * 60;
            p.y += p.velocityY * deltaTime * 60;
        }
        
        // Проверка земли
        if (p.y >= p.groundY) {
            p.y = p.groundY;
            p.velocityY = 0;
            p.isJumping = false;
        }
        
        // Ограничение по верху
        if (p.y < 0) {
            p.y = 0;
            p.velocityY = 0;
        }
    }
    
    /**
     * Отрисовать игрока (курьер с рюкзаком)
     */
    drawPlayer() {
        const p = this.player;
        
        this.ctx.save();
        this.ctx.translate(p.x + p.width/2, p.y + p.height);
        
        // Рюкзак Ozon (синий)
        const backpackGrad = this.ctx.createLinearGradient(-15, -55, -15, -35);
        backpackGrad.addColorStop(0, '#1E90FF');
        backpackGrad.addColorStop(1, '#0066CC');
        this.ctx.fillStyle = backpackGrad;
        this.roundRect(this.ctx, -18, -55, 16, 20, 4);
        this.ctx.fill();
        
        // Лямки рюкзака
        this.ctx.strokeStyle = '#0066CC';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-12, -50);
        this.ctx.lineTo(-8, -40);
        this.ctx.stroke();
        
        // Тело (оранжевая форма)
        const bodyGrad = this.ctx.createLinearGradient(-10, -50, 10, -20);
        bodyGrad.addColorStop(0, '#FF9933');
        bodyGrad.addColorStop(1, '#FF7700');
        this.ctx.fillStyle = bodyGrad;
        this.roundRect(this.ctx, -10, -50, 20, 30, 5);
        this.ctx.fill();
        
        // Голова
        this.ctx.fillStyle = '#FFDCB0';
        this.ctx.beginPath();
        this.ctx.arc(0, -60, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Глаза
        this.ctx.fillStyle = '#2A2A2E';
        this.ctx.beginPath();
        this.ctx.arc(-4, -62, 2, 0, Math.PI * 2);
        this.ctx.arc(4, -62, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Руки (анимация)
        const armSwing = Math.sin(p.armPhase) * 5;
        this.ctx.fillStyle = '#FFDCB0';
        this.ctx.fillRect(-15, -45 + armSwing, 5, 20);
        this.ctx.fillRect(10, -45 - armSwing, 5, 20);
        
        // Ноги (анимация бега)
        const legSwing = Math.sin(p.legPhase) * 8;
        this.ctx.fillStyle = '#0066CC';
        this.ctx.fillRect(-8, -20, 6, 20 + legSwing);
        this.ctx.fillRect(2, -20, 6, 20 - legSwing);
        
        this.ctx.restore();
    }
    
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    /**
     * Обновить препятствия
     */
    updateObstacles(deltaTime) {
        // Спавн препятствий
        this.obstacleSpawnTimer += deltaTime * 60;
        if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }

        // Двигать препятствия
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.obstacleSpeed * deltaTime * 60;

            // Удалить за экраном
            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10; // Очки за пройденное препятствие
            }
        }

        this.distanceTraveled += this.obstacleSpeed;
    }

    /**
     * Спавн препятствия - разные типы
     */
    spawnObstacle() {
        const type = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];

        const obstacle = {
            x: this.canvas.width,
            type,
            y: 630
        };

        if (type === 'box') {
            obstacle.width = 40;
            obstacle.height = 40;
        } else if (type === 'hole') {
            obstacle.width = 50;
            obstacle.height = 20;
            obstacle.y = 650;
        } else if (type === 'barrier') {
            obstacle.width = 30;
            obstacle.height = 50;
        }

        this.obstacles.push(obstacle);
        if (this.sound) this.sound.playEffect('conveyorTick', 0.6);
    }

    /**
     * Отрисовать препятствия
     */
    drawObstacles() {
        this.obstacles.forEach(obs => {
            if (obs.type === 'box') {
                // Изометрическая коробка
                const boxGrad = this.ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
                boxGrad.addColorStop(0, '#FFB366');
                boxGrad.addColorStop(1, '#FF9933');
                this.ctx.fillStyle = boxGrad;
                this.roundRect(this.ctx, obs.x, obs.y, obs.width, obs.height, 6);
                this.ctx.fill();
                
                // Обводка
                this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                this.ctx.lineWidth = 2;
                this.roundRect(this.ctx, obs.x, obs.y, obs.width, obs.height, 6);
                this.ctx.stroke();
                
                // Скотч
                this.ctx.strokeStyle = '#8B4513';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x + obs.width/2, obs.y);
                this.ctx.lineTo(obs.x + obs.width/2, obs.y + obs.height);
                this.ctx.stroke();
            } else if (obs.type === 'hole') {
                // Яма на дороге
                this.ctx.fillStyle = '#1A1A1A';
                this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                
                // Трещины
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x, obs.y);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                this.ctx.moveTo(obs.x + obs.width, obs.y);
                this.ctx.lineTo(obs.x, obs.y + obs.height);
                this.ctx.stroke();
            } else if (obs.type === 'barrier') {
                // Дорожный барьер
                const barrierGrad = this.ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
                barrierGrad.addColorStop(0, '#FF6B6B');
                barrierGrad.addColorStop(0.5, '#FFF');
                barrierGrad.addColorStop(1, '#FF6B6B');
                this.ctx.fillStyle = barrierGrad;
                this.roundRect(this.ctx, obs.x, obs.y, obs.width, obs.height, 4);
                this.ctx.fill();
                
                // Полосы
                this.ctx.fillStyle = '#FF0000';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(obs.x, obs.y + i * 17, obs.width, 8);
                }
            }
        });
    }

    /**
     * Проверить коллизии (более прощающие как в Chrome Dino)
     */
    checkCollisions() {
        const p = this.player;
        const hitboxPadding = 5;
        const playerHitbox = {
            x: p.x + hitboxPadding,
            y: p.y + hitboxPadding,
            width: p.width - hitboxPadding * 2,
            height: p.height - hitboxPadding * 2
        };

        for (const obs of this.obstacles) {
            if (playerHitbox.x < obs.x + obs.width &&
                playerHitbox.x + playerHitbox.width > obs.x &&
                playerHitbox.y + playerHitbox.height > obs.y &&
                playerHitbox.y < obs.y + obs.height) {
                console.log('💥 КОЛЛИЗИЯ! Игра провалена');
                this.lose();
                return;
            }
        }
    }

    /**
     * Обновить UI (таймер)
     */
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);

        const timerText = document.getElementById('timer-text');
        timerText.textContent = Math.ceil(remaining);

        const timerFill = document.getElementById('timer-fill');
        const percentage = (remaining / this.gameTime) * 100;
        timerFill.style.width = percentage + '%';
    }

    /**
     * Победа
     */
    win() {
        console.log('🏆 УСПЕХ! Игра пройдена');
        this.stop();
        this.gameManager.endGame(true, this.score);
        if (this.sound) this.sound.playEffect('success');
    }

    /**
     * Проигрыш
     */
    lose() {
        console.log('💀 ПРОВАЛ! Столкновение');
        this.stop();
        if (this.sound) this.sound.playEffect('fail');
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ runner.js загружен');
