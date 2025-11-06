/**
 * GAME MANAGER - Управляет потоком игры
 * Отвечает за переключение экранов, счет, рандомизацию мини-игр
 */

class GameManager {
    constructor() {
        console.log('🎮 GameManager: Инициализация...');
        
        // Состояние игры
        this.currentGame = null;
        this.totalScore = 0;
        this.gamesCompleted = 0;
        this.gamesList = ['runner', 'game2', 'game3', 'game5', 'game6', 'game7', 'game8', 'game10'];
        this.playedGames = [];
        this.maxLives = 4;
        this.lives = this.maxLives;
        this.lastEarned = 0;
        this.defaultPressStartText = document.querySelector('.press-start')?.textContent || 'Нажми, чтобы начать!';

        // DOM элементы
        this.screens = {
            loading: document.getElementById('loading-screen'),
            transition: document.getElementById('transition-screen'),
            game: document.getElementById('game-screen'),
            result: document.getElementById('result-screen')
        };
        
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Debug
        this.debugPanel = document.getElementById('debug-panel');
        this.debugInfo = document.getElementById('debug-info');
        this.debugMode = false; // Включить для отладки
        
        this.updateScore(0);
        this.renderLives();

        console.log('✅ GameManager: Готов');
    }
    
    /**
     * Показать определенный экран
     */
    showScreen(screenName) {
        console.log(`🖥️ Переключение на экран: ${screenName}`);
        
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }
    
    /**
     * Выбрать случайную мини-игру
     */
    getRandomGame() {
        // Если все игры сыграны, сбросить
        if (this.playedGames.length >= this.gamesList.length) {
            this.playedGames = [];
            console.log('🔄 Все игры сыграны, сброс списка');
        }
        
        // Получить неиграные игры
        const availableGames = this.gamesList.filter(
            game => !this.playedGames.includes(game)
        );
        
        // Случайный выбор
        const randomIndex = Math.floor(Math.random() * availableGames.length);
        const selectedGame = availableGames[randomIndex];
        
        this.playedGames.push(selectedGame);
        
        console.log(`🎲 Выбрана игра: ${selectedGame}`);
        console.log(`📋 Сыграно игр: ${this.playedGames.length}/${this.gamesList.length}`);
        
        return selectedGame;
    }
    
    /**
     * Запустить мини-игру
     */
    startGame(gameName) {
        console.log(`▶️ Запуск игры: ${gameName}`);
        
        // Создать экземпляр игры
        switch(gameName) {
            case 'runner':
                this.currentGame = new RunnerGame(this.canvas, this.ctx, this);
                break;
            case 'game2':
                this.currentGame = new Game2(this.canvas, this.ctx, this);
                break;
            case 'game3':
                this.currentGame = new Game3(this.canvas, this.ctx, this);
                break;
            case 'game5':
                this.currentGame = new Game5(this.canvas, this.ctx, this);
                break;
            case 'game6':
                this.currentGame = new Game6(this.canvas, this.ctx, this);
                break;
            case 'game7':
                this.currentGame = new Game7(this.canvas, this.ctx, this);
                break;
            case 'game8':
                this.currentGame = new Game8(this.canvas, this.ctx, this);
                break;
            case 'game10':
                this.currentGame = new Game10(this.canvas, this.ctx, this);
                break;
            default:
                console.error(`❌ Неизвестная игра: ${gameName}`);
                return;
        }
        
        // Показать экран игры
        this.showScreen('game');
        
        // Запустить игру
        this.currentGame.start();
    }
    
    /**
     * Показать экран перехода с обратным отсчетом
     */
    showTransition(gameName, callback) {
        console.log(`⏳ Переход к игре: ${gameName}`);
        
        // Установить название игры
        const titles = {
            'runner': 'КУРЬЕР-РАННЕР',
            'game2': 'СОРТИРОВКА',
            'game3': 'НАЙДИ ТОВАР',
            'game5': 'ПОЙМАЙ НОУТБУКИ',
            'game6': 'ПОСЧИТАЙ ТОВАРЫ',
            'game7': 'СБОРКА ЗАКАЗА',
            'game8': 'АДРЕСА ДОСТАВКИ',
            'game10': 'ВЕСЫ СКЛАДА'
        };
        
        const instructions = {
            'runner': 'Тапай чтобы прыгать!',
            'game2': 'Одежда vs Техника!',
            'game3': 'Тапай на правильный!',
            'game5': 'Лови только ноутбуки 💻',
            'game6': 'Реши пример!',
            'game7': 'Собери товары из списка!',
            'game8': 'Запомни адрес за 2 сек!',
            'game10': 'Выбери категорию веса!'
        };
        
        document.getElementById('game-title').textContent = titles[gameName] || gameName.toUpperCase();
        document.getElementById('game-instruction').textContent = instructions[gameName] || 'Начинай!';
        document.getElementById('game-number-display').textContent = this.gamesCompleted + 1;
        
        this.renderLives();
        this.showScreen('transition');
        
        // Обратный отсчет
        let count = 3;
        const countdownEl = document.getElementById('countdown-number');
        countdownEl.textContent = count; // Показать начальное значение
        
        const countdownInterval = setInterval(() => {
            count--;
            
            if (count <= 0) {
                clearInterval(countdownInterval);
                callback();
            } else {
                countdownEl.textContent = count; // Показать только если > 0
            }
        }, 1000);
    }
    
    /**
     * Завершение мини-игры
     */
    endGame(success, score) {
        console.log(`🏁 Игра завершена: ${success ? 'УСПЕХ' : 'ПРОВАЛ'}, очки: ${score}`);
        
        if (this.currentGame) {
            this.currentGame.stop();
            this.currentGame = null;
        }

        if (success) {
            const reward = this.calculateReward(score);
            this.lastEarned = reward;
            this.gamesCompleted++;
            this.updateScore(reward);
            this.renderLives();
            this.showResult(true);
        } else {
            this.lastEarned = 0;
            this.handleMistake();
        }
    }
    
    /**
     * Показать экран результата
     */
    showResult(success) {
        const resultIcon = document.getElementById('result-icon');
        const resultTitle = document.getElementById('result-title');
        const lastEarnedEl = document.getElementById('last-earned');
        if (lastEarnedEl) {
            lastEarnedEl.textContent = this.lastEarned;
        }
        const finalScoreEl = document.getElementById('final-score');
        if (finalScoreEl) {
            finalScoreEl.textContent = this.totalScore;
        }
        const gamesCompletedEl = document.getElementById('games-completed');
        if (gamesCompletedEl) {
            gamesCompletedEl.textContent = this.gamesCompleted;
        }
        
        if (success) {
            resultIcon.textContent = '✅';
            resultTitle.textContent = 'УСПЕХ!';
            this.screens.result.style.background = 'linear-gradient(135deg, #00b894, #00cec9)';
        } else {
            resultIcon.textContent = '❌';
            resultTitle.textContent = `ОШИБКА! Осталось ❤️ ${this.lives}`;
            this.screens.result.style.background = 'linear-gradient(135deg, #d63031, #ff7675)';
        }

        this.showScreen('result');
        
        console.log(`📊 Общий счет: ${this.totalScore}, Игр пройдено: ${this.gamesCompleted}`);
    }
    
    /**
     * Следующая игра
     */
    nextGame() {
        console.log('➡️ Переход к следующей игре');
        const gameName = this.getRandomGame();
        this.showTransition(gameName, () => {
            this.startGame(gameName);
        });
    }
    
    /**
     * Начать заново
     */
    restart() {
        console.log('🔄 Перезапуск игры');
        this.startRun();
    }
    
    /**
     * Обновить debug информацию
     */
    updateDebug(info) {
        if (this.debugMode && this.debugPanel) {
            this.debugPanel.classList.add('active');
            this.debugInfo.innerHTML = info;
        }
    }

    updateScore(amount = 0) {
        if (typeof amount === 'number' && amount !== 0) {
            this.totalScore = Math.max(0, Math.round(this.totalScore + amount));
        }

        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = this.totalScore;
        }

        const finalScoreEl = document.getElementById('final-score');
        if (finalScoreEl) {
            finalScoreEl.textContent = this.totalScore;
        }
    }

    renderLives() {
        const containers = [
            document.getElementById('lives-display'),
            document.getElementById('transition-lives')
        ];

        containers.forEach(container => {
            if (!container) return;

            container.innerHTML = '';
            for (let i = 0; i < this.maxLives; i++) {
                const span = document.createElement('span');
                const isActive = i < this.lives;
                span.className = 'life' + (isActive ? ' active' : ' inactive');
                span.textContent = '❤️';
                container.appendChild(span);
            }
        });
    }

    calculateReward(rawScore = 0) {
        const base = Math.max(10, Math.round(rawScore));
        const multiplier = 1 + this.gamesCompleted * 0.25;
        return Math.round(base * multiplier);
    }

    handleMistake() {
        this.lives = Math.max(0, this.lives - 1);
        this.renderLives();

        if (this.lives <= 0) {
            this.handleGameOver();
        } else {
            this.showResult(false);
        }
    }

    handleGameOver() {
        console.log('💔 Жизни закончились. Возврат на главный экран.');

        this.showScreen('loading');
        const pressStart = document.querySelector('.press-start');
        if (pressStart) {
            pressStart.textContent = 'Жизни закончились! Нажми, чтобы начать заново';
        }

        this.resetState();
        if (typeof window.enableStartOverlay === 'function') {
            window.enableStartOverlay();
        }
    }

    resetState() {
        this.totalScore = 0;
        this.gamesCompleted = 0;
        this.playedGames = [];
        this.lives = this.maxLives;
        this.lastEarned = 0;
        this.updateScore(0);
        this.renderLives();

        const lastEarnedEl = document.getElementById('last-earned');
        if (lastEarnedEl) {
            lastEarnedEl.textContent = this.lastEarned;
        }
    }

    startRun() {
        if (typeof window.disableStartOverlay === 'function') {
            window.disableStartOverlay();
        }

        const pressStart = document.querySelector('.press-start');
        if (pressStart) {
            pressStart.textContent = this.defaultPressStartText;
        }

        this.resetState();
        this.nextGame();
    }
}

console.log('✅ game-manager.js загружен');
