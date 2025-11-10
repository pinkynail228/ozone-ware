/**
 * SORTING GAME - Сортировка товаров
 * Механика: свайп влево/вправо для сортировки
 * Длительность: 7 секунд
 */

class SortingGame {
    constructor(canvas, ctx, gameManager) {
        console.log('📦 Game2: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = gameManager.sound;

        this.gameTime = 7;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;

        this.minCorrectSwipes = 2; // Минимум для победы
        this.score = 0;
        this.collectedCorrect = 0;
        this.combo = 0;
        
        // Свайп состояние
        this.swipeState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0
        };
        
        this.cardOffset = { x: 0, y: 0, rotation: 0 };
        this.isAnimating = false;

        this.targetCategory = Math.random() < 0.5 ? 'clothes' : 'tech';
        this.targetLabel = this.targetCategory === 'clothes' ? 'ОДЕЖДУ' : 'ТЕХНИКУ';

        this.itemPools = {
            clothes: [
                { emoji: '👕', name: 'ФУТБОЛКА', category: 'clothes' },
                { emoji: '👖', name: 'ДЖИНСЫ', category: 'clothes' },
                { emoji: '👟', name: 'КРОССОВКИ', category: 'clothes' },
                { emoji: '🧢', name: 'КЕПКА', category: 'clothes' },
                { emoji: '🧥', name: 'КУРТКА', category: 'clothes' },
                { emoji: '👗', name: 'ПЛАТЬЕ', category: 'clothes' },
                { emoji: '🧣', name: 'ШАРФ', category: 'clothes' }
            ],
            tech: [
                { emoji: '📱', name: 'СМАРТФОН', category: 'tech' },
                { emoji: '💻', name: 'НОУТБУК', category: 'tech' },
                { emoji: '🎧', name: 'НАУШНИКИ', category: 'tech' },
                { emoji: '⌚', name: 'ЧАСЫ', category: 'tech' },
                { emoji: '📷', name: 'КАМЕРА', category: 'tech' },
                { emoji: '⌨️', name: 'КЛАВИАТУРА', category: 'tech' },
                { emoji: '🖥️', name: 'МОНИТОР', category: 'tech' }
            ]
        };

        this.itemsQueue = this.generateItemsQueue();
        this.currentIndex = 0;
        this.currentItem = this.itemsQueue[this.currentIndex] || null;

        this.cardPosition = { x: this.canvas.width / 2, y: 350 };
        this.cardSize = { width: 280, height: 200 };

        this.setupControls();

        console.log('✅ Game2: Готов. Цель:', this.targetLabel);
    }

    generateItemsQueue() {
        const targetPool = this.itemPools[this.targetCategory];
        const otherCategory = this.targetCategory === 'clothes' ? 'tech' : 'clothes';
        const otherPool = this.itemPools[otherCategory];

        const queue = [];

        const createItem = (category, pool) => {
            const item = pool[Math.floor(Math.random() * pool.length)];
            return {
                category,
                emoji: item.emoji,
                name: item.name
            };
        };

        // Гарантируем минимум нужных товаров, чтобы можно было собрать цель
        for (let i = 0; i < 6; i++) {
            queue.push(createItem(this.targetCategory, targetPool));
        }
        for (let i = 0; i < 6; i++) {
            queue.push(createItem(otherCategory, otherPool));
        }

        // Перемешаем
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }

        return queue;
    }

    addMoreItems() {
        const extra = [];
        const otherCategory = this.targetCategory === 'clothes' ? 'tech' : 'clothes';
        for (let i = 0; i < 3; i++) {
            extra.push(this.randomItem(this.targetCategory));
            extra.push(this.randomItem(otherCategory));
        }
        for (let i = extra.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [extra[i], extra[j]] = [extra[j], extra[i]];
        }
        this.itemsQueue = this.itemsQueue.concat(extra);
    }

    randomItem(category) {
        const pool = this.itemPools[category];
        const item = pool[Math.floor(Math.random() * pool.length)];
        return {
            category,
            emoji: item.emoji,
            name: item.name
        };
    }

    setupControls() {
        // Надёжная свайп-механика
        this.touchStartHandler = (e) => {
            if (!this.isRunning || !this.currentItem || this.isAnimating) return;
            e.preventDefault();
            
            const { x, y } = this.getPointerPosition(e);
            console.log('👆 Touch start:', x, y);
            this.swipeState.isDragging = true;
            this.swipeState.startX = x;
            this.swipeState.startY = y;
            this.swipeState.currentX = x;
            this.swipeState.currentY = y;
            this.swipeState.deltaX = 0;
            this.swipeState.deltaY = 0;
        };
        
        this.touchMoveHandler = (e) => {
            if (!this.swipeState.isDragging) return;
            e.preventDefault();
            
            const { x, y } = this.getPointerPosition(e);
            this.swipeState.currentX = x;
            this.swipeState.currentY = y;
            this.swipeState.deltaX = x - this.swipeState.startX;
            this.swipeState.deltaY = y - this.swipeState.startY;
            
            // Обновляем позицию карточки
            this.cardOffset.x = this.swipeState.deltaX;
            this.cardOffset.y = this.swipeState.deltaY * 0.3; // Меньше по Y
            this.cardOffset.rotation = this.swipeState.deltaX * 0.1; // Вращение
        };
        
        this.touchEndHandler = (e) => {
            if (!this.swipeState.isDragging) return;
            if (e.cancelable) e.preventDefault();
            
            console.log('⬆️ Touch end, deltaX:', this.swipeState.deltaX);
            this.swipeState.isDragging = false;
            
            const swipeThreshold = 80;
            const deltaX = this.swipeState.deltaX;
            
            if (Math.abs(deltaX) > swipeThreshold) {
                // Свайп зафиксирован!
                console.log('✅ Свайп:', deltaX > 0 ? 'RIGHT' : 'LEFT');
                if (deltaX > 0) {
                    this.handleSwipe('right'); // Вправо = ВЗЯТЬ
                } else {
                    this.handleSwipe('left'); // Влево = ПРОПУСТИТЬ
                }
            } else {
                // Вернуть карточку на место
                console.log('❌ Слабый свайп, возврат');
                this.resetCardPosition();
            }
        };
        
        this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        this.canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });
        this.canvas.addEventListener('mousedown', this.touchStartHandler);
        this.canvas.addEventListener('mousemove', this.touchMoveHandler);
        this.canvas.addEventListener('mouseup', this.touchEndHandler);
        this.canvas.addEventListener('mouseleave', this.touchEndHandler); // Важно!
    }
    
    resetCardPosition() {
        // Плавно вернуть карточку
        const animate = () => {
            this.cardOffset.x *= 0.8;
            this.cardOffset.y *= 0.8;
            this.cardOffset.rotation *= 0.8;
            
            if (Math.abs(this.cardOffset.x) < 1) {
                this.cardOffset = { x: 0, y: 0, rotation: 0 };
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    removeControls() {
        this.canvas.removeEventListener('touchstart', this.touchStartHandler);
        this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        this.canvas.removeEventListener('touchend', this.touchEndHandler);
        this.canvas.removeEventListener('mousedown', this.touchStartHandler);
        this.canvas.removeEventListener('mousemove', this.touchMoveHandler);
        this.canvas.removeEventListener('mouseup', this.touchEndHandler);
        this.canvas.removeEventListener('mouseleave', this.touchEndHandler);
    }

    getPointerPosition(e) {
        const touch = e.touches ? e.touches[0] : e;
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (touch.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handleSwipe(direction) {
        if (!this.currentItem || this.isAnimating) return;
        
        this.isAnimating = true;
        const targetX = direction === 'right' ? 500 : -500;
        
        // Анимация улёта карточки
        const animate = () => {
            this.cardOffset.x += (targetX - this.cardOffset.x) * 0.2;
            this.cardOffset.rotation += (direction === 'right' ? 30 : -30 - this.cardOffset.rotation) * 0.2;
            
            if (Math.abs(this.cardOffset.x - targetX) < 10) {
                // Карточка улетела - обрабатываем результат
                if (direction === 'right') {
                    if (this.currentItem.category === this.targetCategory) {
                        this.collectCurrentItem();
                    } else {
                        this.fail('Неправильный товар!');
                    }
                } else {
                    if (this.currentItem.category === this.targetCategory) {
                        this.fail('Пропустил нужный товар!');
                    } else {
                        if (this.sound) this.sound.playEffect('dropBad', 0.5);
                        this.advanceItem();
                    }
                }
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        if (this.sound) this.sound.playEffect('transition', 0.5);
        animate();
    }

    collectCurrentItem() {
        this.collectedCorrect++;
        this.combo++;
        this.score += 40 + (this.combo * 10);
        if (this.sound) this.sound.playEffect('collectGood');
        
        // Просто продолжаем игру
        this.advanceItem();
    }

    fail(reason) {
        console.log('❌ Ошибка:', reason);
        this.combo = 0; // Сброс комбо
        if (this.sound) this.sound.playEffect('collectBad');
        this.lose();
    }

    advanceItem() {
        this.cardOffset = { x: 0, y: 0, rotation: 0 };
        this.isAnimating = false;
        this.currentIndex++;
        if (this.currentIndex >= this.itemsQueue.length - 2) {
            this.addMoreItems();
        }
        this.currentItem = this.itemsQueue[this.currentIndex] || null;
    }

    start() {
        console.log('▶️ Game2: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        if (this.sound) this.sound.playEffect('start');
        this.update();
    }

    stop() {
        console.log('⏹️ Game2: Стоп');
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.removeControls();
    }

    update() {
        if (!this.isRunning) return;

        // Ozon фон
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#6B2FFF');
        gradient.addColorStop(1, '#4B1FDD');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawHeader();
        this.drawSwipeZones();
        this.drawCard();
        this.drawCombo();

        this.updateUI();

        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Правильных:', this.collectedCorrect);
            if (this.collectedCorrect >= this.minCorrectSwipes) {
                this.win();
            } else {
                this.fail(`Нужно минимум ${this.minCorrectSwipes} правильных!`);
            }
            return;
        }

        this.gameManager.updateDebug(`
            Target: ${this.targetLabel}<br>
            Correct: ${this.collectedCorrect} (min: ${this.minCorrectSwipes})<br>
            Combo: x${this.combo}<br>
            Score: ${this.score}
        `);

        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    drawHeader() {
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 28px "Exo 2", sans-serif';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(`СОРТИРУЙ: ${this.targetLabel}`, this.canvas.width / 2, 100);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 20px "Exo 2", sans-serif';
        this.ctx.fillText(`Правильных: ${this.collectedCorrect}`, this.canvas.width / 2, 140);
        this.ctx.shadowBlur = 0;
    }
    
    drawSwipeZones() {
        const zoneWidth = 120;
        const zoneHeight = 200;
        const zoneY = 300;
        
        // Левая зона (красная) - ПРОПУСТИТЬ
        const leftHighlight = this.swipeState.isDragging && this.swipeState.deltaX < -30;
        this.ctx.fillStyle = leftHighlight ? 'rgba(255, 107, 129, 0.3)' : 'rgba(255, 107, 129, 0.15)';
        this.roundRect(this.ctx, 20, zoneY, zoneWidth, zoneHeight, 20);
        this.ctx.fill();
        this.ctx.strokeStyle = '#FF6B81';
        this.ctx.lineWidth = leftHighlight ? 4 : 2;
        this.roundRect(this.ctx, 20, zoneY, zoneWidth, zoneHeight, 20);
        this.ctx.stroke();
        
        this.ctx.font = '50px Arial';
        this.ctx.fillText('❌', 80, zoneY + 100);
        
        // Правая зона (зелёная) - ВЗЯТЬ
        const rightHighlight = this.swipeState.isDragging && this.swipeState.deltaX > 30;
        this.ctx.fillStyle = rightHighlight ? 'rgba(0, 255, 157, 0.3)' : 'rgba(0, 255, 157, 0.15)';
        this.roundRect(this.ctx, this.canvas.width - zoneWidth - 20, zoneY, zoneWidth, zoneHeight, 20);
        this.ctx.fill();
        this.ctx.strokeStyle = '#00FF9D';
        this.ctx.lineWidth = rightHighlight ? 4 : 2;
        this.roundRect(this.ctx, this.canvas.width - zoneWidth - 20, zoneY, zoneWidth, zoneHeight, 20);
        this.ctx.stroke();
        
        this.ctx.font = '50px Arial';
        this.ctx.fillText('✅', this.canvas.width - 80, zoneY + 100);
    }
    
    drawCombo() {
        if (this.combo > 1) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 32px "Exo 2", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(`COMBO x${this.combo}!`, this.canvas.width / 2, 200);
            this.ctx.shadowBlur = 0;
        }
    }
    
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }


    drawCard() {
        if (!this.currentItem) return;

        this.ctx.save();
        
        // Применяем смещение и вращение от свайпа
        const centerX = this.cardPosition.x + this.cardOffset.x;
        const centerY = this.cardPosition.y + this.cardOffset.y;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.cardOffset.rotation * Math.PI / 180);
        
        const width = this.cardSize.width;
        const height = this.cardSize.height;

        // Карточка с градиентом
        const cardGrad = this.ctx.createLinearGradient(0, -height/2, 0, height/2);
        cardGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
        cardGrad.addColorStop(1, 'rgba(240,240,255,0.95)');
        this.ctx.fillStyle = cardGrad;
        this.roundRect(this.ctx, -width/2, -height/2, width, height, 20);
        this.ctx.fill();
        
        // Обводка
        this.ctx.strokeStyle = 'rgba(107, 47, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.roundRect(this.ctx, -width/2, -height/2, width, height, 20);
        this.ctx.stroke();

        // Эмодзи товара
        this.ctx.font = '100px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.currentItem.emoji, 0, -20);

        // Название товара
        this.ctx.fillStyle = '#2A2A3E';
        this.ctx.font = 'bold 22px "Exo 2", sans-serif';
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(this.currentItem.name, 0, height/2 - 30);
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();
    }

    drawBasket() {
        const basketY = 600;

        this.ctx.fillStyle = '#0f172a';
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillRect(30, basketY - 60, this.canvas.width - 60, 120);
        this.ctx.globalAlpha = 1;

        this.ctx.strokeStyle = '#00b4d8';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(30, basketY - 60, this.canvas.width - 60, 120);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('КОРЗИНА', this.canvas.width / 2, basketY - 25);

        const slotWidth = 60;
        const spacing = 20;
        const totalWidth = this.requiredItems * slotWidth + (this.requiredItems - 1) * spacing;
        let startX = (this.canvas.width - totalWidth) / 2 + slotWidth / 2;

        for (let i = 0; i < this.requiredItems; i++) {
            const item = this.collectedItems[i];
            this.ctx.fillStyle = '#1F2A44';
            this.ctx.beginPath();
            this.ctx.arc(startX + i * (slotWidth + spacing), basketY + 20, 28, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#00b4d8';
            this.ctx.stroke();

            if (item) {
                this.ctx.font = '32px Arial';
                this.ctx.fillStyle = '#fff';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(item.emoji, startX + i * (slotWidth + spacing), basketY + 32);
            }
        }

        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#00ff9d';
        this.ctx.fillText(`${this.collectedItems.length}/${this.requiredItems}`, this.canvas.width / 2, basketY + 70);
    }

    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);

        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
    }


    win() {
        console.log('🏆 УСПЕХ! Корзина заполнена');
        if (this.sound) this.sound.playEffect('success');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }

    lose() {
        console.log('💀 ПРОВАЛ! Ошибка в сортировке');
        this.stop();
        this.gameManager.endGame(false, 0);
    }

    drawButtons() {
        // Кнопка "ВЗЯТЬ" (справа)
        const takeBtn = this.buttons.take;
        this.ctx.fillStyle = '#00ff9d';
        this.ctx.fillRect(takeBtn.x, takeBtn.y, takeBtn.width, takeBtn.height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(takeBtn.x, takeBtn.y, takeBtn.width, takeBtn.height);
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📦', takeBtn.x + takeBtn.width/2, takeBtn.y + 25);
        this.ctx.fillText('ВЗЯТЬ', takeBtn.x + takeBtn.width/2, takeBtn.y + 45);

        // Кнопка "НА СКЛАД" (слева)
        const skipBtn = this.buttons.skip;
        this.ctx.fillStyle = '#ff8fa3';
        this.ctx.fillRect(skipBtn.x, skipBtn.y, skipBtn.width, skipBtn.height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(skipBtn.x, skipBtn.y, skipBtn.width, skipBtn.height);
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillText('🏪', skipBtn.x + skipBtn.width/2, skipBtn.y + 25);
        this.ctx.fillText('НА СКЛАД', skipBtn.x + skipBtn.width/2, skipBtn.y + 45);
    }
}

console.log('✅ game2.js загружен');
