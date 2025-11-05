#!/bin/bash

# 🧹 Скрипт очистки Git истории
# Удаляет все упоминания WarioWare из истории коммитов

echo "🧹 Очистка Git истории от старых упоминаний..."
echo "================================================"
echo ""

# Проверка что мы в правильной директории
if [ ! -d ".git" ]; then
    echo "❌ Ошибка: это не Git репозиторий"
    exit 1
fi

# Показать текущую историю
echo "📜 Текущая история:"
git log --oneline
echo ""

# Спросить подтверждение
read -p "⚠️  ВНИМАНИЕ: Это полностью перепишет Git историю. Продолжить? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Отменено"
    exit 0
fi

echo ""
echo "🔄 Начинаю очистку..."
echo ""

# 1. Создать резервную копию
backup_branch="backup-$(date +%Y%m%d-%H%M%S)"
git branch "$backup_branch"
echo "✅ Создана резервная копия: $backup_branch"

# 2. Сохранить remote URL
remote_url=$(git remote get-url origin 2>/dev/null)

# 3. Удалить .git
echo "🗑️  Удаляю старую историю..."
rm -rf .git

# 4. Создать новую историю
echo "📝 Создаю новую чистую историю..."
git init

# 5. Добавить все файлы
git add .

# 6. Создать единственный коммит
git commit -m "🎮 OzonWare - Dynamic mini-games collection for Ozone Design Contest

8 unique mini-games with different game mechanics:
- 🚴 Courier Runner (jump timing)
- 📦 Package Sorting (drag-and-drop)
- 🎯 Find the Item (tap detection)
- 🚦 Traffic Light (reaction)
- 🛒 Catch Items (movement)
- 🔢 Quick Math (calculation)
- 🎨 Color vs Text (attention)
- 🃏 Find Pairs (memory)

Features:
- Mobile-first design (390x844px vertical)
- Touch-optimized controls
- Fast-paced 5-7 second gameplay
- Random game sequence
- Score accumulation
- Complete documentation

Tech Stack:
- Vanilla JavaScript (ES6+)
- HTML5 Canvas API
- CSS3 with mobile-first approach
- Responsive design
- Static deployment ready

Project Stats:
- 28 files
- ~5600 lines of code
- 8 fully functional games
- Complete test suite

Ready for deployment on Vercel/GitHub Pages
Built for Ozone Design Contest 2025"

echo "✅ Новый коммит создан"

# 7. Добавить remote обратно
if [ -n "$remote_url" ]; then
    git remote add origin "$remote_url"
    echo "✅ Remote добавлен: $remote_url"
fi

# 8. Установить ветку main
git branch -M main

echo ""
echo "✅ История очищена!"
echo ""
echo "📊 Новая история:"
git log --oneline
echo ""
echo "🚀 Следующий шаг:"
echo "   git push -f origin main"
echo ""
echo "⚠️  Не забудь: это force push!"
echo ""

# Спросить про push
read -p "🚀 Запушить изменения на GitHub сейчас? (yes/no): " push_now

if [ "$push_now" = "yes" ]; then
    echo ""
    echo "📤 Пушу на GitHub..."
    git push -f origin main
    echo ""
    echo "🎉 Готово! История полностью чистая!"
    echo "🔗 Проверь: https://github.com/pinkynail228/ozone-ware/commits/main"
else
    echo ""
    echo "ℹ️  Чтобы запушить позже, используй:"
    echo "   git push -f origin main"
fi

echo ""
echo "💾 Резервная копия сохранена в ветке: $backup_branch"
echo "   (если что-то пошло не так, можно восстановить)"
echo ""
echo "✨ Всё готово!"
