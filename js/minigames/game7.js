/**
 * GAME 7 - Цвет или текст? (Stroop Test)
 * Механика: Тапай ТОЛЬКО если цвет текста совпадает со словом
 * Длительность: 5 секунд
 */

class Game7 {
    constructor(canvas, ctx, gameManager) {
        console.log('🎨 Game7: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 5;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.correct = 0;
        this.requiredCorrect = 5; // Нужно 5 правильных
        
        // Цвета
        this.colors = [
            { name: 'СИНИЙ', code: '#0066ff' },
            { name: 'КРАСНЫЙ', code: '#ff0000' },
            { name: 'ЗЕЛЁНЫЙ', code: '#00cc00' },
            { name: 'ЖЁЛТЫЙ', code: '#ffcc00' }
        ];
        
        // Текущее слово
        this.currentWord = null;
        this.currentColor = null;
        this.isMatch = false;
        this.changeTimer = 0;
        this.changeInterval = 90; // Показывать 1.5 секунды
        
        this.generateWord();
        this.setupControls();
        
        console.log('✅ Game7: Готов');
    }
    
    generateWord() {
        // Случайное слово
        this.currentWord = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        // Случайный цвет для текста
        this.currentColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        // Проверить совпадение
        this.isMatch = this.currentWord.name === this.currentColor.name;
        
        console.log('🎨 Слово:', this.currentWord.name, 'Цвет:', this.currentColor.name, 'Совпадение:', this.isMatch);
        
        this.changeTimer = 0;
    }
    
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            // Тап = "совпадает"
            if (this.isMatch) {
                console.log('✅ ПРАВИЛЬНО! Совпадает');
                this.correct++;
                this.score += 20;
                
                if (this.correct >= this.requiredCorrect) {
                    this.isRunning = false; // Остановить игру
                    setTimeout(() => this.win(), 200);
                } else {
                    this.generateWord();
                }
            } else {
                console.log('❌ НЕПРАВИЛЬНО! Не совпадает');
                this.lose();
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
        
        // Фон
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ЦВЕТ = СЛОВО?', this.canvas.width / 2, 100);
        
        this.ctx.font = '16px Courier New';
        this.ctx.fillText('Тапай ТОЛЬКО если совпадает!', this.canvas.width / 2, 130);
        
        this.ctx.fillText(`Правильно: ${this.correct}/${this.requiredCorrect}`, this.canvas.width / 2, 160);
        
        // Слово с цветом
        if (this.currentWord && this.currentColor) {
            this.ctx.font = 'bold 64px Courier New';
            this.ctx.fillStyle = this.currentColor.code;
            this.ctx.fillText(this.currentWord.name, this.canvas.width / 2, 400);
            
            // Подсказка (пульсирует если совпадает)
            if (this.isMatch) {
                const alpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = 'bold 32px Courier New';
                this.ctx.fillText('ТАПАЙ!', this.canvas.width / 2, 500);
                this.ctx.globalAlpha = 1;
            } else {
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.font = 'bold 32px Courier New';
                this.ctx.fillText('НЕ ТАПАЙ!', this.canvas.width / 2, 500);
            }
        }
        
        // Автосмена через время (если не тапнули)
        this.changeTimer++;
        if (this.changeTimer >= this.changeInterval) {
            // Пропустили не-совпадение = хорошо
            if (!this.isMatch) {
                console.log('✅ Правильно пропущено не-совпадение');
                this.correct++;
                this.score += 10;
                
                if (this.correct >= this.requiredCorrect) {
                    this.isRunning = false; // Остановить игру
                    setTimeout(() => this.win(), 200);
                    return; // Прекратить выполнение
                }
            }
            this.generateWord();
        }
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Правильных:', this.correct);
            if (this.correct >= this.requiredCorrect) {
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
        document.getElementById('score-display').textContent = this.score;
    }
    
    win() {
        console.log('🏆 УСПЕХ! Достаточно правильных ответов');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ!');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game7.js загружен');
