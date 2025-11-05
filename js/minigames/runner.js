/**
 * RUNNER GAME - Курьер на велосипеде
 * Механика: Тап для прыжка, избегай препятствий
 * Длительность: 10 секунд
 */

class RunnerGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🚴 RunnerGame: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        // Игровые параметры
        this.gameTime = 7; // 7 секунд
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        // Игрок (курьер)
        this.player = {
            x: 80,
            y: 600,
            width: 40,
            height: 60,
            velocityY: 0,
            gravity: 1.2,
            jumpPower: -18,
            isJumping: false,
            groundY: 600,
            color: '#0066ff' // Синий цвет Ozone
        };
        
        // Препятствия
        this.obstacles = [];
        this.obstacleSpeed = 5;
        this.obstacleSpawnTimer = 0;
        this.obstacleSpawnInterval = 80; // Кадры между спавном
        
        // Фон (симуляция движения)
        this.backgroundOffset = 0;
        this.backgroundSpeed = 3;
        
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
    update() {
        if (!this.isRunning) return;
        
        // Очистить экран
        this.ctx.fillStyle = '#87ceeb'; // Небо
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Отрисовать фон (дорога)
        this.drawBackground();
        
        // Обновить физику игрока
        this.updatePlayer();
        
        // Обновить препятствия
        this.updateObstacles();
        
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
        // Земля
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 660, this.canvas.width, this.canvas.height - 660);
        
        // Дорога
        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(0, 660, this.canvas.width, 80);
        
        // Полосы на дороге (движение)
        this.backgroundOffset += this.backgroundSpeed;
        if (this.backgroundOffset > 60) this.backgroundOffset = 0;
        
        this.ctx.fillStyle = '#fff';
        for (let i = -1; i < 10; i++) {
            const x = i * 60 - this.backgroundOffset;
            this.ctx.fillRect(x, 695, 40, 10);
        }
    }
    
    /**
     * Обновить игрока
     */
    updatePlayer() {
        // Гравитация
        this.player.velocityY += this.player.gravity;
        this.player.y += this.player.velocityY;
        
        // Проверка земли
        if (this.player.y >= this.player.groundY) {
            this.player.y = this.player.groundY;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
        
        // Ограничение по верху
        if (this.player.y < 0) {
            this.player.y = 0;
            this.player.velocityY = 0;
        }
    }
    
    /**
     * Отрисовать игрока (курьер на велосипеде)
     */
    drawPlayer() {
        const p = this.player;
        
        // Тело курьера (простой пиксель-арт)
        this.ctx.fillStyle = p.color;
        
        // Голова
        this.ctx.fillRect(p.x + 10, p.y - 10, 20, 20);
        
        // Тело
        this.ctx.fillRect(p.x + 5, p.y + 10, 30, 30);
        
        // Руки
        this.ctx.fillRect(p.x, p.y + 15, 10, 15);
        this.ctx.fillRect(p.x + 30, p.y + 15, 10, 15);
        
        // Ноги (анимация простая)
        const legOffset = Math.sin(Date.now() / 100) * 5;
        this.ctx.fillRect(p.x + 8, p.y + 40, 8, 20);
        this.ctx.fillRect(p.x + 24, p.y + 40 + legOffset, 8, 20);
        
        // Велосипед (упрощенный)
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(p.x + 10, p.y + 65, 8, 0, Math.PI * 2);
        this.ctx.arc(p.x + 30, p.y + 65, 8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Обновить препятствия
     */
    updateObstacles() {
        // Спавн препятствий
        this.obstacleSpawnTimer++;
        if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // Двигать препятствия
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.obstacleSpeed;
            
            // Удалить за экраном
            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10; // Очки за пройденное препятствие
            }
        }
        
        this.distanceTraveled += this.obstacleSpeed;
    }
    
    /**
     * Создать препятствие
     */
    spawnObstacle() {
        const types = ['car', 'person'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let obstacle = {
            x: this.canvas.width,
            type: type
        };
        
        if (type === 'car') {
            obstacle.y = 620;
            obstacle.width = 60;
            obstacle.height = 40;
            obstacle.color = '#ff0000';
        } else {
            obstacle.y = 630;
            obstacle.width = 30;
            obstacle.height = 30;
            obstacle.color = '#ffaa00';
        }
        
        this.obstacles.push(obstacle);
        console.log(`🚧 Препятствие: ${type} на x=${obstacle.x}`);
    }
    
    /**
     * Отрисовать препятствия
     */
    drawObstacles() {
        this.obstacles.forEach(obs => {
            this.ctx.fillStyle = obs.color;
            
            if (obs.type === 'car') {
                // Машина (простой пиксель-арт)
                this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // Окна
                this.ctx.fillStyle = '#87ceeb';
                this.ctx.fillRect(obs.x + 10, obs.y + 5, 15, 15);
                this.ctx.fillRect(obs.x + 35, obs.y + 5, 15, 15);
            } else {
                // Пешеход
                this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // Голова
                this.ctx.fillStyle = '#ffcc99';
                this.ctx.fillRect(obs.x + 7, obs.y - 10, 16, 16);
            }
        });
    }
    
    /**
     * Проверить коллизии
     */
    checkCollisions() {
        const p = this.player;
        
        for (const obs of this.obstacles) {
            // AABB коллизия
            if (p.x < obs.x + obs.width &&
                p.x + p.width > obs.x &&
                p.y + p.height > obs.y &&
                p.y < obs.y + obs.height) {
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
        
        // Таймер
        const timerText = document.getElementById('timer-text');
        timerText.textContent = Math.ceil(remaining);
        
        // Полоса таймера
        const timerFill = document.getElementById('timer-fill');
        const percentage = (remaining / this.gameTime) * 100;
        timerFill.style.width = percentage + '%';
        
        // Счет
        const scoreDisplay = document.getElementById('score-display');
        scoreDisplay.textContent = this.score;
    }
    
    /**
     * Победа
     */
    win() {
        console.log('🏆 УСПЕХ! Игра пройдена');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    /**
     * Проигрыш
     */
    lose() {
        console.log('💀 ПРОВАЛ! Столкновение');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ runner.js загружен');
