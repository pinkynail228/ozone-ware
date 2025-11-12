// ============================================
//  FINAL STAGE - Финальный этап получения награды
// ============================================

/**
 * Финальный этап с нормальной анимацией прокрутки
 * Простая логика: быстро крутится, плавно замедляется, останавливается на коробке
 */
class FinalNormalGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🎁 Финальный этап: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = null;

        // Игровые параметры
        this.isRunning = false;
        this.isSpinning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;

        // Позиции призов
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2 - 30;
        this.prizeWidth = 120;
        
        // Анимация
        this.spinSpeed = 0;
        this.prizeOffset = 0;
        this.targetOffset = 0;
        
        // Аудиоконтекст
        this._audioContext = null;
        
        // Призы в циклическом порядке
        this.prizes = [
            { emoji: '💰', title: '$100K', color: '#22C55E', gradientColor: '#4ADE80' },
            { emoji: '⌚', title: 'Rolex', color: '#3B82F6', gradientColor: '#60A5FA' },
            { emoji: '🏠', title: 'Квартира', color: '#F59E0B', gradientColor: '#FBBF24' },
            { emoji: '📦', title: 'Коробка', color: '#A855F7', gradientColor: '#D946EF' }
        ];
        
        // Частицы
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
            // Обновляем позицию призов
            this.prizeOffset += this.spinSpeed * deltaTime;
            
            // Плавное замедление
            this.spinSpeed *= 0.995;
            
            // Когда скорость мала, ПРИНУДИТЕЛЬНО ставим коробку в центр
            if (this.spinSpeed < 20) {
                this.isSpinning = false;
                this.spinSpeed = 0;
                
                // КОРОБКА ДОЛЖНА БЫТЬ В ЦЕНТРЕ!
                // Призы: [0:'$100K', 1:'Rolex', 2:'Квартира', 3:'Коробка']
                // Коробка имеет индекс 3
                
                // При отрисовке призов:
                // prizeIndex = Math.floor((adjustedX + this.prizeOffset) / this.prizeWidth) % 4
                // Для того чтобы в центре была коробка (индекс 3):
                // Нужно чтобы (centerX + this.prizeOffset) / this.prizeWidth % 4 = 3
                // Где centerX = this.canvas.width / 2 = 195
                
                const centerX = this.canvas.width / 2; // 195
                const targetPrizeIndex = 3; // Коробка
                
                // Рассчитываем нужный offset
                // (centerX + offset) / prizeWidth % 4 = 3
                // (195 + offset) / 120 % 4 = 3
                // offset = 3 * 120 - 195 = 360 - 195 = 165
                
                const totalCycle = this.prizeWidth * this.prizes.length; // 480
                const requiredOffset = (targetPrizeIndex * this.prizeWidth - centerX) % totalCycle;
                
                // Находим сколько полных циклов прошло
                const completedCycles = Math.floor(this.prizeOffset / totalCycle);
                this.prizeOffset = completedCycles * totalCycle + requiredOffset;
                
                console.log('📦 КОРОБКА ПРИНУДИТЕЛЬНО УСТАНОВЛЕНА В ЦЕНТР:');
                console.log('   - Новый offset:', this.prizeOffset);
                console.log('   - Нужный offset для коробки:', requiredOffset);
                console.log('   - Циклов прошло:', completedCycles);
                
                // Проверяем какой приз теперь в центре
                const testCenterX = this.canvas.width / 2;
                const testPrizeIndex = Math.floor((testCenterX + this.prizeOffset) / this.prizeWidth) % this.prizes.length;
                console.log('   - Проверка: индекс центрального приза:', testPrizeIndex);
                console.log('   - Проверка: название приза:', this.prizes[testPrizeIndex].title);
                
                // Объявляем победу
                setTimeout(() => {
                    this.onSpinComplete();
                }, 500);
            }
        }
        
        // Нормализуем offset для циклического отображения
        const totalWidth = this.prizeWidth * this.prizes.length;
        while (this.prizeOffset >= totalWidth) {
            this.prizeOffset -= totalWidth;
        }
        while (this.prizeOffset < 0) {
            this.prizeOffset += totalWidth;
        }
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 50 * deltaTime;
            p.size *= 0.98;
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawPrizes();
        this.drawParticles();
        this.drawCenterButton();
    }
    
    /**
     * Рисуем призы в линейной прокрутке
     */
    drawPrizes() {
        const startX = -this.prizeWidth * 2;
        const endX = this.canvas.width + this.prizeWidth * 2;
        
        // Рисуем призы циклически
        for (let x = startX; x < endX; x += this.prizeWidth) {
            const adjustedX = x - this.prizeOffset;
            const prizeX = adjustedX + this.prizeWidth / 2;
            
            if (prizeX < -this.prizeWidth || prizeX > this.canvas.width + this.prizeWidth) {
                continue;
            }
            
            // Определяем какой приз рисовать
            const cyclePosition = Math.floor((adjustedX + this.prizeOffset) / this.prizeWidth);
            const prizeIndex = ((cyclePosition % this.prizes.length) + this.prizes.length) % this.prizes.length;
            const prize = this.prizes[prizeIndex];
            
            // Определяем центральный приз
            const centerX = this.canvas.width / 2;
            const distanceFromCenter = Math.abs(prizeX - centerX);
            const isCentral = distanceFromCenter < this.prizeWidth / 3;
            
            this.drawPrize(prize, prizeX, this.centerY, isCentral);
        }
    }
    
    drawPrize(prize, x, y, isCentral) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        let size, opacity, fontSize, textSize;
        
        if (isCentral) {
            size = 120;
            opacity = 1.0;
            fontSize = 60;
            textSize = 24;
            
            // Пульсация только если не крутится
            if (!this.isSpinning) {
                const pulse = Math.sin(Date.now() / 200) * 0.05 + 1;
                this.ctx.scale(pulse, pulse);
            }
        } else {
            size = 80;
            opacity = 0.6;
            fontSize = 40;
            textSize = 16;
        }
        
        // Рамка
        const frameGradient = this.ctx.createRadialGradient(0, 0, size/2 - 10, 0, 0, size/2 + 10);
        
        if (isCentral) {
            frameGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.8)');
            frameGradient.addColorStop(0.9, 'rgba(255, 165, 0, 0.9)');
            frameGradient.addColorStop(1.0, 'rgba(218, 165, 32, 1.0)');
            
            this.ctx.shadowColor = prize.color;
            this.ctx.shadowBlur = 20;
        } else {
            frameGradient.addColorStop(0.7, 'rgba(192, 192, 192, 0.6)');
            frameGradient.addColorStop(0.9, 'rgba(169, 169, 169, 0.7)');
            frameGradient.addColorStop(1.0, 'rgba(128, 128, 128, 0.8)');
        }
        
        this.ctx.globalAlpha = opacity;
        
        // Фон приза
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size/2);
        gradient.addColorStop(0, prize.gradientColor);
        gradient.addColorStop(1, prize.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = frameGradient;
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Эмодзи
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(prize.emoji, 0, 0);
        
        // Название
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
        
        this.particles.forEach(p => {
            const opacity = p.life > 0.8 ? 1 : p.life / 0.8;
            
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = opacity;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    drawCenterButton() {
        this.ctx.save();
        
        const buttonWidth = 300;
        const buttonHeight = 80;
        const buttonY = this.canvas.height - 110;
        const cornerRadius = 24;
        
        const pulse = Math.sin(Date.now() / 300) * 0.03 + 1;
        this.ctx.translate(this.centerX, buttonY);
        this.ctx.scale(pulse, pulse);
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 8;
        
        const gradient = this.ctx.createLinearGradient(0, -buttonHeight/2, 0, buttonHeight/2);
        gradient.addColorStop(0, 'rgba(165, 85, 247, 0.8)');
        gradient.addColorStop(0.5, 'rgba(190, 75, 240, 0.85)');
        gradient.addColorStop(1, 'rgba(212, 70, 239, 0.95)');
        
        this.ctx.beginPath();
        this.ctx.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, cornerRadius);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        
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
    
    // Запуск прокрутки
    spinWheel() {
        if (this.isSpinning) return;
        
        console.log('🎲 ЗАПУСК ПРОКРУТКИ');
        
        // Играем стартовый звук
        this.playStartSound();
        
        // Начальные эффекты
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            this.createParticles(x, y, 1);
        }
        
        // Запускаем вращение
        this.isSpinning = true;
        this.spinSpeed = 400; // Постоянная начальная скорость
        
        console.log('🎯 Вращение началось со скоростью:', this.spinSpeed);
    }
    
    onSpinComplete() {
        const boxPrizeIndex = 3;
        const winnerPrize = this.prizes[boxPrizeIndex];
        
        console.log(`📦 ПОБЕДА: ${winnerPrize.title}!`, winnerPrize);
        
        this.playVictorySound();
        
        // Эффекты победы
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 150;
                const x = this.centerX + Math.cos(angle) * distance;
                const y = this.centerY + Math.sin(angle) * distance;
                this.createParticles(x, y, 2);
            }, i * 20);
        }
        
        setTimeout(() => {
            this.win();
        }, 3000);
    }
    
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
    
    win() {
        console.log('🏆 Финальный этап: победа');
        this.isRunning = false;
        this.gameManager.endGame(true, 100);
    }
    
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
    
    playStartSound() {
        try {
            const audioContext = this.getAudioContext();
            if (!audioContext) return;
            
            const notes = [261.63, 329.63, 392.00]; // C4, E4, G4
            
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    
                    gain.gain.setValueAtTime(0, audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.3);
                }, i * 100);
            });
        } catch (e) {
            console.error('🔇 Ошибка при воспроизведении стартового звука:', e);
        }
    }
    
    playVictorySound() {
        try {
            const audioContext = this.getAudioContext();
            if (!audioContext) return;
            
            const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            
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
                }, i * 150);
            });
        } catch (e) {
            console.error('🔇 Ошибка при воспроизведении звука победы:', e);
        }
    }
}
