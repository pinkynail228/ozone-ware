// ============================================
//  FINAL STAGE - Финальный этап получения награды
// ============================================

/**
 * Финальный этап - завершающая игра с призами.
 * Версия с прокруткой и музыкой.
 */
class FinalWinnerGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🎁 Финальный этап: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = null; // Отключаем системные звуки

        // Игровые параметры
        this.isRunning = false;
        this.isSpinning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;

        // Позиции призов
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2 - 30;
        this.prizeWidth = 120;
        
        // Скорость прокрутки в режиме ожидания
        this.idleSpeed = 1;
        this.spinSpeed = 0;
        
        // Смещение ленты призов
        this.prizeOffset = 0;
        
        // Аудиоконтекст для звуков
        this._audioContext = null;
        
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
        
        this.prizeCount = this.prizes.length;
        
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
        this.stopBackgroundMusic();
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
        
        this.updateMovement(deltaTime);
        this.updateParticles(deltaTime);
        this.draw();
        
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    updateMovement(deltaTime) {
        if (this.isSpinning) {
            // Быстрое движение при спине
            this.prizeOffset += this.spinSpeed * deltaTime;
        } else {
            // Медленное движение в режиме ожидания
            this.prizeOffset += this.idleSpeed * deltaTime;
        }
        
        // Циклическое движение - когда смещение больше ширины приза, сбрасываем
        const totalWidth = this.prizeWidth * this.prizeCount;
        if (this.prizeOffset >= totalWidth) {
            this.prizeOffset -= totalWidth;
        }
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
            p.vy += 50 * deltaTime; // Гравитация
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
    
    drawPrizes() {
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
        this.ctx.translate(x, y);
        
        // Определяем является ли приз центральным
        const centerX = this.canvas.width / 2;
        const distanceFromCenter = Math.abs(x - centerX);
        const isCentral = distanceFromCenter < this.prizeWidth / 2;
        
        // Размер и прозрачность зависят от позиции
        let size, opacity, fontSize, textSize;
        
        if (isCentral) {
            // Центральный приз - КРУПНЫЙ и ЯРКИЙ
            size = 120;
            opacity = 1.0;
            fontSize = 60;
            textSize = 24;
            
            // Пульсация центрального приза
            const pulse = Math.sin(Date.now() / 200) * 0.05 + 1;
            this.ctx.scale(pulse, pulse);
        } else {
            // Боковые призы - МЕНЬШЕ и ПРОЗРАЧНЕЕ
            size = 80;
            opacity = 0.6;
            fontSize = 40;
            textSize = 16;
        }
        
        // Рамка приза
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
        
        // Рисуем эмодзи
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(prize.emoji, 0, 0);
        
        // Название приза - читаемый размер
        this.ctx.font = `bold ${textSize}px system-ui, -apple-system, Roboto, Arial`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.lineWidth = 3;
        
        const textY = size/2 + textSize + 5;
        this.ctx.strokeText(prize.title, 0, textY);
        this.ctx.fillText(prize.title, 0, textY);
        
        this.ctx.restore();
    }
    
    drawParticles() {
        this.ctx.save();
        
        // Рисуем все частицы
        this.particles.forEach(p => {
            const opacity = p.life > 0.8 ? 1 : p.life / 0.8;
            
            this.ctx.fillStyle = p.color || 
                ['#FF4081', '#3F51B5', '#FFD700', '#4CAF50', '#9C27B0'][Math.floor(Math.random() * 5)];
            
            this.ctx.globalAlpha = opacity;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    drawCenterButton() {
        this.ctx.save();
        
        // Glassmorphism кнопка
        const buttonWidth = 300;
        const buttonHeight = 80;
        const buttonY = this.canvas.height - 110;
        const cornerRadius = 24;
        
        // Плавная пульсация
        const pulse = Math.sin(Date.now() / 300) * 0.03 + 1;
        this.ctx.translate(this.centerX, buttonY);
        this.ctx.scale(pulse, pulse);
        
        // Тень кнопки
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 8;
        
        // Градиент кнопки
        const gradient = this.ctx.createLinearGradient(0, -buttonHeight/2, 0, buttonHeight/2);
        gradient.addColorStop(0, 'rgba(165, 85, 247, 0.8)');
        gradient.addColorStop(0.5, 'rgba(190, 75, 240, 0.85)');
        gradient.addColorStop(1, 'rgba(212, 70, 239, 0.95)');
        
        // Рисуем кнопку
        this.ctx.beginPath();
        this.ctx.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, cornerRadius);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Светлая рамка для эффекта стекла
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        
        // Текст на кнопке
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetY = 2;
        this.ctx.font = 'bold 30px system-ui, -apple-system, Roboto, Arial';
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ПОЛУЧИТЬ ПРИЗ', 0, 0);
        
        this.ctx.restore();
    }
    
    createParticles(x, y, count = 1, color = null) {
        // Создаем несколько частиц в указанной позиции
        const colors = ['#FF4081', '#3F51B5', '#FFD700', '#4CAF50', '#9C27B0'];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                size: 3 + Math.random() * 5,
                life: 1.0,
                color: color || colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }
    
    // Запуск вращения призов
    spinWheel() {
        // Проверяем, что не запущено уже вращение
        if (this.isSpinning) return;
        
        console.log('🎲 ЗАПУСК ПРОКРУТКИ');
        
        // Создаём праздничные эффекты при старте
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            this.createParticles(x, y, 1);
        }
        
        // Включаем флаг вращения
        this.isSpinning = true;
        
        // Скорость прокрутки
        this.spinSpeed = 500;
        
        // Задержка перед остановкой (3 секунды)
        setTimeout(() => {
            this.slowDown();
        }, 3000);
    }
    
    // Замедление вращения
    slowDown() {
        if (!this.isSpinning) return;
        
        // Начинаем замедление
        const slowdownInterval = setInterval(() => {
            this.spinSpeed *= 0.9;
            
            // Тикающий звук по мере замедления
            if (this.spinSpeed < 200 && Math.random() > 0.7) {
                this.playTickSound();
            }
            
            // Когда скорость достаточно мала, останавливаемся
            if (this.spinSpeed < 10) {
                clearInterval(slowdownInterval);
                this.positionBoxInCenter();
                this.isSpinning = false;
                this.onSpinComplete();
            }
        }, 100);
    }
    
    // Позиционирование коробки в центре
    positionBoxInCenter() {
        const boxPrizeIndex = 3; // Коробка - индекс 3
        
        // Коробка должна быть в центре, вычисляем нужный offset
        const currentOffset = this.prizeOffset % (this.prizeWidth * this.prizeCount);
        const targetOffset = boxPrizeIndex * this.prizeWidth;
        this.prizeOffset = targetOffset;
        
        console.log('📦 Коробка установлена в центр');
    }
    
    // Завершение вращения
    onSpinComplete() {
        // Победа - коробка
        console.log('📦 ПОБЕДА: Коробка!');
        
        // Играем победный звук
        this.playVictorySound();
        
        // MEGA эффекты победы
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 150;
                const x = this.centerX + Math.cos(angle) * distance;
                const y = this.centerY + Math.sin(angle) * distance;
                this.createParticles(x, y, 2);
            }, i * 20); // Растянуто во времени для эффекта фейерверка
        }
        
        // Завершаем игру через 3 секунды
        setTimeout(() => {
            this.win();
        }, 3000);
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
    
    // Завершение игры
    win() {
        console.log('🏆 Финальный этап: победа');
        this.isRunning = false;
        this.gameManager.endGame(true, 100);
    }
    
    // Создает и возвращает аудио контекст
    getAudioContext() {
        if (!this._audioContext) {
            try {
                this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error('🔇 Не удалось создать AudioContext:', e);
            }
        }
        return this._audioContext;
    }
    
    // Тикающий звук
    playTickSound() {
        try {
            const audioContext = this.getAudioContext();
            if (!audioContext) return;
            
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.frequency.value = 2000;
            osc.type = 'square';
            
            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.start();
            osc.stop(audioContext.currentTime + 0.05);
        } catch (e) {
            console.error('🔇 Ошибка при воспроизведении тика:', e);
        }
    }
    
    // Победный звук
    playVictorySound() {
        try {
            const audioContext = this.getAudioContext();
            if (!audioContext) return;
            
            // Аккорд C мажор (C-E-G)
            const notes = [261.63, 329.63, 392.00];
            
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    
                    osc.frequency.value = freq;
                    osc.type = 'triangle';
                    
                    gain.gain.setValueAtTime(0, audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.5);
                }, i * 100);
            });
            
            // Дополнительный высокий звук в конце
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.frequency.value = 523.25; // C5
                osc.type = 'triangle';
                
                gain.gain.setValueAtTime(0, audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.start();
                osc.stop(audioContext.currentTime + 0.8);
            }, 300);
            
        } catch (e) {
            console.error('🔇 Ошибка при воспроизведении звука победы:', e);
        }
    }
}
