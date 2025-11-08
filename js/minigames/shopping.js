/**
 * GAME 7 - Сборка заказа 🛒
 * Механика: Тапай товары из списка на конвейере
 * Длительность: 7 секунд
 * Стиль: Ozon брендинг - синие градиенты, крупные emoji
 */

class ShoppingGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🛒 Game7: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = gameManager.sound;
        
        this.gameTime = 7;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        
        // Список товаров для заказа (3 товара)
        const allItems = ['📱', '💻', '🎧', '⌚', '👕', '👟', '📚', '🎮'];
        this.shoppingList = [];
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * allItems.length);
            const item = allItems[randomIndex];
            if (!this.shoppingList.includes(item)) {
                this.shoppingList.push(item);
            } else {
                i--; // Повторить итерацию
            }
        }
        this.collected = new Set();
        
        // Конвейер товаров
        this.conveyor = [];
        this.conveyorSpeed = 4;
        this.spawnTimer = 0;
        this.spawnInterval = 30;
        
        this.setupControls();
        
        console.log('✅ Game7: Готов. Список:', this.shoppingList);
    }
    
    spawnItem() {
        // Сначала ищем несобранные товары из списка
        const neededItems = this.shoppingList.filter(item => !this.collected.has(item));
        
        let emoji;
        
        // 85% шанс спавна нужного товара (если есть несобранные)
        if (neededItems.length > 0 && Math.random() < 0.85) {
            emoji = neededItems[Math.floor(Math.random() * neededItems.length)];
        } else {
            // Спавн отвлекающего товара
            const distractingItems = ['📱', '💻', '🎧', '⌚', '👕', '👟', '📚', '🎮', '📷', '🎹']
                .filter(item => !this.shoppingList.includes(item) || this.collected.has(item)); // Исключаем уже собранные нужные
            emoji = distractingItems[Math.floor(Math.random() * distractingItems.length)];
        }
        
        this.conveyor.push({
            emoji: emoji,
            x: this.canvas.width,
            y: 400,
            size: 50,
            needed: this.shoppingList.includes(emoji) && !this.collected.has(emoji)
        });

        if (this.sound) {
            this.sound.playEffect(neededItems.includes(emoji) ? 'dropGood' : 'dropBad', 0.6);
        }
    }
    
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Проверить тап по товару на конвейере
            for (let i = this.conveyor.length - 1; i >= 0; i--) {
                const item = this.conveyor[i];
                if (x > item.x && x < item.x + item.size &&
                    y > item.y && y < item.y + item.size) {
                    
                    if (item.needed) {
                        console.log('✅ Собрал нужный товар:', item.emoji);
                        this.collected.add(item.emoji);
                        this.score += 30;
                        if (this.sound) this.sound.playEffect('collectGood');
                        this.conveyor.splice(i, 1);
                        
                        // Проверить победу
                        if (this.collected.size === this.shoppingList.length) {
                            setTimeout(() => this.win(), 300);
                        }
                    } else {
                        console.log('❌ Собрал НЕ нужный товар!');
                        if (this.sound) this.sound.playEffect('collectBad');
                        this.lose();
                    }
                    break;
                }
            }
        };
        
        this.canvas.addEventListener('touchstart', this.tapHandler);
        this.canvas.addEventListener('mousedown', this.tapHandler);
    }
    
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.tapHandler);
        this.canvas.removeEventListener('mousedown', this.tapHandler);
    }
    
    start() {
        console.log('▶️ Game7: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    stop() {
        console.log('⏹️ Game7: Стоп');
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.removeControls();
    }
    
    update() {
        if (!this.isRunning) return;
        
        // Фон Ozon - синий градиент
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#003d82');
        gradient.addColorStop(1, '#005bff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Только список товаров без заголовков
        let offsetX = (this.canvas.width - this.shoppingList.length * 70) / 2;
        this.shoppingList.forEach((item, index) => {
            const x = offsetX + index * 70 + 35;
            const y = 120;
            
            // Фон товара
            if (this.collected.has(item)) {
                this.ctx.fillStyle = '#00ff88';
                this.ctx.globalAlpha = 0.3;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 30, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
            
            // Emoji
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item, x, y + 15);
            
            // Галочка если собрано
            if (this.collected.has(item)) {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.fillText('✓', x + 20, y - 15);
            }
        });
        
        // Конвейер
        this.ctx.fillStyle = '#333';
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillRect(0, 370, this.canvas.width, 80);
        this.ctx.globalAlpha = 1;
        
        // Линии конвейера
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 375);
        this.ctx.lineTo(this.canvas.width, 375);
        this.ctx.moveTo(0, 445);
        this.ctx.lineTo(this.canvas.width, 445);
        this.ctx.stroke();
        
        // Спавн товаров
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnItem();
            this.spawnTimer = 0;
        }
        
        // Обновить и отрисовать товары на конвейере
        for (let i = this.conveyor.length - 1; i >= 0; i--) {
            const item = this.conveyor[i];
            item.x -= this.conveyorSpeed;
            
            // Удалить если уехал
            if (item.x + item.size < 0) {
                this.conveyor.splice(i, 1);
                continue;
            }
            
            // Отрисовать товар
            this.ctx.font = '50px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.emoji, item.x + item.size / 2, item.y + item.size - 10);
        }
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Собрано:', this.collected.size);
            if (this.collected.size === this.shoppingList.length) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
    }
    
    win() {
        console.log('🏆 УСПЕХ! Заказ собран!');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ! Неправильный товар или время вышло');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game7.js загружен');
