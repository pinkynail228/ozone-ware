/**
 * GAME 8 - Адреса доставки 🏠
 * Механика: Запомни адрес за 2 сек, потом выбери правильный из 3х
 * Длительность: 7 секунд
 * Стиль: Ozon брендинг - синие градиенты, память
 */

class AddressGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🏠 Game8: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.sound = gameManager.sound;
        
        this.gameTime = 6;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        this.lastFrameTime = null;
        
        this.score = 0;
        this.hasAnswered = false;
        
        // Состояния
        this.state = 'showing'; // showing, choosing, finished
        this.showTimer = 0;
        this.showDuration = 120; // 2 секунды
        
        // Адреса
        this.streets = ['Ленина', 'Пушкина', 'Гагарина', 'Мира', 'Советская', 'Кирова'];
        this.currentAddress = null;
        this.options = [];
        
        this.generateAddress();
        this.setupControls();
        
        console.log('✅ Game8: Готов');
    }
    
    generateAddress() {
        const street = this.streets[Math.floor(Math.random() * this.streets.length)];
        const house = Math.floor(Math.random() * 89) + 10; // 10-99
        const apt = Math.floor(Math.random() * 90) + 10; // 10-99
        
        this.currentAddress = {
            street: street,
            house: house,
            apt: apt,
            full: `${street}, ${house}, кв. ${apt}`
        };
        
        // Создать варианты с более явными отличиями
        this.options = [{
            street: street,
            house: house,
            apt: apt,
            full: this.currentAddress.full
        }];
        
        // Неправильный 1 - другая улица
        const wrongStreet1 = this.streets.filter(s => s !== street)[Math.floor(Math.random() * (this.streets.length - 1))];
        this.options.push({
            street: wrongStreet1,
            house: house,
            apt: apt,
            full: `${wrongStreet1}, ${house}, кв. ${apt}`
        });
        
        // Неправильный 2 - другой дом (большая разница)
        const wrongHouse = house + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 20) + 15);
        this.options.push({
            street: street,
            house: Math.max(10, Math.min(99, wrongHouse)),
            apt: apt,
            full: `${street}, ${Math.max(10, Math.min(99, wrongHouse))}, кв. ${apt}`
        });
        
        // Перемешать
        for (let i = this.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.options[i], this.options[j]] = [this.options[j], this.options[i]];
        }
        
        this.state = 'showing';
        this.showTimer = 0;
        this.hasAnswered = false;
        
        console.log('🏠 Адрес:', this.currentAddress.full);
    }
    
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning || this.state !== 'choosing' || this.hasAnswered) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Проверить тап по вариантам (3 кнопки)
            const buttonHeight = 80;
            const buttonSpacing = 16;
            const startY = 200;
            
            for (let i = 0; i < 3; i++) {
                const buttonY = startY + i * (buttonHeight + buttonSpacing);
                
                if (y >= buttonY && y <= buttonY + buttonHeight) {
                    const selected = this.options[i];
                    
                    this.hasAnswered = true;
                    this.state = 'finished';
                    
                    if (selected.full === this.currentAddress.full) {
                        console.log('✅ Правильный адрес!');
                        this.score = 120;
                        if (this.sound) this.sound.playEffect('collectGood');
                        setTimeout(() => this.win(), 250);
                    } else {
                        console.log('❌ Неправильный адрес!');
                        if (this.sound) this.sound.playEffect('collectBad');
                        this.lose();
                    }
                    break;
                }
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
        console.log('▶️ Game8: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        if (this.sound) this.sound.playEffect('start', 0.8);
        this.update();
    }
    
    stop() {
        console.log('⏹️ Game8: Стоп');
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
        
        // Фон Ozon - фиолетовый градиент
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#6B2FFF');
        gradient.addColorStop(1, '#4B1FDD');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Без заголовка

        // Логика состояний
        if (this.state === 'showing') {
            // Показываем адрес на карточке
            this.showTimer += deltaTime * 60;
            
            this.drawAddressCard(this.currentAddress);
            
            // Таймер обратного отсчёта
            const remaining = Math.max(0, (this.showDuration - this.showTimer) / 60);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 72px "Exo 2", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(Math.ceil(remaining), this.canvas.width / 2, 520);
            this.ctx.shadowBlur = 0;
            
            if (this.showTimer >= this.showDuration) {
                this.state = 'choosing';
                if (this.sound) this.sound.playEffect('transition', 0.7);
            }
        } else {
            // Выбор адреса
            this.ctx.font = 'bold 18px "Exo 2", sans-serif';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 6;
            const prompt = this.state === 'finished' ? '✅ ПРОВЕРЬ' : '🏠 ВЫБЕРИ АДРЕС:';
            this.ctx.fillText(prompt, this.canvas.width / 2, 140);
            this.ctx.shadowBlur = 0;
            
            // Кнопки с вариантами
            this.drawOptions();
        }
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло!');
            if (this.hasAnswered) {
                return;
            }
            this.hasAnswered = true;
            this.state = 'finished';
            if (this.sound) this.sound.playEffect('fail');
            this.lose();
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawAddressCard(address) {
        const cx = this.canvas.width / 2;
        const cy = 280;
        const cardWidth = 340;
        const cardHeight = 120;
        
        // Карточка с градиентом
        const cardGrad = this.ctx.createLinearGradient(cx - cardWidth/2, cy - cardHeight/2, cx + cardWidth/2, cy + cardHeight/2);
        cardGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
        cardGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
        this.ctx.fillStyle = cardGrad;
        this.roundRect(this.ctx, cx - cardWidth/2, cy - cardHeight/2, cardWidth, cardHeight, 20);
        this.ctx.fill();
        
        // Обводка
        this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        this.ctx.lineWidth = 2;
        this.roundRect(this.ctx, cx - cardWidth/2, cy - cardHeight/2, cardWidth, cardHeight, 20);
        this.ctx.stroke();
        
        // Адрес одной строкой
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 28px "Exo 2", sans-serif';
        this.ctx.fillText(address.full, cx, cy);
        this.ctx.shadowBlur = 0;
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
    
    drawOptions() {
        const buttonHeight = 80;
        const buttonSpacing = 16;
        const startY = 200;
        const buttonWidth = 350;
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        const radius = 16;
        
        this.options.forEach((option, i) => {
            const y = startY + i * (buttonHeight + buttonSpacing);
            
            // Глянцевая кнопка с градиентом
            const btnGrad = this.ctx.createLinearGradient(0, y, 0, y + buttonHeight);
            btnGrad.addColorStop(0, '#1E90FF');
            btnGrad.addColorStop(1, '#0066CC');
            this.ctx.fillStyle = btnGrad;
            this.roundRect(this.ctx, buttonX, y, buttonWidth, buttonHeight, radius);
            this.ctx.fill();
            
            // Блик сверху
            const gloss = this.ctx.createLinearGradient(0, y, 0, y + buttonHeight * 0.5);
            gloss.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
            gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gloss;
            this.roundRect(this.ctx, buttonX, y, buttonWidth, buttonHeight * 0.5, radius);
            this.ctx.fill();
            
            // Обводка
            this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            this.ctx.lineWidth = 2;
            this.roundRect(this.ctx, buttonX, y, buttonWidth, buttonHeight, radius);
            this.ctx.stroke();
            
            // Текст с тенью
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 18px \"Exo 2\", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(option.full, this.canvas.width / 2, y + buttonHeight / 2 + 6);
            this.ctx.shadowBlur = 0;
        });
    }
    
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
    }
    
    win() {
        console.log('🏆 УСПЕХ! Адрес найден');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ! Адрес не совпал');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game8.js загружен');
