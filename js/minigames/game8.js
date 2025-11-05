/**
 * GAME 8 - Найди пару
 * Механика: Тапай на две одинаковые карты подряд
 * Длительность: 6 секунд
 */

class Game8 {
    constructor(canvas, ctx, gameManager) {
        console.log('🃏 Game8: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 6;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.pairs = 0;
        this.requiredPairs = 3; // Нужно найти 3 пары
        
        // Карты
        this.cards = [];
        this.firstCard = null;
        this.secondCard = null;
        this.lockInput = false;
        
        this.createCards();
        this.setupControls();
        
        console.log('✅ Game8: Готов');
    }
    
    createCards() {
        const emojis = ['📱', '💻', '🎮', '⚡', '💎', '🎁'];
        const selectedEmojis = emojis.slice(0, this.requiredPairs);
        
        // Создать пары
        const cardEmojis = [...selectedEmojis, ...selectedEmojis];
        
        // Перемешать
        for (let i = cardEmojis.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardEmojis[i], cardEmojis[j]] = [cardEmojis[j], cardEmojis[i]];
        }
        
        // Создать карты в сетке 3x2
        let index = 0;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                this.cards.push({
                    emoji: cardEmojis[index],
                    x: col * 110 + 45,
                    y: row * 130 + 350,
                    width: 90,
                    height: 110,
                    revealed: false,
                    matched: false,
                    index: index
                });
                index++;
            }
        }
        
        console.log('🃏 Создано карт:', this.cards.length);
    }
    
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning || this.lockInput) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Найти карту
            for (const card of this.cards) {
                if (card.matched || card.revealed) continue;
                
                if (x >= card.x && x <= card.x + card.width &&
                    y >= card.y && y <= card.y + card.height) {
                    
                    console.log('🃏 Открыта карта:', card.emoji);
                    card.revealed = true;
                    
                    if (!this.firstCard) {
                        this.firstCard = card;
                    } else if (!this.secondCard) {
                        this.secondCard = card;
                        this.checkMatch();
                    }
                    break;
                }
            }
        };
        
        this.canvas.addEventListener('touchstart', this.tapHandler);
        this.canvas.addEventListener('mousedown', this.tapHandler);
    }
    
    checkMatch() {
        this.lockInput = true;
        
        setTimeout(() => {
            if (!this.isRunning) return; // Если игра остановлена, не продолжать
            
            if (this.firstCard.emoji === this.secondCard.emoji) {
                console.log('✅ ПАРА НАЙДЕНА!');
                this.firstCard.matched = true;
                this.secondCard.matched = true;
                this.pairs++;
                this.score += 30;
                
                if (this.pairs >= this.requiredPairs) {
                    this.isRunning = false; // Остановить игру
                    setTimeout(() => this.win(), 300);
                    return; // Не разблокировывать input
                }
            } else {
                console.log('❌ НЕ ПАРА!');
                this.firstCard.revealed = false;
                this.secondCard.revealed = false;
            }
            
            this.firstCard = null;
            this.secondCard = null;
            this.lockInput = false;
        }, 500);
    }
    
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.tapHandler);
        this.canvas.removeEventListener('mousedown', this.tapHandler);
    }
    
    start() {
        console.log('▶️ Game8: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    stop() {
        console.log('⏹️ Game8: Стоп');
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
        gradient.addColorStop(0, '#0f2027');
        gradient.addColorStop(0.5, '#203a43');
        gradient.addColorStop(1, '#2c5364');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 28px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('НАЙДИ ПАРЫ!', this.canvas.width / 2, 100);
        
        this.ctx.font = '18px Courier New';
        this.ctx.fillText(`Пар найдено: ${this.pairs}/${this.requiredPairs}`, this.canvas.width / 2, 135);
        
        this.ctx.font = '14px Courier New';
        this.ctx.fillText('Тапай на две одинаковые карты', this.canvas.width / 2, 165);
        
        // Отрисовать карты
        this.drawCards();
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Пар:', this.pairs);
            if (this.pairs >= this.requiredPairs) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawCards() {
        this.cards.forEach(card => {
            // Фон карты
            if (card.matched) {
                this.ctx.fillStyle = '#2ecc71'; // Зелёный для найденных
            } else if (card.revealed) {
                this.ctx.fillStyle = '#fff';
            } else {
                this.ctx.fillStyle = '#3498db'; // Синий для закрытых
            }
            this.ctx.fillRect(card.x, card.y, card.width, card.height);
            
            // Обводка
            this.ctx.strokeStyle = card.revealed || card.matched ? '#000' : '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(card.x, card.y, card.width, card.height);
            
            // Содержимое
            if (card.revealed || card.matched) {
                // Показать emoji
                this.ctx.font = 'bold 48px Courier New';
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = card.matched ? '#fff' : '#000';
                this.ctx.fillText(card.emoji, card.x + card.width / 2, card.y + card.height / 2 + 15);
            } else {
                // Вопросительный знак
                this.ctx.font = 'bold 48px Courier New';
                this.ctx.fillStyle = '#fff';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('?', card.x + card.width / 2, card.y + card.height / 2 + 15);
            }
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
        console.log('🏆 УСПЕХ! Все пары найдены');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ! Не успел найти все пары');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game8.js загружен');
