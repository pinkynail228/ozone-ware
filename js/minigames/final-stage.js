// ============================================
//  FINAL STAGE - Финальный этап получения награды
// ============================================

class RouletteGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🎁 Финальный этап: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = null; // Отключаем ВСЕ звуки для финального этапа

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

        console.log('✅ Финальный этап: готов к запуску');
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
        console.log('▶️ Финальный этап: СТАРТ ИГРЫ');
        console.log('🔍 Canvas size:', this.canvas.width, 'x', this.canvas.height);
        console.log('🎯 Center point:', this.centerX, this.centerY);
        console.log('🎁 Prizes count:', this.prizes.length);
        
        this.isRunning = true;
        this.lastFrameTime = null;
        this.setupControls();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
        
        console.log('✅ Финальный этап: инициализация завершена');
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
        if (!this.isRunning) {
            console.log('❌ Update прерван: игра не запущена');
            return;
        }
        
        // Инициализируем время
        if (this.lastFrameTime === null) {
            this.lastFrameTime = currentTime;
            console.log('⏰ Первый кадр:', currentTime);
        }
        
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Первые несколько кадров логируем
        if (currentTime < this.lastFrameTime + 3000) {
            console.log('🔄 Update frame, deltaTime:', deltaTime);
        }
        
        this.updateMovement(deltaTime);
        this.updateParticles(deltaTime);
        this.draw();

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
                
                // 🎯 ПРИНУДИТЕЛЬНО ставим коробку (приз #3) по центру экрана!
                const boxPrizeIndex = 3; // 📦 Коробка - 4й приз (индекс 3)
                
                // Базовый offset (сколько нужно сдвинуть, чтобы индекс 3 был по центру)
                this.prizeOffset = this.prizeWidth * 2.5;
                
                console.log('📦 КОРОБКА: принудительно установлена по центру, индекс:', boxPrizeIndex);
                
                console.log('🎯 Коробка установлена в центр экрана, offset:', this.prizeOffset);
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
        
        // Современная 3D иконка вместо эмодзи
        this.ctx.shadowBlur = 0;
        this.drawPrizeIcon(prize, 0, -5, fontSize);
        
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

    drawPrizeIcon(prize, x, y, size) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        const iconSize = size * 0.6;
        
        // Определяем тип приза и рисуем соответствующую 3D иконку
        switch(prize.emoji) {
            case '🚗':
                this.drawCarIcon(iconSize);
                break;
            case '💰':
                this.drawMoneyIcon(iconSize);
                break;
            case '⌚':
                this.drawWatchIcon(iconSize);
                break;
            case '🏠':
                this.drawHouseIcon(iconSize);
                break;
            case '📦':
                this.drawBoxIcon(iconSize);
                break;
        }
        
        this.ctx.restore();
    }

    drawCarIcon(size) {
        // 3D автомобиль с металлическим эффектом
        const scale = size / 40;
        this.ctx.scale(scale, scale);
        
        // Тень
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-18, 8, 36, 4);
        
        // Основной корпус (градиент металла)
        const carGradient = this.ctx.createLinearGradient(0, -10, 0, 10);
        carGradient.addColorStop(0, '#E8E8E8');
        carGradient.addColorStop(0.5, '#C0C0C0');
        carGradient.addColorStop(1, '#808080');
        
        this.ctx.fillStyle = carGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(-15, -8, 30, 16, 3);
        this.ctx.fill();
        
        // Окна (стеклянный эффект)
        const glassGradient = this.ctx.createLinearGradient(0, -6, 0, 2);
        glassGradient.addColorStop(0, 'rgba(173, 216, 230, 0.8)');
        glassGradient.addColorStop(1, 'rgba(100, 149, 237, 0.6)');
        
        this.ctx.fillStyle = glassGradient;
        this.ctx.fillRect(-12, -6, 24, 8);
        
        // Колёса (чёрные с металлическими дисками)
        this.ctx.fillStyle = '#2C2C2C';
        this.ctx.beginPath();
        this.ctx.arc(-8, 6, 3, 0, Math.PI * 2);
        this.ctx.arc(8, 6, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Диски колёс
        this.ctx.fillStyle = '#A0A0A0';
        this.ctx.beginPath();
        this.ctx.arc(-8, 6, 2, 0, Math.PI * 2);
        this.ctx.arc(8, 6, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawMoneyIcon(size) {
        // 3D стопка денег
        const scale = size / 40;
        this.ctx.scale(scale, scale);
        
        // Стопка купюр с 3D эффектом
        for (let i = 0; i < 3; i++) {
            const offset = i * 2;
            
            // Тень каждой купюры
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(-12 + offset, -6 + offset + 1, 24, 12);
            
            // Градиент денег
            const moneyGradient = this.ctx.createLinearGradient(0, -6 + offset, 0, 6 + offset);
            moneyGradient.addColorStop(0, '#90EE90');
            moneyGradient.addColorStop(0.5, '#228B22');
            moneyGradient.addColorStop(1, '#006400');
            
            this.ctx.fillStyle = moneyGradient;
            this.ctx.fillRect(-12 + offset, -6 + offset, 24, 12);
            
            // Символ доллара
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('$', 0 + offset, 2 + offset);
        }
    }

    drawWatchIcon(size) {
        // 3D часы с металлическим корпусом
        const scale = size / 40;
        this.ctx.scale(scale, scale);
        
        // Тень
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(2, 2, 14, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Корпус часов (металлический градиент)
        const watchGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
        watchGradient.addColorStop(0, '#FFD700');
        watchGradient.addColorStop(0.7, '#DAA520');
        watchGradient.addColorStop(1, '#B8860B');
        
        this.ctx.fillStyle = watchGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Циферблат
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Стрелки
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -6);  // Часовая
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(4, -2);  // Минутная
        this.ctx.stroke();
        
        // Центр
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 1, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawHouseIcon(size) {
        // 3D дом с объёмом
        const scale = size / 40;
        this.ctx.scale(scale, scale);
        
        // Тень дома
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-13, 8, 26, 4);
        
        // Стены (градиент)
        const wallGradient = this.ctx.createLinearGradient(-10, -5, 10, 5);
        wallGradient.addColorStop(0, '#DEB887');
        wallGradient.addColorStop(1, '#CD853F');
        
        this.ctx.fillStyle = wallGradient;
        this.ctx.fillRect(-10, -2, 20, 12);
        
        // Крыша (3D треугольник)
        const roofGradient = this.ctx.createLinearGradient(0, -12, 0, -2);
        roofGradient.addColorStop(0, '#8B4513');
        roofGradient.addColorStop(1, '#A0522D');
        
        this.ctx.fillStyle = roofGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(-12, -2);
        this.ctx.lineTo(12, -2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Дверь
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(-3, 2, 6, 8);
        
        // Окно
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(2, 0, 4, 4);
        
        // Ручка двери
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(1, 6, 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBoxIcon(size) {
        // 3D коробка с объёмными гранями
        const scale = size / 40;
        this.ctx.scale(scale, scale);
        
        // Тень
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(-12, 8, 24, 4);
        
        // Передняя грань
        const frontGradient = this.ctx.createLinearGradient(-10, -8, 10, 8);
        frontGradient.addColorStop(0, '#DDA0DD');
        frontGradient.addColorStop(1, '#BA55D3');
        
        this.ctx.fillStyle = frontGradient;
        this.ctx.fillRect(-10, -8, 20, 16);
        
        // Верхняя грань (3D эффект)
        const topGradient = this.ctx.createLinearGradient(-10, -8, 0, -12);
        topGradient.addColorStop(0, '#E6E6FA');
        topGradient.addColorStop(1, '#DDA0DD');
        
        this.ctx.fillStyle = topGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -8);
        this.ctx.lineTo(-6, -12);
        this.ctx.lineTo(14, -12);
        this.ctx.lineTo(10, -8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Правая грань
        const sideGradient = this.ctx.createLinearGradient(10, -8, 14, -12);
        sideGradient.addColorStop(0, '#BA55D3');
        sideGradient.addColorStop(1, '#9932CC');
        
        this.ctx.fillStyle = sideGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(10, -8);
        this.ctx.lineTo(14, -12);
        this.ctx.lineTo(14, 4);
        this.ctx.lineTo(10, 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Лента на коробке
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-10, 0);
        this.ctx.lineTo(10, 0);
        this.ctx.moveTo(0, -8);
        this.ctx.lineTo(0, 8);
        this.ctx.stroke();
        
        // Бантик
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(-2, -8, 2, 0, Math.PI * 2);
        this.ctx.arc(2, -8, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawCenterButton() {
        this.ctx.save();
        
        // Glassmorphism кнопка (2024 тренд)
        const buttonWidth = 280;
        const buttonHeight = 70;
        const buttonY = this.canvas.height - 100;
        const cornerRadius = 20;
        
        // Subtle пульсация
        const pulseScale = 1 + Math.sin(Date.now() / 800) * 0.02;
        
        this.ctx.translate(this.centerX, buttonY);
        this.ctx.scale(pulseScale, pulseScale);
        
        // Многослойная тень (neomorphism)
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        this.ctx.shadowBlur = 30;
        this.ctx.shadowOffsetY = 12;
        
        // Glassmorphism фон - полупрозрачный с градиентом
        const glassGradient = this.ctx.createLinearGradient(0, -buttonHeight/2, 0, buttonHeight/2);
        glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');  
        glassGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)'); 
        glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');   
        
        // Основная кнопка
        this.ctx.beginPath();
        this.ctx.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, cornerRadius);
        this.ctx.fillStyle = glassGradient;
        this.ctx.fill();
        
        // Тонкая светлая граница (glassmorphism)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        
        // Внутренняя тень для глубины
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Subtle блик сверху
        const highlightGradient = this.ctx.createLinearGradient(0, -buttonHeight/2, 0, -buttonHeight/3);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.roundRect(-buttonWidth/2 + 2, -buttonHeight/2 + 2, buttonWidth - 4, buttonHeight/3, cornerRadius - 2);
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fill();
        
        // Цветная подложка для контраста текста
        const bgGradient = this.ctx.createLinearGradient(0, -buttonHeight/2, 0, buttonHeight/2);
        bgGradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
        bgGradient.addColorStop(1, 'rgba(255, 140, 0, 0.3)');
        
        this.ctx.beginPath();
        this.ctx.roundRect(-buttonWidth/2 + 1, -buttonHeight/2 + 1, buttonWidth - 2, buttonHeight - 2, cornerRadius - 1);
        this.ctx.fillStyle = bgGradient;
        this.ctx.fill();
        
        // Современный чистый текст
        this.ctx.shadowBlur = 2;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowOffsetY = 1;
        this.ctx.font = '600 18px system-ui, -apple-system, sans-serif'; // Современный шрифт
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('ПОЛУЧИТЬ ПРИЗ', 0, 0);
        
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
        
        // 🎵 СОБСТВЕННЫЙ ПРАЗДНИЧНЫЙ ЗВУК (без тикания!)
        this.playVictorySound();
        
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
        
        // 🎵 СОБСТВЕННЫЙ ПОБЕДНЫЙ ФАНФАР (без тикания!)
        this.playVictoryFanfare();
        
        // Всегда выигрывает коробка (индекс 3)
        const boxIndex = 3;
        const winnerPrize = this.prizes[boxIndex];
        console.log('📦 КОРОБКА ВЫИГРАЛА! Приз:', winnerPrize?.title || 'Неизвестный');
        
        // МЕГА эффекты победы
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 150;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            this.createParticles(x, y, 2);
        }
        
        // Завершаем игру через 3 секунды (дольше для наслаждения)
        setTimeout(() => {
            this.win();
        }, 3000);
    }

    // 🎵 СОБСТВЕННАЯ СИСТЕМА ЗВУКОВ (без тикания!)
    playVictorySound() {
        // Создаём короткий приятный звук через Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Приятная нота (C5 = 523.25 Hz)
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.type = 'sine';
            
            // Быстрое затухание
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('🔇 Audio not available');
        }
    }

    playVictoryFanfare() {
        // Создаём праздничную мелодию из трёх нот
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Нота 1: C5 (523.25 Hz)
            this.playNote(audioContext, 523.25, 0, 0.4);
            
            // Нота 2: E5 (659.25 Hz) 
            setTimeout(() => {
                this.playNote(audioContext, 659.25, 0, 0.4);
            }, 200);
            
            // Нота 3: G5 (783.99 Hz)
            setTimeout(() => {
                this.playNote(audioContext, 783.99, 0, 0.6);
            }, 400);
        } catch (e) {
            console.log('🔇 Audio not available');
        }
    }

    playNote(audioContext, frequency, startTime, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
        oscillator.type = 'triangle'; // Приятный тембр
        
        // Плавное нарастание и затухание
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
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
