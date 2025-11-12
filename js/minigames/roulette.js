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

        // 5 секторов с ценными призами (4 крутых + 1 коробка)
        this.sectors = [
            { 
                color: '#FF6B35', 
                gradientColor: '#FF8C5A',
                prize: '🚗 BMW X5', 
                text: 'BMW X5',
                emoji: '🚗'
            },
            { 
                color: '#22C55E', 
                gradientColor: '#4ADE80',
                prize: '💰 $100,000', 
                text: '$100K',
                emoji: '💰'
            },
            { 
                color: '#3B82F6', 
                gradientColor: '#60A5FA',
                prize: '⌚ Rolex', 
                text: 'Rolex',
                emoji: '⌚'
            },
            { 
                color: '#F59E0B', 
                gradientColor: '#FBBF24',
                prize: '🏠 Квартира', 
                text: 'Квартира',
                emoji: '🏠'
            },
            { 
                color: '#A855F7', 
                gradientColor: '#D946EF',
                prize: '📦 Коробка', 
                text: 'Коробка',
                emoji: '📦'
            }
        ];

        this.sectorAngle = (Math.PI * 2) / this.sectors.length; // 72 градуса на сектор

        // Стрелка-указатель
        this.pointer = {
            x: this.wheel.centerX,
            y: this.wheel.centerY - this.wheel.radius - 20,
            size: 20
        };

        // Частицы для эффектов
        this.particles = [];
        this.stars = [];
        this.initStars();

        console.log('✅ RouletteGame: готов к запуску');
    }

    initStars() {
        // Создаём звёзды вокруг колеса
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const distance = this.wheel.radius + 80;
            this.stars.push({
                x: this.wheel.centerX + Math.cos(angle) * distance,
                y: this.wheel.centerY + Math.sin(angle) * distance,
                size: 3 + Math.random() * 5,
                opacity: 0.3 + Math.random() * 0.7,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    createParticles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (3 + Math.random() * 3),
                vy: Math.sin(angle) * (3 + Math.random() * 3),
                life: 1,
                size: 2 + Math.random() * 4,
                color: ['#FFD700', '#FFA500', '#FF8C00', '#FF6B35'][Math.floor(Math.random() * 4)]
            });
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Гравитация
            p.life -= 0.02;
            return p.life > 0;
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    drawStars() {
        const time = Date.now() / 1000;
        this.stars.forEach((star, i) => {
            // Мерцание звёзд
            const twinkle = Math.sin(time * 2 + star.twinkle) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
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
        
        // Мерцающие звёзды
        this.drawStars();
        
        // Колесо рулетки
        this.drawWheel();
        
        // Частицы
        this.updateParticles();
        this.drawParticles();
        
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
        
        // Тень колеса (большая и мягкая)
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 40;
        this.ctx.shadowOffsetY = 15;
        
        // Рисуем секторы с градиентами
        for (let i = 0; i < this.sectors.length; i++) {
            const sector = this.sectors[i];
            const startAngle = i * this.sectorAngle;
            const endAngle = (i + 1) * this.sectorAngle;
            const midAngle = startAngle + this.sectorAngle / 2;
            
            // Радиальный градиент для объёма
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.wheel.radius);
            gradient.addColorStop(0, sector.gradientColor);
            gradient.addColorStop(1, sector.color);
            
            // Сектор с градиентом
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, this.wheel.radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Золотая рамка сектора
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Внутренняя тень для глубины
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // Крупный эмодзи приза
            this.ctx.save();
            this.ctx.rotate(midAngle);
            this.ctx.translate(this.wheel.radius * 0.65, 0);
            this.ctx.rotate(-midAngle);
            
            this.ctx.font = 'bold 50px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(sector.emoji, 0, 0);
            
            this.ctx.restore();
            
            // Текст приза (жирный с обводкой)
            this.ctx.save();
            this.ctx.rotate(midAngle);
            this.ctx.translate(this.wheel.radius * 0.35, 0);
            this.ctx.rotate(-midAngle);
            
            // Обводка (чёрная)
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 4;
            this.ctx.font = 'bold 16px Exo 2';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeText(sector.text, 0, 0);
            
            // Основной текст (белый)
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(sector.text, 0, 0);
            
            this.ctx.restore();
        }
        
        // Внешний ободок (золотой)
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.wheel.radius + 3, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 6;
        this.ctx.stroke();
        
        // Центральный круг с градиентом
        const centerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
        centerGradient.addColorStop(0, '#FFD700');
        centerGradient.addColorStop(0.7, '#FFA500');
        centerGradient.addColorStop(1, '#FF8C00');
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
        this.ctx.fillStyle = centerGradient;
        this.ctx.fill();
        
        // Рамка центра
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Корона в центре
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('👑', 0, 0);
        
        this.ctx.restore();
    }

    drawPointer() {
        this.ctx.save();
        
        // Пульсирующий эффект стрелки
        const pulseScale = 1 + Math.sin(Date.now() / 300) * 0.1;
        
        this.ctx.translate(this.pointer.x, this.pointer.y);
        this.ctx.scale(pulseScale, pulseScale);
        
        // Большая золотая стрелка с градиентом
        const arrowGradient = this.ctx.createLinearGradient(0, 0, 0, 40);
        arrowGradient.addColorStop(0, '#FFD700');
        arrowGradient.addColorStop(0.5, '#FFA500');
        arrowGradient.addColorStop(1, '#FF8C00');
        
        // Тень стрелки
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 8;
        
        // Основная стрелка (большой треугольник)
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-25, 50);
        this.ctx.lineTo(25, 50);
        this.ctx.closePath();
        
        this.ctx.fillStyle = arrowGradient;
        this.ctx.fill();
        
        // Белая рамка стрелки
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Внутренняя обводка для глубины
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Блик света на стрелке
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.moveTo(-5, 10);
        this.ctx.lineTo(5, 10);
        this.ctx.lineTo(0, 35);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawUI() {
        // Заголовок с эффектом
        const titleScale = 1 + Math.sin(Date.now() / 500) * 0.05;
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, 60);
        this.ctx.scale(titleScale, titleScale);
        
        // Обводка заголовка
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = 'bold 32px Exo 2';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎰 РУЛЕТКА УДАЧИ', 0, 0);
        
        // Основной текст заголовка
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 32px Exo 2';
        this.ctx.fillText('🎰 РУЛЕТКА УДАЧИ', 0, 0);
        
        this.ctx.restore();
        
        // Инструкция с анимацией
        if (!this.wheel.isSpinning) {
            const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
            this.ctx.globalAlpha = pulse;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 20px Exo 2';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👆 ТАПНИ ЧТОБЫ КРУТИТЬ', this.canvas.width / 2, this.canvas.height - 100);
            this.ctx.globalAlpha = 1;
        } else {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 20px Exo 2';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🎲 КРУТИТСЯ...', this.canvas.width / 2, this.canvas.height - 100);
        }
    }

    // Запуск вращения колеса
    spinWheel() {
        if (this.wheel.isSpinning) return;
        
        console.log('🎰 Запуск вращения колеса');
        
        // Создаём праздничные частицы вокруг колеса
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.wheel.radius + 50;
            const x = this.wheel.centerX + Math.cos(angle) * distance;
            const y = this.wheel.centerY + Math.sin(angle) * distance;
            this.createParticles(x, y, 1);
        }
        
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
