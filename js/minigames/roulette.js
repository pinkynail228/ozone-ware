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

        // Призы по кругу (как в современных играх)
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2 - 30;
        this.prizeRadius = 120; // Радиус расположения призов
        
        // Система вращения
        this.rotation = 0; // Текущий угол поворота призов
        this.spinSpeed = 0; // Скорость вращения
        this.isSpinning = false;
        this.idleRotationSpeed = 0.5; // Медленное вращение в покое

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

        // Обновление анимации вращения
        this.updateRotation(deltaTime);

        // Отрисовка
        this.draw(deltaTime);

        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    updateRotation(deltaTime) {
        if (this.isSpinning) {
            // Быстрое вращение при спине
            this.rotation += this.spinSpeed * deltaTime * 60;
            
            // Замедление (трение)
            this.spinSpeed *= 0.98;
            
            // Остановка когда скорость мала
            if (this.spinSpeed < 0.5) {
                this.isSpinning = false;
                this.spinSpeed = 0;
                this.onSpinComplete();
            }
        } else {
            // Медленное вращение в режиме ожидания
            this.rotation += this.idleRotationSpeed * deltaTime * 60;
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
        // Рисуем призы по кругу
        for (let i = 0; i < this.prizeCount; i++) {
            const prize = this.prizes[i];
            const angle = this.rotation + (i * this.prizeAngle);
            
            // Позиция приза
            const x = this.centerX + Math.cos(angle) * this.prizeRadius;
            const y = this.centerY + Math.sin(angle) * this.prizeRadius;
            
            this.drawPrize(prize, x, y, i);
        }
    }

    drawPrize(prize, x, y, index) {
        this.ctx.save();
        
        // Размер приза
        const size = 70;
        const pulseScale = 1 + Math.sin(Date.now() / 1000 + index) * 0.1;
        
        this.ctx.translate(x, y);
        this.ctx.scale(pulseScale, pulseScale);
        
        // Тень приза
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 8;
        
        // Градиентный фон приза
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size/2);
        gradient.addColorStop(0, prize.gradientColor);
        gradient.addColorStop(1, prize.color);
        
        // Круг приза
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Золотая рамка
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Эмодзи приза
        this.ctx.font = 'bold 35px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(prize.emoji, 0, -5);
        
        // Название приза
        this.ctx.font = 'bold 12px Exo 2';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(prize.title, 0, 25);
        this.ctx.fillText(prize.title, 0, 25);
        
        this.ctx.restore();
    }

    drawCenterButton() {
        this.ctx.save();
        
        // Пульсирующий эффект кнопки
        const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.05;
        const buttonSize = 90;
        
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.scale(pulseScale, pulseScale);
        
        // Тень кнопки
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        this.ctx.shadowBlur = 25;
        this.ctx.shadowOffsetY = 10;
        
        // Градиент кнопки
        const buttonGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, buttonSize/2);
        buttonGradient.addColorStop(0, '#FFFACD');
        buttonGradient.addColorStop(0.3, '#FFD700');
        buttonGradient.addColorStop(1, '#FFA500');
        
        // Круг кнопки
        this.ctx.beginPath();
        this.ctx.arc(0, 0, buttonSize/2, 0, Math.PI * 2);
        this.ctx.fillStyle = buttonGradient;
        this.ctx.fill();
        
        // Белая рамка
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Текст "ПОЛУЧИТЬ ПРИЗ"
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = 'bold 14px Exo 2';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('ПОЛУЧИТЬ', 0, -8);
        this.ctx.fillText('ПРИЗ', 0, 8);
        
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
        
        // Случайная скорость вращения
        this.spinSpeed = 15 + Math.random() * 10;
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
