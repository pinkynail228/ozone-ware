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

        this.gameTime = 10; // Было 7, стало 10 (больше времени)
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;

        this.requiredScans = 5; // Было 4, стало 5 (больше ящиков)
        this.scanned = 0;
        this.score = 0;
        this.combo = 0;
        this.baseSpeed = 4.0; // Было 2.5, стало 4.0 (быстрее)
        this.speedMultiplier = 1.0;

        // Узкая горизонтальная зона сканирования (лазер)
        this.scanningZone = {
            width: 280,
            height: 50, // Было 160, стало 50 (в 3+ раза меньше)
            x: (this.canvas.width - 280) / 2,
            y: 400, // Ниже по центру
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
        console.log('📦 Scanner: Creating new crate...');
        // Больше товаров!
        const emojis = ['📦', '🎁', '📚', '🎮', '🧳', '💡', '👟', '🎂', '🎸', '📱', '⌨️', '💍', '🕯️', '🎭', '🎨', '🧩'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        // Разная скорость + ускорение
        const baseSpeed = this.baseSpeed * Math.min(this.speedMultiplier, 1.5); // Макс x1.5
        const speed = baseSpeed + Math.random() * 2.0; // Вариация
        
        // Неожиданные изменения скорости (чаще и драматичнее!)
        const hasSpeedChange = Math.random() > 0.3; // Ещё чаще
        // Точка остановки — перед зоной сканирования
        const speedChangePoint = hasSpeedChange ? this.scanningZone.y - 100 - Math.random() * 50 : null;
        // После паузы — только ускорение (2x-3x)
        const speedChangeFactor = hasSpeedChange ? (2.0 + Math.random() * 1.0) : 1;
        // Пауза от 0.3 до 1 секунды (короче!)
        const pauseBeforeChange = hasSpeedChange ? 0.3 + Math.random() * 0.7 : 0;

        this.currentCrate = {
            emoji,
            x: this.canvas.width / 2, // По центру горизонтально
            y: -60, // Начинаем сверху
            speed,
            baseSpeed: speed,
            size: 72,
            wobble: 0,
            hasSpeedChange,
            speedChangePoint,
            speedChangeFactor,
            speedChanged: false,
            pauseBeforeChange,
            pauseStartTime: null,
            isPaused: false
        };
        
        console.log('✅ Scanner: Crate created:', this.currentCrate);
        if (hasSpeedChange) {
            console.log('🎲 Speed change enabled! Point:', speedChangePoint, 'Factor:', speedChangeFactor, 'Pause:', pauseBeforeChange);
        }
        
        // Ускоряем игру со временем
        this.speedMultiplier += 0.08;
    }

    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            if (!this.currentCrate) return;

            // Проверяем Y координату ящика — он должен быть в зоне сканирования
            const zoneCenter = this.scanningZone.y + this.scanningZone.height / 2;
            const tolerance = this.scanningZone.height / 2 + 30; // Щедрый запас

            if (Math.abs(this.currentCrate.y - zoneCenter) <= tolerance) {
                this.handleSuccessfulScan();
            } else {
                console.log('❌ Тап мимо! Ящик Y:', this.currentCrate.y, 'Зона Y:', zoneCenter, '±', tolerance);
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
        this.createCrate(); // Создаём первый ящик!
        this.gameLoop = requestAnimationFrame((time) => this.update(time)); // Правильный запуск
    }

    stop() {
        console.log('⏹️ ScannerGame: стоп');
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.removeControls();
    }

    update(currentTime) {
        if (!this.isRunning) return;
        
        if (!this.lastFrameTime) {
            this.lastFrameTime = currentTime;
            var deltaTime = 1/60;
        } else {
            var deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
            this.lastFrameTime = currentTime;
        }

        this.drawBackground();
        this.drawHeader();
        this.drawScanningZone(deltaTime);
        this.drawCrate(deltaTime);
        this.drawProgress();

        this.updateUI();
        this.updateCratePosition(deltaTime);
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

        this.gameLoop = requestAnimationFrame((time) => this.update(time));
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


        this.ctx.setLineDash([12, 12]);
        this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.scanningZone.x + 20, this.scanningZone.y + this.scanningZone.height / 2);
        this.ctx.lineTo(this.scanningZone.x + this.scanningZone.width - 20, this.scanningZone.y + this.scanningZone.height / 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.restore();
    }

    drawScanningZone(deltaTime) {
        const zone = this.scanningZone;
        zone.pulse += 0.1 * deltaTime * 60;
        
        this.ctx.save();
        
        // Пульсирующая рамка зоны сканирования
        const pulseAlpha = 0.3 + Math.sin(zone.pulse) * 0.2;
        this.ctx.strokeStyle = `rgba(34, 197, 94, ${pulseAlpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 8]);
        
        this.drawRoundedRect(zone.x, zone.y, zone.width, zone.height, 15, false);
        
        // Центральная линия сканера
        this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(zone.x + 20, zone.y + zone.height / 2);
        this.ctx.lineTo(zone.x + zone.width - 20, zone.y + zone.height / 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawCrate(deltaTime) {
        if (!this.currentCrate) {
            console.log('⚠️ Scanner: currentCrate is null!');
            return;
        }
        
        const crate = this.currentCrate;
        crate.wobble += 0.15 * deltaTime * 60;
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

    updateCratePosition(deltaTime) {
        if (!this.currentCrate) return;
        
        const crate = this.currentCrate;
        
        // Неожиданное изменение скорости с паузой!
        if (crate.hasSpeedChange && !crate.speedChanged && crate.y > crate.speedChangePoint) {
            console.log('🎯 Reached speed change point! Y:', crate.y, 'Point:', crate.speedChangePoint);
            if (!crate.isPaused) {
                // Начинаем паузу
                crate.isPaused = true;
                crate.pauseStartTime = Date.now();
                crate.speed = 0; // Останавливаем
                console.log('⏸️ Scanner: Crate paused before speed change');
            } else {
                // Проверяем закончилась ли пауза
                const pauseDuration = (Date.now() - crate.pauseStartTime) / 1000;
                if (pauseDuration >= crate.pauseBeforeChange) {
                    // Резко меняем скорость!
                    crate.speed = crate.baseSpeed * crate.speedChangeFactor; // БЕЗ ограничения!
                    crate.speedChanged = true;
                    console.log('🚀 Scanner: Speed changed to', crate.speed);
                }
            }
        }

        // Двигаем ящик ВНИЗ (если не на паузе)
        if (!crate.isPaused || crate.speedChanged) {
            crate.y += crate.speed * deltaTime * 60;
        }

        // Проверка выхода за экран
        if (crate.y - crate.size / 2 > this.canvas.height + 60) {
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
