/**
 * GAME MANAGER - Управляет потоком игры, сериями мини-игр и системой жизней
 */

class GameManager {
    constructor() {
        console.log('🎮 GameManager: Инициализация...');

        // Основное состояние
        this.currentGame = null;
        this.totalScore = 0;
        this.gamesCompleted = 0;
        this.maxLives = 4;
        this.lives = this.maxLives;
        this.lastEarned = 0;
        this.gamesList = ['delivery', 'sorting', 'finder', 'catcher', 'calculator', 'shopping', 'address', 'weighing'];
        this.playedGames = [];

        this.defaultPressStartText = document.querySelector('.press-start')?.textContent || 'Нажми, чтобы начать!';

        // DOM элементы экранов
        this.screens = {
            loading: document.getElementById('loading-screen'),
            transition: document.getElementById('transition-screen'),
            game: document.getElementById('game-screen'),
            result: document.getElementById('result-screen'),
            gameover: document.getElementById('gameover-screen')
        };

        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // HUD элементы
        this.transitionEmojiEl = document.getElementById('transition-emoji');
        this.transitionTaglineEl = document.getElementById('transition-tagline');
        this.countdownEl = document.getElementById('countdown-number');

        this.resultIconEl = document.getElementById('result-icon');
        this.resultTitleEl = document.getElementById('result-title');
        this.lastEarnedEl = document.getElementById('last-earned');
        this.finalScoreEl = document.getElementById('final-score');
        this.gamesCompletedEl = document.getElementById('games-completed');
        this.resultRestartBtn = document.getElementById('restart-btn');
        this.resultRestartAction = 'restart';

        this.gameoverEmojiEl = document.getElementById('gameover-emoji');
        this.gameoverTitleEl = document.getElementById('gameover-title');
        this.gameoverSubtitleEl = document.getElementById('gameover-subtitle');
        this.gameoverScoreEl = document.getElementById('gameover-score');
        this.gameoverGamesEl = document.getElementById('gameover-games');

        // Звук
        this.sound = new window.SoundManager();

        // Debug
        this.debugPanel = document.getElementById('debug-panel');
        this.debugInfo = document.getElementById('debug-info');
        this.debugMode = false;

        // Переходы
        this.countdownInterval = null;
        this.transitionData = {
            delivery: { emoji: '🚴‍♂️', tagline: 'Тапай для прыжка! Избегай препятствия на пути' },
            sorting: { emoji: '🧺', tagline: 'Жми ВЗЯТЬ для нужного, НА СКЛАД для остального' },
            finder: { emoji: '🔍', tagline: 'Тапни на товар который показан вверху экрана' },
            catcher: { emoji: '📦', tagline: 'Двигай корзину! Лови ТОЛЬКО показанный товар' },
            calculator: { emoji: '🧮', tagline: 'Реши пример и тапни правильный ответ' },
            shopping: { emoji: '🛒', tagline: 'Тапай товары из списка сверху на конвейере' },
            address: { emoji: '🏠', tagline: 'Запомни адрес, потом выбери его из списка' },
            weighing: { emoji: '⚖️', tagline: 'Посмотри вес товара и выбери категорию' }
        };

        this.updateScore(0);
        this.renderLives();
        this.showScreen('loading');

        console.log('✅ GameManager: Готов');
    }

    showScreen(screenName) {
        console.log(`🖥️ Переключение на экран: ${screenName}`);

        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        if (this.countdownInterval && screenName !== 'transition') {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        const target = this.screens[screenName];
        if (target) {
            target.classList.add('active');
        }

        if (screenName === 'game' || screenName === 'transition') {
            this.sound.startGameplayLoop();
        } else {
            this.sound.stopGameplayLoop();
        }
    }

    getRandomGame() {
        if (this.playedGames.length >= this.gamesList.length) {
            this.playedGames = [];
            console.log('🔄 Все игры сыграны, список обновлён');
        }

        const available = this.gamesList.filter(game => !this.playedGames.includes(game));
        const chosen = available[Math.floor(Math.random() * available.length)];
        this.playedGames.push(chosen);

        console.log(`🎲 Выбрана игра: ${chosen}`);
        return chosen;
    }

    startGame(gameName) {
        console.log(`▶️ Запуск игры: ${gameName}`);

        this.sound.enable();
        this.sound.playEffect('transition');

        switch (gameName) {
            case 'delivery':
                this.currentGame = new DeliveryGame(this.canvas, this.ctx, this);
                break;
            case 'sorting':
                this.currentGame = new SortingGame(this.canvas, this.ctx, this);
                break;
            case 'finder':
                this.currentGame = new FinderGame(this.canvas, this.ctx, this);
                break;
            case 'catcher':
                this.currentGame = new CatcherGame(this.canvas, this.ctx, this);
                break;
            case 'calculator':
                this.currentGame = new CalculatorGame(this.canvas, this.ctx, this);
                break;
            case 'shopping':
                this.currentGame = new ShoppingGame(this.canvas, this.ctx, this);
                break;
            case 'address':
                this.currentGame = new AddressGame(this.canvas, this.ctx, this);
                break;
            case 'weighing':
                this.currentGame = new WeighingGame(this.canvas, this.ctx, this);
                break;
            default:
                console.error(`❌ Неизвестная игра: ${gameName}`);
                return;
        }

        this.showScreen('game');
        this.currentGame.start();
    }

    showTransition(gameName, callback) {
        console.log(`⏳ Переход к игре: ${gameName}`);

        const titles = {
            delivery: 'Курьерская доставка',
            sorting: 'Сортировка на складе',
            finder: 'Поиск товара',
            catcher: 'Приёмка на ПВЗ',
            calculator: 'Расчёт заказа',
            shopping: 'Комплектация заказа',
            address: 'Адрес доставки',
            weighing: 'Взвешивание товара'
        };

        document.getElementById('game-title').textContent = titles[gameName] || gameName.toUpperCase();
        document.getElementById('game-number-display').textContent = this.gamesCompleted + 1;

        const transitionInfo = this.transitionData[gameName] || { emoji: '🎮', tagline: 'ВПЕРЁД ЗА ХАОСОМ!' };
        document.getElementById('game-instruction').textContent = transitionInfo.tagline;
        if (this.transitionEmojiEl) this.transitionEmojiEl.textContent = transitionInfo.emoji;
        if (this.transitionTaglineEl) this.transitionTaglineEl.textContent = transitionInfo.tagline;

        this.renderLives();
        this.showScreen('transition');

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        let count = 3;
        if (this.countdownEl) this.countdownEl.textContent = count;

        this.countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.sound.playEffect('countdown');
            }
            if (count <= 0) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.sound.playEffect('countdownFinal');
                callback();
            } else if (this.countdownEl) {
                this.countdownEl.textContent = count;
            }
        }, 900); // чуть быстрее, чтобы добавить драйва
    }

    endGame(success, rawScore) {
        console.log(`🏁 Игра завершена: ${success ? 'УСПЕХ' : 'ПРОВАЛ'}, очки: ${rawScore}`);

        if (this.currentGame) {
            this.currentGame.stop();
            this.currentGame = null;
        }

        if (success) {
            const reward = this.calculateReward(rawScore);
            this.lastEarned = reward;
            this.gamesCompleted++;
            this.updateScore(reward);
            this.showResult(true);
            this.sound.playEffect('success');
        } else {
            this.lastEarned = 0;
            this.handleMistake();
        }
    }

    showResult(success) {
        if (!this.resultIconEl || !this.resultTitleEl) return;

        if (success) {
            this.resultIconEl.textContent = '✅';
            this.resultTitleEl.textContent = 'УСПЕХ! Новая победа';
            this.screens.result.style.background = 'linear-gradient(135deg, #00b894, #00cec9)';
            document.getElementById('next-game-btn').textContent = 'Следующая игра';
            if (this.resultRestartBtn) this.resultRestartBtn.textContent = 'Начать заново';
            this.resultRestartAction = 'restart';
        } else {
            this.resultIconEl.textContent = '💥';
            this.resultTitleEl.textContent = `Ошибка! Осталось ❤️ ${this.lives}`;
            this.screens.result.style.background = 'linear-gradient(135deg, #d63031, #ff7675)';
            document.getElementById('next-game-btn').textContent = 'Продолжить смену';
            if (this.resultRestartBtn) this.resultRestartBtn.textContent = 'Выйти со смены';
            this.resultRestartAction = 'exit';
        }

        if (this.lastEarnedEl) this.lastEarnedEl.textContent = this.lastEarned;
        if (this.finalScoreEl) this.finalScoreEl.textContent = this.totalScore;
        if (this.gamesCompletedEl) this.gamesCompletedEl.textContent = this.gamesCompleted;

        this.showScreen('result');
        this.renderLives();

        console.log(`📊 Общий счет: ${this.totalScore}, Игр пройдено: ${this.gamesCompleted}, Жизней: ${this.lives}`);
    }

    nextGame() {
        const gameName = this.getRandomGame();
        this.showTransition(gameName, () => this.startGame(gameName));
    }

    restart() {
        console.log('🔄 Новая смена');
        this.startRun();
    }

    startRun() {
        this.resetState();
        this.nextGame();
    }

    showStartScreen() {
        this.resetState();
        this.showScreen('loading');
        const pressStart = document.querySelector('.press-start');
        if (pressStart) {
            pressStart.textContent = this.defaultPressStartText;
        }
        this.resultRestartAction = 'restart';
        if (this.resultRestartBtn) this.resultRestartBtn.textContent = 'Начать заново';
        window.dispatchEvent(new CustomEvent('ozon:start-screen'));
    }

    handleMistake() {
        this.lives = Math.max(0, this.lives - 1);
        this.renderLives();
        this.sound.playEffect('lifeLost');

        if (this.lives <= 0) {
            this.showGameOver();
        } else {
            this.showResult(false);
        }
    }

    showGameOver() {
        console.log('💔 Жизни кончились — показываем экран отдыха.');

        if (this.gameoverEmojiEl) this.gameoverEmojiEl.textContent = '😴';
        if (this.gameoverTitleEl) this.gameoverTitleEl.textContent = 'Сотрудник ПВЗ устал';
        if (this.gameoverSubtitleEl) this.gameoverSubtitleEl.textContent = 'Ему нужен перерыв. Начни смену заново!';
        if (this.gameoverScoreEl) this.gameoverScoreEl.textContent = this.totalScore;
        if (this.gameoverGamesEl) this.gameoverGamesEl.textContent = this.gamesCompleted;

        this.showScreen('gameover');
        this.sound.stopGameplayLoop();
    }

    handleResultRestart() {
        if (this.resultRestartAction === 'exit') {
            console.log('🚪 Завершение смены и возврат на стартовый экран');
            this.showStartScreen();
        } else {
            console.log('🔄 Перезапуск смены с начала');
            this.restart();
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

        if (this.finalScoreEl) this.finalScoreEl.textContent = this.totalScore;
    }

    renderLives() {
        // Lives отключены - элементы удалены из HTML
        return;
    }

    calculateReward(rawScore = 0) {
        const base = Math.max(10, Math.round(rawScore));
        const multiplier = 1 + this.gamesCompleted * 0.25;
        return Math.round(base * multiplier);
    }

    resetState() {
        this.totalScore = 0;
        this.gamesCompleted = 0;
        this.playedGames = [];
        this.lives = this.maxLives;
        this.lastEarned = 0;
        this.updateScore(0);
        this.renderLives();

        if (this.lastEarnedEl) this.lastEarnedEl.textContent = this.lastEarned;
    }

    updateDebug(info) {
        if (this.debugMode && this.debugPanel) {
            this.debugPanel.classList.add('active');
            this.debugInfo.innerHTML = info;
        }
    }
}

console.log('✅ game-manager.js загружен');
