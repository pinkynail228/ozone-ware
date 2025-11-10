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
        this.combo = 0;
        this.baseSpeed = 2.5;
        this.speedMultiplier = 1.0;

        this.scanningZone = {
            width: 200,
            height: 160,
            x: (this.canvas.width - 200) / 2,
            y: 320,
            pulse: 0
        };

        this.currentCrate = null;
        this.scanEffect = null;
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
        // Больше товаров!
        const emojis = ['📦', '🎁', '📚', '🎮', '🧳', '💡', '👟', '🎂', '🎸', '📱', '⌨️', '💍', '🕯️', '🎭', '🎨', '🧩'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        // Разная скорость + ускорение
        const baseSpeed = this.baseSpeed * this.speedMultiplier;
        const speed = baseSpeed + Math.random() * 2.5;
        
        // Неожиданные изменения скорости
        const hasSpeedChange = Math.random() > 0.6;
        const speedChangePoint = hasSpeedChange ? 100 + Math.random() * 150 : null;
        const speedChangeFactor = hasSpeedChange ? (Math.random() > 0.5 ? 1.8 : 0.5) : 1;

        this.currentCrate = {
            emoji,
            x: -60,
            y: this.scanningZone.y + this.scanningZone.height / 2,
            speed,
            baseSpeed: speed,
            size: 72,
            wobble: 0,
            hasSpeedChange,
            speedChangePoint,
            speedChangeFactor,
            speedChanged: false
        };
        
        // Ускоряем игру со временем
        this.speedMultiplier += 0.08;
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
        this.combo++;
        this.score += 30 + (this.combo * 10); // Бонус за комбо
        if (this.sound) this.sound.playEffect('collectGood');
        
        // Эффект сканирования
        this.scanEffect = {
            x: this.currentCrate.x,
            y: this.currentCrate.y,
            alpha: 1,
            size: 0
        };

        if (this.scanned >= this.requiredScans) {
            this.isRunning = false;
            setTimeout(() => this.win(), 250);
        } else {
            this.createCrate();
        }
    }

    fail(reason) {
        console.log('❌ Ошибка сканирования:', reason);
        this.combo = 0; // Сброс комбо
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
        // Ozon фиолетовый градиент
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#6B2FFF');
        gradient.addColorStop(1, '#4B1FDD');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Анимированный конвейер
        const conveyorY = this.scanningZone.y + this.scanningZone.height + 20;
        this.ctx.fillStyle = '#3A2A6F';
        this.ctx.fillRect(0, conveyorY, this.canvas.width, 40);
        
        // Полосы конвейера
        const offset = (Date.now() / 50) % 30;
        this.ctx.fillStyle = '#2A1A5F';
        for (let i = -1; i < 15; i++) {
            this.ctx.fillRect(i * 30 - offset, conveyorY, 20, 40);
        }
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
        
        const crate = this.currentCrate;
        crate.wobble += 0.1;
        const wobbleOffset = Math.sin(crate.wobble) * 3;

        this.ctx.fillStyle = '#0f172a';
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(crate.x, crate.y + wobbleOffset, crate.size / 2 + 18, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        this.ctx.font = `${crate.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(crate.emoji, crate.x, crate.y + wobbleOffset);
        this.ctx.textBaseline = 'alphabetic';
        
        // Эффект сканирования
        if (this.scanEffect) {
            this.ctx.strokeStyle = `rgba(0, 255, 157, ${this.scanEffect.alpha})`;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(this.scanEffect.x, this.scanEffect.y, this.scanEffect.size, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.scanEffect.size += 8;
            this.scanEffect.alpha -= 0.05;
            
            if (this.scanEffect.alpha <= 0) {
                this.scanEffect = null;
            }
        }
    }

    drawProgress() {
        // Комбо
        if (this.combo > 1) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 28px "Exo 2", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText(`COMBO x${this.combo}!`, this.canvas.width / 2, 200);
            this.ctx.shadowBlur = 0;
        }
    }

    updateCratePosition() {
        if (!this.currentCrate) return;
        
        const crate = this.currentCrate;
        
        // Неожиданное изменение скорости!
        if (crate.hasSpeedChange && !crate.speedChanged && crate.x > crate.speedChangePoint) {
            crate.speed = crate.baseSpeed * crate.speedChangeFactor;
            crate.speedChanged = true;
        }

        crate.x += crate.speed;

        if (crate.x - crate.size / 2 > this.canvas.width + 60) {
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
