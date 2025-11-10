/**
 * GAME 6 - Подсчёт коробок на паллете
 * Механика: Быстро посчитай коробки на стопке и выбери правильное количество
 * Длительность: 6 секунд
 */

class CalculatorGame {
    constructor(canvas, ctx, gameManager) {
        console.log('🔢 Game6: Инициализация...');
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameManager = gameManager;
        
        this.gameTime = 6;
        this.startTime = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        this.score = 0;
        this.solved = 0;
        this.requiredSolved = 1;
        
        // Коробки на паллете
        this.boxes = [];
        this.correctCount = 0;
        this.answers = [];
        
        this.generateProblem();
        this.setupControls();
        
        console.log('✅ Game6: Готов');
    }
    
    generateProblem() {
        // Генерируем от 3 до 10 коробок
        this.correctCount = Math.floor(Math.random() * 8) + 3;
        this.boxes = [];
        
        // Создаём стопку коробок (изометрическая пирамида)
        const baseY = 420;
        const boxHeight = 45;
        const boxWidth = 55;
        
        // Размещаем коробки слоями
        let placed = 0;
        let layer = 0;
        const maxPerLayer = 4;
        
        while (placed < this.correctCount) {
            const boxesInLayer = Math.min(maxPerLayer, this.correctCount - placed);
            const layerStartX = this.canvas.width / 2 - (boxesInLayer * boxWidth) / 2;
            
            for (let i = 0; i < boxesInLayer; i++) {
                this.boxes.push({
                    x: layerStartX + i * boxWidth + Math.random() * 10 - 5,
                    y: baseY - layer * boxHeight - Math.random() * 5,
                    width: boxWidth,
                    height: boxHeight,
                    rotation: Math.random() * 4 - 2
                });
                placed++;
            }
            layer++;
        }
        
        // Создать 3 варианта ответа
        this.answers = [];
        this.answers.push({ value: this.correctCount, correct: true });
        
        // Два неправильных ответа (близкие значения)
        let wrong1 = this.correctCount + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
        let wrong2 = this.correctCount + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 2);
        
        // Проверяем чтобы не было дубликатов
        while (wrong1 === this.correctCount || wrong1 < 1) wrong1++;
        while (wrong2 === this.correctCount || wrong2 === wrong1 || wrong2 < 1) wrong2++;
        
        this.answers.push({ value: wrong1, correct: false });
        this.answers.push({ value: wrong2, correct: false });
        
        // Перемешать
        for (let i = this.answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.answers[i], this.answers[j]] = [this.answers[j], this.answers[i]];
        }
        
        // ПОСЛЕ перемешивания установить координаты (ниже)
        this.answers[0].x = 50;
        this.answers[0].y = 560;
        this.answers[0].width = 80;
        this.answers[0].height = 80;
        
        this.answers[1].x = 155;
        this.answers[1].y = 560;
        this.answers[1].width = 80;
        this.answers[1].height = 80;
        
        this.answers[2].x = 260;
        this.answers[2].y = 560;
        this.answers[2].width = 80;
        this.answers[2].height = 80;
        
        console.log('📦 Коробок на паллете:', this.correctCount);
    }
    
    setupControls() {
        this.tapHandler = (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Проверить, на какой ответ тапнули
            for (const answer of this.answers) {
                if (x >= answer.x && x <= answer.x + answer.width &&
                    y >= answer.y && y <= answer.y + answer.height) {
                    
                    if (answer.correct) {
                        console.log('✅ ПРАВИЛЬНО!');
                        this.solved++;
                        this.score += 30;
                        
                        if (this.solved >= this.requiredSolved) {
                            this.isRunning = false; // Остановить игру
                            setTimeout(() => this.win(), 300);
                        } else {
                            this.generateProblem();
                        }
                    } else {
                        console.log('❌ НЕПРАВИЛЬНО!');
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
        console.log('▶️ Game6: Старт');
        this.isRunning = true;
        this.startTime = Date.now();
        this.update();
    }
    
    stop() {
        console.log('⏹️ Game6: Стоп');
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.removeControls();
    }
    
    update() {
        if (!this.isRunning) return;
        
        // Фон Ozon
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#6B2FFF');
        gradient.addColorStop(1, '#4B1FDD');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заголовок
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px "Exo 2", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 6;
        this.ctx.fillText('📦 СКОЛЬКО КОРОБОК?', this.canvas.width / 2, 140);
        this.ctx.shadowBlur = 0;
        
        // Паллета и коробки
        this.drawPallet();
        this.drawBoxes();
        
        // Варианты ответов
        this.drawAnswers();
        
        // Обновить UI
        this.updateUI();
        
        // Проверить время
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.gameTime) {
            console.log('⏰ Время вышло! Решено:', this.solved);
            if (this.solved >= this.requiredSolved) {
                this.win();
            } else {
                this.lose();
            }
            return;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawPallet() {
        // Изометрическая паллета
        const cx = this.canvas.width / 2;
        const cy = 470;
        const palletWidth = 220;
        const palletDepth = 40;
        const palletHeight = 15;
        
        // Верхняя грань
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(cx - palletWidth/2, cy);
        this.ctx.lineTo(cx - palletWidth/2 - palletDepth, cy - palletDepth/2);
        this.ctx.lineTo(cx + palletWidth/2 - palletDepth, cy - palletDepth/2);
        this.ctx.lineTo(cx + palletWidth/2, cy);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Передняя грань
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(cx - palletWidth/2, cy, palletWidth, palletHeight);
        
        // Тень
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(cx - palletWidth/2, cy + palletHeight, palletWidth, 3);
    }
    
    drawBoxes() {
        this.boxes.forEach(box => {
            this.ctx.save();
            this.ctx.translate(box.x + box.width/2, box.y + box.height/2);
            this.ctx.rotate(box.rotation * Math.PI / 180);
            
            // Изометрическая коробка
            const w = box.width;
            const h = box.height;
            const d = 15; // глубина
            
            // Верхняя грань
            const topGrad = this.ctx.createLinearGradient(0, -h/2 - d, 0, -h/2);
            topGrad.addColorStop(0, '#FFB366');
            topGrad.addColorStop(1, '#FFA94D');
            this.ctx.fillStyle = topGrad;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -h/2 - d);
            this.ctx.lineTo(w/2, -h/2 - d/2);
            this.ctx.lineTo(0, -h/2);
            this.ctx.lineTo(-w/2, -h/2 - d/2);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Обводка верхней грани
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Левая грань
            this.ctx.fillStyle = '#FF9933';
            this.ctx.beginPath();
            this.ctx.moveTo(-w/2, -h/2 - d/2);
            this.ctx.lineTo(-w/2, h/2);
            this.ctx.lineTo(0, h/2 + d/2);
            this.ctx.lineTo(0, -h/2);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Обводка левой грани
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Правая грань
            this.ctx.fillStyle = '#FFCE73';
            this.ctx.beginPath();
            this.ctx.moveTo(w/2, -h/2 - d/2);
            this.ctx.lineTo(w/2, h/2);
            this.ctx.lineTo(0, h/2 + d/2);
            this.ctx.lineTo(0, -h/2);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Обводка правой грани
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    drawAnswers() {
        this.answers.forEach(answer => {
            const radius = 12;
            
            // Глянцевая кнопка
            const btnGrad = this.ctx.createLinearGradient(0, answer.y, 0, answer.y + answer.height);
            btnGrad.addColorStop(0, '#1E90FF');
            btnGrad.addColorStop(1, '#0066CC');
            this.ctx.fillStyle = btnGrad;
            this.roundRect(this.ctx, answer.x, answer.y, answer.width, answer.height, radius);
            this.ctx.fill();
            
            // Блик
            const gloss = this.ctx.createLinearGradient(0, answer.y, 0, answer.y + answer.height * 0.5);
            gloss.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gloss;
            this.roundRect(this.ctx, answer.x, answer.y, answer.width, answer.height * 0.5, radius);
            this.ctx.fill();
            
            // Обводка
            this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            this.ctx.lineWidth = 2;
            this.roundRect(this.ctx, answer.x, answer.y, answer.width, answer.height, radius);
            this.ctx.stroke();
            
            // Число
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 40px "Exo 2", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(answer.value, answer.x + answer.width / 2, answer.y + answer.height / 2 + 14);
            this.ctx.shadowBlur = 0;
        });
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
    
    updateUI() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        document.getElementById('timer-text').textContent = Math.ceil(remaining);
        document.getElementById('timer-fill').style.width = (remaining / this.gameTime * 100) + '%';
    }
    
    win() {
        console.log('🏆 УСПЕХ! Все примеры решены');
        this.stop();
        this.gameManager.endGame(true, this.score);
    }
    
    lose() {
        console.log('💀 ПРОВАЛ!');
        this.stop();
        this.gameManager.endGame(false, 0);
    }
}

console.log('✅ game6.js загружен');
