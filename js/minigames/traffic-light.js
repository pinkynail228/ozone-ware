/**
 * TRAFFIC LIGHT GAME - Светофор
 * Механика: Тапай ТОЛЬКО на зелёный свет!
 * Длительность: 5 секунд
 */

class TrafficLightGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🚦 TrafficLightGame: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 5;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;
        
        this.score = 0;
        this.requiredScore = 50; // Нужно набрать 50 очков
        
        // Светофор
        this.lightColor = 'red';
        this.lightChangeTimer = 0;
        this.lightChangeInterval = 30; // Кадры между сменами (0.5 сек)
        
        // Анимация пульсации
        this.pulseScale = 1;
        
        this.setupControls();
        
        console.log('✅ TrafficLightGame: Готов');
    }
    
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            if (this.lightColor === 'green') {
                console.log('✅ ЗЕЛЁНЫЙ! +10 очков');
                this.score += 10;
            } else {
                console.log('❌ КРАСНЫЙ! Провал');
                this.lose();
            }
        };
        
        this.canvas.addEventListener('touchstart', this.tapHandler);
        this.canvas.addEventListener('mousedown', this.tapHandler);
    }
    
    removeControls() {
        this.canvas.removeEventListener('touchstart', this.tapHandler);
        this.canvas.removeEventListener('mousedown', this.tapHandler);
    }
    
    start() {
        console.log('▶️ TrafficLightGame: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    stop() {
        console.log('⏹️ TrafficLightGame: Стоп');
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
        
        // Фон
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 28px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('СВЕТОФОР!', this.canvas.width / 2, 100);
        
        this.ctx.font = '18px Courier New';
        this.ctx.fillText('Тапай ТОЛЬКО на ЗЕЛЁНЫЙ!', this.canvas.width / 2, 135);
        
        // Прогресс
        this.ctx.font = 'bold 20px Courier New';
        this.ctx.fillText(`Очки: ${this.score}/${this.requiredScore}`, this.canvas.width / 2, 170);
        
        // Смена цвета светофора
        this.lightChangeTimer += deltaTime * 60;
        if (this.lightChangeTimer >= this.lightChangeInterval) {
            this.lightColor = Math.random() > 0.5 ? 'green' : 'red';
            this.lightChangeTimer = 0;
            console.log('🚦 Смена цвета:', this.lightColor);
        }
        
        // Анимация пульсации
        this.pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
        
        // Отрисовать светофор
        this.drawTrafficLight();
        
        // Обновить UI
        this.updateUI();
        
        // Проверить условия
        const elapsed = (Date.now() - this.startTime) / 1000;
        
        if (this.score >= this.requiredScore) {
            console.log('🏆 Набрано нужное количество очков!');
            this.win();
            return;
        }
        
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Очков:', this.score);
            if (this.score >= this.requiredScore) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawTrafficLight() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + 50;
        const radius = 80 * this.pulseScale;
        
        // Тень
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX + 5, centerY + 5, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Основной круг
        if (this.lightColor === 'green') {
            this.ctx.fillStyle = '#00ff00';
        } else {
            this.ctx.fillStyle = '#ff0000';
        }
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Обводка
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // Блик
        const glowGradient = this.ctx.createRadialGradient(
            centerX - 20, centerY - 20, 10,
            centerX, centerY, radius
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Текст цвета
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 32px Courier New';
        this.ctx.textAlign = 'center';
        const text = this.lightColor === 'green' ? 'ТАПАЙ!' : 'НЕТ!';
        this.ctx.fillText(text, centerX, centerY + 10);
    }
    
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
    }
    
    win() {
        console.log('🏆 УСПЕХ! Набрано достаточно очков');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ!');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ traffic-light.js загружен');
