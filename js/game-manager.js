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
        this.gamesList = ['delivery', 'sorting', 'finder', 'catcher', 'calculator', 'shopping', 'address', 'weighing', 'loadingDock', 'inspection', 'scanner', 'roulette'];
        this.playedGames = [];
        this.recentGames = [];
        this.currentGameKey = null;
        this.mode = 'shift';
        this.currentLevelKey = null;
        this.levelMeta = null;
        this.levelLastScore = 0;
        this.shiftCompletedGames = new Set();
        this.shiftFinished = false;

        this.defaultPressStartText = document.querySelector('.press-start')?.textContent || 'Нажми, чтобы начать!';

        // DOM элементы экранов
        this.screens = {
            loading: document.getElementById('loading-screen'),
            transition: document.getElementById('transition-screen'),
            levelSelect: document.getElementById('level-select-screen'),
            game: document.getElementById('game-screen'),
            result: document.getElementById('result-screen'),
            levelResult: document.getElementById('level-result-screen'),
            shiftComplete: document.getElementById('shift-complete-screen'),
            gameover: document.getElementById('gameover-screen')
        };

        this.gameCatalog = {
            delivery: {
                title: 'Курьерская доставка',
                emoji: '🚴‍♂️',
                tagline: 'Тапай для прыжка! Избегай препятствия на пути',
                description: 'Перепрыгивай коробки и конусы, чтобы успеть довезти заказ до ПВЗ.',
                controls: 'Тап по экрану — прыжок.',
                duration: '≈ 6 секунд'
            },
            sorting: {
                title: 'Сортировка на складе',
                emoji: '🧺',
                tagline: 'Жми ВЗЯТЬ для нужного, НА СКЛАД для остального',
                description: 'Раздели поток посылок: нужные отправь в заказ, остальные — обратно на склад.',
                controls: 'Кнопки ВЗЯТЬ и НА СКЛАД.',
                duration: '≈ 7 секунд'
            },
            finder: {
                title: 'Поиск товара',
                emoji: '🔍',
                tagline: 'Тапни на товар который показан вверху экрана',
                description: 'Найди товар из списка и не промахнись среди отвлекающих предметов.',
                controls: 'Тап по нужному товару.',
                duration: '≈ 7 секунд'
            },
            catcher: {
                title: 'Приёмка на ПВЗ',
                emoji: '📦',
                tagline: 'Двигай корзину! Лови ТОЛЬКО показанный товар',
                description: 'Катай контейнер по ленте и лови нужные коробки, избегая лишнего.',
                controls: 'Свайп/перетаскивание по экрану — движение корзины.',
                duration: '≈ 8 секунд'
            },
            calculator: {
                title: 'Расчёт заказа',
                emoji: '🧮',
                tagline: 'Реши пример и тапни правильный ответ',
                description: 'Считай быстрее всех — выбирай верный ответ до окончания таймера.',
                controls: 'Тап по правильному числу.',
                duration: '≈ 6 секунд'
            },
            shopping: {
                title: 'Комплектация заказа',
                emoji: '🛒',
                tagline: 'Тапай товары из списка сверху на конвейере',
                description: 'Собери заказ по списку — отмечай только нужные позиции на конвейере.',
                controls: 'Тап по нужному товару.',
                duration: '≈ 8 секунд'
            },
            address: {
                title: 'Адрес доставки',
                emoji: '🏠',
                tagline: 'Запомни адрес, потом выбери его из списка',
                description: 'Запомни адрес клиента и найди его среди похожих вариантов.',
                controls: 'Тап по верному адресу.',
                duration: '≈ 7 секунд'
            },
            weighing: {
                title: 'Взвешивание товара',
                emoji: '⚖️',
                tagline: 'Посмотри вес товара и выбери категорию',
                description: 'Определи тариф: выбери правильную весовую категорию для посылки.',
                controls: 'Тап по нужной категории.',
                duration: '≈ 6 секунд'
            },
            loadingDock: {
                title: 'Погрузочная рампа',
                emoji: '📦',
                tagline: 'Тапай быстрее, заталкивай коробку в фургон',
                description: 'Толкай коробку в кузов — быстрые тапы спасут смену!',
                controls: 'Быстрые тапы по экрану.',
                duration: '≈ 5 секунд'
            },
            inspection: {
                title: 'Приёмка: Лови товар',
                emoji: '⚡️',
                tagline: 'Жми в тот момент, когда коробка летит вниз',
                description: 'Склад тряхнуло — коробка падает со стеллажа. Подставь тележку вовремя, иначе всё разобьётся.',
                controls: 'Один тап в момент падения.',
                duration: '≈ 6 секунд'
            },
            scanner: {
                title: 'Сканирование посылок',
                emoji: '🔦',
                tagline: 'Попади лампой по посылке и тапни для скана',
                description: 'Води сканером по складу, подсвети штрихкод и подтвердите скан.',
                controls: 'Перетаскивание лампы + тап для скана.',
                duration: '≈ 7 секунд'
            },
            roulette: {
                title: 'Финальный этап',
                emoji: '🎁',
                tagline: 'Получи награду за смену',
                description: 'Смена окончена! Получи заслуженную награду за отличную работу.',
                controls: 'Тап для получения приза.',
                duration: '≈ 10 секунд'
            }
        };

        this.transitionData = Object.fromEntries(
            Object.entries(this.gameCatalog).map(([key, meta]) => [key, { emoji: meta.emoji, tagline: meta.tagline }])
        );

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
        this.shiftFinalScoreEl = document.getElementById('shift-final-score');
        this.resultRestartBtn = document.getElementById('restart-btn');
        this.resultRestartAction = 'restart';

        this.levelListEl = document.getElementById('level-list');
        this.levelDetailEl = document.getElementById('level-detail');
        this.levelDetailEmojiEl = document.getElementById('level-detail-emoji');
        this.levelDetailTitleEl = document.getElementById('level-detail-title');
        this.levelDetailTaglineEl = document.getElementById('level-detail-tagline');
        this.levelDetailDescriptionEl = document.getElementById('level-detail-description');
        this.levelDetailControlsEl = document.getElementById('level-detail-controls');
        this.levelDetailDurationEl = document.getElementById('level-detail-duration');
        this.playLevelBtn = document.getElementById('play-level-btn');

        this.levelResultEmojiEl = document.getElementById('level-result-emoji');
        this.levelResultTitleEl = document.getElementById('level-result-title');
        this.levelResultSubtitleEl = document.getElementById('level-result-subtitle');
        this.levelResultScoreEl = document.getElementById('level-result-score');

        this.gameoverEmojiEl = document.getElementById('gameover-emoji');
        this.gameoverTitleEl = document.getElementById('gameover-title');
        this.gameoverSubtitleEl = document.getElementById('gameover-subtitle');
        this.gameoverScoreEl = document.getElementById('gameover-score');
        this.gameoverGamesEl = document.getElementById('gameover-games');

        // Коллекции уровней
        this.levelButtons = new Map();
        this.levelActiveButton = null;

        // Звук
        this.sound = new window.SoundManager();

        // Debug
        this.debugPanel = document.getElementById('debug-panel');
        this.debugInfo = document.getElementById('debug-info');
        this.debugMode = false;

        // Переходы
        this.countdownInterval = null;

        if (this.levelListEl) {
            this.buildLevelSelect();
            this.resetLevelSelection();
        }

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

        // Запускаем gameplay loop только если это НЕ финальный этап
        if (screenName === 'game' || screenName === 'transition') {
            if (this.currentGameKey !== 'roulette') {
                this.sound.startGameplayLoop();
            } else {
                console.log('🔇 Финальный этап: пропускаем gameplay loop');
            }
        } else {
            this.sound.stopGameplayLoop();
        }
    }

    buildLevelSelect() {
        if (!this.levelListEl) return;

        this.levelListEl.innerHTML = '';
        this.levelButtons.clear();
        this.levelActiveButton = null;

        Object.entries(this.gameCatalog).forEach(([key, meta]) => {
            const button = document.createElement('button');
            button.className = 'level-item';
            button.innerHTML = `
                <span class="level-emoji">${meta.emoji}</span>
                <span class="level-name">${meta.title}</span>
                <span class="level-duration">${meta.duration}</span>
            `;
            button.addEventListener('click', () => this.selectLevel(key));
            this.levelListEl.appendChild(button);
            this.levelButtons.set(key, button);
        });

        this.resetLevelSelection();
    }

    resetLevelSelection() {
        this.currentLevelKey = null;
        this.levelMeta = null;
        this.levelLastScore = 0;

        if (this.levelActiveButton) {
            this.levelActiveButton.classList.remove('active');
            this.levelActiveButton = null;
        }

        if (this.levelDetailEl) {
            this.levelDetailEl.classList.add('hidden');
        }

        if (this.playLevelBtn) {
            this.playLevelBtn.disabled = true;
        }
    }

    selectLevel(levelKey) {
        const meta = this.gameCatalog[levelKey];
        if (!meta) {
            console.warn(`⚠️ Нет данных для уровня ${levelKey}`);
            return;
        }

        this.currentLevelKey = levelKey;
        this.levelMeta = meta;

        if (this.levelActiveButton) {
            this.levelActiveButton.classList.remove('active');
        }

        const button = this.levelButtons.get(levelKey);
        if (button) {
            button.classList.add('active');
            this.levelActiveButton = button;
        }

        if (this.levelDetailEl) {
            this.levelDetailEl.classList.remove('hidden');
        }
        if (this.levelDetailEmojiEl) this.levelDetailEmojiEl.textContent = meta.emoji;
        if (this.levelDetailTitleEl) this.levelDetailTitleEl.textContent = meta.title;
        if (this.levelDetailTaglineEl) this.levelDetailTaglineEl.textContent = meta.tagline;
        if (this.levelDetailDescriptionEl) this.levelDetailDescriptionEl.textContent = meta.description;
        if (this.levelDetailControlsEl) this.levelDetailControlsEl.textContent = meta.controls ? `Управление: ${meta.controls}` : '';
        if (this.levelDetailDurationEl) this.levelDetailDurationEl.textContent = meta.duration ? `Длительность: ${meta.duration}` : '';

        if (this.playLevelBtn) {
            this.playLevelBtn.disabled = false;
        }
    }

    startShift() {
        console.log('🏁 Запуск смены (режим shift)');
        this.mode = 'shift';
        this.startRun();
    }

    enterLevelSelect(preserveSelection = false) {
        this.mode = 'level';
        this.sound.stopGameplayLoop();
        this.buildLevelSelect();

        if (preserveSelection && this.currentLevelKey) {
            this.selectLevel(this.currentLevelKey);
        } else {
            this.resetLevelSelection();
        }

        this.showScreen('levelSelect');
    }

    returnToLevelSelect() {
        this.enterLevelSelect(true);
    }

    startLevel(levelKey) {
        if (!this.gameCatalog[levelKey]) {
            console.warn(`⚠️ Попытка запустить неизвестный уровень: ${levelKey}`);
            return;
        }

        this.mode = 'level';
        this.currentLevelKey = levelKey;
        this.levelMeta = this.gameCatalog[levelKey];
        this.levelLastScore = 0;

        this.startGame(levelKey);
    }

    startSelectedLevel() {
        if (!this.currentLevelKey) {
            console.warn('⚠️ Уровень не выбран');
            return;
        }

        this.startLevel(this.currentLevelKey);
    }

    showLevelResult(success) {
        if (this.levelResultEmojiEl) this.levelResultEmojiEl.className = success ? 'result-icon success' : 'result-icon fail';
        if (this.levelResultTitleEl) this.levelResultTitleEl.textContent = success ? 'Задание выполнено' : 'Почти получилось';

        const subtitle = success
            ? 'Сотрудник доволен! Возвращайся к выбору уровней.'
            : 'Попробуй ещё раз — уровень уже ждёт!';
        if (this.levelResultSubtitleEl) this.levelResultSubtitleEl.textContent = subtitle;

        if (this.levelResultScoreEl) this.levelResultScoreEl.textContent = this.levelLastScore;

        this.sound.stopGameplayLoop();
        this.showScreen('levelResult');
    }

    getRandomGame() {
        if (this.playedGames.length >= this.gamesList.length) {
            this.playedGames = [];
            console.log('🔄 Все игры сыграны, список обновлён');
        }

        const recentBlock = this.recentGames.slice(-2);

        let available = this.gamesList.filter(game => !this.playedGames.includes(game) && !recentBlock.includes(game));

        if (available.length === 0) {
            available = this.gamesList.filter(game => !recentBlock.includes(game));
        }

        if (available.length === 0) {
            available = [...this.gamesList];
        }

        const chosen = available[Math.floor(Math.random() * available.length)];
        this.playedGames.push(chosen);
        this.recentGames.push(chosen);
        if (this.recentGames.length > 2) {
            this.recentGames.shift();
        }

        console.log(`🎲 Выбрана игра: ${chosen}`);
        return chosen;
    }

    startGame(gameName) {
        console.log(`▶️ Запуск игры: ${gameName}`);

        // Специальная обработка для финального этапа - БЕЗ тикающих звуков!
        if (gameName !== 'roulette') {
            this.sound.enable();
            this.sound.playEffect('transition');
        } else {
            console.log('🔇 Финальный этап: отключаем все игровые звуки');
            this.sound.mute(true); // Заглушаем звук для финального этапа
        }

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
            case 'loadingDock':
                this.currentGame = new LoadingDockGame(this.canvas, this.ctx, this);
                break;
            case 'inspection':
                this.currentGame = new InspectionGame(this.canvas, this.ctx, this);
                break;
            case 'scanner':
                this.currentGame = new ScannerGame(this.canvas, this.ctx, this);
                break;
            case 'roulette':
                console.log('🏠 Запуск нормального финального этапа с плавной анимацией');
                this.currentGame = new FinalNormalGame(this.canvas, this.ctx, this);
                break;
            default:
                console.error(`❌ Неизвестная игра: ${gameName}`);
                return;
        }

        this.currentGameKey = gameName;
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
            weighing: 'Взвешивание товара',
            loadingDock: 'Погрузочная рампа',
            inspection: 'Приёмка товаров',
            scanner: 'Сканирование посылок'
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

        const normalizedScore = typeof rawScore === 'number' ? Math.max(0, Math.round(rawScore)) : 0;

        if (this.mode === 'level') {
            this.levelLastScore = normalizedScore;
            if (success) {
                this.sound.playEffect('success');
            } else {
                this.sound.playEffect('lifeLost');
            }
            this.showLevelResult(success);
            return;
        }

        if (success) {
            const reward = this.calculateReward(normalizedScore);
            this.lastEarned = reward;
            this.gamesCompleted++;
            this.updateScore(reward);
            if (this.currentGameKey) {
                this.shiftCompletedGames.add(this.currentGameKey);
            }
            if (!this.shiftFinished && this.shiftCompletedGames.size >= this.gamesList.length) {
                this.showShiftComplete();
            } else {
                this.showResult(true);
            }
            this.sound.playEffect('success');
        } else {
            this.lastEarned = 0;
            this.handleMistake();
        }
    }

    showResult(success) {
        if (this.mode !== 'shift') {
            console.warn('⚠️ Показ результата доступен только в режиме смены');
            return;
        }

        if (!this.resultIconEl || !this.resultTitleEl) return;

        if (success) {
            this.resultIconEl.className = 'result-icon success';
            this.resultTitleEl.innerHTML = 'Готово! Заказ уходит в ПВЗ';
            this.screens.result.style.background = 'linear-gradient(180deg, #00D9A3 0%, #00B386 100%)';
            document.getElementById('next-game-btn').textContent = 'Следующая игра';
            if (this.resultRestartBtn) this.resultRestartBtn.textContent = 'Выйти со смены';
            this.resultRestartAction = 'exit';
        } else {
            this.resultIconEl.className = 'result-icon fail';
            const hearts = '❤️'.repeat(Math.max(0, this.lives)) || '❤️';
            this.resultTitleEl.innerHTML = `ПВЗ заметил ошибку<br><span class="result-hearts">${hearts}</span>`;
            this.screens.result.style.background = 'linear-gradient(180deg, #FF6B6B 0%, #CC0000 100%)';
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
        if (this.mode !== 'shift') {
            console.warn('⚠️ Следующая игра доступна только в режиме смены');
            return;
        }

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
        if (this.mode === 'level') {
            this.levelLastScore = 0;
            this.sound.playEffect('lifeLost');
            this.showLevelResult(false);
            return;
        }

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

        if (this.gameoverEmojiEl) this.gameoverEmojiEl.className = 'result-icon gameover';
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
        this.mode = 'shift';
        this.totalScore = 0;
        this.gamesCompleted = 0;
        this.playedGames = [];
        this.recentGames = [];
        this.shiftCompletedGames.clear();
        this.shiftFinished = false;
        this.lives = this.maxLives;
        this.lastEarned = 0;
        this.currentGameKey = null;
        this.currentLevelKey = null;
        this.levelMeta = null;
        this.levelLastScore = 0;
        this.updateScore(0);
        this.renderLives();

        if (this.lastEarnedEl) this.lastEarnedEl.textContent = this.lastEarned;

        if (this.levelListEl) {
            this.resetLevelSelection();
        }
    }

    showShiftComplete() {
        this.shiftFinished = true;
        if (this.shiftFinalScoreEl) {
            this.shiftFinalScoreEl.textContent = this.totalScore;
        }
        this.showScreen('shiftComplete');
        this.sound.stopGameplayLoop();
    }

    updateDebug(info) {
        if (this.debugMode && this.debugPanel) {
            this.debugPanel.classList.add('active');
            this.debugInfo.innerHTML = info;
        }
    }
}

console.log('✅ game-manager.js загружен');
