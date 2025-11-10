/**
 * LOADING DOCK GAME - Затолкай коробку в грузовик
 * Механика: быстро тапай, чтобы довести коробку до конца рампы
 */

class LoadingDockGame {
    constructor(canvas, ctx, gameManager) {
        console.log('📦 LoadingDockGame: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;

        this.gameTime = 4.5;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;

        this.progress = 0; // 0..1
        this.renderedProgress = 0;
        this.pushPerTap = 0.06;
        this.tapCount = 0;
        this.score = 0;

        this.comboGlow = 0;
        this.shakeStrength = 0;

        this.setupControls();

        console.log('✅ LoadingDockGame: Готов');
    }

    setupControls() {
        this.tapHandler = (event) => {
            if (!this.isRunning) return;
            event.preventDefault();

            this.handlePush();
        };

        this.canvas.addEventListener('touchstart', this.tapHandler, { passive: false });
        this.canvas.addEventListener('mousedown', this.tapHandler);
    }

    removeControls() {
        this.canvas.removeEventListener('touchstart', this.tapHandler);
        this.canvas.removeEventListener('mousedown', this.tapHandler);
    }

    start() {
        console.log('▶️ LoadingDockGame: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }

    stop() {
        console.log('⏹️ LoadingDockGame: Стоп');
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        this.removeControls();
    }

    handlePush() {
        if (this.progress >= 1) return;

        this.tapCount++;
        this.progress = Math.min(1, this.progress + this.pushPerTap);
        this.comboGlow = 1;
        this.shakeStrength = 6;
    }

    update() {
        if (!this.isRunning) return;

        const now = Date.now();
        const elapsed = (now - this.startTime) / 1000;

        this.renderedProgress += (this.progress - this.renderedProgress) * 0.2;
        if (Math.abs(this.renderedProgress - this.progress) < 0.001) {
            this.renderedProgress = this.progress;
        }

        this.comboGlow = Math.max(0, this.comboGlow * 0.85);
        this.shakeStrength = Math.max(0, this.shakeStrength * 0.85);

        this.drawScene(elapsed);
        this.updateUI(elapsed);

        if (this.progress >= 1) {
            this.renderedProgress = 1;
            this.finishRun(elapsed, true);
            return;
        }

        if (elapsed >= this.gameTime) {
            this.finishRun(elapsed, this.progress >= 1);
            return;
        }

        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    finishRun(elapsed, success) {
        const progressRatio = success ? 1 : Math.min(1, this.renderedProgress);
        const timeBonus = Math.max(0, this.gameTime - elapsed);
        this.score = Math.round(progressRatio * 120 + timeBonus * 15 + this.tapCount * 2);

        if (success) {
            console.log('🏆 LoadingDockGame: Коробка на погрузке!');
            this.stop();
            this.gameManager.endGame(true, this.score);
        } else {
            console.log('⌛ LoadingDockGame: Не успели дотолкать.');
            this.stop();
            this.gameManager.endGame(false, Math.round(progressRatio * 60));
        }
    }

    drawScene(elapsed) {
        const { width, height } = this.canvas;

        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0c1d2f');
        gradient.addColorStop(1, '#12324f');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        this.drawDock();
        this.drawTruck();
        this.drawBox();
        this.drawHUD(elapsed);
    }

    drawDock() {
        const { width, height } = this.canvas;
        const rampHeight = height * 0.4;
        const floorY = height * 0.72;

        this.ctx.fillStyle = '#203a57';
        this.ctx.fillRect(0, floorY, width, height - floorY);

        this.ctx.fillStyle = '#1b2e45';
        this.ctx.fillRect(width * 0.08, floorY - rampHeight, width * 0.72, rampHeight);

        this.ctx.strokeStyle = '#325b87';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(width * 0.08, floorY - rampHeight, width * 0.72, rampHeight);
    }

    drawTruck() {
        const { width, height } = this.canvas;
        const truckWidth = width * 0.26;
        const truckHeight = height * 0.55;
        const x = width - truckWidth - width * 0.05;
        const y = height * 0.25;

        this.ctx.fillStyle = '#c0392b';
        this.ctx.fillRect(x, y, truckWidth, truckHeight);

        this.ctx.fillStyle = '#922b21';
        this.ctx.fillRect(x + 14, y + 24, truckWidth - 28, truckHeight - 48);

        const wheelRadius = 26;
        this.ctx.fillStyle = '#1c1c1c';
        this.ctx.beginPath();
        this.ctx.arc(x + 45, y + truckHeight, wheelRadius, 0, Math.PI * 2);
        this.ctx.arc(x + truckWidth - 45, y + truckHeight, wheelRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#515a5a';
        this.ctx.beginPath();
        this.ctx.arc(x + 45, y + truckHeight, wheelRadius * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + truckWidth - 45, y + truckHeight, wheelRadius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBox() {
        const { width, height } = this.canvas;
        const rampStartX = width * 0.1;
        const rampEndX = width * 0.75;
        const y = height * 0.58;
        const boxWidth = width * 0.18;
        const boxHeight = height * 0.22;

        const progressX = rampStartX + (rampEndX - rampStartX) * this.renderedProgress;
        const shakeOffset = this.shakeStrength ? (Math.random() - 0.5) * this.shakeStrength : 0;

        const x = Math.min(progressX, rampEndX - boxWidth / 2);

        const gradient = this.ctx.createLinearGradient(0, y - boxHeight, 0, y);
        gradient.addColorStop(0, '#f7c67b');
        gradient.addColorStop(1, '#cf8a2e');

        this.ctx.save();
        this.ctx.translate(shakeOffset, 0);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y - boxHeight, boxWidth, boxHeight);

        this.ctx.strokeStyle = '#a66b1e';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(x, y - boxHeight, boxWidth, boxHeight);

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - boxHeight * 0.35);
        this.ctx.lineTo(x + boxWidth, y - boxHeight * 0.35);
        this.ctx.moveTo(x + boxWidth * 0.45, y - boxHeight);
        this.ctx.lineTo(x + boxWidth * 0.45, y);
        this.ctx.stroke();

        if (this.comboGlow > 0.05) {
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.comboGlow * 0.6})`;
            this.ctx.lineWidth = 8;
            this.ctx.strokeRect(x - 4, y - boxHeight - 4, boxWidth + 8, boxHeight + 8);
        }

        this.ctx.restore();
    }

    drawHUD(elapsed) {
        const { width } = this.canvas;

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 30px "Courier New"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ЗАТОЛКАЙ КОРОБКУ В ГРУЗОВИК!', width / 2, 70);

        this.ctx.font = '20px "Courier New"';
        this.ctx.fillText('Тапай как можно быстрее!', width / 2, 105);

        this.ctx.font = 'bold 22px "Courier New"';
        const percent = Math.round(this.renderedProgress * 100);
        this.ctx.fillText(`Прогресс: ${percent}%`, width / 2, 145);

        this.ctx.font = '18px "Courier New"';
        this.ctx.fillText(`Тапов: ${this.tapCount}`, width / 2, 175);

        this.drawProgressBar();

        const remaining = Math.max(0, this.gameTime - elapsed).toFixed(1);
        this.ctx.font = 'bold 18px "Courier New"';
        this.ctx.fillText(`Осталось времени: ${remaining} сек`, width / 2, this.canvas.height - 30);
    }

    drawProgressBar() {
        const { width, height } = this.canvas;
        const barWidth = width * 0.7;
        const barHeight = 18;
        const x = (width - barWidth) / 2;
        const y = height * 0.82;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        const fillWidth = barWidth * Math.min(1, this.renderedProgress);
        const gradient = this.ctx.createLinearGradient(x, 0, x + fillWidth, 0);
        gradient.addColorStop(0, '#27ae60');
        gradient.addColorStop(1, '#2ecc71');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, fillWidth, barHeight);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
    }

    updateUI(elapsed) {
        const remaining = Math.max(0, this.gameTime - elapsed);
        const timerText = document.getElementById('timer-text');
        const timerFill = document.getElementById('timer-fill');

        if (timerText) timerText.textContent = Math.ceil(remaining);
        if (timerFill) timerFill.style.width = `${(remaining / this.gameTime) * 100}%`;
    }
}

console.log('✅ loading-dock.js загружен');
