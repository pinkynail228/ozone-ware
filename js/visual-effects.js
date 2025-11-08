/**
 * PREMIUM VISUAL EFFECTS SYSTEM
 * Система градиентных эмодзи и визуальных эффектов
 */

class VisualEffects {
    constructor() {
        this.emojiCategories = {
            tech: ['📱', '💻', '🎧', '⌚', '📷', '🖥️', '⌨️', '🖱️'],
            clothes: ['👕', '👖', '👟', '🧢', '🧥', '👗', '👠', '🧦'],
            food: ['🍎', '🍌', '🍕', '🍔', '🍰', '🍪', '🥤', '🍇'],
            delivery: ['📦', '🚚', '🏠', '📍', '🛒', '💳', '⚖️', '🧺']
        };
        
        this.gradientStyles = {
            tech: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            clothes: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
            food: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
            delivery: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            default: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #ffeaa7 100%)'
        };
        
        this.init();
    }
    
    init() {
        console.log('🎨 Visual Effects System initialized');
    }
    
    /**
     * Создает градиентный эмодзи элемент
     */
    createGradientEmoji(emoji, category = 'default', size = '48px') {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.style.fontSize = size;
        span.style.fontWeight = 'bold';
        span.style.background = this.gradientStyles[category] || this.gradientStyles.default;
        span.style.backgroundSize = '200% 200%';
        span.style.webkitBackgroundClip = 'text';
        span.style.webkitTextFillColor = 'transparent';
        span.style.backgroundClip = 'text';
        span.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))';
        span.style.animation = `${category}Pulse 2s ease-in-out infinite`;
        span.className = `gradient-emoji ${category}-emoji`;
        
        return span;
    }
    
    /**
     * Определяет категорию эмодзи
     */
    getEmojiCategory(emoji) {
        for (const [category, emojis] of Object.entries(this.emojiCategories)) {
            if (emojis.includes(emoji)) {
                return category;
            }
        }
        return 'default';
    }
    
    /**
     * Применяет градиентный эффект к canvas тексту
     */
    drawGradientEmoji(ctx, emoji, x, y, size = 48) {
        const category = this.getEmojiCategory(emoji);
        
        // Создаем временный canvas для градиента
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = size * 2;
        tempCanvas.height = size * 2;
        
        // Рисуем эмодзи
        tempCtx.font = `${size}px Arial`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(emoji, size, size);
        
        // Применяем эффект свечения
        ctx.save();
        ctx.shadowColor = this.getShadowColor(category);
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Рисуем с эффектом
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Создаем градиент
        const gradient = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2);
        const colors = this.getGradientColors(category);
        colors.forEach((color, index) => {
            gradient.addColorStop(index / (colors.length - 1), color);
        });
        
        ctx.fillStyle = gradient;
        ctx.fillText(emoji, x, y);
        ctx.restore();
    }
    
    /**
     * Получает цвета градиента для категории
     */
    getGradientColors(category) {
        const colorMap = {
            tech: ['#667eea', '#764ba2', '#f093fb'],
            clothes: ['#ff9a9e', '#fecfef', '#fad0c4'],
            food: ['#fdbb2d', '#22c1c3', '#a8edea'],
            delivery: ['#4facfe', '#00f2fe', '#43e97b'],
            default: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']
        };
        return colorMap[category] || colorMap.default;
    }
    
    /**
     * Получает цвет тени для категории
     */
    getShadowColor(category) {
        const shadowMap = {
            tech: 'rgba(102, 126, 234, 0.6)',
            clothes: 'rgba(255, 154, 158, 0.6)',
            food: 'rgba(253, 187, 45, 0.6)',
            delivery: 'rgba(79, 172, 254, 0.6)',
            default: 'rgba(0, 191, 255, 0.6)'
        };
        return shadowMap[category] || shadowMap.default;
    }
    
    /**
     * Создает частицы для фона
     */
    createParticles(container, count = 20) {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles-container';
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 4 + 's';
            particle.style.animationDuration = (4 + Math.random() * 2) + 's';
            particlesContainer.appendChild(particle);
        }
        
        container.appendChild(particlesContainer);
        return particlesContainer;
    }
    
    /**
     * Создает премиум карточку
     */
    createPremiumCard(content) {
        const card = document.createElement('div');
        card.className = 'premium-card';
        card.innerHTML = content;
        return card;
    }
    
    /**
     * Создает премиум кнопку
     */
    createPremiumButton(text, onClick) {
        const button = document.createElement('button');
        button.className = 'premium-button';
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }
    
    /**
     * Добавляет эффект свечения к элементу
     */
    addGlowEffect(element, color = 'blue') {
        element.classList.add(`glow-${color}`);
    }
    
    /**
     * Создает анимированный фон с градиентом
     */
    createAnimatedBackground(element, colors) {
        const gradient = `linear-gradient(135deg, ${colors.join(', ')})`;
        element.style.background = gradient;
        element.style.backgroundSize = '300% 300%';
        element.style.animation = 'gradientShift 4s ease infinite';
    }
    
    /**
     * Применяет эффект размытия стекла
     */
    applyGlassEffect(element) {
        element.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)';
        element.style.backdropFilter = 'blur(10px)';
        element.style.border = '1px solid rgba(255,255,255,0.2)';
        element.style.borderRadius = '20px';
        element.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
    }
}

// Создаем глобальный экземпляр
window.visualEffects = new VisualEffects();

console.log('✨ Premium Visual Effects loaded');
