/**
 * GAME 7 - Запоминание заказа 🛍️
 * Механика: Запомни товары (2с) → собери с конвейера (5с)
 * Фазы: Показ 2с + Конвейер 5с = 7с
 */

class ShoppingGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🛒 Game7: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = gameManager.sound;
        
        this.showPhaseTime = 2; // 2 секунды показ
        this.conveyorPhaseTime = 5; // 5 секунд конвейер
        this.gameTime = this.showPhaseTime + this.conveyorPhaseTime; // 7 секунд всего
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        this.phase = 'show'; // 'show' или 'conveyor'
        this.lastFrameTime = null; // Для delta time
        
        this.score = 0;
        
        // Большой пул товаров
        const allItems = ['📱', '💻', '🎧', '⌚', '👕', '👟', '📚', '🎮', '📷', '🎸', '⌨️', '👗', '🧥', '👖', '🖥️'];
        
        // Всегда 3 товара для запоминания
        this.itemsToRemember = [];
        const count = 3; // Ровно 3 товара
        while (this.itemsToRemember.length < count) {
            const item = allItems[Math.floor(Math.random() * allItems.length)];
            if (!this.itemsToRemember.includes(item)) {
                this.itemsToRemember.push(item);
            }
        }
        
        this.collected = [];
        this.fallingItems = []; // Анимация падения
        
        // Конвейер
        this.conveyor = [];
        this.conveyorSpeed = 3;
        this.spawnTimer = 0;
        this.spawnInterval = 40;
        this.allPossibleItems = allItems;
        
        this.setupControls();
        
        console.log('✅ Game7: Готов. Запомни:', this.itemsToRemember);
    }
    
    spawnItem() {
        const uncollected = this.itemsToRemember.filter(item => !this.collected.includes(item));
        
        let emoji;
        // 40% нужные, 60% ненужные
        if (uncollected.length > 0 && Math.random() < 0.4) {
            emoji = uncollected[Math.floor(Math.random() * uncollected.length)];
        } else {
            const distractors = this.allPossibleItems.filter(item => !this.itemsToRemember.includes(item));
            emoji = distractors[Math.floor(Math.random() * distractors.length)];
        }
        
        this.conveyor.push({
            emoji,
            x: this.canvas.width,
            y: 350,
            size: 60,
            needed: this.itemsToRemember.includes(emoji) && !this.collected.includes(emoji)
        });
    }
    
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            if (this.phase !== 'conveyor') return; // Только во время конвейера
            
            // Проверить тап по товару
            for (let i = this.conveyor.length - 1; i >= 0; i--) {
                const item = this.conveyor[i];
                if (x > item.x && x < item.x + item.size &&
                    y > item.y && y < item.y + item.size) {
                    
                    if (item.needed) {
                        console.log('✅ Собрал:', item.emoji);
                        this.collected.push(item.emoji);
                        this.score += 40;
                        if (this.sound) this.sound.playEffect('collectGood');
                        
                        // Анимация падения в корзину
                        this.fallingItems.push({
                            emoji: item.emoji,
                            x: item.x,
                            y: item.y,
                            targetY: 650,
                            rotation: 0,
                            scale: 1
                        });
                        
                        this.conveyor.splice(i, 1);
                    } else {
                        console.log('❌ Тапнул ненужный!');
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
    
    update(currentTime) {
        if (!this.isRunning) return;
        
        // Delta time для независимости от FPS
        if (!this.lastFrameTime) this.lastFrameTime = currentTime;
        const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = currentTime;
        
        const elapsed = (Date.now() - this.startTime) / 1000;
        
        // Фон Ozon фиолетовый
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#6B2FFF');
        gradient.addColorStop(1, '#4B1FDD');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Переключение фаз
        if (elapsed < this.showPhaseTime) {
            this.phase = 'show';
            this.drawShowPhase();
        } else if (elapsed < this.gameTime) {
            if (this.phase === 'show') {
                this.phase = 'conveyor';
                console.log('🔄 Фаза: Конвейер');
            }
            this.drawConveyorPhase(deltaTime);
        } else {
            // Время вышло
            const remaining = this.itemsToRemember.length - this.collected.length;
            if (remaining === 0) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.updateUI();
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawShowPhase() {
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px "Exo 2", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText('ЗАПОМНИ ЗАКАЗ!', this.canvas.width/2, 100);
        this.ctx.shadowBlur = 0;
        
        // Товары крупно
        const spacing = 90;
        const startX = (this.canvas.width - (this.itemsToRemember.length - 1) * spacing) / 2;
        this.itemsToRemember.forEach((item, i) => {
            this.ctx.font = '120px Arial';
            this.ctx.fillText(item, startX + i * spacing, 380);
        });
    }
    
    drawConveyorPhase(deltaTime) {
        // Заголовок
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px "Exo 2", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Осталось: ${this.itemsToRemember.length - this.collected.length}`, this.canvas.width/2, 80);
        
        // Конвейер
        this.ctx.fillStyle = '#3A2A6F';
        this.ctx.fillRect(0, 320, this.canvas.width, 80);
        
        // Спавн и движение (с delta time)
        this.spawnTimer += deltaTime * 60;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnItem();
            this.spawnTimer = 0;
        }
        
        // Двигаем товары (независимо от FPS)
        for (let i = this.conveyor.length - 1; i >= 0; i--) {
            const item = this.conveyor[i];
            item.x -= this.conveyorSpeed * deltaTime * 60;
            
            // Удаляем если уехал
            if (item.x + item.size < 0) {
                if (item.needed) {
                    console.log('❌ Пропустил нужный:', item.emoji);
                    this.lose();
                    return;
                }
                this.conveyor.splice(i, 1);
            }
            
            // Рисуем
            this.ctx.font = '60px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.emoji, item.x + item.size/2, item.y + item.size/2 + 20);
        }
        
        // Анимация падения
        for (let i = this.fallingItems.length - 1; i >= 0; i--) {
            const f = this.fallingItems[i];
            f.y += 8;
            f.rotation += 15;
            f.scale -= 0.02;
            
            this.ctx.save();
            this.ctx.translate(f.x, f.y);
            this.ctx.rotate(f.rotation * Math.PI / 180);
            this.ctx.scale(f.scale, f.scale);
            this.ctx.font = '60px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(f.emoji, 0, 20);
            this.ctx.restore();
            
            if (f.y > f.targetY) {
                this.fallingItems.splice(i, 1);
            }
        }
        
        // Корзина внизу
        this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        this.ctx.fillRect(20, 620, this.canvas.width - 40, 80);
        this.collected.forEach((item, i) => {
            this.ctx.font = '50px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(item, 60 + i * 70, 670);
        });
    }
    
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
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
