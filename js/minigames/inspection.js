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

        // Фон
        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#4328ff');
        gradient.addColorStop(0.5, '#6c2dff');
        gradient.addColorStop(1, '#a52fff');
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
        ctx.fillStyle = '#2b1ea8';
        ctx.shadowColor = 'rgba(255,255,255,0.25)';
        ctx.shadowBlur = 16;
        ctx.fillRect(this.shelfX, this.shelfTopY - 40, 28, this.canvas.height - (this.shelfTopY - 40) - 70);

        ctx.shadowBlur = 0;
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        const shelfCount = 3;
        const spacing = 115;
        for (let i = 0; i < shelfCount; i++) {
            const y = this.shelfTopY + i * spacing;
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

        // Тело
        const bodyGradient = ctx.createLinearGradient(-40, -120, 40, 20);
        bodyGradient.addColorStop(0, '#09f');
        bodyGradient.addColorStop(1, '#7b4dff');
        ctx.fillStyle = bodyGradient;
        ctx.fillRoundRect?.(-38, -95, 76, 95, 20) ?? ctx.fillRect(-38, -95, 76, 95);

        // Тележка
        ctx.fillStyle = '#0d1335';
        ctx.fillRoundRect?.(-50, -28, 100, 24, 10) ?? ctx.fillRect(-50, -28, 100, 24);
        ctx.fillRoundRect?.(-48, -6, 96, 16, 8) ?? ctx.fillRect(-48, -6, 96, 16);

        ctx.fillStyle = '#ffad66';
        ctx.beginPath();
        ctx.arc(-24, 12, 10, 0, Math.PI * 2);
        ctx.arc(24, 12, 10, 0, Math.PI * 2);
        ctx.fill();

        // Голова
        ctx.fillStyle = '#ffdcb0';
        ctx.beginPath();
        ctx.arc(0, -116, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0d1335';
        ctx.beginPath();
        ctx.arc(-10, -122, 4, 0, Math.PI * 2);
        ctx.arc(10, -122, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0d1335';
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
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '700 30px "Montserrat", Arial';
        ctx.fillText('ПРИЁМКА: ЛОВИ ПАДАЮЩИЙ ТОВАР', this.canvas.width / 2, 78);

        ctx.font = '600 20px "Montserrat", Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('Жми в момент падения — иначе коробка разобьётся!', this.canvas.width / 2, 108);

        ctx.font = '700 24px "Montserrat", Arial';
        if (this.state === 'waiting') {
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.fillText('⌛ Ждём складское «землетрясение»...', this.canvas.width / 2, 150);
        } else if (this.state === 'warning') {
            ctx.fillStyle = '#ffec9f';
            ctx.fillText('⚠️ ГОТОВЬСЯ! СЕЙЧАС РУХНЕТ', this.canvas.width / 2, 150);
        } else if (this.state === 'falling') {
            ctx.fillStyle = '#fffb7d';
            ctx.fillText('⚠️ ЛОВИ СЕЙЧАС!', this.canvas.width / 2, 150);
        } else if (this.state === 'caught') {
            ctx.fillStyle = '#00ffc6';
            ctx.fillText('✅ Поймано!', this.canvas.width / 2, 150);
        } else if (this.state === 'missed') {
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText('💥 Товар разбился', this.canvas.width / 2, 150);
        }
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
