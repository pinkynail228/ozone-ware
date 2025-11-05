# 📤 Заливка на GitHub

## ✅ Уже сделано:

- ✅ Git инициализирован
- ✅ 28 файлов добавлены
- ✅ Коммит создан (5606 строк кода)

---

## 🚀 Следующие шаги:

### Шаг 1: Создать репозиторий на GitHub

1. Открыть [github.com/new](https://github.com/new)
2. **Repository name**: `ozonware`
3. **Description**: `🎮 Dynamic mini-games collection for Ozone Design Contest`
4. **Public** ✅ (или Private)
5. **НЕ добавлять**:
   - ❌ README
   - ❌ .gitignore
   - ❌ License
6. Нажать **"Create repository"**

---

### Шаг 2: Залить код

GitHub покажет команды, но вот готовые:

```bash
# Добавить remote (замени USERNAME на свой)
git remote add origin https://github.com/USERNAME/ozonware.git

# Переименовать ветку в main
git branch -M main

# Залить код
git push -u origin main
```

**Или через SSH:**

```bash
git remote add origin git@github.com:USERNAME/ozonware.git
git branch -M main
git push -u origin main
```

---

### Шаг 3: Проверить

Открой репозиторий на GitHub, должно быть:
- ✅ 28 файлов
- ✅ README.md с описанием
- ✅ 8 мини-игр в js/minigames/
- ✅ Документация (ARCHITECTURE.md, TESTING.md, etc.)

---

## 📋 Готовые команды (скопируй и подставь USERNAME):

```bash
# 1. Добавить remote
git remote add origin https://github.com/USERNAME/ozonware.git

# 2. Залить код
git branch -M main
git push -u origin main
```

**Введи свои данные Git (если еще не настроено):**

```bash
git config --global user.name "Твое Имя"
git config --global user.email "твой@email.com"

# Исправить коммит с новыми данными
git commit --amend --reset-author --no-edit
```

---

## 🔐 Аутентификация:

### Вариант 1: Personal Access Token (рекомендуется)

1. Открыть [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
3. Название: `Ozone WarioWare Deploy`
4. Срок: 90 days
5. Права: ✅ **repo**
6. Создать и **скопировать токен**

При `git push` вставить токен вместо пароля.

### Вариант 2: SSH ключ

```bash
# Создать SSH ключ
ssh-keygen -t ed25519 -C "твой@email.com"

# Скопировать публичный ключ
cat ~/.ssh/id_ed25519.pub

# Добавить на GitHub:
# https://github.com/settings/ssh/new
```

---

## 🎯 После заливки на GitHub:

### 1. Обновить README на GitHub
Добавить ссылку на демо (после деплоя на Vercel)

### 2. Добавить Topics
На странице репозитория → Settings → Topics:
- `game`
- `warioware`
- `javascript`
- `mobile-first`
- `ozone`

### 3. Настроить GitHub Pages (опционально)
Settings → Pages → Source: main branch → Save

Игра будет доступна на:
```
https://USERNAME.github.io/ozonware/
```

---

## 📊 Статистика проекта:

```
28 файлов
5606 строк кода
8 мини-игр
~3500 строк JavaScript
```

---

## 🚀 Готово к следующему шагу!

После заливки на GitHub можно:
1. ✅ Подключить Vercel (автодеплой)
2. ✅ Поделиться кодом
3. ✅ Принимать pull requests
4. ✅ Отслеживать issues

---

**Жми создать репозиторий! 🎮**
