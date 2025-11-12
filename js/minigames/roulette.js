// ============================================
//  ROULETTE GAME - Игра-рулетка в конце смены
// ============================================

class RouletteGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🎰 RouletteGame: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = gameManager.sound;

        // Игровые параметры
        this.isRunning = false;
        this.isSpinning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;

        // Колесо рулетки
        this.wheel = {
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height / 2 - 50,
            radius: 140,
            rotation: 0, // Текущий угол поворота
            targetRotation: 0, // Целевой угол
            spinSpeed: 0, // Скорость вращения
            isSpinning: false
        };

        // 8 секторов с ценными призами
        this.sectors = [
            { color: '#FF6B35', prize: '🚗 BMW X5', text: 'BMW X5' },
            { color: '#4ECDC4', prize: '💰 $100,000', text: '$100,000' },
            { color: '#45B7D1', prize: '⌚ Rolex', text: 'Rolex Watch' },
            { color: '#96CEB4', prize: '🏠 Квартира', text: 'Квартира' },
            { color: '#FFEAA7', prize: '💎 Бриллианты', text: 'Бриллианты' },
            { color: '#DDA0DD', prize: '🏖️ Мальдивы', text: 'Мальдивы' },
            { color: '#98D8C8', prize: '📱 iPhone 15', text: 'iPhone 15' },
            { color: '#F7DC6F', prize: '🎮 PlayStation', text: 'PlayStation' }
        ];

        this.sectorAngle = (Math.PI * 2) / this.sectors.length; // 45 градусов на сектор

        // Стрелка-указатель
        this.pointer = {
            x: this.wheel.centerX,
            y: this.wheel.centerY - this.wheel.radius - 20,
            size: 20
        };

        console.log('✅ RouletteGame: готов к запуску');
    }

    start() {
        console.log('▶️ RouletteGame: старт');
        this.isRunning = true;
        this.lastFrameTime = null;
        this.setupControls();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    stop() {
        console.log('⏹️ RouletteGame: стоп');
        this.isRunning = false;
        this.removeControls();
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }

    update(currentTime) {
        if (!this.isRunning) return;

        // Расчёт deltaTime
        let deltaTime = 1/60; // Фоллбэк для первого кадра
        if (this.lastFrameTime !== null) {
            deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 1/15);
        }
        this.lastFrameTime = currentTime;

        // Обновление анимации вращения
        this.updateWheelRotation(deltaTime);

        // Отрисовка
        this.draw(deltaTime);

        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    updateWheelRotation(deltaTime) {
        if (this.wheel.isSpinning) {
            // Применяем скорость вращения
            this.wheel.rotation += this.wheel.spinSpeed * deltaTime * 60;
            
            // Замедление (трение)
            this.wheel.spinSpeed *= 0.98;
            
            // Остановка когда скорость мала
            if (this.wheel.spinSpeed < 0.5) {
                this.wheel.isSpinning = false;
                this.wheel.spinSpeed = 0;
                this.onSpinComplete();
            }
        }
    }

    draw(deltaTime) {
        // Очистка canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Фон
        this.drawBackground();
        
        // Колесо рулетки
        this.drawWheel();
        
        // Стрелка-указатель
        this.drawPointer();
        
        // UI
        this.drawUI();
    }

    drawBackground() {
        // Ozon фиолетовый градиент
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#6B2FFF');
        gradient.addColorStop(1, '#4B1FDD');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawWheel() {
        this.ctx.save();
        
        // Перемещаемся в центр колеса
        this.ctx.translate(this.wheel.centerX, this.wheel.centerY);
        this.ctx.rotate(this.wheel.rotation);
        
        // Рисуем секторы
        for (let i = 0; i < this.sectors.length; i++) {
            const sector = this.sectors[i];
            const startAngle = i * this.sectorAngle;
            const endAngle = (i + 1) * this.sectorAngle;
            
            // Сектор
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, this.wheel.radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = sector.color;
            this.ctx.fill();
            
            // Рамка сектора
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Текст приза
            this.ctx.save();
            this.ctx.rotate(startAngle + this.sectorAngle / 2);
            this.ctx.translate(this.wheel.radius * 0.7, 0);
            this.ctx.rotate(-Math.PI / 2);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Exo 2';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(sector.text, 0, 0);
            
            this.ctx.restore();
        }
        
        // Центральный круг
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawPointer() {
        this.ctx.save();
        
        // Стрелка-треугольник
        this.ctx.translate(this.pointer.x, this.pointer.y);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-this.pointer.size / 2, this.pointer.size);
        this.ctx.lineTo(this.pointer.size / 2, this.pointer.size);
        this.ctx.closePath();
        
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawUI() {
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 28px Exo 2';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎰 РУЛЕТКА УДАЧИ', this.canvas.width / 2, 60);
        
        // Инструкция
        if (!this.wheel.isSpinning) {
            this.ctx.font = '18px Exo 2';
            this.ctx.fillText('👆 ТАПНИ ЧТОБЫ КРУТИТЬ', this.canvas.width / 2, this.canvas.height - 100);
        } else {
            this.ctx.font = '18px Exo 2';
            this.ctx.fillText('🎲 КРУТИТСЯ...', this.canvas.width / 2, this.canvas.height - 100);
        }
    }

    // Запуск вращения колеса
    spinWheel() {
        if (this.wheel.isSpinning) return;
        
        console.log('🎰 Запуск вращения колеса');
        
        // Случайная скорость и направление
        this.wheel.spinSpeed = 15 + Math.random() * 10; // 15-25 оборотов в секунду
        this.wheel.isSpinning = true;
        
        if (this.sound) this.sound.playEffect('collectGood');
    }

    // Завершение вращения
    onSpinComplete() {
        console.log('🎯 Колесо остановилось');
        
        // Определяем выигрышный сектор
        const winnerSector = this.getWinningSector();
        console.log('🏆 Выигрышный сектор:', winnerSector.prize);
        
        // Показываем результат через секунду
        setTimeout(() => {
            this.showResult(winnerSector);
        }, 1000);
    }

    // Определение выигрышного сектора по углу стрелки
    getWinningSector() {
        // Нормализуем угол поворота колеса (0 - 2π)
        let normalizedRotation = this.wheel.rotation % (Math.PI * 2);
        if (normalizedRotation < 0) normalizedRotation += Math.PI * 2;
        
        // Стрелка указывает вверх, поэтому нужно учесть смещение
        let pointerAngle = (Math.PI * 2 - normalizedRotation + Math.PI / 2) % (Math.PI * 2);
        
        // Определяем индекс сектора
        const sectorIndex = Math.floor(pointerAngle / this.sectorAngle);
        
        return this.sectors[sectorIndex];
    }

    // Показ результата (пока просто в консоль)
    showResult(sector) {
        console.log('🎁 Результат:', sector.prize);
        // TODO: Показать модальное окно с результатом
        // Всегда будет "📦 Коробка-сюрприз!"
    }

    // Обработка тапов
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            this.spinWheel();
        };

        this.canvas.addEventListener('touchstart', this.tapHandler, { passive: false });
        this.canvas.addEventListener('mousedown', this.tapHandler);
    }

    removeControls() {
        if (this.tapHandler) {
            this.canvas.removeEventListener('touchstart', this.tapHandler);
            this.canvas.removeEventListener('mousedown', this.tapHandler);
        }
    }

    // Завершение игры
    win() {
        console.log('🏆 RouletteGame: победа');
        this.isRunning = false;
        this.gameManager.onGameComplete(true, 100); // Всегда победа в рулетке
    }

    lose() {
        console.log('💀 RouletteGame: поражение');
        this.isRunning = false;
        this.gameManager.onGameComplete(false, 0);
    }
}
