/**
 * GAME 10 - Сканер посылок 🔦
 * Механика: попади посылкой в луч и тапни, пока она внутри зоны
 * Длительность: 7 секунд
 */

class ScannerGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🔦 ScannerGame: Инициализация...');

        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = gameManager.sound;

        this.gameTime = 7;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;

        this.requiredScans = 4;
        this.scanned = 0;
        this.score = 0;

        this.scanningZone = {
            width: 180,
            height: 140,
            x: (this.canvas.width - 180) / 2,
            y: 320
        };

        this.currentCrate = null;
        this.createCrate();
        this.setupControls();

        console.log('✅ ScannerGame: готов. Нужно отсканировать', this.requiredScans, 'посылок');
    }

    drawRoundedRect(x, y, width, height, radius, fill = false) {
        const ctx = this.ctx;
        const r = Math.min(radius, width / 2, height / 2);

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        if (fill) ctx.fill();
        ctx.stroke();
    }

    createCrate() {
        const emojis = ['📦', '🎁', '📚', '🎮', '🧳', '💡'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const speed = 2.8 + Math.random() * 1.7; // 2.8 - 4.5 px/frame

        this.currentCrate = {
            emoji,
            x: -60,
            y: this.scanningZone.y + this.scanningZone.height / 2,
            speed,
            size: 72
        };
    }

    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();

            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);

            if (!this.isPointInZone(x, y)) {
                return;
            }

            if (!this.currentCrate) return;

            const zoneCenter = this.scanningZone.x + this.scanningZone.width / 2;
            const tolerance = this.scanningZone.width / 2 - 18;

            if (Math.abs(this.currentCrate.x - zoneCenter) <= tolerance) {
                this.handleSuccessfulScan();
            } else {
                this.fail('Сканировал мимо посылки');
            }
        };

        this.canvas.addEventListener('touchstart', this.tapHandler, { passive: false });
        this.canvas.addEventListener('mousedown', this.tapHandler);
    }

    isPointInZone(x, y) {
        const zone = this.scanningZone;
        return x >= zone.x && x <= zone.x + zone.width &&
               y >= zone.y && y <= zone.y + zone.height;
    }

    handleSuccessfulScan() {
        console.log('✅ Посылка отсканирована');
        this.scanned++;
        this.score += 30;
        if (this.sound) this.sound.playEffect('collectGood');

        if (this.scanned >= this.requiredScans) {
            this.isRunning = false;
            setTimeout(() => this.win(), 250);
        } else {
            this.createCrate();
        }
    }

    fail(reason) {
        console.log('❌ Ошибка сканирования:', reason);
        if (this.sound) this.sound.playEffect('collectBad');
        this.lose();
    }

    removeControls() {
        this.canvas.removeEventListener('touchstart', this.tapHandler);
        this.canvas.removeEventListener('mousedown', this.tapHandler);
    }

    start() {
        console.log('▶️ ScannerGame: старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }

    stop() {
        console.log('⏹️ ScannerGame: стоп');
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.removeControls();
    }

    update() {
        if (!this.isRunning) return;

        this.drawBackground();
        this.drawHeader();
        this.drawScanningZone();
        this.drawCrate();
        this.drawProgress();

        this.updateUI();
        this.updateCratePosition();
        if (!this.isRunning) return; // могло закончиться при обновлении позиции

        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время на сканирование вышло');
            if (this.scanned >= this.requiredScans) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }

        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#001f3f');
        gradient.addColorStop(1, '#003d82');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawHeader() {
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('Сканируй посылки', this.canvas.width / 2, 90);

        this.ctx.fillStyle = '#00ff9d';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`${this.scanned}/${this.requiredScans}`, this.canvas.width / 2, 125);
    }

    drawScanningZone() {
        const zone = this.scanningZone;
        this.ctx.save();

        const zoneCenter = zone.x + zone.width / 2;
        const highlight = this.currentCrate && Math.abs(this.currentCrate.x - zoneCenter) <= zone.width / 2;

        this.ctx.fillStyle = highlight ? 'rgba(0, 255, 157, 0.18)' : 'rgba(255, 255, 255, 0.08)';
        this.ctx.strokeStyle = highlight ? '#00ff9d' : '#3a7bd5';
        this.ctx.lineWidth = 4;
        this.drawRoundedRect(zone.x, zone.y, zone.width, zone.height, 20, true);

        this.ctx.setLineDash([12, 12]);
        this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(zone.x + 20, zone.y + zone.height / 2);
        this.ctx.lineTo(zone.x + zone.width - 20, zone.y + zone.height / 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.restore();
    }

    drawCrate() {
        if (!this.currentCrate) return;

        this.ctx.fillStyle = '#0f172a';
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(this.currentCrate.x, this.currentCrate.y, this.currentCrate.size / 2 + 18, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        this.ctx.font = `${this.currentCrate.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.currentCrate.emoji, this.currentCrate.x, this.currentCrate.y);
        this.ctx.textBaseline = 'alphabetic';
    }

    drawProgress() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Сканируй быстро и точно', this.canvas.width / 2, this.scanningZone.y + this.scanningZone.height + 60);
    }

    updateCratePosition() {
        if (!this.currentCrate) return;

        this.currentCrate.x += this.currentCrate.speed;

        if (this.currentCrate.x - this.currentCrate.size / 2 > this.canvas.width + 60) {
            this.fail('Посылка проскочила сканер');
        }
    }

    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);

        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
    }

    win() {
        console.log('🏆 ScannerGame: все посылки отсканированы');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }

    lose() {
        console.log('💀 ScannerGame: смена сорвалась');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ scanner.js загружен');
