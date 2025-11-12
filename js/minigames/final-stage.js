// ============================================
//  FINAL STAGE - Финальный этап получения награды
// ============================================

/**
 * Финальный этап - завершающая игра с призами.
 * Полностью переработанная версия с модерным UI и четкими шрифтами.
 * Включает собственную звуковую систему и 3D иконки вместо эмодзи.
 * Победа гарантирована - коробка всегда в центре и всегда выигрывает.
 */
class FinalStageGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🎁 Финальный этап: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = null; // Отключаем системные звуки

        // Игровые параметры
        this.isRunning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;

        // Позиции призов
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2 - 30;
        this.prizeWidth = 120;
        
        // Призы - неизменный порядок
        this.prizes = [
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
        
        // Частицы для эффектов
        this.particles = [];
        
        console.log('✅ Финальный этап: готов к запуску');
    }

    start() {
        console.log('▶️ Финальный этап: СТАРТ ИГРЫ');
        this.isRunning = true;
        this.lastFrameTime = null;
        this.setupControls();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    stop() {
        console.log('⏹️ Финальный этап: стоп');
        this.isRunning = false;
        this.removeControls();
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }

    update(currentTime) {
        if (!this.isRunning) return;
        
        // Инициализируем время
        if (this.lastFrameTime === null) {
            this.lastFrameTime = currentTime;
        }
        
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        this.updateParticles(deltaTime);
        this.draw();
        
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    updateParticles(deltaTime) {
        // Обновляем частицы
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 30 * deltaTime; // Гравитация
            p.size *= 0.95; // Уменьшение размера
        }
    }
    
    draw() {
        // Очистка canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем все элементы экрана
        this.drawPrizes();
        this.drawParticles();
        this.drawCenterButton();
    }
    
    // НОВАЯ СТАТИЧНАЯ СИСТЕМА ПРИЗОВ
    drawPrizes() {
        // Настраиваем позиции призов
        const centerX = this.canvas.width / 2;
        const positions = [
            centerX - this.prizeWidth * 2, // Крайний левый
            centerX - this.prizeWidth,     // Левый
            centerX,                       // Центр (КОРОБКА ВСЕГДА ЗДЕСЬ)
            centerX + this.prizeWidth,     // Правый
            centerX + this.prizeWidth * 2  // Крайний правый
        ];
        
        // Всегда рисуем призы в строгом порядке
        const prizesToDraw = [
            this.prizes[0],  // $100K слева край
            this.prizes[1],  // Rolex слева
            this.prizes[3],  // КОРОБКА В ЦЕНТРЕ
            this.prizes[2],  // Квартира справа
            this.prizes[0]   // $100K справа край
        ];
        
        // Рисуем все призы в фиксированных позициях
        for (let i = 0; i < positions.length; i++) {
            const isCentral = i === 2; // Центральный индекс - это всегда 2
            this.drawPrize(prizesToDraw[i], positions[i], this.centerY, isCentral);
        }
    }
    
    drawPrize(prize, x, y, isCentral) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Размер и прозрачность зависят от позиции
        let size, opacity, fontSize, textSize;
        
        if (isCentral) {
            // Центральный приз - КРУПНЫЙ и ЯРКИЙ
            size = 120;
            opacity = 1.0;
            fontSize = 60;
            textSize = 24; // Увеличиваем размер текста для читаемости
            
            // Пульсация центрального приза
            const pulse = Math.sin(Date.now() / 200) * 0.05 + 1;
            this.ctx.scale(pulse, pulse);
        } else {
            // Боковые призы - МЕНЬШЕ и ПРОЗРАЧНЕЕ
            size = 80;
            opacity = 0.6;
            fontSize = 40;
            textSize = 16; // Увеличиваем размер текста для читаемости
        }
        
        // Рамка приза - золотая для центрального, серебряная для остальных
        const frameGradient = this.ctx.createRadialGradient(0, 0, size/2 - 10, 0, 0, size/2 + 10);
        
        if (isCentral) {
            // Золотая рамка для центрального приза
            frameGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.8)');
            frameGradient.addColorStop(0.9, 'rgba(255, 165, 0, 0.9)');
            frameGradient.addColorStop(1.0, 'rgba(218, 165, 32, 1.0)');
            
            // Свечение для центрального приза
            this.ctx.shadowColor = prize.color;
            this.ctx.shadowBlur = 20;
        } else {
            // Серебряная рамка для обычных призов
            frameGradient.addColorStop(0.7, 'rgba(192, 192, 192, 0.6)');
            frameGradient.addColorStop(0.9, 'rgba(169, 169, 169, 0.7)');
            frameGradient.addColorStop(1.0, 'rgba(128, 128, 128, 0.8)');
        }
        
        // Рисуем круглый фон приза
        this.ctx.globalAlpha = opacity;
        
        // Градиентный фон приза
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size/2);
        gradient.addColorStop(0, prize.gradientColor);
        gradient.addColorStop(1, prize.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Рисуем рамку
        this.ctx.strokeStyle = frameGradient;
        this.ctx.lineWidth = 4;
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
            // Современный системный шрифт с хорошей читаемостью
            this.ctx.font = `bold ${textSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
            
            // Усиленный контур для лучшей читаемости
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.lineWidth = Math.max(3, textSize / 5);
            
            // Яркий белый цвет с небольшим свечением
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            this.ctx.shadowBlur = 2;
            
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
            default:
                // Фоллбэк на случай неизвестного эмодзи
                this.ctx.font = `bold ${size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(prize.emoji, 0, 0);
                break;
        }
        
        this.ctx.restore();
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
    
    drawParticles() {
        this.ctx.save();
        
        // Рисуем все частицы
        this.particles.forEach(p => {
            const opacity = p.life > 0.8 ? 1 : p.life / 0.8;
            
            // Разные цвета для праздничного эффекта
            this.ctx.fillStyle = p.color || 
                ['#FF4081', '#3F51B5', '#FFD700', '#4CAF50', '#9C27B0'][Math.floor(Math.random() * 5)];
            
            this.ctx.globalAlpha = opacity;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    /**
     * Отрисовка центральной кнопки в стиле glassmorphism (тренд 2024 года)
     */
    drawCenterButton() {
        this.ctx.save();
        
        // Размеры кнопки
        const buttonWidth = 300; // Увеличили ширину для лучшей читаемости
        const buttonHeight = 80;  // Увеличили высоту для удобства нажатия
        const buttonY = this.canvas.height - 110; // Немного выше, чтобы не было слишком внизу
        const cornerRadius = 24; // Более плавные углы
        
        // Плавная пульсация
        const pulse = Math.sin(Date.now() / 300) * 0.03 + 1; // Увеличили амплитуду
        this.ctx.translate(this.centerX, buttonY);
        this.ctx.scale(pulse, pulse);
        
        // Усиленная тень кнопки
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 8;
        
        // Улучшенный градиент - яркий и насыщенный
        const gradient = this.ctx.createLinearGradient(0, -buttonHeight/2, 0, buttonHeight/2);
        gradient.addColorStop(0, 'rgba(165, 85, 247, 0.8)'); // Более насыщенный
        gradient.addColorStop(0.5, 'rgba(190, 75, 240, 0.85)');
        gradient.addColorStop(1, 'rgba(212, 70, 239, 0.95)');
        
        // Основная форма
        this.ctx.beginPath();
        this.ctx.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, cornerRadius);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Светлая рамка для эффекта стекла - ярче и заметнее
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        
        // Верхняя светлая бликовая полоса для лучшего эффекта стекла
        this.ctx.beginPath();
        this.ctx.moveTo(-buttonWidth/2 + cornerRadius, -buttonHeight/2 + 10);
        this.ctx.lineTo(buttonWidth/2 - cornerRadius, -buttonHeight/2 + 10);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Улучшенный текст на кнопке
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetY = 2;
        this.ctx.font = 'bold 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial';
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ПОЛУЧИТЬ ПРИЗ', 0, 0);
        
        this.ctx.restore();
    }
    
    /**
     * Создает частицы в указанной позиции
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {number} count - Количество частиц
     * @param {string} [color] - Цвет частиц, если указан
     */
    createParticles(x, y, count = 1, color = null) {
        // Создаем несколько частиц в указанной позиции
        const colors = ['#FF4081', '#3F51B5', '#FFD700', '#4CAF50', '#9C27B0'];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            
            // Варьируем начальный подъём для более естественного эффекта
            const initialLift = 70 + Math.random() * 60;
            
            // Увеличиваем разброс размеров для визуального разнообразия
            const particleSize = 2 + Math.random() * 6;
            
            // Время жизни частицы - случайное
            const lifeSpan = 0.7 + Math.random() * 0.5;
            
            // Если цвет передан, используем его, иначе случайный
            const particleColor = color || colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - initialLift,
                size: particleSize,
                life: lifeSpan,
                color: particleColor
            });
        }
    }
    
    // Запуск вращения призов
    spinWheel() {
        // Создаём праздничные эффекты
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            this.createParticles(x, y, 1);
        }
        
        // Мгновенная победа - сразу переходим к финалу
        this.playVictoryFanfare();
        this.onSpinComplete();
    }

    /**
     * Завершение игры с выдачей приза и эффектами победы
     */
    onSpinComplete() {
        // Всегда выигрывает коробка (индекс 3)
        const boxIndex = 3;
        const winnerPrize = this.prizes[boxIndex];
        console.log('📦 ПОБЕДА: Коробка!', winnerPrize);
        
        // Расширенный эффект победы
        
        // 1. Волна частиц от центра
        for (let i = 0; i < 120; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 150;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            
            // Цвета в стиле приза-победителя
            const particleColor = Math.random() < 0.6 ? 
                [winnerPrize.color, winnerPrize.gradientColor, '#FFD700'][Math.floor(Math.random() * 3)] : // 60% шанс на цвета приза
                ['#FF4081', '#3F51B5', '#FFFFFF', '#4CAF50', '#9C27B0'][Math.floor(Math.random() * 5)]; // 40% шанс на случайные цвета
            
            this.createParticles(x, y, 2, particleColor);
        }
        
        // 2. Дополнительный взрыв частиц через короткий интервал
        setTimeout(() => {
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const x = this.centerX + Math.cos(angle) * 20; // Ближе к центру
                const y = this.centerY + Math.sin(angle) * 20;
                this.createParticles(x, y, 3, '#FFD700'); // Золотые частицы
            }
        }, 300);
        
        // 3. Финальная волна частиц перед завершением
        setTimeout(() => {
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 100;
                const x = this.centerX + Math.cos(angle) * distance;
                const y = this.centerY + Math.sin(angle) * distance;
                this.createParticles(x, y, 2, winnerPrize.gradientColor);
            }
        }, 1500);
        
        // Завершаем игру через 4 секунды (дольше для наслаждения)
        setTimeout(() => {
            this.win();
        }, 4000);
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
        this.canvas.removeEventListener('touchstart', this.tapHandler);
        this.canvas.removeEventListener('mousedown', this.tapHandler);
    }

    /**
     * Завершение игры с победой
     */
    win() {
        console.log('🏆 Финальный этап: победа');
        this.isRunning = false;
        
        // Исправляем на правильный метод gameManager.endGame вместо onGameComplete
        this.gameManager.endGame(true, 100);
    }

    // СОБСТВЕННАЯ СИСТЕМА ЗВУКОВ (Web Audio API)
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
}
