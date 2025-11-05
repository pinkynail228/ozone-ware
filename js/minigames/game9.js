/**
 * GAME 9 - Складские полки 📚
 * Механика: Свайп товаров на правильную полку (ЭЛЕКТРОНИКА/ОДЕЖДА/КНИГИ)
 * Длительность: 7 секунд
 * Стиль: Ozon брендинг - синие градиенты, свайпы
 */

class Game9 {
    constructor(canvas, ctx, gameManager) {
        console.log('📚 Game9: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 7;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.sorted = 0;
        this.requiredSorted = 6; // Нужно отсортировать 6 товаров
        
        // Полки
        this.shelves = [
            { category: 'tech', emoji: '📱', name: 'ЭЛЕКТРОНИКА', y: 250, color: '#0066ff' },
            { category: 'clothes', emoji: '👕', name: 'ОДЕЖДА', y: 400, color: '#ff6b9d' },
            { category: 'books', emoji: '📚', name: 'КНИГИ', y: 550, color: '#9b59b6' }
        ];
        
        // Товары
        this.items = {
            tech: ['📱', '💻', '⌚', '🎧'],
            clothes: ['👕', '👟', '🧢', '👔'],
            books: ['📚', '📖', '📰', '🗞️']
        };
        
        // Текущий товар для сортировки
        this.currentItem = null;
        this.touchStart = null;
        
        this.spawnItem();
        this.setupControls();
        
        console.log('✅ Game9: Готов');
    }
    
    spawnItem() {
        const categories = ['tech', 'clothes', 'books'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const emoji = this.items[category][Math.floor(Math.random() * this.items[category].length)];
        
        this.currentItem = {
            emoji: emoji,
            category: category,
            x: this.canvas.width / 2,
            y: 150,
            size: 60,
            offsetX: 0,
            offsetY: 0
        };
        
        console.log('📦 Товар:', emoji, 'Категория:', category);
    }
    
    setupControls() {
        this.touchStartHandler = (e) => {
            if (!this.isRunning || !this.currentItem) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Проверить что тапнули на товар
            if (x >= this.currentItem.x - this.currentItem.size / 2 &&
                x <= this.currentItem.x + this.currentItem.size / 2 &&
                y >= this.currentItem.y - this.currentItem.size / 2 &&
                y <= this.currentItem.y + this.currentItem.size / 2) {
                
                this.touchStart = { x, y };
            }
        };
        
        this.touchMoveHandler = (e) => {
            if (!this.isRunning || !this.touchStart || !this.currentItem) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.currentItem.offsetX = x - this.touchStart.x;
            this.currentItem.offsetY = y - this.touchStart.y;
        };
        
        this.touchEndHandler = (e) => {
            if (!this.isRunning || !this.touchStart || !this.currentItem) return;
            e.preventDefault();
            
            const swipeY = this.currentItem.offsetY;
            
            // Определить на какую полку свайпнули
            let targetShelf = null;
            if (Math.abs(swipeY) > 50) { // Минимальная дистанция свайпа
                if (swipeY > 0) {
                    // Свайп вниз
                    targetShelf = swipeY > 200 ? this.shelves[2] : this.shelves[1];
                } else {
                    // Свайп вверх
                    targetShelf = this.shelves[0];
                }
            }
            
            if (targetShelf) {
                if (targetShelf.category === this.currentItem.category) {
                    console.log('✅ Правильная полка!');
                    this.sorted++;
                    this.score += 20;
                    
                    if (this.sorted >= this.requiredSorted) {
                        setTimeout(() => this.win(), 300);
                    } else {
                        this.spawnItem();
                    }
                } else {
                    console.log('❌ Неправильная полка!');
                    this.lose();
                }
            } else {
                // Вернуть товар на место
                this.currentItem.offsetX = 0;
                this.currentItem.offsetY = 0;
            }
            
            this.touchStart = null;
        };
        
        this.canvas.addEventListener('touchstart', this.touchStartHandler);
        this.canvas.addEventListener('touchmove', this.touchMoveHandler);
        this.canvas.addEventListener('touchend', this.touchEndHandler);
        this.canvas.addEventListener('mousedown', this.touchStartHandler);
        this.canvas.addEventListener('mousemove', this.touchMoveHandler);
        this.canvas.addEventListener('mouseup', this.touchEndHandler);
    }
    
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.touchStartHandler);
        this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        this.canvas.removeEventListener('touchend', this.touchEndHandler);
        this.canvas.removeEventListener('mousedown', this.touchStartHandler);
        this.canvas.removeEventListener('mousemove', this.touchMoveHandler);
        this.canvas.removeEventListener('mouseup', this.touchEndHandler);
    }
    
    start() {
        console.log('▶️ Game9: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    stop() {
        console.log('⏹️ Game9: Стоп');
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
        gradient.addColorStop(0, '#002244');
        gradient.addColorStop(1, '#0066ff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('СКЛАДСКИЕ ПОЛКИ 📚', this.canvas.width / 2, 70);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Отсортировано: ${this.sorted}/${this.requiredSorted}`, this.canvas.width / 2, 100);
        
        // Полки
        this.drawShelves();
        
        // Текущий товар
        if (this.currentItem) {
            const x = this.currentItem.x + this.currentItem.offsetX;
            const y = this.currentItem.y + this.currentItem.offsetY;
            
            // Тень товара
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.beginPath();
            this.ctx.arc(x, y + 5, this.currentItem.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Товар
            this.ctx.font = `${this.currentItem.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentItem.emoji, x, y + 20);
            
            // Подсказка свайп
            if (!this.touchStart) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '14px Arial';
                this.ctx.fillText('👆 СВАЙП НА ПОЛКУ', this.canvas.width / 2, 210);
            }
        }
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло!');
            if (this.sorted >= this.requiredSorted) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawShelves() {
        this.shelves.forEach(shelf => {
            // Фон полки
            this.ctx.fillStyle = shelf.color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(20, shelf.y - 40, this.canvas.width - 40, 80);
            this.ctx.globalAlpha = 1;
            
            // Обводка
            this.ctx.strokeStyle = shelf.color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(20, shelf.y - 40, this.canvas.width - 40, 80);
            
            // Emoji и название
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(shelf.emoji, 40, shelf.y + 10);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillText(shelf.name, 100, shelf.y + 5);
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
        console.log('🏆 УСПЕХ! Все товары отсортированы!');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ! Неправильная полка или время вышло');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game9.js загружен');
