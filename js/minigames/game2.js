/**
 * GAME 2 - Сортировка посылок
 * Механика: Перетаскивай посылки в правильные ящики по ФОРМЕ
 * Длительность: 7 секунд
 */

class Game2 {
    constructor(canvas, ctx, gameManager) {
        console.log('📦 Game2: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 8;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.sortedPackages = 0;
        this.totalPackages = 4;
        
        // Посылки
        this.packages = [];
        this.draggedPackage = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Корзины: ОДЕЖДА и ТЕХНИКА
        this.boxes = [
            { x: 60, y: 650, width: 120, height: 80, category: 'clothes', label: '👕', color: '#FF6B9D', name: 'ОДЕЖДА' },
            { x: 210, y: 650, width: 120, height: 80, category: 'tech', label: '📱', color: '#4A90E2', name: 'ТЕХНИКА' }
        ];
        
        // Создать посылки
        this.createPackages();
        
        // Управление
        this.setupControls();
        
        console.log('✅ Game2: Готов');
    }
    
    /**
     * Создать товары для сортировки
     */
    createPackages() {
        // Товары: 2 одежда + 2 техника
        const items = [
            { category: 'clothes', emoji: '👕', name: 'ФУТБОЛКА' },
            { category: 'clothes', emoji: '👟', name: 'КРОССОВКИ' },
            { category: 'tech', emoji: '📱', name: 'ТЕЛЕФОН' },
            { category: 'tech', emoji: '💻', name: 'НОУТБУК' }
        ];
        
        // Перемешать
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        
        // Создать 4 товара в ряд
        for (let i = 0; i < 4; i++) {
            this.packages.push({
                x: i * 80 + 35,
                y: 250,
                width: 60,
                height: 60,
                category: items[i].category,
                emoji: items[i].emoji,
                name: items[i].name,
                sorted: false
            });
        }
        
        console.log('📦 Создано товаров:', this.packages.length);
    }
    
    /**
     * Настроить управление
     */
    setupControls() {
        // Touch start
        this.touchStartHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Найти товар под пальцем (проверяем в обратном порядке - верхние первыми)
            for (let i = this.packages.length - 1; i >= 0; i--) {
                const pkg = this.packages[i];
                if (!pkg.sorted && this.isInside(x, y, pkg)) {
                    this.draggedPackage = pkg;
                    this.dragOffset.x = x - pkg.x;
                    this.dragOffset.y = y - pkg.y;
                    console.log('🖐️ Схватил товар:', pkg.name);
                    break;
                }
            }
        };
        
        // Touch move
        this.touchMoveHandler = (e) => {
            if (!this.isRunning || !this.draggedPackage) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Двигать товар
            this.draggedPackage.x = x - this.dragOffset.x;
            this.draggedPackage.y = y - this.dragOffset.y;
        };
        
        // Touch end
        this.touchEndHandler = (e) => {
            if (!this.isRunning || !this.draggedPackage) return;
            e.preventDefault();
            
            // Проверить, попала ли в правильный ящик
            this.checkDrop();
            this.draggedPackage = null;
        };
        
        this.canvas.addEventListener('touchstart', this.touchStartHandler);
        this.canvas.addEventListener('touchmove', this.touchMoveHandler);
        this.canvas.addEventListener('touchend', this.touchEndHandler);
        
        // Mouse events для десктопа
        this.canvas.addEventListener('mousedown', this.touchStartHandler);
        this.canvas.addEventListener('mousemove', this.touchMoveHandler);
        this.canvas.addEventListener('mouseup', this.touchEndHandler);
        
        console.log('🎮 Управление: Драг-энд-дроп');
    }
    
    /**
     * Убрать управление
     */
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.touchStartHandler);
        this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        this.canvas.removeEventListener('touchend', this.touchEndHandler);
        this.canvas.removeEventListener('mousedown', this.touchStartHandler);
        this.canvas.removeEventListener('mousemove', this.touchMoveHandler);
        this.canvas.removeEventListener('mouseup', this.touchEndHandler);
    }
    
    /**
     * Проверить, внутри ли точка объекта
     */
    isInside(x, y, obj) {
        return x >= obj.x && x <= obj.x + obj.width &&
               y >= obj.y && y <= obj.y + obj.height;
    }
    
    /**
     * Проверить drop в ящик
     */
    checkDrop() {
        const pkg = this.draggedPackage;
        const centerX = pkg.x + pkg.width / 2;
        const centerY = pkg.y + pkg.height / 2;
        
        // Проверить каждый ящик
        for (const box of this.boxes) {
            if (this.isInside(centerX, centerY, box)) {
                // Правильная КАТЕГОРИЯ?
                if (pkg.category === box.category) {
                    console.log('✅ Правильно! Товар в ящик:', box.label);
                    pkg.sorted = true;
                    pkg.x = box.x + 20;
                    pkg.y = box.y + 10;
                    this.sortedPackages++;
                    this.score += 25;
                    
                    // Проверить победу
                    if (this.sortedPackages >= this.totalPackages) {
                        setTimeout(() => this.win(), 300);
                    }
                } else {
                    console.log('❌ Неправильный ящик!');
                    // Вернуть товар на место (или проиграть)
                    this.lose();
                }
                return;
            }
        }
    }
    
    /**
     * Запустить игру
     */
    start() {
        console.log('▶️ Game2: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    /**
     * Остановить игру
     */
    stop() {
        console.log('⏹️ Game2: Стоп');
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
        this.ctx.fillStyle = '#2d3561';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('СОРТИРУЙ ПОСЫЛКИ!', this.canvas.width / 2, 100);
        
        this.ctx.font = '16px Courier New';
        this.ctx.fillText('Перетащи в нужный цвет', this.canvas.width / 2, 130);
        
        // Отрисовать ящики
        this.drawBoxes();
        
        // Отрисовать посылки
        this.drawPackages();
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло!');
            if (this.sortedPackages >= this.totalPackages) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        // Debug
        this.gameManager.updateDebug(`
            Time: ${(this.gameTime - elapsed).toFixed(1)}s<br>
            Sorted: ${this.sortedPackages}/${this.totalPackages}<br>
            Score: ${this.score}<br>
            Dragging: ${this.draggedPackage ? 'YES' : 'NO'}
        `);
        
        // Следующий кадр
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    /**
     * Отрисовать ящики
     */
    drawBoxes() {
        this.boxes.forEach(box => {
            // Фон ящика
            this.ctx.fillStyle = box.color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(box.x, box.y, box.width, box.height);
            this.ctx.globalAlpha = 1;
            
            // Обводка
            this.ctx.strokeStyle = box.color;
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            // Emoji категории
            this.ctx.font = 'bold 50px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(box.label, box.x + box.width / 2, box.y + 55);
            
            // Название категории
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Courier New';
            this.ctx.fillText(box.name, box.x + box.width / 2, box.y + box.height + 20);
        });
    }
    
    /**
     * Отрисовать товары (emoji)
     */
    drawPackages() {
        this.packages.forEach(pkg => {
            if (pkg.sorted && pkg !== this.draggedPackage) {
                // Отсортированные товары - меньше с галочкой
                this.ctx.font = '32px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(pkg.emoji, pkg.x + 20, pkg.y + 32);
                
                // Галочка
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillText('✓', pkg.x + 35, pkg.y + 15);
            } else if (pkg !== this.draggedPackage) {
                // Обычные товары - просто emoji
                this.ctx.font = '48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(pkg.emoji, pkg.x + pkg.width / 2, pkg.y + pkg.height - 10);
            }
        });
        
        // Перетаскиваемый товар (рисуем последней)
        if (this.draggedPackage) {
            const pkg = this.draggedPackage;
            this.ctx.font = '52px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(pkg.emoji, pkg.x + pkg.width / 2, pkg.y + pkg.height - 5);
        }
    }
    
    /**
     * Обновить UI
     */
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        const timerText = document.getElementById('timer-text');
        timerText.textContent = Math.ceil(remaining);
        
        const timerFill = document.getElementById('timer-fill');
        const percentage = (remaining / this.gameTime) * 100;
        timerFill.style.width = percentage + '%';
        
        const scoreDisplay = document.getElementById('score-display');
        scoreDisplay.textContent = this.score;
    }
    
    /**
     * Победа
     */
    win() {
        console.log('🏆 УСПЕХ! Все посылки отсортированы');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    /**
     * Проигрыш
     */
    lose() {
        console.log('💀 ПРОВАЛ! Неправильная сортировка или время вышло');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game2.js загружен');
