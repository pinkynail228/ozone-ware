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
        this.prizeOffset = 0;
        this.spinSpeed = 0; // px/sec по ленте
        this.phase = 'idle'; // idle | spinFast | easeOut
        this.phaseStart = 0;
        this.spinFastDuration = 2600; // мс (динамичная быстрая фаза)
        this.easeOutDuration = 1200; // мс (плавное замедление)
        this.targetOffset = 0;
        
        // Аудиоконтекст
        this._audioContext = null;
        
        // Призы в циклическом порядке — псевдореальные бонусы сотрудника склада
        this.prizes = [
            { emoji: '💸', title: 'x2 за смену', color: '#22C55E', gradientColor: '#4ADE80' },        // 0
            { emoji: '💸', title: 'x3 за смену', color: '#16A34A', gradientColor: '#34D399' },        // 1
            { emoji: '💰', title: 'Премия 5000₽', color: '#059669', gradientColor: '#10B981' },      // 2
            { emoji: '🗓️', title: 'Бесплатные выходные', color: '#2563EB', gradientColor: '#60A5FA' }, // 3
            { emoji: '🍔', title: 'Обед за счет компании', color: '#F59E0B', gradientColor: '#FBBF24' }, // 4
            { emoji: '🧢', title: 'Мерч Ozon', color: '#8B5CF6', gradientColor: '#A78BFA' },         // 5
            { emoji: '⭐', title: 'Приоритет графика', color: '#A855F7', gradientColor: '#D946EF' },  // 6
            { emoji: '🌙', title: 'Смена без ночи', color: '#0EA5E9', gradientColor: '#38BDF8' },    // 7
            { emoji: '🎟️', title: 'Бонусные часы', color: '#EC4899', gradientColor: '#F472B6' },    // 8
            { emoji: '🎁', title: 'Сюрприз от HR', color: '#10B981', gradientColor: '#34D399' },     // 9
            { emoji: '📘', title: 'ИНСТРУКЦИЯ', color: '#334155', gradientColor: '#64748B' }         // 10 — ПОБЕДИТЕЛЬ
        ];
        this.targetPrizeIndex = 10; // всегда выигрывает "ИНСТРУКЦИЯ"
        this.cycleWidth = this.prizeWidth * this.prizes.length;
        
        // Частицы
        this.particles = [];
        
        // Джекпот-вспышка
        this.jackpot = { active: false, start: 0, duration: 800 };
        
        console.log('✅ Финальный этап: готов к запуску');
    }

    // ===== UI helpers: спрятать/вернуть таймер =====
    hideTimerUI() {
        const timer = document.getElementById('timer');
        const timerText = document.getElementById('timer-text');
        const timerFill = document.getElementById('timer-fill');
        if (timer) {
            this._prevTimerDisplay = timer.style.display;
            timer.style.display = 'none';
        }
        if (timerText) timerText.textContent = '';
        if (timerFill) timerFill.style.width = '0%';
    }
    restoreTimerUI() {
        const timer = document.getElementById('timer');
        if (timer) timer.style.display = this._prevTimerDisplay || '';
    }

    // ===== Modal: инструкция с поддержкой =====
    showInstructionModal() {
        // Создаем контейнер если его нет
        let modal = document.getElementById('instruction-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'instruction-modal';
            Object.assign(modal.style, {
                position: 'fixed', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', zIndex: '9999'
            });
            const card = document.createElement('div');
            Object.assign(card.style, {
                width: '84%', maxWidth: '360px', borderRadius: '16px', padding: '20px 18px',
                background: 'linear-gradient(145deg,#111827,#1f2937)', color: '#fff',
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)', textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.08)'
            });
            const title = document.createElement('div');
            title.textContent = 'ИНСТРУКЦИЯ';
            Object.assign(title.style, { fontWeight: '800', fontSize: '20px', letterSpacing: '1px', marginBottom: '10px' });
            const phrase = document.createElement('div');
            phrase.id = 'support-phrase';
            Object.assign(phrase.style, { fontSize: '16px', lineHeight: '1.4', opacity: '0.95', marginBottom: '16px' });
            const btn = document.createElement('button');
            btn.textContent = 'Прочитать';
            Object.assign(btn.style, {
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff',
                border: 'none', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(99,102,241,0.35)'
            });
            btn.addEventListener('click', () => {
                modal.remove();
                // Завершить игру после прочтения
                this.win();
            });
            card.appendChild(title);
            card.appendChild(phrase);
            card.appendChild(btn);
            modal.appendChild(card);
            document.body.appendChild(modal);
        }
        // Выставляем случайную фразу поддержки
        const phrases = [
            'Отличная смена! Ты держишь ритм склада 💪',
            'Спасибо за порядок и скорость — на тебе всё держится 👏',
            'Твоя внимательность — золото логистики ✨',
            'Смена пролетела, а ты — красавчик(а). Продолжаем в том же духе! 🚀',
            'Надёжность — твоё второе имя. Команда это ценит ❤️',
            'Ты делаешь склад лучше каждый день. Респект! 🙌',
            'Чётко, быстро, по делу — вот это наш стиль ✅',
            'Стабильно на 200%. Так держать! 🔥'
        ];
        const phraseEl = document.getElementById('support-phrase');
        if (phraseEl) phraseEl.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    }

    start() {
        console.log('▶️ Финальный этап: СТАРТ ИГРЫ');
        this.isRunning = true;
        this.lastFrameTime = null;
        this.hideTimerUI();
        this.setupControls();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    stop() {
        console.log('⏹️ Финальный этап: стоп');
        this.isRunning = false;
        this.restoreTimerUI();
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
        // Нормализуем смещение в пределах цикла
        const norm = () => {
            while (this.prizeOffset >= this.cycleWidth) this.prizeOffset -= this.cycleWidth;
            while (this.prizeOffset < 0) this.prizeOffset += this.cycleWidth;
        };

        if (this.phase === 'spinFast') {
            this.prizeOffset += this.spinSpeed * deltaTime;
            norm();

            const elapsed = performance.now() - this.phaseStart;
            if (elapsed >= this.spinFastDuration) {
                // Переход к easeOut: рассчитываем целевой offset для коробки, который находится ВПЕРЕДИ текущего
                const current = this.prizeOffset;
                const required = this.computeRequiredOffsetForIndex(this.targetPrizeIndex);
                // подбираем ближайшую цель впереди (минимум +1 полный цикл, чтобы был вау-эффект)
                let target = required;
                // гарантируем как минимум ОДИН ПОЛНЫЙ ЦИКЛ впереди, чтобы не было ощущения телепорта
                while (target <= current + this.cycleWidth) target += this.cycleWidth;
                // Добавим еще 0..1 циклов чтобы не казалось телепортом
                this.targetOffset = target;
                this.startOffset = current;
                this.phase = 'easeOut';
                this.phaseStart = performance.now();
            }
        } else if (this.phase === 'easeOut') {
            const t = Math.min(1, (performance.now() - this.phaseStart) / this.easeOutDuration);
            const eased = this.easeOutCubic(t);
            const path = this.targetOffset - this.startOffset;
            this.prizeOffset = this.startOffset + path * eased;
            norm();
            if (t >= 1) {
                // Зафиксировать идеально на цели
                this.prizeOffset = this.targetOffset % this.cycleWidth;
                norm();
                this.phase = 'idle';
                this.onSpinComplete();
            }
        }
        // idle: ничего не делаем
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
        
        // Казино-визуал
        this.drawBackgroundVignette();
        this.drawMarqueeLights();

        this.drawPrizes();
        this.drawParticles();
        this.drawCenterButton();
        this.drawShineSweep();
        this.drawJackpotFlash();
    }
    
    // Рисуем 5 призов: 2 слева, 1 центр, 2 справа (без лишних логов)
    drawPrizes() {
        const cx = this.canvas.width / 2;
        for (let i = -2; i <= 2; i++) {
            const prizeX = cx + i * this.prizeWidth;
            const position = Math.floor((prizeX + this.prizeOffset) / this.prizeWidth);
            let prizeIndex = position % this.prizes.length;
            if (prizeIndex < 0) prizeIndex += this.prizes.length;
            const prize = this.prizes[prizeIndex];
            this.drawPrize(prize, prizeX, this.centerY, i === 0);
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

            // Трейл при быстром вращении для эффекта движения
            if (this.phase === 'spinFast') {
                this.ctx.save();
                this.ctx.globalAlpha = 0.15;
                this.ctx.translate(-12, 0);
                this.ctx.scale(0.98, 0.98);
                const gradTrail = this.ctx.createLinearGradient(-size, 0, size, 0);
                gradTrail.addColorStop(0, 'rgba(255,255,255,0.0)');
                gradTrail.addColorStop(1, 'rgba(255,255,255,0.2)');
                this.ctx.fillStyle = gradTrail;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
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

    // Виньетка для концентрации внимания на центре
    drawBackgroundVignette() {
        const g = this.ctx.createRadialGradient(
            this.centerX, this.centerY, Math.min(this.canvas.width, this.canvas.height) * 0.25,
            this.centerX, this.centerY, Math.max(this.canvas.width, this.canvas.height) * 0.7
        );
        g.addColorStop(0, 'rgba(0,0,0,0.0)');
        g.addColorStop(1, 'rgba(0,0,0,0.35)');
        this.ctx.fillStyle = g;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Огоньки-маркизы сверху и снизу экрана
    drawMarqueeLights() {
        const rows = [32, this.canvas.height - 64];
        const step = 28;
        const phase = (Date.now() % 1000) / 1000; // 0..1
        for (const y of rows) {
            for (let x = 20; x < this.canvas.width - 20; x += step) {
                const idx = Math.floor(x / step);
                const on = ((idx + Math.floor(phase * 8)) % 2) === 0;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 6, 0, Math.PI * 2);
                this.ctx.fillStyle = on ? 'rgba(255,215,0,0.95)' : 'rgba(255,215,0,0.25)';
                this.ctx.shadowColor = on ? 'rgba(255,200,0,0.9)' : 'transparent';
                this.ctx.shadowBlur = on ? 10 : 0;
                this.ctx.fill();
            }
        }
        // сброс тени
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
    }

    // Бликовый сдвиг по полосе призов (активен при вращении)
    drawShineSweep() {
        if (this.phase === 'idle') return;
        const t = (Date.now() % 1500) / 1500; // 0..1
        const sweepX = -this.canvas.width + t * (this.canvas.width * 2);
        this.ctx.save();
        this.ctx.translate(sweepX, 0);
        const w = 160;
        const g = this.ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, 'rgba(255,255,255,0.0)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.08)');
        g.addColorStop(1, 'rgba(255,255,255,0.0)');
        this.ctx.fillStyle = g;
        this.ctx.fillRect(0, this.centerY - 120, w, 240);
        this.ctx.restore();
    }

    // Джекпот-вспышка: белая вспышка + радиальные лучи, затухающие по easing
    triggerJackpotFlash() {
        this.jackpot.active = true;
        this.jackpot.start = performance.now();
    }
    drawJackpotFlash() {
        if (!this.jackpot.active) return;
        const now = performance.now();
        const t = Math.min(1, (now - this.jackpot.start) / this.jackpot.duration);
        const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const alpha = (1 - ease) * 0.75; // пиковая яркость в начале

        // Полноэкранная вспышка
        this.ctx.save();
        this.ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Радиальные лучи вокруг центра
        const rays = 18;
        const maxLen = Math.max(this.canvas.width, this.canvas.height) * 0.7;
        for (let i = 0; i < rays; i++) {
            const a = (i / rays) * Math.PI * 2;
            const len = maxLen * (1 - ease);
            const x2 = this.centerX + Math.cos(a) * len;
            const y2 = this.centerY + Math.sin(a) * len;
            this.ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.6})`;
            this.ctx.lineWidth = 3 * (1 - ease);
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
        this.ctx.restore();

        if (t >= 1) this.jackpot.active = false;
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
    
    // Запуск прокрутки (фазы: быстрый спин -> плавное замедление к коробке)
    spinWheel() {
        if (this.phase !== 'idle') return;
        this.playStartSound();
        for (let i = 0; i < 16; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = 20 + Math.random() * 28;
            this.createParticles(this.centerX + Math.cos(a) * d, this.centerY + Math.sin(a) * d, 1);
        }
        this.spinSpeed = 1200; // px/sec быстро
        this.phase = 'spinFast';
        this.phaseStart = performance.now();
    }

    // Вычисляет требуемый offset, чтобы индекс prizeIndex оказался строго по центру
    computeRequiredOffsetForIndex(prizeIndex) {
        const centerX = this.canvas.width / 2; // пиксели
        // (centerX + offset) / prizeWidth % N == prizeIndex
        // offset == prizeIndex * prizeWidth - centerX (mod cycleWidth)
        let off = prizeIndex * this.prizeWidth - centerX;
        off %= this.cycleWidth;
        if (off < 0) off += this.cycleWidth;
        return off;
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    onSpinComplete() {
        const winnerPrize = this.prizes[this.targetPrizeIndex];
        console.log(`🏁 Победа: ${winnerPrize.title}!`, winnerPrize);
        
        this.playVictorySound();
        this.triggerJackpotFlash();
        
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
        // Показываем модалку с инструкцией и фразой поддержки
        this.showInstructionModal();
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
