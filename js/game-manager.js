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
        this.gamesList = ['delivery', 'sorting', 'game3', 'catcher', 'game6', 'shopping', 'address', 'game10'];
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
            delivery: { emoji: '🚴‍♂️', tagline: 'ТАПАЙ ДЛЯ ПРЫЖКА! ИЗБЕГАЙ ПРЕПЯТСТВИЙ!' },
            sorting: { emoji: '🧺', tagline: 'КНОПКИ: ВЗЯТЬ НУЖНОЕ, НА СКЛАД НЕНУЖНОЕ!' },
            game3: { emoji: '🔍', tagline: 'НАШЁЛ? ТАПАЙ!' },
            catcher: { emoji: '💻', tagline: 'ДВИГАЙ КОРЗИНУ! ЛОВИ ТОЛЬКО НУЖНЫЙ ТОВАР!' },
            game6: { emoji: '🧮', tagline: 'РЕШАЙ МГНОВЕННО!' },
            shopping: { emoji: '🛒', tagline: 'ТАПАЙ ТОВАРЫ ИЗ СПИСКА НА КОНВЕЙЕРЕ!' },
            address: { emoji: '📦', tagline: 'ЗАПОМНИ АДРЕС И ВЫБЕРИ ЕГО ИЗ СПИСКА!' },
            game10: { emoji: '⚖️', tagline: 'ВЫБЕРИ ПРАВИЛЬНЫЙ ВЕС!' }
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
            case 'game3':
                this.currentGame = new Game3(this.canvas, this.ctx, this);
                break;
            case 'catcher':
                this.currentGame = new CatcherGame(this.canvas, this.ctx, this);
                break;
            case 'game6':
                this.currentGame = new Game6(this.canvas, this.ctx, this);
                break;
            case 'shopping':
                this.currentGame = new ShoppingGame(this.canvas, this.ctx, this);
                break;
            case 'address':
                this.currentGame = new AddressGame(this.canvas, this.ctx, this);
                break;
            case 'game10':
                this.currentGame = new Game10(this.canvas, this.ctx, this);
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
            runner: 'КУРЬЕР-РАННЕР',
            game2: 'СОРТИРОВКА',
            game3: 'НАЙДИ ТОВАР',
            game5: 'ПОЙМАЙ НОУТБУКИ',
            game6: 'ПОСЧИТАЙ ТОВАРЫ',
            game7: 'СБОРКА ЗАКАЗА',
            game8: 'АДРЕСА ДОСТАВКИ',
            game10: 'ВЕСЫ СКЛАДА'
        };

        const instructions = {
            runner: 'Тапай чтобы прыгать!',
            game2: 'Одежда vs Техника!',
            game3: 'Тапай на правильный!',
            game5: 'Лови только ноутбуки 💻',
            game6: 'Реши пример!',
            game7: 'Собери товары из списка!',
            game8: 'Запомни адрес за 2 сек!',
            game10: 'Выбери категорию веса!'
        };

        document.getElementById('game-title').textContent = titles[gameName] || gameName.toUpperCase();
        document.getElementById('game-instruction').textContent = instructions[gameName] || 'Начинай!';
        document.getElementById('game-number-display').textContent = this.gamesCompleted + 1;

        const transitionInfo = this.transitionData[gameName] || { emoji: '🎮', tagline: 'ВПЕРЁД ЗА ХАОСОМ!' };
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
        } else {
            this.resultIconEl.textContent = '💥';
            this.resultTitleEl.textContent = `Ошибка! Осталось ❤️ ${this.lives}`;
            this.screens.result.style.background = 'linear-gradient(135deg, #d63031, #ff7675)';
            document.getElementById('next-game-btn').textContent = 'Продолжить смену';
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
        const containers = [
            document.getElementById('lives-display'),
            document.getElementById('transition-lives')
        ];

        containers.forEach(container => {
            if (!container) return;
            container.innerHTML = '';
            for (let i = 0; i < this.maxLives; i++) {
                const span = document.createElement('span');
                const active = i < this.lives;
                span.className = 'life' + (active ? ' active' : ' inactive');
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
