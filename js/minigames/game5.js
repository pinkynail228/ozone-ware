/**
 * GAME 5 - Поймай товары
 * Механика: Двигай корзину (тап или драг) чтобы ловить падающие товары
 * Длительность: 6 секунд
 */

class Game5 {
    constructor(canvas, ctx, gameManager) {
        console.log('🛒 Game5: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 6;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.caught = 0;
        this.requiredCaught = 5; // Нужно поймать 5 товаров
        
        // Корзина
        this.basket = {
            x: this.canvas.width / 2 - 40,
            y: 720,
            width: 80,
            height: 40,
            targetX: this.canvas.width / 2 - 40
        };
        
        // Падающие товары
        this.items = [];
        this.spawnTimer = 0;
        this.spawnInterval = 40; // Кадры между спавном
        
        this.setupControls();
        
        console.log('✅ Game5: Готов');
    }
    
    setupControls() {
        // Тап/драг для движения корзины
        this.moveHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            
            // Двигать корзину к тапу
            this.basket.targetX = Math.max(0, Math.min(this.canvas.width - this.basket.width, x - this.basket.width / 2));
        };
        
        this.canvas.addEventListener('touchstart', this.moveHandler);
        this.canvas.addEventListener('touchmove', this.moveHandler);
        this.canvas.addEventListener('mousedown', this.moveHandler);
        this.canvas.addEventListener('mousemove', this.moveHandler);
    }
    
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.moveHandler);
        this.canvas.removeEventListener('touchmove', this.moveHandler);
        this.canvas.removeEventListener('mousedown', this.moveHandler);
        this.canvas.removeEventListener('mousemove', this.moveHandler);
    }
    
    start() {
        console.log('▶️ Game5: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    stop() {
        console.log('⏹️ Game5: Стоп');
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.removeControls();
    }
    
    update() {
        if (!this.isRunning) return;
        
        // Фон
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 24px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ПОЙМАЙ ТОВАРЫ!', this.canvas.width / 2, 80);
        
        this.ctx.font = '18px Courier New';
        this.ctx.fillText(`Поймано: ${this.caught}/${this.requiredCaught}`, this.canvas.width / 2, 110);
        
        // Спавн товаров
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnItem();
            this.spawnTimer = 0;
        }
        
        // Обновить товары
        this.updateItems();
        
        // Плавное движение корзины
        this.basket.x += (this.basket.targetX - this.basket.x) * 0.2;
        
        // Отрисовать корзину
        this.drawBasket();
        
        // Отрисовать товары
        this.drawItems();
        
        // Обновить UI
        this.updateUI();
        
        // Проверить победу
        if (this.caught >= this.requiredCaught) {
            console.log('🏆 Поймано достаточно товаров!');
            this.win();
            return;
        }
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Поймано:', this.caught);
            if (this.caught >= this.requiredCaught) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    spawnItem() {
        const emojis = ['📱', '💻', '📦', '🎁', '⚡', '💎'];
        const item = {
            x: Math.random() * (this.canvas.width - 40),
            y: 150,
            width: 40,
            height: 40,
            speed: 3 + Math.random() * 2,
            emoji: emojis[Math.floor(Math.random() * emojis.length)]
        };
        this.items.push(item);
        console.log('📦 Товар спавнится на x:', item.x);
    }
    
    updateItems() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += item.speed;
            
            // Проверить коллизию с корзиной
            if (item.y + item.height >= this.basket.y &&
                item.y <= this.basket.y + this.basket.height &&
                item.x + item.width >= this.basket.x &&
                item.x <= this.basket.x + this.basket.width) {
                console.log('✅ Поймал товар!');
                this.caught++;
                this.score += 20;
                this.items.splice(i, 1);
                continue;
            }
            
            // Удалить упавшие
            if (item.y > this.canvas.height) {
                this.items.splice(i, 1);
            }
        }
    }
    
    drawBasket() {
        // Корзина
        this.ctx.fillStyle = '#ff6b35';
        this.ctx.fillRect(this.basket.x, this.basket.y, this.basket.width, this.basket.height);
        
        // Обводка
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.basket.x, this.basket.y, this.basket.width, this.basket.height);
        
        // Emoji корзины
        this.ctx.font = 'bold 32px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🛒', this.basket.x + this.basket.width / 2, this.basket.y + 30);
    }
    
    drawItems() {
        this.items.forEach(item => {
            this.ctx.font = 'bold 36px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.emoji, item.x + item.width / 2, item.y + item.height / 2 + 10);
        });
    }
    
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
        document.getElementById('score-display').textContent = this.score;
    }
    
    win() {
        console.log('🏆 УСПЕХ! Поймано достаточно товаров');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ! Не успел поймать');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game5.js загружен');
