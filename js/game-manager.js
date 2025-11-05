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
        this.gamesList = ['runner', 'game2', 'game3', 'game5', 'game6', 'game7', 'game8', 'game9', 'game10', 'game11'];
        this.playedGames = [];
        
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
            case 'game9':
                this.currentGame = new Game9(this.canvas, this.ctx, this);
                break;
            case 'game10':
                this.currentGame = new Game10(this.canvas, this.ctx, this);
                break;
            case 'game11':
                this.currentGame = new Game11(this.canvas, this.ctx, this);
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
            'game9': 'СКЛАДСКИЕ ПОЛКИ',
            'game10': 'ВЕСЫ СКЛАДА',
            'game11': 'ПРИЁМКА ТОВАРОВ'
        };
        
        const instructions = {
            'runner': 'Тапай чтобы прыгать!',
            'game2': 'Одежда vs Техника!',
            'game3': 'Тапай на правильный!',
            'game5': 'Лови только ноутбуки 💻',
            'game6': 'Реши пример!',
            'game7': 'Собери товары из списка!',
            'game8': 'Запомни адрес за 2 сек!',
            'game9': 'Свайпай на полку!',
            'game10': 'Выбери категорию веса!',
            'game11': 'Свайп вверх/вниз!'
        };
        
        document.getElementById('game-title').textContent = titles[gameName] || gameName.toUpperCase();
        document.getElementById('game-instruction').textContent = instructions[gameName] || 'Начинай!';
        document.getElementById('game-number-display').textContent = this.gamesCompleted + 1;
        
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
        
        // Остановить игру
        if (this.currentGame) {
            this.currentGame.stop();
        }
        
        // Обновить счет
        if (success) {
            this.totalScore += score;
            this.gamesCompleted++;
        }
        
        // Показать результат
        this.showResult(success, score);
    }
    
    /**
     * Показать экран результата
     */
    showResult(success, score) {
        const resultIcon = document.getElementById('result-icon');
        const resultTitle = document.getElementById('result-title');
        
        if (success) {
            resultIcon.textContent = '✅';
            resultTitle.textContent = 'УСПЕХ!';
            this.screens.result.style.background = 'linear-gradient(135deg, #00b894, #00cec9)';
        } else {
            resultIcon.textContent = '❌';
            resultTitle.textContent = 'ПРОВАЛ!';
            this.screens.result.style.background = 'linear-gradient(135deg, #d63031, #ff7675)';
        }
        
        document.getElementById('final-score').textContent = this.totalScore;
        document.getElementById('games-completed').textContent = this.gamesCompleted;
        
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
        this.totalScore = 0;
        this.gamesCompleted = 0;
        this.playedGames = [];
        this.nextGame();
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
}

console.log('✅ game-manager.js загружен');
