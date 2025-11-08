/**
 * SORTING GAME - Сортировка товаров
 * Механика: кнопки "Взять" и "На склад", собирай только заданную категорию
 * Длительность: 6 секунд
 */

class SortingGame {
    constructor(canvas, ctx, gameManager) {
        console.log('📦 Game2: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = gameManager.sound;

        this.gameTime = 6;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;

        this.requiredItems = 4;
        this.score = 0;
        this.collectedItems = [];

        this.targetCategory = Math.random() < 0.5 ? 'clothes' : 'tech';
        this.targetLabel = this.targetCategory === 'clothes' ? 'ОДЕЖДУ' : 'ТЕХНИКУ';

        this.itemPools = {
            clothes: [
                { emoji: '👕', name: 'ФУТБОЛКА' },
                { emoji: '👖', name: 'ДЖИНСЫ' },
                { emoji: '👟', name: 'КРОССОВКИ' },
                { emoji: '🧢', name: 'КЕПКА' },
                { emoji: '🧥', name: 'КУРТКА' }
            ],
            tech: [
                { emoji: '📱', name: 'СМАРТФОН' },
                { emoji: '💻', name: 'НОУТБУК' },
                { emoji: '🎧', name: 'НАУШНИКИ' },
                { emoji: '⌚', name: 'СМАРТ-ЧАСЫ' },
                { emoji: '📷', name: 'КАМЕРА' }
            ]
        };

        this.itemsQueue = this.generateItemsQueue();
        this.currentIndex = 0;
        this.currentItem = this.itemsQueue[this.currentIndex] || null;

        this.cardPosition = { x: this.canvas.width / 2, y: 360 };
        this.cardOffsetX = 0;
        this.dragState = {
            active: false,
            startX: 0
        };
        this.cardAnimation = {
            active: false,
            direction: null,
            onComplete: null
        };
        this.cardAnimationSpeed = 28;

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
        this.pointerDownHandler = (e) => {
            if (!this.isRunning || !this.currentItem || this.cardAnimation.active) return;
            e.preventDefault();

            const { x } = this.getPointerPosition(e);
            this.dragState.active = true;
            this.dragState.startX = x;
            this.cardOffsetX = 0;
        };

        this.pointerMoveHandler = (e) => {
            if (!this.isRunning || !this.dragState.active || this.cardAnimation.active) return;
            e.preventDefault();

            const { x } = this.getPointerPosition(e);
            this.cardOffsetX = Math.max(-150, Math.min(150, x - this.dragState.startX));
        };

        this.pointerUpHandler = (e) => {
            if (!this.isRunning || !this.dragState.active || this.cardAnimation.active) return;
            e.preventDefault();

            const deltaX = this.cardOffsetX;
            this.dragState.active = false;

            if (Math.abs(deltaX) < 40) {
                this.cardOffsetX = 0;
                return;
            }

            const direction = deltaX > 0 ? 'right' : 'left';
            this.handleSwipe(direction);
        };

        this.canvas.addEventListener('touchstart', this.pointerDownHandler, { passive: false });
        this.canvas.addEventListener('touchmove', this.pointerMoveHandler, { passive: false });
        this.canvas.addEventListener('touchend', this.pointerUpHandler, { passive: false });

        this.canvas.addEventListener('mousedown', this.pointerDownHandler);
        this.canvas.addEventListener('mousemove', this.pointerMoveHandler);
        this.canvas.addEventListener('mouseup', this.pointerUpHandler);
    }

    removeControls() {
        this.canvas.removeEventListener('touchstart', this.pointerDownHandler);
        this.canvas.removeEventListener('touchmove', this.pointerMoveHandler);
        this.canvas.removeEventListener('touchend', this.pointerUpHandler);

        this.canvas.removeEventListener('mousedown', this.pointerDownHandler);
        this.canvas.removeEventListener('mousemove', this.pointerMoveHandler);
        this.canvas.removeEventListener('mouseup', this.pointerUpHandler);
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
        if (!this.currentItem || this.cardAnimation.active) return;

        console.log(`➡️ Свайп ${direction === 'right' ? 'ВПРАВО' : 'ВЛЕВО'}:`, this.currentItem.name);

        const action = () => {
            if (direction === 'right') {
                if (this.currentItem.category === this.targetCategory) {
                    this.collectCurrentItem();
                } else {
                    this.fail('Неправильный товар попал в корзину');
                }
            } else {
                if (this.currentItem.category === this.targetCategory) {
                    this.fail('Пропустил нужный товар');
                } else {
                    if (this.sound) this.sound.playEffect('dropBad', 0.5);
                    this.advanceItem();
                }
            }
        };

        if (this.sound) this.sound.playEffect('transition', 0.5);
        this.cardAnimation = {
            active: true,
            direction,
            onComplete: action
        };
    }

    collectCurrentItem() {
        this.collectedItems.push(this.currentItem);
        this.score += 40;
        if (this.sound) this.sound.playEffect('collectGood');

        if (this.collectedItems.length >= this.requiredItems) {
            setTimeout(() => this.win(), 250);
        } else {
            this.advanceItem();
        }
    }

    fail(reason) {
        console.log('❌ Ошибка:', reason);
        if (this.sound) this.sound.playEffect('collectBad');
        this.lose();
    }

    advanceItem() {
        this.cardOffsetX = 0;
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

        this.ctx.fillStyle = '#14213D';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.updateCardAnimation();

        this.drawHeader();
        this.drawBins();
        this.drawCard();
        this.drawBasket();

        this.updateUI();

        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Собрано:', this.collectedItems.length);
            if (this.collectedItems.length >= this.requiredItems) {
                this.win();
            } else {
                this.fail('Не успел собрать корзину');
            }
            return;
        }

        this.gameManager.updateDebug(`
            Target: ${this.targetLabel}<br>
            Collected: ${this.collectedItems.length}/${this.requiredItems}<br>
            Score: ${this.score}<br>
            Timeleft: ${(this.gameTime - elapsed).toFixed(1)}s
        `);

        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    drawHeader() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 26px Arial';
        this.ctx.fillText('СОРТИРОВКА ПО КАТЕГОРИИ', this.canvas.width / 2, 70);

        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Собирай: ${this.targetLabel}`, this.canvas.width / 2, 110);

        this.ctx.font = '16px Arial';
        this.ctx.fillText('Нажимай кнопки: ВЗЯТЬ нужное или НА СКЛАД ненужное', this.canvas.width / 2, 140);

        this.ctx.font = '15px Arial';
        this.ctx.fillStyle = '#00ff9d';
        this.ctx.fillText('4 товара за 6 секунд', this.canvas.width / 2, 165);
        this.ctx.fillStyle = '#FFFFFF';
    }

    drawBins() {
        const binWidth = 140;
        const binHeight = 180;
        const top = 190;
        const leftX = 30;
        const rightX = this.canvas.width - binWidth - 30;

        const draggingRight = (this.cardAnimation.active && this.cardAnimation.direction === 'right') || (this.dragState.active && this.cardOffsetX > 40);
        const draggingLeft = (this.cardAnimation.active && this.cardAnimation.direction === 'left') || (this.dragState.active && this.cardOffsetX < -40);

        const drawBin = (x, icon, label, highlight, accentColor) => {
            this.ctx.save();
            this.ctx.globalAlpha = highlight ? 1 : 0.5;
            this.ctx.fillStyle = '#1F2A44';
            this.ctx.fillRect(x, top, binWidth, binHeight);
            this.ctx.strokeStyle = accentColor;
            this.ctx.lineWidth = highlight ? 5 : 3;
            this.ctx.strokeRect(x, top, binWidth, binHeight);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '60px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(icon, x + binWidth / 2, top + 80);

            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(label, x + binWidth / 2, top + binHeight - 20);
            this.ctx.restore();
        };

        drawBin(leftX, '🗑️', 'МУСОРКА', draggingLeft, '#ff6b81');
        drawBin(rightX, '🧺', 'КОРЗИНА', draggingRight, '#00ff9d');
    }

    drawCard() {
        if (!this.currentItem) {
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Товары закончились!', this.canvas.width / 2, this.cardPosition.y);
            return;
        }

        const centerX = this.cardPosition.x + this.cardOffsetX;
        const centerY = this.cardPosition.y;
        const width = 260;
        const height = 200;
        const left = centerX - width / 2;
        const top = centerY - height / 2;

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((this.cardOffsetX / 200) * 0.1);
        this.ctx.translate(-centerX, -centerY);

        this.ctx.fillStyle = '#1F2A44';
        this.ctx.strokeStyle = this.currentItem.category === this.targetCategory ? '#00ff9d' : '#ff8fa3';
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(left, top, width, height);
        this.ctx.strokeRect(left, top, width, height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.currentItem.emoji, centerX, top + 95);

        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(this.currentItem.name, centerX, top + 150);

        this.ctx.font = '14px Arial';
        this.ctx.fillText('ЛЕВО = НЕТ    ПРАВО = ДА', centerX, top + height - 20);

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
        document.getElementById('score-display').textContent = this.score;
    }

    updateCardAnimation() {
        if (!this.cardAnimation.active) return;

        const directionMultiplier = this.cardAnimation.direction === 'right' ? 1 : -1;
        this.cardOffsetX += directionMultiplier * this.cardAnimationSpeed;

        if (Math.abs(this.cardOffsetX) > this.canvas.width / 2 + 200) {
            const onComplete = this.cardAnimation.onComplete;
            this.cardAnimation = {
                active: false,
                direction: null,
                onComplete: null
            };
            if (onComplete) {
                onComplete();
            }
            if (this.isRunning) {
                this.cardOffsetX = 0;
            }
        }
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
}

console.log('✅ game2.js загружен');
