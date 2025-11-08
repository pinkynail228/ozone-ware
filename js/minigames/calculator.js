/**
 * GAME 6 - Быстрая математика
 * Механика: Решай простые примеры, тапай на правильный ответ
 * Длительность: 5 секунд
 */

class CalculatorGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🔢 Game6: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 5;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.solved = 0;
        this.requiredSolved = 1; // Нужно решить 1 пример
        
        // Текущий пример
        this.currentProblem = null;
        this.answers = [];
        
        this.generateProblem();
        this.setupControls();
        
        console.log('✅ Game6: Готов');
    }
    
    generateProblem() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operations = ['+', '-', '×'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        let correctAnswer;
        switch(operation) {
            case '+':
                correctAnswer = num1 + num2;
                break;
            case '-':
                // Всегда положительный результат
                if (num1 < num2) {
                    correctAnswer = num2 - num1;
                    this.currentProblem = { num1: num2, num2: num1, operation, text: `${num2} - ${num1}` };
                } else {
                    correctAnswer = num1 - num2;
                    this.currentProblem = { num1, num2, operation, text: `${num1} - ${num2}` };
                }
                break;
            case '×':
                correctAnswer = num1 * num2;
                this.currentProblem = { num1, num2, operation, text: `${num1} × ${num2}` };
                break;
        }
        
        if (!this.currentProblem) {
            this.currentProblem = { num1, num2, operation, text: `${num1} ${operation} ${num2}` };
        }
        this.currentProblem.correctAnswer = correctAnswer;
        
        // Создать 3 варианта ответа
        this.answers = [];
        this.answers.push({ value: correctAnswer, correct: true });
        
        // Два неправильных ответа
        let wrong1 = correctAnswer + Math.floor(Math.random() * 5) + 1;
        let wrong2 = correctAnswer - Math.floor(Math.random() * 5) - 1;
        if (wrong2 < 0) wrong2 = correctAnswer + Math.floor(Math.random() * 3) + 6;
        
        this.answers.push({ value: wrong1, correct: false });
        this.answers.push({ value: wrong2, correct: false });
        
        // Перемешать
        for (let i = this.answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.answers[i], this.answers[j]] = [this.answers[j], this.answers[i]];
        }
        
        // ПОСЛЕ перемешивания установить координаты
        this.answers[0].x = 50;
        this.answers[0].y = 500;
        this.answers[0].width = 80;
        this.answers[0].height = 80;
        
        this.answers[1].x = 155;
        this.answers[1].y = 500;
        this.answers[1].width = 80;
        this.answers[1].height = 80;
        
        this.answers[2].x = 260;
        this.answers[2].y = 500;
        this.answers[2].width = 80;
        this.answers[2].height = 80;
        
        console.log('🔢 Пример:', this.currentProblem.text, '=', correctAnswer);
    }
    
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Проверить, на какой ответ тапнули
            for (const answer of this.answers) {
                if (x >= answer.x && x <= answer.x + answer.width &&
                    y >= answer.y && y <= answer.y + answer.height) {
                    
                    if (answer.correct) {
                        console.log('✅ ПРАВИЛЬНО!');
                        this.solved++;
                        this.score += 30;
                        
                        if (this.solved >= this.requiredSolved) {
                            this.isRunning = false; // Остановить игру
                            setTimeout(() => this.win(), 300);
                        } else {
                            this.generateProblem();
                        }
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
    }
    
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.tapHandler);
        this.canvas.removeEventListener('mousedown', this.tapHandler);
    }
    
    start() {
        console.log('▶️ Game6: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    stop() {
        console.log('⏹️ Game6: Стоп');
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
        gradient.addColorStop(0, '#4a148c');
        gradient.addColorStop(1, '#7b1fa2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Только счетчик
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.solved}/${this.requiredSolved}`, this.canvas.width / 2, 60);
        
        // Пример
        if (this.currentProblem) {
            this.ctx.font = 'bold 72px Courier New';
            this.ctx.fillText(this.currentProblem.text, this.canvas.width / 2, 300);
            
            this.ctx.font = 'bold 48px Courier New';
            this.ctx.fillText('= ? ₽', this.canvas.width / 2, 380);
        }
        
        // Варианты ответов
        this.drawAnswers();
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Решено:', this.solved);
            if (this.solved >= this.requiredSolved) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawAnswers() {
        this.answers.forEach(answer => {
            // Фон кнопки
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(answer.x, answer.y, answer.width, answer.height);
            
            // Обводка
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(answer.x, answer.y, answer.width, answer.height);
            
            // Число
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 36px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(answer.value, answer.x + answer.width / 2, answer.y + answer.height / 2 + 12);
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
        console.log('🏆 УСПЕХ! Все примеры решены');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ!');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game6.js загружен');
