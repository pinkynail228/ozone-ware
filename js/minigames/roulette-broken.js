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

        // Убираем стрелку - теперь у нас центральная кнопка

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
                color: ['#FFD700', '#FFA500', '#FF8C00', '#FF6B35', '#E74C3C', '#9B59B6', '#3498DB'][Math.floor(Math.random() * 7)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    createConfetti() {
        // Создаём конфетти по всему экрану
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -20,
                vx: (Math.random() - 0.5) * 4,
                vy: 2 + Math.random() * 3,
                life: 1,
                size: 4 + Math.random() * 8,
                color: ['#FFD700', '#FFA500', '#FF6B35', '#E74C3C', '#9B59B6', '#3498DB', '#2ECC71'][Math.floor(Math.random() * 7)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.4,
                isConfetti: true
            });
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.isConfetti) {
                p.vy += 0.15; // Больше гравитации для конфетти
                p.rotation += p.rotSpeed;
                p.life -= 0.008; // Дольше живут
            } else {
                p.vy += 0.1; // Обычная гравитация
                p.life -= 0.02;
            }
            
            if (p.rotation !== undefined) {
                p.rotation += p.rotSpeed || 0;
            }
            
            return p.life > 0 && p.y < this.canvas.height + 50;
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            
            if (p.isConfetti) {
                // Рисуем конфетти как прямоугольники
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
            } else {
                // Рисуем обычные частицы как круги с сиянием
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = p.size * 2;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
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

        // Отрисовка БЕЗ UI (только колесо)
        this.draw(deltaTime);

        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    updateWheelRotation(deltaTime) {
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
        
        // UI убран - никаких текстов!
    }

    drawBackground() {
        // Премиальный Ozon градиент с изящным радиальным эффектом
        const linearGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        linearGradient.addColorStop(0, '#6B2FFF');  // Насыщенный фиолетовый
        linearGradient.addColorStop(0.5, '#5026E5'); // Промежуточный тон
        linearGradient.addColorStop(1, '#4B1FDD');  // Глубокий фиолетовый
        
        // Базовый фон
        this.ctx.fillStyle = linearGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Пульсирующий радиальный градиент в центре (как на стартовом экране)
        const time = Date.now() / 1000;
        const pulseSize = 0.9 + Math.sin(time * 1.5) * 0.1; // Пульсирует между 0.8 и 1.0
        
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
        
        // Создаём плавные круги на фоне
        this.drawBackgroundCircles();
        
        // Лучи света от центра (как на стартовом экране)
        this.drawLightRays();
    }

    drawBackgroundCircles() {
        // Большие размытые круги на фоне
        const circlePositions = [
            { x: this.canvas.width * 0.2, y: this.canvas.height * 0.2, radius: 100 },
            { x: this.canvas.width * 0.8, y: this.canvas.height * 0.3, radius: 120 },
            { x: this.canvas.width * 0.15, y: this.canvas.height * 0.75, radius: 80 },
            { x: this.canvas.width * 0.8, y: this.canvas.height * 0.8, radius: 110 }
        ];
        
        const time = Date.now() / 1000;
        
        circlePositions.forEach((circle, i) => {
            // Каждый круг движется по своей траектории
            const offsetX = Math.sin(time * 0.5 + i) * 20;
            const offsetY = Math.cos(time * 0.3 + i * 0.7) * 20;
            const pulseSize = 0.8 + Math.sin(time + i * 0.5) * 0.2;
            
            const gradient = this.ctx.createRadialGradient(
                circle.x + offsetX,
                circle.y + offsetY,
                0,
                circle.x + offsetX,
                circle.y + offsetY,
                circle.radius * pulseSize
            );
            
            gradient.addColorStop(0, 'rgba(164, 92, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(108, 59, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(
                circle.x + offsetX,
                circle.y + offsetY,
                circle.radius * pulseSize,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }

    drawLightRays() {
        // Лучи света из центра
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
            const rayOpacity = 0.02 + Math.sin(time * 2 + i) * 0.01; // Пульсирующая прозрачность
            
            this.ctx.save();
            this.ctx.rotate(angle);
            
            const gradient = this.ctx.createLinearGradient(0, 0, rayLength, 0);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${rayOpacity * 2})`); // Золотой
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

    // Старый код drawWheel удалён - теперь используется drawPrizes
        
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
        
        // Премиум центральный круг с объёмом
        const centerRadius = 45;
        
        // Тень центрального круга
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 30;
        this.ctx.shadowOffsetY = 10;
        
        // Градиент центра с металлическим эффектом
        const centerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, centerRadius);
        centerGradient.addColorStop(0, '#FFFACD');    // Светло-золотой центр
        centerGradient.addColorStop(0.3, '#FFD700');  // Золотой
        centerGradient.addColorStop(0.7, '#FFA500');  // Оранжево-золотой
        centerGradient.addColorStop(1, '#FF8C00');    // Тёмно-оранжевый край
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = centerGradient;
        this.ctx.fill();
        
        // Металлическая рамка с объёмом
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Внутренняя тень для глубины
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Блик света на центре
        const highlightGradient = this.ctx.createRadialGradient(-10, -10, 0, -10, -10, 25);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = highlightGradient;
        this.ctx.beginPath();
        this.ctx.arc(-10, -10, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Корона в центре с тенью
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetY = 3;
        
        this.ctx.font = 'bold 45px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFFFF';
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
        // ЭПИЧНЫЙ заголовок с множественными эффектами
        const time = Date.now() / 1000;
        const titleScale = 1 + Math.sin(time * 2) * 0.08;
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, 60);
        this.ctx.scale(titleScale, titleScale);
        
        // Сияние вокруг заголовка
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 30;
        
        // Большая тёмная обводка
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 8;
        this.ctx.font = 'bold 36px Exo 2';
        this.ctx.textAlign = 'center';
        this.ctx.strokeText('🎰 РУЛЕТКА УДАЧИ', 0, 0);
        
        // Белая обводка
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText('🎰 РУЛЕТКА УДАЧИ', 0, 0);
        
        // Золотой градиент для текста
        const textGradient = this.ctx.createLinearGradient(0, -20, 0, 20);
        textGradient.addColorStop(0, '#FFFACD');
        textGradient.addColorStop(0.5, '#FFD700');
        textGradient.addColorStop(1, '#FFA500');
        
        this.ctx.fillStyle = textGradient;
        this.ctx.fillText('🎰 РУЛЕТКА УДАЧИ', 0, 0);
        
        this.ctx.restore();
        
        // Подзаголовок
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, 100);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 16px Exo 2';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💎 КРУТИ И ВЫИГРЫВАЙ 💎', 0, 0);
        
        this.ctx.restore();
        
        // Инструкция с МЕГА анимацией
        if (!this.wheel.isSpinning) {
            const pulse = 0.6 + Math.sin(time * 4) * 0.4;
            const bounce = 1 + Math.sin(time * 3) * 0.1;
            
            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height - 80);
            this.ctx.scale(bounce, bounce);
            
            // Сияние кнопки
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 20;
            this.ctx.globalAlpha = pulse;
            
            // Фон кнопки
            const buttonGradient = this.ctx.createLinearGradient(-120, -20, 120, 20);
            buttonGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            buttonGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.6)');
            buttonGradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
            
            this.ctx.fillStyle = buttonGradient;
            this.ctx.beginPath();
            this.ctx.roundRect(-120, -25, 240, 50, 25);
            this.ctx.fill();
            
            // Рамка кнопки
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Текст кнопки
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 22px Exo 2';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👆 ТАПНИ ЧТОБЫ КРУТИТЬ 👆', 0, 8);
            
            this.ctx.restore();
        } else {
            // Текст во время вращения
            const spinPulse = 0.7 + Math.sin(time * 6) * 0.3;
            
            this.ctx.save();
            this.ctx.globalAlpha = spinPulse;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px Exo 2';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText('🎲 КРУТИТСЯ... 🎲', this.canvas.width / 2, this.canvas.height - 80);
            this.ctx.restore();
        }
    }

    // Запуск вращения призов
    spinWheel() {
        if (this.isSpinning) return;
        
        console.log('🎰 Запуск вращения призов');
        
        // МЕГА праздничные эффекты!
        this.createConfetti(); // Конфетти с неба
        
        // Взрыв частиц от центра
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            this.createParticles(x, y, 1);
        }
        
        // Кольцо частиц вокруг призов
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 / 16) * i;
            const distance = this.prizeRadius + 40;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            this.createParticles(x, y, 2);
        }
        
        // Случайная скорость вращения
        this.spinSpeed = 15 + Math.random() * 10; // 15-25 оборотов в секунду
        this.isSpinning = true;
        
        // Звук убран для рулетки
    }

    // Завершение вращения
    onSpinComplete() {
        console.log('🎯 Призы остановились');
        
        // Всегда выигрывает коробка (последний приз в массиве)
        const winnerPrize = this.prizes[4]; // Коробка
        console.log('🏆 Выигрышный приз:', winnerPrize.title);
        
        // Показываем результат через секунду
        setTimeout(() => {
            this.showResult(winnerPrize);
        }, 1000);
    }

    // Показ результата (всегда коробка)
    showResult(prize) {
        console.log('🎁 Результат:', prize.title);
        
        // Создаём ещё больше эффектов
        this.createConfetti();
        
        // Завершаем игру через 2 секунды
        setTimeout(() => {
            this.win();
        }, 2000);
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
