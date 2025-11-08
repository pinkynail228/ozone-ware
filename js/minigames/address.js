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
        
        this.gameTime = 7;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
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
        const house = Math.floor(Math.random() * 99) + 1;
        const apt = Math.floor(Math.random() * 150) + 1;
        
        this.currentAddress = {
            street: street,
            house: house,
            apt: apt,
            full: `${street}, ${house}, кв. ${apt}`
        };
        
        // Создать варианты (2 неправильных + 1 правильный)
        this.options = [this.currentAddress.full];
        
        // Неправильный вариант 1 - другая улица
        const wrongStreet1 = this.streets.filter(s => s !== street)[Math.floor(Math.random() * (this.streets.length - 1))];
        this.options.push(`${wrongStreet1}, ${house}, кв. ${apt}`);
        
        // Неправильный вариант 2 - другой номер дома
        const wrongHouse = house + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 10) + 1);
        this.options.push(`${street}, ${wrongHouse}, кв. ${apt}`);
        
        // Перемешать варианты
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
            const buttonHeight = 70;
            const buttonSpacing = 20;
            const startY = 400;
            
            for (let i = 0; i < 3; i++) {
                const buttonY = startY + i * (buttonHeight + buttonSpacing);
                
                if (y >= buttonY && y <= buttonY + buttonHeight) {
                    const selected = this.options[i];
                    
                    this.hasAnswered = true;
                    this.state = 'finished';
                    
                    if (selected === this.currentAddress.full) {
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
    
    update() {
        if (!this.isRunning) return;
        
        // Фон Ozon - синий градиент
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#001f3f');
        gradient.addColorStop(1, '#005bff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 26px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('АДРЕС ДОСТАВКИ 🏠', this.canvas.width / 2, 80);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Запомни адрес и выбери его из списка', this.canvas.width / 2, 115);

        // Логика состояний
        if (this.state === 'showing') {
            // Показываем адрес
            this.showTimer++;
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('ЗАПОМНИ АДРЕС:', this.canvas.width / 2, 180);
            
            // Адрес большим шрифтом
            this.ctx.fillStyle = '#00ff88';
            this.ctx.font = 'bold 20px Courier New';
            const lines = this.wrapText(this.currentAddress.full, 300);
            lines.forEach((line, i) => {
                this.ctx.fillText(line, this.canvas.width / 2, 250 + i * 30);
            });
            
            // Таймер
            const remaining = Math.max(0, (this.showDuration - this.showTimer) / 60);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.fillText(Math.ceil(remaining), this.canvas.width / 2, 400);
            
            if (this.showTimer >= this.showDuration) {
                this.state = 'choosing';
                if (this.sound) this.sound.playEffect('transition', 0.7);
            }
        } else {
            // Выбор адреса или ожидание результата
            this.ctx.font = '18px Arial';
            this.ctx.fillStyle = '#fff';
            const prompt = this.state === 'finished' ? 'ПРОВЕРЬ РЕЗУЛЬТАТ' : 'ВЫБЕРИ ПРАВИЛЬНЫЙ:';
            this.ctx.fillText(prompt, this.canvas.width / 2, 180);
            
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
    
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
    }
    
    drawOptions() {
        const buttonHeight = 70;
        const buttonSpacing = 20;
        const startY = 400;
        const buttonWidth = 340;
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        
        this.options.forEach((option, i) => {
            const y = startY + i * (buttonHeight + buttonSpacing);
            
            // Фон кнопки
            this.ctx.fillStyle = '#0066ff';
            this.ctx.fillRect(buttonX, y, buttonWidth, buttonHeight);
            
            // Обводка
            this.ctx.strokeStyle = '#00bfff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(buttonX, y, buttonWidth, buttonHeight);
            
            // Текст
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Courier New';
            this.ctx.textAlign = 'center';
            const lines = this.wrapText(option, 320);
            lines.forEach((line, li) => {
                this.ctx.fillText(line, this.canvas.width / 2, y + 30 + li * 20);
            });
        });
    }
    
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
        document.getElementById('score-display').textContent = this.score;
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
