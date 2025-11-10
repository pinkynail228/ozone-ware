/**
 * INSPECTION GAME - Поимка падающего товара
 * Реакция: подставь тележку до того, как коробка рухнет со стеллажа.
 */

class InspectionGame {
    constructor(canvas, ctx, gameManager) {
        console.log('✅ InspectionGame: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;

        // Тайминги и параметры
        this.gameDuration = 6;
        this.minDropDelay = 1.15;
        this.maxDropDelay = 3.6;
        this.fallDuration = 0.75;
        this.reactionWindow = 420; // ms

        // Состояния
        this.state = 'idle'; // idle → waiting → warning → falling → caught/missed
        this.startTime = null;
        this.dropPlannedAt = null;
        this.warningStartedAt = null;
        this.fallStartedAt = null;
        this.catchDeadline = null;
        this.animationFrame = null;
        this.isRunning = false;

        // Геометрия сцены
        this.groundY = this.canvas.height - 100;
        this.shelfX = this.canvas.width - 120;
        this.shelfTopY = this.canvas.height * 0.28;
        this.workerBaseX = 120;
        this.workerBaseY = this.canvas.height - 140;

        this.box = {
            width: 74,
            height: 64,
            startX: this.shelfX - 38,
            startY: this.shelfTopY,
            currentX: this.shelfX - 38,
            currentY: this.shelfTopY,
            targetY: this.groundY,
            wobblePhase: 0,
            glow: 0
        };

        this.worker = {
            x: this.workerBaseX,
            y: this.workerBaseY,
            reachOffset: 0,
            catchBounce: 0,
            faceMood: 'neutral'
        };

        this.fx = {
            shake: 0,
            sparks: []
        };

        this.resultScore = 120;

        this.setupInput();

        console.log('✅ InspectionGame: Готов');
    }

    setupInput() {
        this.handlePointerDown = (event) => {
            if (!this.isRunning) return;
            if (event.cancelable) event.preventDefault();
            this.onPlayerInput();
        };

        this.canvas.addEventListener('mousedown', this.handlePointerDown);
        this.canvas.addEventListener('touchstart', this.handlePointerDown, { passive: false });
    }

    removeInput() {
        this.canvas.removeEventListener('mousedown', this.handlePointerDown);
        this.canvas.removeEventListener('touchstart', this.handlePointerDown);
    }

    onPlayerInput() {
        if (this.state !== 'falling') return;

        const now = performance.now();
        if (this.catchDeadline && now <= this.catchDeadline) {
            this.catchBox(now);
        } else if (this.catchDeadline) {
            this.fail(false);
        }
    }

    start() {
        console.log('▶️ InspectionGame: старт игры');

        this.isRunning = true;
        this.state = 'waiting';
        this.startTime = performance.now();
        this.dropPlannedAt = this.startTime + this.randomBetween(this.minDropDelay, this.maxDropDelay) * 1000;
        this.warningStartedAt = null;
        this.fallStartedAt = null;
        this.catchDeadline = null;
        this.box.currentX = this.box.startX;
        this.box.currentY = this.box.startY;
        this.box.wobblePhase = 0;
        this.box.glow = 0;
        this.worker.reachOffset = 0;
        this.worker.catchBounce = 0;
        this.worker.faceMood = 'neutral';
        this.fx.shake = 0;
        this.fx.sparks = [];

        this.updateTimer();
        this.loop();
    }

    stop() {
        console.log('⏹️ InspectionGame: стоп');
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.removeInput();
    }

    loop() {
        if (!this.isRunning) return;

        const now = performance.now();

        if (this.state === 'waiting' && now >= this.dropPlannedAt - 280) {
            this.beginWarning(now);
        }

        if (this.state === 'warning' && now >= this.dropPlannedAt) {
            this.startFall(now);
        }

        if (this.state === 'falling') {
            this.updateFallingBox(now);
        }

        if (this.worker.catchBounce > 0) {
            this.worker.catchBounce *= 0.86;
        }

        this.box.wobblePhase += 0.06;
        if (this.state === 'warning') {
            this.box.glow = Math.min(1, this.box.glow + 0.12);
        } else {
            this.box.glow = Math.max(0, this.box.glow - 0.08);
        }

        this.fx.shake *= 0.85;

        this.updateTimer();
        this.render();

        if (this.state === 'waiting' || this.state === 'warning' || this.state === 'falling') {
            const elapsed = (now - this.startTime) / 1000;
            if (elapsed >= this.gameDuration) {
                console.log('⏰ InspectionGame: время истекло');
                this.fail(false);
                return;
            }
        }

        this.animationFrame = requestAnimationFrame(() => this.loop());
    }

    beginWarning(now) {
        if (this.state !== 'waiting') return;
        this.state = 'warning';
        this.warningStartedAt = now;
        this.fx.shake = 4;
        this.playSound('warning');
        console.log('⚠️ InspectionGame: предупреждение о падении');
    }

    startFall(now) {
        this.state = 'falling';
        this.fallStartedAt = now;
        this.catchDeadline = now + this.reactionWindow;
        this.playSound('fall');
        this.fx.shake = 6;
        console.log('📦 Коробка падает!');
    }

    updateFallingBox(now) {
        if (!this.fallStartedAt) return;

        const elapsed = (now - this.fallStartedAt) / 1000;
        const progress = Math.min(1, elapsed / this.fallDuration);
        const eased = progress * progress;

        this.box.currentY = this.box.startY + (this.box.targetY - this.box.startY) * eased;

        if (progress >= 1) {
            this.fail(true);
        }
    }

    catchBox(now) {
        if (this.state !== 'falling') return;

        console.log('🙌 Коробка поймана!');
        this.state = 'caught';
        this.isRunning = false;
        this.worker.reachOffset = 52;
        this.worker.catchBounce = 12;
        this.worker.faceMood = 'happy';
        this.box.currentY = this.workerBaseY - 30;
        this.fx.shake = 10;
        this.spawnSparks('#00ffc6');
        this.playSound('catch');

        setTimeout(() => {
            this.animateReturn();
            this.win();
        }, 240);
    }

    fail(reachedGround) {
        if (this.state === 'caught' || this.state === 'missed') return;

        this.state = 'missed';
        this.isRunning = false;

        if (reachedGround) {
            this.box.currentY = this.box.targetY;
        }

        this.worker.faceMood = 'sad';
        this.fx.shake = 12;
        this.spawnSparks('#ff6b6b');
        this.playSound('fail');

        setTimeout(() => this.lose(), 320);
    }

    win() {
        console.log('🏆 InspectionGame: успех!');
        this.stop();
        this.gameManager.endGame(true, this.resultScore);
    }

    lose() {
        console.log('💥 InspectionGame: товар разбился');
        this.stop();
        this.gameManager.endGame(false, 0);
    }

    updateTimer() {
        if (!this.startTime) return;

        const elapsed = (performance.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameDuration - elapsed);

        const timerText = document.getElementById('timer-text');
        const timerFill = document.getElementById('timer-fill');
        if (timerText) timerText.textContent = Math.ceil(remaining);
        if (timerFill) timerFill.style.width = `${(remaining / this.gameDuration) * 100}%`;
    }

    render() {
        const ctx = this.ctx;
        ctx.save();

        // Фон Ozon
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#6B2FFF');
        gradient.addColorStop(1, '#4B1FDD');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawShelf(ctx);
        this.drawWorker(ctx);
        this.drawBox(ctx);
        this.drawText(ctx);
        this.drawEffects(ctx);

        ctx.restore();
    }

    drawShelf(ctx) {
        ctx.save();
        
        // Стойка стеллажа с градиентом
        const poleGrad = ctx.createLinearGradient(this.shelfX, 0, this.shelfX + 28, 0);
        poleGrad.addColorStop(0, '#3A2A8F');
        poleGrad.addColorStop(0.5, '#4B3AA0');
        poleGrad.addColorStop(1, '#3A2A8F');
        ctx.fillStyle = poleGrad;
        ctx.fillRect(this.shelfX, this.shelfTopY - 40, 28, this.canvas.height - (this.shelfTopY - 40) - 70);

        // Полки с объёмом
        ctx.lineWidth = 8;
        const shelfCount = 3;
        const spacing = 115;
        for (let i = 0; i < shelfCount; i++) {
            const y = this.shelfTopY + i * spacing;
            
            // Тень полки
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.moveTo(this.shelfX - 120, y + 2);
            ctx.lineTo(this.shelfX + 24, y + 2);
            ctx.stroke();
            
            // Полка
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath();
            ctx.moveTo(this.shelfX - 120, y);
            ctx.lineTo(this.shelfX + 24, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawWorker(ctx) {
        ctx.save();
        ctx.translate(this.worker.x + this.worker.reachOffset + Math.sin(this.worker.catchBounce) * 4, this.worker.y);

        // Тележка с градиентом
        const cartGrad = ctx.createLinearGradient(-50, -28, -50, 10);
        cartGrad.addColorStop(0, '#2A2A3E');
        cartGrad.addColorStop(1, '#1A1A2E');
        ctx.fillStyle = cartGrad;
        this.roundRect(ctx, -50, -28, 100, 38, 10);
        ctx.fill();
        
        // Блик на тележке
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        this.roundRect(ctx, -48, -26, 96, 15, 8);
        ctx.fill();

        // Колёса с градиентом
        const wheelGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
        wheelGrad.addColorStop(0, '#555');
        wheelGrad.addColorStop(1, '#333');
        ctx.fillStyle = wheelGrad;
        ctx.beginPath();
        ctx.arc(-24, 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(24, 12, 10, 0, Math.PI * 2);
        ctx.fill();

        // Тело рабочего
        const bodyGradient = ctx.createLinearGradient(-40, -120, 40, 20);
        bodyGradient.addColorStop(0, '#1E90FF');
        bodyGradient.addColorStop(1, '#0066CC');
        ctx.fillStyle = bodyGradient;
        this.roundRect(ctx, -38, -95, 76, 95, 20);
        ctx.fill();

        // Голова
        ctx.fillStyle = '#FFDCB0';
        ctx.beginPath();
        ctx.arc(0, -116, 26, 0, Math.PI * 2);
        ctx.fill();

        // Глаза
        ctx.fillStyle = '#2A2A3E';
        ctx.beginPath();
        ctx.arc(-10, -122, 4, 0, Math.PI * 2);
        ctx.arc(10, -122, 4, 0, Math.PI * 2);
        ctx.fill();

        // Рот
        ctx.strokeStyle = '#2A2A3E';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (this.worker.faceMood === 'happy') {
            ctx.arc(0, -110, 10, 0, Math.PI);
        } else if (this.worker.faceMood === 'sad') {
            ctx.arc(0, -102, 10, Math.PI, Math.PI * 2);
        } else {
            ctx.moveTo(-8, -108);
            ctx.lineTo(8, -108);
        }
        ctx.stroke();

        ctx.restore();
    }
    
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    drawBox(ctx) {
        ctx.save();

        const { currentX, currentY, width, height } = this.box;

        ctx.translate(currentX, currentY + Math.sin(this.box.wobblePhase) * 2);
        const boxGradient = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
        boxGradient.addColorStop(0, '#ffa94d');
        boxGradient.addColorStop(1, '#ffce73');
        ctx.fillStyle = boxGradient;
        ctx.fillRoundRect?.(-width / 2, -height / 2, width, height, 14) ?? ctx.fillRect(-width / 2, -height / 2, width, height);

        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 4;
        ctx.strokeRect(-width / 2, -height / 2, width, height);

        ctx.strokeStyle = '#f27a0a';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-width / 4, -height / 2);
        ctx.lineTo(-width / 4, height / 2);
        ctx.moveTo(width / 4, -height / 2);
        ctx.lineTo(width / 4, height / 2);
        ctx.stroke();

        if (this.box.glow > 0) {
            ctx.fillStyle = `rgba(255,255,255,${0.35 * this.box.glow})`;
            ctx.fillRect(-width / 2, -height / 2, width, height);
        }

        ctx.restore();
    }

    drawText(ctx) {
        // Минимальный текст только для статуса
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px "Exo 2", sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 6;
        
        if (this.state === 'warning') {
            ctx.fillStyle = '#FFD700';
            ctx.fillText('⚠️ ГОТОВЬСЯ!', this.canvas.width / 2, 140);
        } else if (this.state === 'falling') {
            ctx.fillStyle = '#FF6B6B';
            ctx.fillText('⚡ ТАПНИ!', this.canvas.width / 2, 140);
        }
        
        ctx.shadowBlur = 0;
    }

    drawEffects(ctx) {
        if (this.fx.shake > 0) {
            ctx.save();
            const intensity = this.fx.shake;
            ctx.fillStyle = `rgba(255,255,255,${0.05 * intensity})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();
        }

        this.fx.sparks.forEach((spark) => {
            ctx.save();
            ctx.globalAlpha = spark.alpha;
            ctx.fillStyle = spark.color;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            spark.x += spark.vx;
            spark.y += spark.vy;
            spark.vy += 0.3;
            spark.alpha -= 0.04;
        });

        this.fx.sparks = this.fx.sparks.filter((spark) => spark.alpha > 0);
    }

    animateReturn() {
        const duration = 360;
        const startY = this.box.currentY;
        const startX = this.box.currentX;
        const endY = this.box.startY;
        const endX = this.box.startX;
        const startTime = performance.now();

        const step = () => {
            const now = performance.now();
            const progress = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            this.box.currentY = startY + (endY - startY) * eased;
            this.box.currentX = startX + (endX - startX) * eased;
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    spawnSparks(color) {
        for (let i = 0; i < 12; i++) {
            this.fx.sparks.push({
                x: this.box.currentX,
                y: this.box.currentY,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 5,
                alpha: 1,
                size: 3 + Math.random() * 3,
                color
            });
        }
    }

    playSound(type) {
        if (!this.gameManager?.sound) return;
        const sound = this.gameManager.sound;
        switch (type) {
            case 'warning':
                sound.playEffect?.('countdown');
                break;
            case 'fall':
                sound.playEffect?.('transition');
                break;
            case 'catch':
                sound.playEffect?.('success');
                break;
            case 'fail':
                sound.playEffect?.('lifeLost');
                break;
            default:
                break;
        }
    }

    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
}

console.log('✅ inspection.js загружен');
