/**
 * GAME 5 - Поймай нужный товар
 * Механика: Двигай корзину, лови ТОЛЬКО нужный товар (рандомный каждый раз)
 * Длительность: 6 секунд
 */

class CatcherGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🛒 Game5: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = gameManager.sound;
        
        this.gameTime = 6;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.caught = 0;
        
        // Рандомный целевой товар каждую игру
        this.allItems = ['💻', '📱', '📷', '🎧', '⌚', '👕', '👟', '📚', '🎮'];
        this.targetItem = this.allItems[Math.floor(Math.random() * this.allItems.length)];
        this.targetName = this.getItemName(this.targetItem);
        
        console.log('🎯 Целевой товар:', this.targetItem, this.targetName);
        
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
        this.spawnInterval = 30; // Кадры между спавном - динамичнее!
        
        this.setupControls();
        
        console.log('✅ Game5: Готов');
    }
    
    getItemName(emoji) {
        const names = {
            '💻': 'НОУТБУКИ',
            '📱': 'ТЕЛЕФОНЫ', 
            '📷': 'КАМЕРЫ',
            '🎧': 'НАУШНИКИ',
            '⌚': 'ЧАСЫ',
            '👕': 'ОДЕЖДУ',
            '👟': 'ОБУВЬ',
            '📚': 'КНИГИ',
            '🎮': 'КОНСОЛИ'
        };
        return names[emoji] || 'ТОВАРЫ';
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
        if (this.sound) this.sound.playEffect('start');
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
        
        // Целевой товар и счетчик
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.targetItem, this.canvas.width / 2, 70);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Поймано: ${this.caught}`, this.canvas.width / 2, 100);
        
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
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Поймано:', this.caught);
            // Всегда побеждаем если время вышло (главное - не ловить плохие)
            this.win();
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    spawnItem() {
        // Все товары кроме целевого - плохие
        const badItems = this.allItems.filter(item => item !== this.targetItem);
        
        // 40% шанс целевого товара
        const isGood = Math.random() < 0.4;
        const emoji = isGood ? this.targetItem : badItems[Math.floor(Math.random() * badItems.length)];
        
        const item = {
            x: Math.random() * (this.canvas.width - 40),
            y: 150,
            width: 40,
            height: 40,
            speed: 5 + Math.random() * 2, // Быстрее! 5-7
            emoji: emoji,
            isGood: isGood
        };
        this.items.push(item);
        console.log('📦 Предмет спавнится:', emoji, 'Good:', isGood);
        if (this.sound) this.sound.playEffect(isGood ? 'dropGood' : 'dropBad', 0.7);
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
                
                // Считаем ТОЛЬКО ноутбуки!
                if (item.isGood) {
                    console.log('✅ Поймал ноутбук!');
                    this.caught++;
                    this.score += 20;
                    if (this.sound) this.sound.playEffect('collectGood');
                } else {
                    console.log('❌ Это не ноутбук!');
                    // Можно штраф, но пока просто не считаем
                    if (this.sound) this.sound.playEffect('collectBad');
                }
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
