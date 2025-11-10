/**
 * GAME 3 - Найди товар
 * Механика: Тап на правильный товар среди множества
 * Длительность: 8 секунд
 */

class FinderGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🎯 Game3: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 6;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;
        
        this.score = 0;
        this.foundCorrect = false;
        
        // Типы товаров маркетплейса (emoji)
        this.itemTypes = [
            { emoji: '📱', name: 'ТЕЛЕФОН' },
            { emoji: '💻', name: 'НОУТБУК' },
            { emoji: '📺', name: 'ТЕЛЕВИЗОР' },
            { emoji: '🎧', name: 'НАУШНИКИ' },
            { emoji: '⌚', name: 'ЧАСЫ' },
            { emoji: '📷', name: 'КАМЕРА' },
            { emoji: '👕', name: 'ОДЕЖДА' },
            { emoji: '👟', name: 'КРОССОВКИ' },
            { emoji: '🎮', name: 'КОНСОЛЬ' },
            { emoji: '📚', name: 'КНИГА' }
        ];
        
        // Выбрать целевой товар
        this.targetItem = this.itemTypes[Math.floor(Math.random() * this.itemTypes.length)];
        console.log('🎯 Целевой товар:', this.targetItem.name);
        
        // Сетка товаров
        this.items = [];
        this.createItemGrid();
        
        // Управление
        this.setupControls();
        
        console.log('✅ Game3: Готов');
    }
    
    /**
     * Создать сетку товаров
     */
    createItemGrid() {
        const rows = 4;
        const cols = 3;
        const itemSize = 70;
        const startX = 45;
        const startY = 250;
        const spacingX = 105;
        const spacingY = 120;
        
        // Создать сетку с рандомными товарами
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Случайный товар (не целевой)
                let randomItem;
                do {
                    randomItem = this.itemTypes[Math.floor(Math.random() * this.itemTypes.length)];
                } while (randomItem === this.targetItem);
                
                this.items.push({
                    x: col * spacingX + startX,
                    y: row * spacingY + startY,
                    width: itemSize,
                    height: itemSize,
                    type: randomItem,
                    isTarget: false,
                    scale: 1
                });
            }
        }
        
        // Заменить один случайный товар на целевой
        const targetIndex = Math.floor(Math.random() * this.items.length);
        this.items[targetIndex].type = this.targetItem;
        this.items[targetIndex].isTarget = true;
        
        console.log('🎯 Создано товаров:', this.items.length);
        console.log('🎯 Целевой на позиции:', targetIndex);
    }
    
    /**
     * Настроить управление
     */
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning || this.foundCorrect) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            console.log('🖱️ Тап на:', x, y);
            
            // Проверить, попал ли в какой-то товар
            for (const item of this.items) {
                if (this.isInside(x, y, item)) {
                    console.log('📦 Тап на товар:', item.type.name);
                    
                    if (item.isTarget) {
                        console.log('✅ ПРАВИЛЬНО!');
                        this.foundCorrect = true;
                        this.score = 100;
                        item.scale = 1.5; // Увеличить для эффекта
                        setTimeout(() => this.win(), 500);
                    } else {
                        console.log('❌ НЕПРАВИЛЬНО!');
                        this.lose();
                    }
                    break;
                }
            }
        };
        
        this.canvas.addEventListener('touchstart', this.tapHandler);
        this.canvas.addEventListener('mousedown', this.tapHandler);
        
        console.log('🎮 Управление: Тап на товар');
    }
    
    /**
     * Убрать управление
     */
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.tapHandler);
        this.canvas.removeEventListener('mousedown', this.tapHandler);
    }
    
    /**
     * Проверить, внутри ли точка объекта
     */
    isInside(x, y, obj) {
        return x >= obj.x && x <= obj.x + obj.width &&
               y >= obj.y && y <= obj.y + obj.height;
    }
    
    /**
     * Запустить игру
     */
    start() {
        console.log('▶️ Game3: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    /**
     * Остановить игру
     */
    stop() {
        console.log('⏹️ Game3: Стоп');
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
        
        if (!this.lastFrameTime) {
            this.lastFrameTime = currentTime;
            var deltaTime = 1/60;
        } else {
            var deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
            this.lastFrameTime = currentTime;
        }
        
        // Очистить экран
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(1, '#2d4a6e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Целевой товар с градиентным эффектом
        if (window.visualEffects) {
            window.visualEffects.drawGradientEmoji(
                this.ctx, 
                this.targetItem.emoji, 
                this.canvas.width / 2, 
                140, 
                60
            );
        } else {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 60px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.targetItem.emoji, this.canvas.width / 2, 140);
        }
        
        // Отрисовать товары
        this.drawItems();
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime && !this.foundCorrect) {
            console.log('⏰ Время вышло!');
            this.lose();
            return;
        }
        
        // Debug
        this.gameManager.updateDebug(`
            Time: ${(this.gameTime - elapsed).toFixed(1)}s<br>
            Target: ${this.targetItem.name}<br>
            Found: ${this.foundCorrect ? 'YES' : 'NO'}<br>
            Items: ${this.items.length}
        `);
        
        // Следующий кадр
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    /**
     * Отрисовать товары
     */
    drawItems() {
        this.items.forEach((item, index) => {
            // Анимация покачивания для разнообразия
            const wobble = Math.sin(Date.now() / 200 + index) * 3;
            
            // Фон товара
            this.ctx.fillStyle = item.isTarget && this.foundCorrect 
                ? 'rgba(0, 255, 136, 0.3)' 
                : 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(
                item.x - 5, 
                item.y - 5 + wobble, 
                item.width + 10, 
                item.height + 10
            );
            
            // Обводка
            this.ctx.strokeStyle = item.isTarget && this.foundCorrect 
                ? '#00ff88' 
                : 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = item.isTarget && this.foundCorrect ? 4 : 2;
            this.ctx.strokeRect(
                item.x - 5, 
                item.y - 5 + wobble, 
                item.width + 10, 
                item.height + 10
            );
            
            // Emoji товара с градиентным эффектом
            const fontSize = 50 * item.scale;
            if (window.visualEffects) {
                window.visualEffects.drawGradientEmoji(
                    this.ctx,
                    item.type.emoji,
                    item.x + item.width / 2,
                    item.y + item.height / 2 + wobble,
                    fontSize
                );
            } else {
                this.ctx.font = `bold ${fontSize}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = '#fff';
                this.ctx.fillText(
                    item.type.emoji, 
                    item.x + item.width / 2, 
                    item.y + item.height / 2 + wobble
                );
            }
        });
    }
    
    /**
     * Обновить UI
     */
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        const timerText = document.getElementById('timer-text');
        if (timerText) timerText.textContent = Math.ceil(remaining);
        
        const timerFill = document.getElementById('timer-fill');
        if (timerFill) {
            const percentage = (remaining / this.gameTime) * 100;
            timerFill.style.width = percentage + '%';
        }
    }
    
    /**
     * Победа
     */
    win() {
        console.log('🏆 УСПЕХ! Правильный товар найден');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    /**
     * Проигрыш
     */
    lose() {
        console.log('💀 ПРОВАЛ! Неправильный товар или время вышло');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game3.js загружен');
