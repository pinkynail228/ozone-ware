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
        
        this.gameTime = 7;
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
        
        // Ящики (корзины) по ФОРМЕ
        this.boxes = [
            { x: 80, y: 650, width: 100, height: 80, shape: 'square', label: '■', color: '#0066ff' },
            { x: 210, y: 650, width: 100, height: 80, shape: 'circle', label: '●', color: '#ff0066' }
        ];
        
        // Создать посылки
        this.createPackages();
        
        // Управление
        this.setupControls();
        
        console.log('✅ Game2: Готов');
    }
    
    /**
     * Создать посылки разных ФОРМ
     */
    createPackages() {
        const shapes = ['square', 'circle', 'square', 'circle'];
        
        // Перемешать
        for (let i = shapes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
        }
        
        // Создать 4 посылки в ряд
        for (let i = 0; i < 4; i++) {
            this.packages.push({
                x: i * 80 + 35,
                y: 250,
                width: 60,
                height: 60,
                shape: shapes[i],
                color: '#FFD700', // Все золотые
                sorted: false
            });
        }
        
        console.log('📦 Создано посылок:', this.packages.length);
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
            
            // Найти посылку под пальцем (проверяем в обратном порядке - верхние первыми)
            for (let i = this.packages.length - 1; i >= 0; i--) {
                const pkg = this.packages[i];
                if (!pkg.sorted && this.isInside(x, y, pkg)) {
                    this.draggedPackage = pkg;
                    this.dragOffset.x = x - pkg.x;
                    this.dragOffset.y = y - pkg.y;
                    console.log('🖐️ Схватил посылку:', pkg.color);
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
            
            // Двигать посылку
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
                // Правильная ФОРМА?
                if (pkg.shape === box.shape) {
                    console.log('✅ Правильно! Посылка в ящик:', box.label);
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
                    console.log('❌ Неправильный цвет!');
                    // Вернуть посылку на место (или проиграть)
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
            this.lose();
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
            
            // Метка с ФОРМОЙ
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(box.label, box.x + box.width / 2, box.y + 55);
        });
    }
    
    /**
     * Отрисовать посылки
     */
    drawPackages() {
        this.packages.forEach(pkg => {
            if (pkg.sorted && pkg !== this.draggedPackage) {
                // Отсортированные посылки рисуем меньше
                this.ctx.fillStyle = pkg.color;
                this.ctx.fillRect(pkg.x, pkg.y, 40, 40);
                
                // Галочка
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 24px Courier New';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('✓', pkg.x + 20, pkg.y + 28);
            } else if (pkg !== this.draggedPackage) {
                // Обычные посылки - рисуем ФОРМУ
                this.ctx.fillStyle = pkg.color;
                
                if (pkg.shape === 'square') {
                    this.ctx.fillRect(pkg.x, pkg.y, pkg.width, pkg.height);
                } else if (pkg.shape === 'circle') {
                    this.ctx.beginPath();
                    this.ctx.arc(pkg.x + pkg.width / 2, pkg.y + pkg.height / 2, pkg.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Обводка
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 3;
                if (pkg.shape === 'square') {
                    this.ctx.strokeRect(pkg.x, pkg.y, pkg.width, pkg.height);
                } else {
                    this.ctx.stroke();
                }
            }
        });
        
        // Перетаскиваемая посылка (рисуем последней)
        if (this.draggedPackage) {
            const pkg = this.draggedPackage;
            this.ctx.fillStyle = pkg.color;
            
            if (pkg.shape === 'square') {
                this.ctx.fillRect(pkg.x, pkg.y, pkg.width, pkg.height);
            } else if (pkg.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(pkg.x + pkg.width / 2, pkg.y + pkg.height / 2, pkg.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 4;
            if (pkg.shape === 'square') {
                this.ctx.strokeRect(pkg.x, pkg.y, pkg.width, pkg.height);
            } else {
                this.ctx.stroke();
            }
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
