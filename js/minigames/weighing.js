/**
 * GAME 10 - Весы склада ⚖️
 * Механика: Взвесь товар - тапни правильную категорию (ЛЕГКИЙ/НОРМАЛЬНЫЙ/ТЯЖЕЛЫЙ)
 * Длительность: 7 секунд
 * Стиль: Ozon брендинг - синие градиенты, большие кнопки
 */

class WeighingGame {
    constructor(canvas, ctx, gameManager) {
        console.log('⚖️ Game10: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 7;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.correct = 0;
        this.requiredCorrect = 5; // Нужно 5 правильных
        
        // Категории веса
        this.weights = [
            { category: 'light', name: 'ЛЕГКИЙ', color: '#2ecc71', range: [0, 1] },
            { category: 'medium', name: 'НОРМАЛЬНЫЙ', color: '#f39c12', range: [1, 5] },
            { category: 'heavy', name: 'ТЯЖЕЛЫЙ', color: '#e74c3c', range: [5, 20] }
        ];
        
        // Товары с весами
        this.items = [
            { emoji: '📱', weight: 0.2, category: 'light' },
            { emoji: '💻', weight: 2, category: 'medium' },
            { emoji: '📚', weight: 1.5, category: 'medium' },
            { emoji: '⌚', weight: 0.1, category: 'light' },
            { emoji: '📦', weight: 3, category: 'medium' },
            { emoji: '🏋️', weight: 10, category: 'heavy' },
            { emoji: '📺', weight: 8, category: 'heavy' },
            { emoji: '🎮', weight: 0.5, category: 'light' }
        ];
        
        this.currentItem = null;
        this.generateItem();
        this.setupControls();
        
        console.log('✅ Game10: Готов');
    }
    
    generateItem() {
        const item = this.items[Math.floor(Math.random() * this.items.length)];
        this.currentItem = {
            emoji: item.emoji,
            weight: item.weight,
            category: item.category
        };
        
        console.log('⚖️ Товар:', item.emoji, 'Вес:', item.weight, 'кг');
    }
    
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Проверить тап по кнопкам (3 кнопки)
            const buttonHeight = 80;
            const buttonSpacing = 20;
            const startY = 450;
            const buttonWidth = 340;
            const buttonX = (this.canvas.width - buttonWidth) / 2;
            
            for (let i = 0; i < 3; i++) {
                const buttonY = startY + i * (buttonHeight + buttonSpacing);
                
                if (x >= buttonX && x <= buttonX + buttonWidth &&
                    y >= buttonY && y <= buttonY + buttonHeight) {
                    
                    const selected = this.weights[i];
                    
                    if (selected.category === this.currentItem.category) {
                        console.log('✅ Правильно!');
                        this.correct++;
                        this.score += 20;
                        
                        if (this.correct >= this.requiredCorrect) {
                            setTimeout(() => this.win(), 300);
                        } else {
                            this.generateItem();
                        }
                    } else {
                        console.log('❌ Неправильно!');
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
        console.log('▶️ Game10: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    stop() {
        console.log('⏹️ Game10: Стоп');
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
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 26px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ВЕСЫ СКЛАДА ⚖️', this.canvas.width / 2, 70);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Правильно: ${this.correct}/${this.requiredCorrect}`, this.canvas.width / 2, 105);
        
        // Весы (визуал)
        this.drawScales();
        
        // Товар на весах
        if (this.currentItem) {
            this.ctx.font = '80px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentItem.emoji, this.canvas.width / 2, 250);
            
            // Показать вес
            this.ctx.fillStyle = '#00ff88';
            this.ctx.font = 'bold 32px Courier New';
            this.ctx.fillText(`${this.currentItem.weight} кг`, this.canvas.width / 2, 320);
        }
        
        // Инструкция
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('ВЫБЕРИ КАТЕГОРИЮ:', this.canvas.width / 2, 400);
        
        // Кнопки выбора
        this.drawButtons();
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло!');
            if (this.correct >= this.requiredCorrect) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawScales() {
        // Платформа весов
        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(this.canvas.width / 2 - 100, 270, 200, 20);
        
        // Столбик весов
        this.ctx.fillRect(this.canvas.width / 2 - 5, 290, 10, 40);
        
        // Основание
        this.ctx.fillRect(this.canvas.width / 2 - 60, 330, 120, 15);
    }
    
    drawButtons() {
        const buttonHeight = 80;
        const buttonSpacing = 20;
        const startY = 450;
        const buttonWidth = 340;
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        
        this.weights.forEach((weight, i) => {
            const y = startY + i * (buttonHeight + buttonSpacing);
            
            // Фон кнопки
            this.ctx.fillStyle = weight.color;
            this.ctx.fillRect(buttonX, y, buttonWidth, buttonHeight);
            
            // Обводка
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(buttonX, y, buttonWidth, buttonHeight);
            
            // Текст
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(weight.name, this.canvas.width / 2, y + 50);
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
        console.log('🏆 УСПЕХ! Все взвешено правильно!');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ! Неправильная категория');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game10.js загружен');
