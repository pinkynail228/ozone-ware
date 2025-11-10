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
        
        this.gameTime = 6;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;
        
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
            const buttonHeight = 90;
            const buttonSpacing = 16;
            const startY = 460;
            const buttonWidth = 360;
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
    
    update(currentTime) {
        if (!this.isRunning) return;
        
        if (!this.lastFrameTime) {
            this.lastFrameTime = currentTime;
            var deltaTime = 1/60;
        } else {
            var deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
            this.lastFrameTime = currentTime;
        }
        
        // Фон Ozon - фиолетовый градиент
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#6B2FFF');
        gradient.addColorStop(1, '#4B1FDD');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Счетчик
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px "Exo 2", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(`${this.correct}/${this.requiredCorrect}`, this.canvas.width / 2, 120);
        this.ctx.shadowBlur = 0;
        
        // Весы (визуал)
        this.drawScales();
        
        // Товар на весах
        if (this.currentItem) {
            this.ctx.font = '100px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 12;
            this.ctx.fillText(this.currentItem.emoji, this.canvas.width / 2, 260);
            this.ctx.shadowBlur = 0;
            
            // Показать вес
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 40px "Exo 2", sans-serif';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 6;
            this.ctx.fillText(`${this.currentItem.weight} кг`, this.canvas.width / 2, 330);
            this.ctx.shadowBlur = 0;
        }
        
        // Без инструкции
        
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
        const cx = this.canvas.width / 2;
        
        // Платформа весов с градиентом
        const platformGrad = this.ctx.createLinearGradient(0, 270, 0, 290);
        platformGrad.addColorStop(0, '#888');
        platformGrad.addColorStop(1, '#555');
        this.ctx.fillStyle = platformGrad;
        this.ctx.fillRect(cx - 120, 270, 240, 20);
        
        // Столбик весов
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(cx - 6, 290, 12, 50);
        
        // Основание
        const baseGrad = this.ctx.createLinearGradient(0, 340, 0, 360);
        baseGrad.addColorStop(0, '#777');
        baseGrad.addColorStop(1, '#444');
        this.ctx.fillStyle = baseGrad;
        this.ctx.fillRect(cx - 70, 340, 140, 20);
    }
    
    drawButtons() {
        const buttonHeight = 90;
        const buttonSpacing = 16;
        const startY = 460;
        const buttonWidth = 360;
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        const radius = 20;
        
        this.weights.forEach((weight, i) => {
            const y = startY + i * (buttonHeight + buttonSpacing);
            
            // Глянцевая кнопка с градиентом
            const btnGrad = this.ctx.createLinearGradient(0, y, 0, y + buttonHeight);
            btnGrad.addColorStop(0, weight.color);
            btnGrad.addColorStop(1, this.darkenColor(weight.color, 0.3));
            
            this.ctx.fillStyle = btnGrad;
            this.roundRect(buttonX, y, buttonWidth, buttonHeight, radius);
            this.ctx.fill();
            
            // Блик сверху
            const gloss = this.ctx.createLinearGradient(0, y, 0, y + buttonHeight * 0.5);
            gloss.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gloss;
            this.roundRect(buttonX, y, buttonWidth, buttonHeight * 0.5, radius);
            this.ctx.fill();
            
            // Обводка
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 3;
            this.roundRect(buttonX, y, buttonWidth, buttonHeight, radius);
            this.ctx.stroke();
            
            // Тень текста
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            
            // Текст
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 28px "Exo 2", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(weight.name, this.canvas.width / 2, y + 58);
            
            this.ctx.shadowBlur = 0;
        });
    }
    
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
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
