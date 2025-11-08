/**
 * MAIN.JS - Точка входа в игру
 * Инициализация, обработка событий, запуск игрового менеджера
 */

console.log('🚀 Инициализация Ozone WarioWare...');

// Глобальные переменные
let gameManager = null;
let startListenersAttached = false;

function addStartListeners(loadingScreen) {
    if (!loadingScreen || startListenersAttached) return;
    loadingScreen.addEventListener('click', startFirstGame, { passive: false });
    loadingScreen.addEventListener('touchstart', startFirstGame, { passive: false });
    startListenersAttached = true;
}

function removeStartListeners(loadingScreen) {
    if (!loadingScreen || !startListenersAttached) return;
    loadingScreen.removeEventListener('click', startFirstGame, { passive: false });
    loadingScreen.removeEventListener('touchstart', startFirstGame, { passive: false });
    startListenersAttached = false;
}

/**
 * Инициализация при загрузке страницы
 */
window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен');
    
    // Создать менеджер игры
    gameManager = new GameManager();
    
    // Показать экран загрузки
    gameManager.showScreen('loading');
    
    // Обработчики кнопок
    setupEventListeners();
    
    // Предотвратить прокрутку на мобильных
    document.body.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    console.log('✅ Игра готова к запуску');
});

/**
 * Настроить обработчики событий
 */
function setupEventListeners() {
    console.log('🎮 Настройка обработчиков событий...');
    
    // Экран загрузки - тап для старта
    const loadingScreen = document.getElementById('loading-screen');
    addStartListeners(loadingScreen);
    
    // Кнопка "Следующая игра"
    const nextGameBtn = document.getElementById('next-game-btn');
    nextGameBtn.addEventListener('click', () => {
        console.log('🔄 Нажата кнопка: Следующая игра');
        gameManager.nextGame();
    });
    
    // Кнопка перезапуска/выхода со смены
    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', () => {
        console.log('🔁 Нажата кнопка: перезапуск/выход со смены');
        gameManager.handleResultRestart();
    });

    // Кнопка на экране Game Over
    const gameoverRestartBtn = document.getElementById('gameover-restart-btn');
    if (gameoverRestartBtn) {
        gameoverRestartBtn.addEventListener('click', () => {
            console.log('🏁 Нажата кнопка: Вернуться на заставку');
            gameManager.showStartScreen();
        });
    }
    
    // Debug: Нажатие D для включения debug панели
    document.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            gameManager.debugMode = !gameManager.debugMode;
            if (!gameManager.debugMode) {
                gameManager.debugPanel.classList.remove('active');
            }
            console.log(`🐛 Debug режим: ${gameManager.debugMode ? 'ВКЛ' : 'ВЫКЛ'}`);
        }
    });
    
    console.log('✅ Обработчики настроены');
}

/**
 * Запустить первую игру
 */
function startFirstGame(e) {
    e.preventDefault();
    console.log('🎮 СТАРТ ИГРЫ!');
    
    // Убрать обработчики с экрана загрузки
    const loadingScreen = document.getElementById('loading-screen');
    removeStartListeners(loadingScreen);

    // Запустить первую игру
    gameManager.nextGame();
}

window.addEventListener('ozon:start-screen', () => {
    const loadingScreen = document.getElementById('loading-screen');
    addStartListeners(loadingScreen);
});

/**
 * Обработка ошибок
 */
window.addEventListener('error', (e) => {
    console.error('❌ Ошибка:', e.error);
    console.error('Stack:', e.error.stack);
});

/**
 * Обработка необработанных промисов
 */
window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Необработанный промис:', e.reason);
});

console.log('🎮 OzonWare: Загрузка...');
