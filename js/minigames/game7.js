/**
 * GAME 7 - Сборка заказа 🛒
 * Механика: Тапай товары из списка на конвейере
 * Длительность: 7 секунд
 * Стиль: Ozon брендинг - синие градиенты, крупные emoji
 */

class Game7 {
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
        this.wobbleTime = 0;
        this.conveyorOffset = 0;
        this.confetti = this.createConfetti();

        this.setupControls();
        
        console.log('✅ Game7: Готов. Список:', this.shoppingList);
    }
    
    createConfetti() {
        const colors = ['#ff006e', '#ffd166', '#3a86ff', '#06d6a0', '#ffbe0b'];
        const pieces = [];
        for (let i = 0; i < 30; i++) {
            pieces.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                speed: 0.5 + Math.random() * 1.5,
                size: 4 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
        return pieces;
    }

    updateConfetti() {
        for (const piece of this.confetti) {
            piece.y += piece.speed;
            piece.x += Math.sin(piece.y * 0.04) * 0.6;
            if (piece.y > this.canvas.height + 20) {
                piece.y = -10;
                piece.x = Math.random() * this.canvas.width;
            }
        }
    }

    drawConfetti() {
        for (const piece of this.confetti) {
            this.ctx.save();
            this.ctx.fillStyle = piece.color;
            this.ctx.translate(piece.x, piece.y);
            this.ctx.rotate(piece.y * 0.02);
            this.ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size / 2);
            this.ctx.restore();
        }
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
            needed: this.shoppingList.includes(emoji) && !this.collected.has(emoji),
            spawnTime: Date.now()
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
        this.wobbleTime += 0.08;
        this.conveyorOffset += this.conveyorSpeed * 0.6;
        this.updateConfetti();

        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#001b4d');
        gradient.addColorStop(0.5, '#002f87');
        gradient.addColorStop(1, '#0130a3');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.globalAlpha = 0.35;
        this.drawConfetti();
        this.ctx.restore();

        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 26px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, 80);
        this.ctx.rotate(Math.sin(this.wobbleTime) * 0.05);
        this.ctx.fillText('СОБЕРИ ЗАКАЗ 🛒', 0, 0);
        this.ctx.restore();

        // Список товаров
        this.ctx.font = '18px Arial';
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, 130);
        this.ctx.rotate(Math.sin(this.wobbleTime * 1.2) * 0.05);
        this.ctx.fillText('СПИСОК:', 0, 0);
        this.ctx.restore();

        let offsetX = (this.canvas.width - this.shoppingList.length * 70) / 2;
        this.shoppingList.forEach((item, index) => {
            const x = offsetX + index * 70 + 35;
            const y = 180;

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
            this.ctx.save();
            this.ctx.translate(x, y + 15);
            this.ctx.rotate(Math.sin(this.wobbleTime * 1.4 + index) * 0.12);
            this.ctx.font = '48px Arial';
            this.ctx.fillText(item, 0, 0);
            this.ctx.restore();

            // Галочка если собрано
            if (this.collected.has(item)) {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.fillText('✓', x + 20, y - 15);
            }
        });
        
        // Конвейер
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, 410);
        this.ctx.rotate(Math.sin(this.wobbleTime * 0.8) * 0.04);
        this.ctx.translate(-this.canvas.width / 2, -410);
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.globalAlpha = 0.55;
        this.ctx.fillRect(-40, 370, this.canvas.width + 80, 80);
        this.ctx.globalAlpha = 1;

        // Линии конвейера
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 375);
        this.ctx.lineTo(this.canvas.width, 375);
        this.ctx.moveTo(-40, 445);
        this.ctx.lineTo(this.canvas.width + 40, 445);
        this.ctx.stroke();
        this.ctx.restore();

        // Декоративная лента
        this.ctx.save();
        this.ctx.strokeStyle = '#ffbe0b';
        this.ctx.lineWidth = 6;
        this.ctx.globalAlpha = 0.35;
        this.ctx.beginPath();
        const beltWave = Math.sin(this.wobbleTime * 0.9) * 10;
        this.ctx.moveTo(-60, 355 + beltWave);
        for (let x = -60; x <= this.canvas.width + 60; x += 40) {
            this.ctx.lineTo(x, 360 + beltWave + Math.sin((x + this.conveyorOffset) * 0.1) * 6);
        }
        this.ctx.stroke();
        this.ctx.restore();

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
            this.ctx.save();
            const elapsed = (Date.now() - item.spawnTime) / 160;
            const bounce = Math.sin(elapsed) * 6;
            this.ctx.translate(item.x + item.size / 2, item.y + item.size / 2 + bounce);
            this.ctx.rotate(Math.sin(elapsed * 0.6) * 0.15);
            const scale = 1 + Math.sin(elapsed * 1.2) * 0.08;
            this.ctx.scale(scale, scale);
            this.ctx.font = '50px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.emoji, 0, item.size / 2 - 10);
            this.ctx.restore();
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
        document.getElementById('score-display').textContent = this.score;
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
