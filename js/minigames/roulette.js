// ============================================
//  ROULETTE GAME - Призы по кругу (Vampire Survivors стиль)
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
        this.gameLoop = null;
        this.lastFrameTime = null;

        // Горизонтальная лента призов
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2 - 30;
        
        // Система горизонтального движения
        this.prizeOffset = 0; // Смещение ленты по X
        this.prizeWidth = 120; // Ширина одного приза с отступами
        this.spinSpeed = 0; // Скорость прокрутки
        this.isSpinning = false;
        this.idleSpeed = 1; // Медленное движение в покое (пикселей за кадр)

        // 5 призов расположенных по кругу
        this.prizes = [
            { 
                emoji: '🚗',
                title: 'BMW X5',
                color: '#FF6B35',
                gradientColor: '#FF8C5A'
            },
            { 
                emoji: '💰',
                title: '$100K',
                color: '#22C55E',
                gradientColor: '#4ADE80'
            },
            { 
                emoji: '⌚',
                title: 'Rolex',
                color: '#3B82F6',
                gradientColor: '#60A5FA'
            },
            { 
                emoji: '🏠',
                title: 'Квартира',
                color: '#F59E0B',
                gradientColor: '#FBBF24'
            },
            { 
                emoji: '📦',
                title: 'Коробка',
                color: '#A855F7',
                gradientColor: '#D946EF'
            }
        ];

        this.prizeCount = this.prizes.length;
        this.prizeAngle = (Math.PI * 2) / this.prizeCount; // 72 градуса между призами

        // Частицы для эффектов
        this.particles = [];
        this.stars = [];
        this.initStars();

        console.log('✅ RouletteGame: готов к запуску');
    }

    initStars() {
        // Создаём звёзды вокруг призов
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const distance = this.prizeRadius + 80;
            this.stars.push({
                x: this.centerX + Math.cos(angle) * distance,
                y: this.centerY + Math.sin(angle) * distance,
                size: 3 + Math.random() * 5,
                opacity: 0.3 + Math.random() * 0.7,
                twinkle: Math.random() * Math.PI * 2
            });
        }
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

        // Обновление движения ленты
        this.updateMovement(deltaTime);

        // Отрисовка
        this.draw(deltaTime);

        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    updateMovement(deltaTime) {
        if (this.isSpinning) {
            // Быстрое движение при спине
            this.prizeOffset += this.spinSpeed * deltaTime * 60;
            
            // Замедление (трение)
            this.spinSpeed *= 0.98;
            
            // Остановка когда скорость мала
            if (this.spinSpeed < 2) {
                this.isSpinning = false;
                this.spinSpeed = 0;
                this.onSpinComplete();
            }
        } else {
            // Медленное движение в режиме ожидания (раз в секунду)
            this.prizeOffset += this.idleSpeed * deltaTime * 60;
        }
        
        // Циклическое движение - когда смещение больше ширины приза, сбрасываем
        const totalWidth = this.prizeWidth * this.prizeCount;
        if (this.prizeOffset >= totalWidth) {
            this.prizeOffset -= totalWidth;
        }
    }

    draw(deltaTime) {
        // Очистка canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Фон
        this.drawBackground();
        
        // Мерцающие звёзды
        this.drawStars();
        
        // Призы по кругу
        this.drawPrizes();
        
        // Центральная кнопка
        this.drawCenterButton();
        
        // Частицы
        this.updateParticles();
        this.drawParticles();
    }

    drawBackground() {
        // Премиальный Ozon градиент
        const linearGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        linearGradient.addColorStop(0, '#6B2FFF');
        linearGradient.addColorStop(0.5, '#5026E5');
        linearGradient.addColorStop(1, '#4B1FDD');
        
        this.ctx.fillStyle = linearGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Пульсирующий радиальный градиент в центре
        const time = Date.now() / 1000;
        const pulseSize = 0.9 + Math.sin(time * 1.5) * 0.1;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.max(this.canvas.width, this.canvas.height) * pulseSize;
        
        const radialGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        
        radialGradient.addColorStop(0, 'rgba(111, 83, 255, 0.8)');
        radialGradient.addColorStop(0.5, 'rgba(108, 59, 255, 0.3)');
        radialGradient.addColorStop(1, 'rgba(75, 31, 221, 0)');
        
        this.ctx.fillStyle = radialGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Лучи света
        this.drawLightRays();
    }

    drawLightRays() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = Date.now() / 1000;
        const rotation = time * 0.2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(rotation);
        
        const rayCount = 12;
        const rayLength = Math.max(this.canvas.width, this.canvas.height) * 0.8;
        
        for (let i = 0; i < rayCount; i++) {
            const angle = (Math.PI * 2 / rayCount) * i;
            const rayOpacity = 0.02 + Math.sin(time * 2 + i) * 0.01;
            
            this.ctx.save();
            this.ctx.rotate(angle);
            
            const gradient = this.ctx.createLinearGradient(0, 0, rayLength, 0);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${rayOpacity * 2})`);
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${rayOpacity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(rayLength, -15);
            this.ctx.lineTo(rayLength, 15);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }

    drawStars() {
        const time = Date.now() / 1000;
        this.stars.forEach((star) => {
            const twinkle = Math.sin(time * 2 + star.twinkle) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawPrizes() {
        // Рисуем призы горизонтально (несколько циклов для бесшовности)
        const startX = -this.prizeWidth; // Начинаем левее экрана
        const endX = this.canvas.width + this.prizeWidth; // Заканчиваем правее экрана
        
        let currentX = startX - this.prizeOffset;
        let prizeIndex = 0;
        
        // Рисуем призы пока не заполним весь экран
        while (currentX < endX) {
            const prize = this.prizes[prizeIndex % this.prizeCount];
            const x = currentX + this.prizeWidth / 2;
            const y = this.centerY;
            
            // Рисуем только если приз виден на экране
            if (x > -50 && x < this.canvas.width + 50) {
                this.drawPrize(prize, x, y, prizeIndex);
            }
            
            currentX += this.prizeWidth;
            prizeIndex++;
        }
    }

    drawPrize(prize, x, y, index) {
        this.ctx.save();
        
        // Определяем является ли приз центральным
        const centerX = this.canvas.width / 2;
        const distanceFromCenter = Math.abs(x - centerX);
        const isCentral = distanceFromCenter < 60; // В пределах 60px от центра
        
        // Размер и прозрачность зависят от позиции
        let size, opacity, fontSize, textSize;
        if (isCentral) {
            // Центральный приз - КРУПНЫЙ и ЯРКИЙ
            size = 100;
            opacity = 1;
            fontSize = 50;
            textSize = 16;
        } else {
            // Боковые призы - меньше и прозрачнее
            const fadeDistance = Math.min(distanceFromCenter / 100, 1);
            size = 70 - fadeDistance * 20;
            opacity = 1 - fadeDistance * 0.6;
            fontSize = 35 - fadeDistance * 10;
            textSize = 12 - fadeDistance * 3;
        }
        
        this.ctx.globalAlpha = opacity;
        
        // Пульсация только для центрального
        const pulseScale = isCentral ? 1 + Math.sin(Date.now() / 400) * 0.15 : 1;
        
        this.ctx.translate(x, y);
        this.ctx.scale(pulseScale, pulseScale);
        
        // Усиленная тень для центрального
        this.ctx.shadowColor = isCentral ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = isCentral ? 25 : 10;
        this.ctx.shadowOffsetY = isCentral ? 12 : 6;
        
        // Градиентный фон приза
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size/2);
        gradient.addColorStop(0, prize.gradientColor);
        gradient.addColorStop(1, prize.color);
        
        // Круг приза
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Рамка - золотая для центрального, серебряная для боковых
        this.ctx.strokeStyle = isCentral ? '#FFD700' : '#C0C0C0';
        this.ctx.lineWidth = isCentral ? 4 : 2;
        this.ctx.stroke();
        
        // Дополнительное свечение для центрального
        if (isCentral) {
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = prize.color;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // Эмодзи приза
        this.ctx.shadowBlur = 0;
        this.ctx.font = `bold ${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(prize.emoji, 0, -5);
        
        // Название приза - читаемый размер
        if (textSize > 8) { // Показываем текст только если достаточно крупный
            this.ctx.font = `bold ${textSize}px Exo 2`;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = Math.max(2, textSize / 6);
            
            const textY = size/2 + textSize + 5;
            this.ctx.strokeText(prize.title, 0, textY);
            this.ctx.fillText(prize.title, 0, textY);
        }
        
        this.ctx.restore();
    }

    drawCenterButton() {
        this.ctx.save();
        
        // Современная прямоугольная кнопка
        const buttonWidth = 260;
        const buttonHeight = 60;
        const buttonY = this.canvas.height - 100;
        const cornerRadius = 30;
        
        // Пульсирующий эффект
        const pulseScale = 1 + Math.sin(Date.now() / 600) * 0.03;
        const glowIntensity = 0.5 + Math.sin(Date.now() / 400) * 0.3;
        
        this.ctx.translate(this.centerX, buttonY);
        this.ctx.scale(pulseScale, pulseScale);
        
        // Большая мягкая тень
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 8;
        
        // Премиальный градиент кнопки
        const buttonGradient = this.ctx.createLinearGradient(0, -buttonHeight/2, 0, buttonHeight/2);
        buttonGradient.addColorStop(0, '#FFD700');  // Золотой верх
        buttonGradient.addColorStop(0.5, '#FFA500'); // Оранжевый центр
        buttonGradient.addColorStop(1, '#FF8C00');   // Тёмно-оранжевый низ
        
        // Рисуем скругленный прямоугольник
        this.ctx.beginPath();
        this.ctx.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, cornerRadius);
        this.ctx.fillStyle = buttonGradient;
        this.ctx.fill();
        
        // Белая рамка
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Внутренняя подсветка (блик)
        const highlightGradient = this.ctx.createLinearGradient(0, -buttonHeight/2, 0, -buttonHeight/4);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.roundRect(-buttonWidth/2 + 3, -buttonHeight/2 + 3, buttonWidth - 6, buttonHeight/2, cornerRadius - 3);
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fill();
        
        // Внешнее свечение
        this.ctx.shadowColor = `rgba(255, 215, 0, ${glowIntensity})`;
        this.ctx.shadowBlur = 40;
        this.ctx.shadowOffsetY = 0;
        this.ctx.strokeStyle = `rgba(255, 215, 0, ${glowIntensity * 0.5})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Текст кнопки
        this.ctx.shadowBlur = 3;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowOffsetY = 2;
        this.ctx.font = 'bold 20px Exo 2';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('🎁 ПОЛУЧИТЬ ПРИЗ 🎁', 0, 0);
        
        this.ctx.restore();
    }

    // Простая система частиц
    createParticles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (3 + Math.random() * 4),
                vy: Math.sin(angle) * (3 + Math.random() * 4),
                life: 1,
                size: 3 + Math.random() * 6,
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
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = p.size * 2;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    // Запуск вращения призов
    spinWheel() {
        if (this.isSpinning) return;
        
        console.log('🎰 Запуск вращения призов');
        
        // Создаём эффекты
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            this.createParticles(x, y, 1);
        }
        
        // Случайная скорость горизонтального движения  
        this.spinSpeed = 300 + Math.random() * 200; // Пикселей в секунду
        this.isSpinning = true;
    }

    // Завершение вращения
    onSpinComplete() {
        console.log('🎯 Призы остановились');
        
        // Всегда выигрывает коробка
        const winnerPrize = this.prizes[4];
        console.log('🏆 Выигрышный приз:', winnerPrize.title);
        
        // Эффекты победы
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            this.createParticles(x, y, 1);
        }
        
        // Завершаем игру через 2 секунды
        setTimeout(() => {
            this.win();
        }, 2000);
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
        this.gameManager.onGameComplete(true, 100);
    }

    lose() {
        console.log('💀 RouletteGame: поражение');
        this.isRunning = false;
        this.gameManager.onGameComplete(false, 0);
    }
}
