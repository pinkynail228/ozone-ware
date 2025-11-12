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

    // ===== UI helpers: спрятать/вернуть все элементы интерфейса =====
    hideGameUI() {
        // Скрываем таймер
        const timerBar = document.querySelector('.timer-bar');
        const timerText = document.getElementById('timer-text');
        const timerFill = document.getElementById('timer-fill');
        
        if (timerBar) {
            this._prevTimerBarDisplay = timerBar.style.display;
            timerBar.style.display = 'none';
        }
        if (timerText) timerText.textContent = '';
        if (timerFill) timerFill.style.width = '0%';
        
        // Скрываем все полоски и другие элементы UI
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            this._prevGameUIDisplay = gameUI.style.display;
            gameUI.style.display = 'none';
        }
        
        // Убираем все полоски и другие элементы, которые могут быть видны
        const allBars = document.querySelectorAll('.timer-bar, .progress-bar, .score-bar');
        allBars.forEach(bar => {
            bar.style.display = 'none';
        });
    }
    
    restoreGameUI() {
        const timerBar = document.querySelector('.timer-bar');
        if (timerBar) timerBar.style.display = this._prevTimerBarDisplay || '';
        
        const gameUI = document.getElementById('game-ui');
        if (gameUI) gameUI.style.display = this._prevGameUIDisplay || '';
        
        // Восстанавливаем все полоски
        const allBars = document.querySelectorAll('.timer-bar, .progress-bar, .score-bar');
        allBars.forEach(bar => {
            bar.style.display = '';
        });
    }

    // ===== Modal: инструкция с поддержкой =====
    showOpenInstructionButton() {
        // Создаем кнопку "Открыть инструкцию"
        let instructionBtn = document.getElementById('open-instruction-btn');
        if (!instructionBtn) {
            instructionBtn = document.createElement('div');
            instructionBtn.id = 'open-instruction-btn';
            Object.assign(instructionBtn.style, {
                position: 'fixed', left: '50%', bottom: '120px', transform: 'translateX(-50%)',
                width: '300px', padding: '16px', borderRadius: '24px',
                background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff',
                boxShadow: '0 8px 20px rgba(99,102,241,0.4)', textAlign: 'center',
                fontWeight: '700', fontSize: '18px', letterSpacing: '0.5px', cursor: 'pointer',
                zIndex: '9998', border: '2px solid rgba(255,255,255,0.2)'
            });
            instructionBtn.textContent = 'ОТКРЫТЬ ИНСТРУКЦИЮ';
            instructionBtn.addEventListener('click', () => {
                instructionBtn.remove();
                this.showInstructionModal();
            });
            document.body.appendChild(instructionBtn);
        }
    }
    
    // Создает красивую иллюстрацию для модального окна
    createModalIllustration() {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        
        // Фон с градиентом
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#6B2FFF');
        bgGradient.addColorStop(1, '#4B1FDD');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Добавляем декоративные элементы
        // Звезды/частицы
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3 + 1;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Рисуем коробку Ozon в центре
        this.drawOzonBox(ctx, canvas.width / 2, canvas.height / 2 - 10, 70);
        
        // Рисуем фигурку сотрудника
        this.drawWorker(ctx, canvas.width / 2, canvas.height / 2 + 50, 30);
        
        // Добавляем декоративные линии
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 20);
        ctx.lineTo(60, 20);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(canvas.width - 20, 20);
        ctx.lineTo(canvas.width - 60, 20);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(20, canvas.height - 20);
        ctx.lineTo(60, canvas.height - 20);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(canvas.width - 20, canvas.height - 20);
        ctx.lineTo(canvas.width - 60, canvas.height - 20);
        ctx.stroke();
        
        return canvas.toDataURL();
    }
    
    // Рисует коробку Ozon
    drawOzonBox(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-size/2 + 5, size/2 - 5, size, 10);
        
        // Основная часть коробки
        const boxGradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        boxGradient.addColorStop(0, '#A855F7');
        boxGradient.addColorStop(1, '#7928CA');
        ctx.fillStyle = boxGradient;
        ctx.fillRect(-size/2, -size/2, size, size);
        
        // Верхняя грань для 3D эффекта
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/2);
        ctx.lineTo(-size/2 + size/5, -size/2 - size/5);
        ctx.lineTo(size/2 + size/5, -size/2 - size/5);
        ctx.lineTo(size/2, -size/2);
        ctx.closePath();
        ctx.fillStyle = '#D946EF';
        ctx.fill();
        
        // Боковая грань для 3D эффекта
        ctx.beginPath();
        ctx.moveTo(size/2, -size/2);
        ctx.lineTo(size/2 + size/5, -size/2 - size/5);
        ctx.lineTo(size/2 + size/5, size/2 - size/5);
        ctx.lineTo(size/2, size/2);
        ctx.closePath();
        ctx.fillStyle = '#9333EA';
        ctx.fill();
        
        // Лента на коробке
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-size/2, 0);
        ctx.lineTo(size/2, 0);
        ctx.moveTo(0, -size/2);
        ctx.lineTo(0, size/2);
        ctx.stroke();
        
        // Лого Ozon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold ' + (size/4) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('OZON', 0, 0);
        
        ctx.restore();
    }
    
    // Рисует стилизованную фигурку сотрудника
    drawWorker(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        // Голова
        ctx.fillStyle = '#FFD3B5';
        ctx.beginPath();
        ctx.arc(0, -size/2, size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Тело
        const bodyGradient = ctx.createLinearGradient(-size/2, -size/4, size/2, size);
        bodyGradient.addColorStop(0, '#3B82F6');
        bodyGradient.addColorStop(1, '#1E40AF');
        ctx.fillStyle = bodyGradient;
        
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/4);
        ctx.lineTo(size/2, -size/4);
        ctx.lineTo(size/3, size/2);
        ctx.lineTo(-size/3, size/2);
        ctx.closePath();
        ctx.fill();
        
        // Руки
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = size/6;
        ctx.lineCap = 'round';
        
        // Левая рука
        ctx.beginPath();
        ctx.moveTo(-size/3, -size/6);
        ctx.lineTo(-size/2, size/4);
        ctx.stroke();
        
        // Правая рука
        ctx.beginPath();
        ctx.moveTo(size/3, -size/6);
        ctx.lineTo(size/2, size/4);
        ctx.stroke();
        
        // Бейдж Ozon
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.rect(-size/6, -size/6, size/3, size/4);
        ctx.fill();
        
        ctx.fillStyle = '#FF4500';
        ctx.font = 'bold ' + (size/8) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('O', 0, -size/10);
        
        ctx.restore();
    }
    
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
            
            // Заголовок
            const title = document.createElement('div');
            title.textContent = 'ИНСТРУКЦИЯ';
            Object.assign(title.style, { 
                fontWeight: '800', 
                fontSize: '24px', 
                letterSpacing: '1px', 
                marginBottom: '16px',
                background: 'linear-gradient(90deg, #A855F7, #6366F1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            });
            
            // Иллюстрация
            const illustration = document.createElement('div');
            const imageUrl = this.createModalIllustration();
            Object.assign(illustration.style, {
                width: '100%',
                height: '180px',
                marginBottom: '16px',
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            });
            
            // Текст поддержки
            const phrase = document.createElement('div');
            phrase.id = 'support-phrase';
            Object.assign(phrase.style, { 
                fontSize: '16px', 
                lineHeight: '1.5', 
                opacity: '0.95', 
                marginBottom: '20px',
                padding: '0 8px'
            });
            
            // Кнопка
            const btn = document.createElement('button');
            btn.textContent = 'ИДТИ НА СМЕНУ';
            Object.assign(btn.style, {
                width: '100%', 
                padding: '14px 16px', 
                borderRadius: '12px',
                background: 'linear-gradient(135deg,#6366F1,#A855F7)', 
                color: '#fff',
                border: 'none', 
                fontWeight: '700', 
                fontSize: '16px',
                letterSpacing: '0.5px', 
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(99,102,241,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s'
            });
            
            // Эффект при наведении
            btn.addEventListener('mouseover', () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = '0 8px 20px rgba(99,102,241,0.4)';
            });
            btn.addEventListener('mouseout', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 6px 16px rgba(99,102,241,0.35)';
            });
            
            btn.addEventListener('click', () => {
                modal.remove();
                // Возвращаемся на начальную заставку игры
                this.gameManager.showStartScreen();
            });
            
            card.appendChild(title);
            card.appendChild(illustration);
            card.appendChild(phrase);
            card.appendChild(btn);
            modal.appendChild(card);
            document.body.appendChild(modal);
        }
        
        // Выставляем случайную фразу поддержки
        const phrases = [
            'Отличная смена! Ты держишь ритм склада, но нужно еще лучше работать. Продолжай совершенствоваться! 💪',
            'Спасибо за порядок и скорость — на тебе всё держится. В следующую смену постарайся еще лучше! 👏',
            'Твоя внимательность — золото логистики. Продолжай совершенствоваться и достигай новых высот! ✨',
            'Смена пролетела, а ты — молодец. На следующей смене покажи больше результатов и эффективности! 🚀',
            'Надёжность — твоё второе имя. Команда это ценит, но всегда есть куда расти и к чему стремиться! ❤️',
            'Ты делаешь склад лучше каждый день. В следующий раз будет еще лучше, если приложишь больше усилий! 🙌',
            'Чётко, быстро, по делу — но на следующей смене нужно работать еще усерднее и внимательнее! ✅',
            'Стабильно на 200%. В следующий раз постарайся выйти на 300% и стать лучшим сотрудником месяца! 🔥'
        ];
        const phraseEl = document.getElementById('support-phrase');
        if (phraseEl) phraseEl.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    }

    start() {
        console.log('▶️ Финальный этап: СТАРТ ИГРЫ');
        this.isRunning = true;
        this.lastFrameTime = null;
        this.hideGameUI(); // Скрываем все элементы UI
        this.setupControls();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    stop() {
        console.log('⏹️ Финальный этап: стоп');
        this.isRunning = false;
        this.restoreGameUI(); // Восстанавливаем все элементы UI
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
        
        // Рисуем красивый градиентный фон для финального экрана
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#6B2FFF');
        bgGradient.addColorStop(1, '#4B1FDD');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Добавляем анимированные частицы для фона
        this.drawBackgroundParticles();
        
        // Казино-визуал
        this.drawBackgroundVignette();
        this.drawMarqueeLights();

        // Рисуем анимированный заголовок "ВЫПЛАТА ЗА СМЕНУ"
        this.drawAnimatedTitle();

        this.drawPrizes();
        this.drawParticles();
        this.drawCenterButton();
        this.drawShineSweep();
        this.drawJackpotFlash();
    }
    
    // Рисуем анимированные частицы на фоне
    drawBackgroundParticles() {
        // Время для анимации
        const time = Date.now() * 0.001;
        
        // Рисуем 20 мерцающих звезд
        for (let i = 0; i < 20; i++) {
            // Используем хеш-функцию для стабильных позиций
            const x = ((i * 397) % this.canvas.width);
            const y = ((i * 631) % this.canvas.height);
            
            // Пульсация с разными частотами
            const pulse = 0.5 + 0.5 * Math.sin(time + i * 0.7);
            
            // Разные размеры для разных звезд
            const size = 1 + 2 * pulse;
            
            // Разные цвета
            const colors = ['rgba(255,255,255,', 'rgba(255,200,255,', 'rgba(200,200,255,'];
            const color = colors[i % colors.length];
            
            this.ctx.fillStyle = `${color}${pulse * 0.7})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // Рисуем анимированный заголовок "ВЫПЛАТА ЗА СМЕНУ"
    drawAnimatedTitle() {
        const title = 'ВЫПЛАТА ЗА СМЕНУ';
        const x = this.canvas.width / 2;
        const y = 80;
        const time = Date.now() * 0.001;
        
        // Создаем градиент для заголовка
        const gradient = this.ctx.createLinearGradient(x - 150, y - 20, x + 150, y + 20);
        gradient.addColorStop(0, '#FF4081');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(1, '#FF4081');
        
        // Добавляем анимацию сдвига градиента
        const gradientShift = (Math.sin(time * 2) + 1) / 2;
        gradient.addColorStop(gradientShift * 0.8, '#FFFFFF');
        
        // Настраиваем шрифт и тени
        this.ctx.font = 'bold 36px "Exo 2", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Рисуем тени для 3D эффекта
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillText(title, x + 3, y + 3);
        
        // Рисуем основной текст с градиентом
        this.ctx.fillStyle = gradient;
        this.ctx.fillText(title, x, y);
        
        // Добавляем блик сверху
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillText(title, x, y - 1);
        
        // Добавляем вибрацию для эффекта глитча
        if (Math.random() > 0.97) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(title, x + (Math.random() * 4 - 2), y + (Math.random() * 4 - 2));
        }
        
        // Добавляем декоративные линии под заголовком
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        
        // Левая линия
        this.ctx.beginPath();
        this.ctx.moveTo(x - 140, y + 25);
        this.ctx.lineTo(x - 60, y + 25);
        this.ctx.stroke();
        
        // Правая линия
        this.ctx.beginPath();
        this.ctx.moveTo(x + 60, y + 25);
        this.ctx.lineTo(x + 140, y + 25);
        this.ctx.stroke();
        
        // Декоративный элемент посередине
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x, y + 25, 4, 0, Math.PI * 2);
        this.ctx.fill();
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
        // Не рисуем кнопку, если уже завершили вращение
        if (this.phase === 'idle' && this.targetOffset > 0) {
            return;
        }
        
        this.ctx.save();
        
        const buttonWidth = 300;
        const buttonHeight = 80;
        const buttonY = this.canvas.height - 110;
        const cornerRadius = 24;
        const time = Date.now() * 0.001; // Для анимации
        
        // Улучшенная пульсация
        const pulse = Math.sin(time * 3) * 0.03 + 1.02;
        this.ctx.translate(this.centerX, buttonY);
        this.ctx.scale(pulse, pulse);
        
        // Усиленная тень
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        this.ctx.shadowBlur = 25;
        this.ctx.shadowOffsetY = 10;
        
        // Красивый градиент с анимацией
        const gradientShift = (Math.sin(time * 2) + 1) / 2; // 0..1
        const gradient = this.ctx.createLinearGradient(-buttonWidth/2, 0, buttonWidth/2, 0);
        gradient.addColorStop(0, '#FF4081');
        gradient.addColorStop(0.5, '#A855F7');
        gradient.addColorStop(1, '#3B82F6');
        // Добавляем движущийся блик
        gradient.addColorStop(gradientShift * 0.8, '#FFD700');
        
        // Основная форма кнопки
        this.ctx.beginPath();
        this.ctx.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, cornerRadius);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Добавляем внутреннюю обводку для эффекта стекла
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Добавляем блик сверху для эффекта стекла
        this.ctx.beginPath();
        this.ctx.moveTo(-buttonWidth/2 + cornerRadius, -buttonHeight/2 + 8);
        this.ctx.lineTo(buttonWidth/2 - cornerRadius, -buttonHeight/2 + 8);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Текст кнопки с эффектом металлика
        // Сначала тень
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetY = 3;
        this.ctx.font = 'bold 30px "Exo 2", sans-serif';
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ПОЛУЧИТЬ ПРИЗ', 0, 2);
        
        // Затем металлический текст
        const textGradient = this.ctx.createLinearGradient(0, -15, 0, 15);
        textGradient.addColorStop(0, '#FFFFFF');
        textGradient.addColorStop(0.5, '#E0E0E0');
        textGradient.addColorStop(1, '#FFFFFF');
        
        this.ctx.fillStyle = textGradient;
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.fillText('ПОЛУЧИТЬ ПРИЗ', 0, 0);
        
        // Добавляем иконку подарка
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('🎁', -buttonWidth/2 + 30, 0);
        
        // Добавляем иконку стрелки
        this.ctx.fillText('→', buttonWidth/2 - 30, 0);
        
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
        // Показываем кнопку "Открыть инструкцию"
        setTimeout(() => {
            this.showOpenInstructionButton();
        }, 1500); // Небольшая задержка для лучшего UX
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
