/**
 * GAME 11 - Приёмка товаров ✅❌
 * Механика: Свайп вверх = ПРИНЯТЬ целую, Свайп вниз = ОТКЛОНИТЬ битую
 * Длительность: 7 секунд
 * Стиль: Ozon брендинг - синие градиенты, быстрые свайпы
 */

class Game11 {
    constructor(canvas, ctx, gameManager) {
        console.log('✅ Game11: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 7;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.processed = 0;
        this.requiredProcessed = 6; // Нужно обработать 6 товаров
        
        // Текущая коробка
        this.currentBox = null;
        this.touchStart = null;
        this.swipeDistance = 0;
        
        this.spawnBox();
        this.setupControls();
        
        console.log('✅ Game11: Готов');
    }
    
    spawnBox() {
        const isDamaged = Math.random() < 0.5;
        
        this.currentBox = {
            emoji: '📦',
            damaged: isDamaged,
            x: this.canvas.width / 2,
            y: 400,
            size: 80,
            offsetY: 0
        };
        
        console.log('📦 Коробка:', isDamaged ? 'БИТАЯ ❌' : 'ЦЕЛАЯ ✅');
    }
    
    setupControls() {
        this.touchStartHandler = (e) => {
            if (!this.isRunning || !this.currentBox) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.touchStart = { y };
            this.swipeDistance = 0;
        };
        
        this.touchMoveHandler = (e) => {
            if (!this.isRunning || !this.touchStart || !this.currentBox) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.swipeDistance = y - this.touchStart.y;
            this.currentBox.offsetY = this.swipeDistance;
        };
        
        this.touchEndHandler = (e) => {
            if (!this.isRunning || !this.touchStart || !this.currentBox) return;
            e.preventDefault();
            
            const swipeThreshold = 80;
            
            if (Math.abs(this.swipeDistance) > swipeThreshold) {
                const swipeUp = this.swipeDistance < 0;
                const swipeDown = this.swipeDistance > 0;
                
                // Свайп вверх = ПРИНЯТЬ (должна быть целая)
                // Свайп вниз = ОТКЛОНИТЬ (должна быть битая)
                
                if ((swipeUp && !this.currentBox.damaged) || (swipeDown && this.currentBox.damaged)) {
                    console.log('✅ Правильно!');
                    this.processed++;
                    this.score += 20;
                    
                    if (this.processed >= this.requiredProcessed) {
                        setTimeout(() => this.win(), 300);
                    } else {
                        this.spawnBox();
                    }
                } else {
                    console.log('❌ Неправильно!');
                    this.lose();
                }
            } else {
                // Недостаточный свайп - вернуть коробку
                this.currentBox.offsetY = 0;
            }
            
            this.touchStart = null;
            this.swipeDistance = 0;
        };
        
        this.canvas.addEventListener('touchstart', this.touchStartHandler);
        this.canvas.addEventListener('touchmove', this.touchMoveHandler);
        this.canvas.addEventListener('touchend', this.touchEndHandler);
        this.canvas.addEventListener('mousedown', this.touchStartHandler);
        this.canvas.addEventListener('mousemove', this.touchMoveHandler);
        this.canvas.addEventListener('mouseup', this.touchEndHandler);
    }
    
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.touchStartHandler);
        this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        this.canvas.removeEventListener('touchend', this.touchEndHandler);
        this.canvas.removeEventListener('mousedown', this.touchStartHandler);
        this.canvas.removeEventListener('mousemove', this.touchMoveHandler);
        this.canvas.removeEventListener('mouseup', this.touchEndHandler);
    }
    
    start() {
        console.log('▶️ Game11: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    stop() {
        console.log('⏹️ Game11: Стоп');
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
        gradient.addColorStop(0, '#0a0e27');
        gradient.addColorStop(1, '#1a1a40');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ПРИЁМКА ТОВАРОВ ✅❌', this.canvas.width / 2, 70);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Обработано: ${this.processed}/${this.requiredProcessed}`, this.canvas.width / 2, 105);
        
        // Зоны принятия/отклонения
        this.drawZones();
        
        // Текущая коробка
        if (this.currentBox) {
            const y = this.currentBox.y + this.currentBox.offsetY;
            
            // Коробка
            this.ctx.font = `${this.currentBox.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentBox.emoji, this.currentBox.x, y);
            
            // Индикатор состояния
            if (this.currentBox.damaged) {
                // Битая - красный крестик
                this.ctx.fillStyle = '#ff0000';
                this.ctx.font = 'bold 40px Arial';
                this.ctx.fillText('❌', this.currentBox.x + 35, y - 25);
                
                // Трещины
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(this.currentBox.x - 20, y - 30);
                this.ctx.lineTo(this.currentBox.x + 20, y + 10);
                this.ctx.stroke();
            } else {
                // Целая - зеленая галочка
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = 'bold 40px Arial';
                this.ctx.fillText('✓', this.currentBox.x + 35, y - 25);
            }
            
            // Подсказка
            if (!this.touchStart) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '14px Arial';
                this.ctx.fillText('👆 СВАЙП ВВЕРХ/ВНИЗ', this.canvas.width / 2, 550);
            }
        }
        
        // Инструкции
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('✅ ЦЕЛУЮ → ВВЕРХ', 30, 200);
        this.ctx.fillText('❌ БИТУЮ → ВНИЗ', 30, 650);
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло!');
            if (this.processed >= this.requiredProcessed) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawZones() {
        // Зона принятия (верх) - зеленая
        this.ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, 150);
        this.ctx.strokeStyle = '#2ecc71';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, this.canvas.width, 150);
        
        // Зона отклонения (низ) - красная
        this.ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
        this.ctx.fillRect(0, this.canvas.height - 150, this.canvas.width, 150);
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, this.canvas.height - 150, this.canvas.width, 150);
    }
    
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
    }
    
    win() {
        console.log('🏆 УСПЕХ! Все товары обработаны!');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ! Неправильная обработка');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game11.js загружен');
