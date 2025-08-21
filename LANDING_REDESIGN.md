# Landing Page Redesign Documentation

## Обзор изменений

Полная переработка главной страницы (HomePage.tsx) в стиле сайта agrocredit.kz с сохранением синей цветовой схемы и добавлением новых секций.

## Новая структура страницы

### 1. Hero Section (`HeroSection.tsx`)
- Градиентный фон с анимированными элементами
- Две колонки: контент слева, визуал справа
- Основные CTA кнопки
- Быстрые статистические данные
- Placeholder для главного изображения

### 2. Services Grid (`ServicesGrid.tsx`)
- 4 основные услуги: Гранты, Субсидии, Консультации, Обучение
- Hover эффекты и иконки
- Адаптивная сетка
- CTA внизу секции

### 3. Benefits Section (`BenefitsSection.tsx`)
- 6 преимуществ платформы
- 3-колоночная сетка на desktop
- Анимации при появлении в viewport
- Социальное подтверждение внизу

### 4. Stats Banner (`StatsBanner.tsx`)
- Анимированные счетчики
- Градиентный фон с паттерном
- 4 ключевые метрики
- Цитата внизу секции

### 5. News Carousel (`NewsCarousel.tsx`)
- Карусель новостей с 3 видимыми карточками
- Навигация стрелками
- Индикаторы слайдов
- Placeholder изображения

### 6. Partners Strip (`PartnersStrip.tsx`)
- Логотипы ключевых партнеров
- Grayscale эффект с hover
- Знак доверия
- Сетка из 6 партнеров

### 7. Testimonials Slider (`TestimonialsSlider.tsx`)
- Слайдер отзывов клиентов
- Рейтинги звездочками
- Навигация и индикаторы
- Градиентный фон

### 8. Call to Action (`CallToAction.tsx`)
- Финальный призыв к действию
- Список преимуществ
- Большая CTA кнопка
- Визуальные элементы

## Обновленная навигация

### Header изменения:
- Добавлена верхняя информационная панель с контактами
- Sticky навигация с тенью при скролле
- Улучшенный логотип с описанием
- Подчеркивание активных ссылок
- Обновленные кнопки авторизации

### Footer изменения:
- Темный фон (neutral-800)
- Многоколоночная структура
- Контактная информация
- Быстрые ссылки
- Юридическая информация

## Технические улучшения

### Tailwind Config:
- Новые анимации: slide-up, scale-in, float, counter
- Дополнительные тени: soft, medium, large, glow
- Расширенная цветовая палитра neutral
- Градиентные утилиты

### Производительность:
- React.memo для тяжелых компонентов
- Intersection Observer для ленивых анимаций
- Оптимизированные изображения с placeholder'ами
- Анимированные счетчики с requestAnimationFrame

### Отзывчивость:
- Mobile-first подход
- Breakpoints: sm, md, lg, xl
- Адаптивные сетки и типографика
- Touch-friendly элементы управления

## Placeholder изображения

Все изображения используют сервис via.placeholder.com для демонстрации:

### Замена изображений:
1. **Hero изображение**: `/src/components/home/HeroSection.tsx` строка 83
2. **Новости**: `/src/data/landingContent.ts` в массиве news.items
3. **Партнеры**: `/src/data/landingContent.ts` в массиве partners.logos  
4. **Аватары отзывов**: `/src/data/landingContent.ts` в массиве testimonials.items
5. **CTA изображение**: `/src/components/home/CallToAction.tsx` строка 87

### Рекомендуемые размеры:
- Hero: 640x480px
- Новости: 400x240px  
- Партнеры: 200x80px
- Аватары: 64x64px
- CTA: 400x400px

## Контент управление

Весь контент централизован в `/src/data/landingContent.ts`:
- Заголовки и описания всех секций
- Данные услуг, преимуществ, статистики
- Новости, партнеры, отзывы
- CTA тексты

Для изменения контента отредактируйте этот файл.

## Компоненты и файлы

### Новые файлы:
```
src/
├── data/
│   └── landingContent.ts          # Контент страницы
├── hooks/
│   └── useIntersectionObserver.ts # Хук для анимаций
└── components/home/
    ├── HeroSection.tsx            # Главная секция
    ├── ServicesGrid.tsx           # Сетка услуг  
    ├── BenefitsSection.tsx        # Преимущества
    ├── StatsBanner.tsx            # Статистический баннер
    ├── NewsCarousel.tsx           # Карусель новостей
    ├── PartnersStrip.tsx          # Полоса партнеров
    ├── TestimonialsSlider.tsx     # Слайдер отзывов
    └── CallToAction.tsx           # Призыв к действию
```

### Обновленные файлы:
- `src/pages/HomePage.tsx` - полностью переписан
- `src/components/Layout.tsx` - обновлен header и footer
- `tailwind.config.js` - добавлены анимации и утилиты
- `src/index.css` - дополнительные стили

## Запуск и разработка

```bash
# Развитие
cd frontend
npm run dev

# Сборка
npm run build

# Превью продакшен сборки  
npm run preview
```

## Дальнейшее развитие

### Приоритеты:
1. Замена placeholder изображений на реальные
2. Добавление lazy loading для изображений
3. Интеграция с CMS для управления контентом
4. A/B тестирование CTA элементов
5. SEO оптимизация метатегов

### Возможные улучшения:
- Интеграция с Google Analytics/Яндекс.Метрика
- Добавление поиска по странице
- Мультиязычность (KZ/EN)
- Темная тема
- PWA функциональность

## Совместимость

- ✅ Chrome, Firefox, Safari, Edge (последние версии)
- ✅ iOS Safari, Chrome Mobile
- ✅ Responsive design для всех устройств
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ SEO friendly markup
