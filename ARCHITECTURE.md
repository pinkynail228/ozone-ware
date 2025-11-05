# 🏗️ Архитектура Ozone WarioWare

## 📐 Общая структура

```
┌─────────────────────────────────────┐
│         index.html (DOM)            │
│  ┌───────────┐  ┌──────────────┐   │
│  │  Screens  │  │   Canvas     │   │
│  │  (HTML)   │  │  (390x844)   │   │
│  └───────────┘  └──────────────┘   │
└─────────────────────────────────────┘
            ↕
┌─────────────────────────────────────┐
│         main.js (Entry)             │
│  • Event listeners                  │
│  • Initialization                   │
└─────────────────────────────────────┘
            ↕
┌─────────────────────────────────────┐
│    GameManager (Orchestrator)       │
│  • Screen management                │
│  • Score tracking                   │
│  • Game randomization               │
│  • Lifecycle control                │
└─────────────────────────────────────┘
            ↕
┌─────────────────────────────────────┐
│      Minigames (Individual)         │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │ Runner  │ │ Game2   │ │ Game3  ││
│  │ (Done)  │ │ (Stub)  │ │ (Stub) ││
│  └─────────┘ └─────────┘ └────────┘│
└─────────────────────────────────────┘
```

## 🎯 Ключевые компоненты

### 1. **GameManager** (`js/game-manager.js`)
**Центральный менеджер** — контролирует весь flow игры.

#### Ответственности:
- Переключение экранов (`showScreen()`)
- Рандомизация игр (`getRandomGame()`)
- Счет и прогресс (`totalScore`, `gamesCompleted`)
- Lifecycle мини-игр (`startGame()`, `endGame()`)
- Debug панель (`updateDebug()`)

#### Ключевые методы:
```javascript
showScreen(screenName)        // Показать экран
getRandomGame()               // Выбрать случайную игру
startGame(gameName)           // Запустить мини-игру
showTransition(game, cb)      // Обратный отсчет
endGame(success, score)       // Завершить игру
showResult(success, score)    // Показать результат
nextGame()                    // Следующая игра
restart()                     // Начать заново
```

#### Состояние:
```javascript
{
  currentGame: MiniGame | null,
  totalScore: number,
  gamesCompleted: number,
  gamesList: string[],
  playedGames: string[]
}
```

---

### 2. **MiniGame Interface** (базовый класс для игр)

Каждая мини-игра должна реализовывать:

```javascript
class MiniGame {
  constructor(canvas, ctx, gameManager) {
    this.canvas = canvas;      // Canvas элемент
    this.ctx = ctx;            // 2D context
    this.gameManager = gameManager;
    
    this.gameTime = X;         // Длительность (сек)
    this.startTime = null;     // Время старта
    this.isRunning = false;    // Статус
    this.gameLoop = null;      // requestAnimationFrame ID
    this.score = 0;            // Очки
  }
  
  start() {
    // Запустить игру
    this.isRunning = true;
    this.startTime = Date.now();
    this.update();
  }
  
  stop() {
    // Остановить игру
    this.isRunning = false;
    cancelAnimationFrame(this.gameLoop);
    // Очистить event listeners!
  }
  
  update() {
    // Игровой цикл (60 FPS)
    if (!this.isRunning) return;
    
    // 1. Очистить canvas
    // 2. Обновить логику
    // 3. Отрисовать
    // 4. Проверить win/lose
    // 5. Обновить UI
    
    this.gameLoop = requestAnimationFrame(() => this.update());
  }
}
```

**Важно**: Всегда вызывай `this.gameManager.endGame(success, score)` при завершении!

---

### 3. **RunnerGame** (`js/minigames/runner.js`)

#### Механика:
- Курьер бежит вправо (фон движется влево)
- Тап = прыжок
- Избегай препятствий (машины, пешеходы)
- 10 секунд без коллизий = успех

#### Физика:
```javascript
player.velocityY += player.gravity;  // Гравитация
player.y += player.velocityY;        // Движение

if (player.y >= groundY) {           // Земля
  player.isJumping = false;
}
```

#### Коллизии (AABB):
```javascript
if (p.x < obs.x + obs.width &&
    p.x + p.width > obs.x &&
    p.y + p.height > obs.y &&
    p.y < obs.y + obs.height) {
  // COLLISION!
}
```

#### Спавн препятствий:
```javascript
obstacleSpawnTimer++;
if (obstacleSpawnTimer >= obstacleSpawnInterval) {
  spawnObstacle();
  obstacleSpawnTimer = 0;
}
```

---

### 4. **Game2 & Game3** (заглушки)

Сейчас это простые placeholders. Чтобы добавить реальную механику:

1. Скопируй структуру из `RunnerGame`
2. Реализуй `setupControls()` (тач/драг)
3. Реализуй игровую логику в `update()`
4. Добавь `win()` / `lose()` условия
5. Обнови названия в `game-manager.js`:

```javascript
const titles = {
  'game2': 'СОРТИРОВКА ПОСЫЛОК',
  'game3': 'НАЙДИ ТОВАР'
};
```

**Идеи для механик**:
- **Game2**: Драг посылок в правильные ящики (touch move events)
- **Game3**: Тап на правильный товар среди множества (grid + tap detection)

---

## 🎨 UI & Screens

### Экраны (HTML):
1. **loading-screen**: Главное меню
2. **transition-screen**: Обратный отсчет перед игрой
3. **game-screen**: Canvas + UI overlay
4. **result-screen**: Успех/провал

### Переключение:
```javascript
gameManager.showScreen('loading');  // Активирует .active класс
```

### UI элементы:
- **Timer bar**: `#timer-fill` (width = 100% → 0%)
- **Timer text**: `#timer-text` (секунды)
- **Score**: `#score-display` (очки)

---

## 🎮 Event Flow

### Полный цикл игры:

```
START
  ↓
[Loading Screen] ← Тап
  ↓
GameManager.nextGame()
  ↓
[Transition Screen] ← 3-2-1
  ↓
GameManager.startGame(gameName)
  ↓
[Game Screen] ← Canvas rendering (60 FPS)
  ↓
Game.update() × N кадров
  ↓
Game.endGame(success, score)
  ↓
[Result Screen]
  ↓
"Следующая игра" → nextGame()
"Начать заново" → restart()
```

---

## 🔧 Как добавить новую игру

### Шаг 1: Создать файл
```bash
touch js/minigames/my-game.js
```

### Шаг 2: Класс игры
```javascript
class MyGame {
  constructor(canvas, ctx, gameManager) {
    // Init
  }
  
  start() {
    // Start game loop
  }
  
  stop() {
    // Cleanup
  }
  
  update() {
    // Game logic (60 FPS)
    // ...
    if (winCondition) {
      this.gameManager.endGame(true, this.score);
    }
  }
}
```

### Шаг 3: Добавить в index.html
```html
<script src="js/minigames/my-game.js"></script>
```

### Шаг 4: Зарегистрировать в GameManager
```javascript
// game-manager.js
this.gamesList = ['runner', 'game2', 'game3', 'my-game'];

// В startGame():
case 'my-game':
  this.currentGame = new MyGame(this.canvas, this.ctx, this);
  break;
```

### Шаг 5: Добавить метаданные
```javascript
// В showTransition():
const titles = {
  'my-game': 'МОЯ ИГРА'
};
const instructions = {
  'my-game': 'Инструкция'
};
```

---

## 📱 Mobile Optimization

### Canvas resolution:
```javascript
canvas.width = 390;   // Physical pixels
canvas.height = 844;
```

### Touch handling:
```javascript
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();  // Prevent scrolling!
  // Handle touch
});
```

### Prevent scroll:
```javascript
document.body.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });
```

---

## 🐛 Debug

### Включить debug:
```javascript
// game-manager.js
this.debugMode = true;  // Или нажми 'D'
```

### Вывод debug info:
```javascript
this.gameManager.updateDebug(`
  FPS: ${fps}<br>
  Entities: ${entities.length}
`);
```

### Console logs:
```javascript
console.log('🎮 Event');     // Игровое событие
console.log('✅ Success');    // Успех
console.log('❌ Error');      // Ошибка
console.log('🐛 Debug');      // Debug info
```

---

## 🚀 Deploy

### GitHub Pages:
```bash
git add .
git commit -m "Deploy"
git push origin main
# Settings → Pages → main branch
```

### Vercel:
```bash
vercel
```

### Netlify:
```bash
netlify deploy --dir=. --prod
```

---

## 📊 Performance Tips

1. **Ограничь объекты**: Не больше 20-30 активных entities
2. **Object pooling**: Переиспользуй объекты вместо создания новых
3. **Throttle events**: Не обрабатывай каждый touchmove
4. **Clear memory**: `stop()` должен очищать listeners и timers
5. **Use requestAnimationFrame**: Уже используется

---

## 🎨 Style Guide

### Цвета Ozone:
- Синий: `#0066ff` (основной)
- Голубой: `#0099ff` (акцент)
- Темный: `#1a1a2e` (фон)

### Pixel Art:
- Простые формы (квадраты, круги)
- 1-2 кадра анимации максимум
- Контрастные цвета

### Fonts:
- `'Courier New', monospace` (ретро-стиль)

---

Made with 💙 for Ozone Design Contest
