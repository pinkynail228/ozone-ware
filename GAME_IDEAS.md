# 🎮 Идеи для новых мини-игр — OzonWare

## ✅ Реализовано

### 1. 🚴 Курьер-раннер
- **Механика**: Тап для прыжка, избегай препятствий
- **Время**: 10 секунд
- **Сложность**: ⭐⭐☆☆☆
- **Статус**: ✅ Готово

---

## 🚧 В разработке

### 2. 📦 Сортировка посылок
**Механика**: Драг посылок в правильные ящики

**Как реализовать**:
```javascript
// Touch drag detection
let draggedBox = null;

canvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  // Найти посылку под пальцем
  boxes.forEach(box => {
    if (isInside(x, y, box)) {
      draggedBox = box;
    }
  });
});

canvas.addEventListener('touchmove', (e) => {
  if (!draggedBox) return;
  const touch = e.touches[0];
  // Двигать посылку
  draggedBox.x = touch.clientX - rect.left;
  draggedBox.y = touch.clientY - rect.top;
});

canvas.addEventListener('touchend', () => {
  if (!draggedBox) return;
  // Проверить, попала ли в правильный ящик
  checkDrop(draggedBox);
  draggedBox = null;
});
```

**Геймплей**:
- 5 посылок разных цветов
- 3 ящика с метками (синий, красный, зеленый)
- Перетащи каждую в правильный ящик
- 8 секунд на выполнение
- Успех = все посылки отсортированы

**Визуал**:
- Посылки: простые квадраты 40x40 с цветом
- Ящики: контуры 60x60 внизу экрана
- Particle эффект при правильном drop

---

### 3. 🎯 Найди товар
**Механика**: Тап на правильный товар среди множества

**Как реализовать**:
```javascript
// Создать сетку товаров
const grid = [];
const targetItem = 'phone'; // Что искать

for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 3; col++) {
    const item = {
      type: getRandomItem(), // 'phone', 'laptop', 'tv', etc.
      x: col * 100 + 50,
      y: row * 150 + 200,
      width: 80,
      height: 80
    };
    grid.push(item);
  }
}

// 1 правильный товар
grid[Math.floor(Math.random() * grid.length)].type = targetItem;

// Тап detection
canvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  grid.forEach(item => {
    if (isInside(x, y, item)) {
      if (item.type === targetItem) {
        win();
      } else {
        lose();
      }
    }
  });
});
```

**Геймплей**:
- Показать текст: "НАЙДИ: 📱 ТЕЛЕФОН"
- 12 товаров в сетке (11 неправильных + 1 правильный)
- Один тап = одна попытка
- 7 секунд на поиск
- Успех = нашел правильный

**Визуал**:
- Товары: emoji или простые иконки
- Хаотичное расположение (как в тематике Ozone)
- Мигающая рамка вокруг правильного (после выбора)

---

## 💡 Дополнительные идеи

### 4. 🚦 Светофор
**Механика**: Тап на ЗЕЛЁНЫЙ, не тапай на красный

**Геймплей**:
- Светофор быстро меняет цвет
- Тап на зеленый = +10 очков
- Тап на красный = провал
- 5 секунд, нужно набрать 50 очков

**Реализация**:
```javascript
let color = 'red';
let colorTimer = 0;

function update() {
  colorTimer++;
  if (colorTimer > 30) { // Каждые 0.5 сек
    color = Math.random() > 0.5 ? 'green' : 'red';
    colorTimer = 0;
  }
  
  // Отрисовать круг с цветом
  drawCircle(color);
}

function onTap() {
  if (color === 'green') {
    score += 10;
  } else {
    lose();
  }
}
```

---

### 5. 📞 Ответь на звонок
**Механика**: Свайп вверх для ответа

**Геймплей**:
- Телефон "звонит" (анимация)
- Свайп вверх = ответить
- Не успел за 5 секунд = провал

**Реализация**:
```javascript
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
  const touchEndY = e.changedTouches[0].clientY;
  const deltaY = touchStartY - touchEndY;
  
  if (deltaY > 100) { // Свайп вверх
    win();
  }
});
```

---

### 6. 🛒 Поймай корзину
**Механика**: Наклон телефона для движения корзины

**Геймплей**:
- Товары падают сверху
- Наклоняй телефон влево/вправо
- Поймай 5 товаров за 8 секунд

**Реализация**:
```javascript
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', (e) => {
    const tilt = e.gamma; // -90 to 90
    basket.x += tilt * 0.5; // Двигать корзину
  });
}
```

---

### 7. 🔢 Быстрая математика
**Механика**: Тап на правильный ответ

**Геймплей**:
- Пример: "5 + 3 = ?"
- 3 варианта ответа: [7, 8, 9]
- Тап на правильный за 5 секунд

---

### 8. 🎨 Цвет или текст?
**Механика**: Тап если цвет текста совпадает со словом

**Геймплей**:
- Слово "СИНИЙ" написано красным цветом → не тапай
- Слово "СИНИЙ" написано синим → тапай
- 5 попыток за 7 секунд

---

### 9. 💨 Задуй свечу
**Механика**: Дуй в микрофон

**Геймплей**:
- Свеча горит
- Дунь в микрофон чтобы задуть
- 5 секунд

**Реализация**:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    // Анализировать громкость
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
    if (volume > 50) {
      // Задул!
      win();
    }
  });
```

---

### 10. 🌪️ Встряхни телефон
**Механика**: Встряхни для активации

**Геймплей**:
- Экран: "ВСТРЯХНИ ТЕЛЕФОН!"
- Встряхни сильно
- 5 секунд

**Реализация**:
```javascript
let lastX = 0, lastY = 0, lastZ = 0;

window.addEventListener('devicemotion', (e) => {
  const x = e.accelerationIncludingGravity.x;
  const y = e.accelerationIncludingGravity.y;
  const z = e.accelerationIncludingGravity.z;
  
  const deltaX = Math.abs(x - lastX);
  const deltaY = Math.abs(y - lastY);
  const deltaZ = Math.abs(z - lastZ);
  
  if (deltaX + deltaY + deltaZ > 30) {
    // Встряхнул!
    win();
  }
  
  lastX = x; lastY = y; lastZ = z;
});
```

---

## 🎯 Рекомендации по выбору

### Для начала реализуй:
1. **Сортировка посылок** (Game2) — простой драг, хорошо для мобильных
2. **Найди товар** (Game3) — простой тап, быстро сделать

### Для расширения:
3. **Светофор** — очень просто, весело
4. **Ответь на звонок** — свайп, интересная механика

### Для "вау-эффекта":
5. **Встряхни телефон** — используем акселерометр
6. **Задуй свечу** — используем микрофон

---

## 📐 Структура новой игры

```javascript
class NewGame {
  constructor(canvas, ctx, gameManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.gameManager = gameManager;
    
    this.gameTime = 7; // Секунды
    this.startTime = null;
    this.isRunning = false;
    this.gameLoop = null;
    this.score = 0;
    
    // Игровые объекты
    this.entities = [];
    
    this.setupControls();
  }
  
  setupControls() {
    // Touch/click handlers
    this.tapHandler = (e) => {
      e.preventDefault();
      // Handle tap
    };
    
    this.canvas.addEventListener('touchstart', this.tapHandler);
    this.canvas.addEventListener('mousedown', this.tapHandler);
  }
  
  removeControls() {
    this.canvas.removeEventListener('touchstart', this.tapHandler);
    this.canvas.removeEventListener('mousedown', this.tapHandler);
  }
  
  start() {
    this.isRunning = true;
    this.startTime = Date.now();
    this.update();
  }
  
  stop() {
    this.isRunning = false;
    if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
    this.removeControls();
  }
  
  update() {
    if (!this.isRunning) return;
    
    // Clear
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update logic
    // ...
    
    // Draw
    // ...
    
    // Check win/lose
    const elapsed = (Date.now() - this.startTime) / 1000;
    if (elapsed >= this.gameTime) {
      if (this.score >= requiredScore) {
        this.win();
      } else {
        this.lose();
      }
      return;
    }
    
    // Update UI
    this.updateUI(elapsed);
    
    this.gameLoop = requestAnimationFrame(() => this.update());
  }
  
  updateUI(elapsed) {
    const remaining = this.gameTime - elapsed;
    document.getElementById('timer-text').textContent = Math.ceil(remaining);
    document.getElementById('timer-fill').style.width = 
      (remaining / this.gameTime * 100) + '%';
    document.getElementById('score-display').textContent = this.score;
  }
  
  win() {
    console.log('🏆 Win!');
    this.stop();
    this.gameManager.endGame(true, this.score);
  }
  
  lose() {
    console.log('💀 Lose!');
    this.stop();
    this.gameManager.endGame(false, 0);
  }
}
```

---

## 🎨 Принципы дизайна:
- **Хаос**: Много движения, быстрые смены
- **Яркие цвета**: Контрастные, кричащие
- **Простота**: Максимально простая механика
- **Скорость**: 5-10 секунд максимум
- **Юмор**: Забавные ситуации

### Pixel Art:
- Минимум деталей
- Крупные пиксели
- 2-3 цвета на объект
- Анимация 2 кадра max

---

Made with 💙 for Ozone Design Contest
