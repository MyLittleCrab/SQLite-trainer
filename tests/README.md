# Puppeteer Tests - Структура проекта

Тесты для SQLite WebAssembly Playground разделены на логические модули для лучшей организации и поддержки.

## 📁 Структура файлов

### 🛠️ Утилиты (`utils/`)
- **`test-config.js`** - Базовая конфигурация, утилиты и общие классы

### 🎯 Основные тестовые модули

1. **`ui-basic-tests.js`** - Тесты базовой функциональности UI
   - Загрузка страницы
   - Проверка элементов интерфейса
   - Инициализация SQLite
   - Отображение схемы
   - Примеры запросов
   - Обработка ошибок
   - Responsive дизайн
   - Обновление схемы после INSERT

2. **`i18n-tests.js`** - Тесты системы интернационализации
   - Проверка загрузки i18n системы
   - Переключение языков (EN/RU)
   - Загрузка JSON файлов переводов
   - Сохранение языка в localStorage

3. **`task-system-tests.js`** - Тесты системы задач
   - Отображение элементов задач
   - Локализация текстовых полей
   - Выполнение SQL задач
   - Смена задач
   - Проверка подсказок

4. **`sql-function-tests.js`** - Тесты SQL функций
   - Функция `executeTestSQL`
   - Функция `checkSolutionSQL`
   - Кнопки выполнения запросов
   - Модальные окна результатов

### 📊 Дополнительные тестовые модули (примеры)

5. **`performance-tests.js`** - Тесты производительности
   - Скорость загрузки страницы
   - Инициализация SQLite
   - Время выполнения запросов
   - Использование памяти
   - Отзывчивость интерфейса

6. **`accessibility-tests.js`** - Тесты доступности
   - Навигация с клавиатуры
   - ARIA метки и атрибуты
   - Контрастность цветов
   - Совместимость со скринридерами
   - Управление фокусом

### 🚀 Запуск тестов

- **`run-all-tests.js`** - Главный файл для запуска всех тестов
- **`puppeteer-tests.js`** - Оригинальный файл (можно удалить после перехода)

## 🎮 Как использовать

### Запуск всех тестов
```bash
node tests/run-all-tests.js
```

### Запуск отдельных групп тестов
```javascript
// Пример запуска только UI тестов
const { puppeteer, TestRunner, waitForServer } = require('./utils/test-config');
const UIBasicTests = require('./ui-basic-tests');

async function runUITestsOnly() {
    const runner = new TestRunner();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const uiTests = new UIBasicTests(page, runner);
    await uiTests.testPageLoad();
    await uiTests.testUIElements();
    // ... другие тесты
    
    await browser.close();
    return runner.summary();
}
```

## 🏗️ Архитектура

### Базовые классы
- **`TestRunner`** - Управление результатами тестов и отчетностью
- **`BaseTest`** - Базовый класс для всех тестовых модулей

### Наследование
Все тестовые классы наследуются от `BaseTest`:
```javascript
class UIBasicTests extends BaseTest {
    constructor(page, runner) {
        super(page, runner);
        // this.page и this.runner доступны
    }
}
```

## 🎯 Преимущества новой структуры

1. **Модульность** - Каждая группа тестов в отдельном файле
2. **Переиспользование** - Общие утилиты выносятся в отдельный модуль
3. **Масштабируемость** - Легко добавлять новые тестовые модули
4. **Читаемость** - Понятная организация по функциональным областям
5. **Гибкость** - Можно запускать как все тесты, так и отдельные группы

## 📊 Отчетность

Каждый тестовый класс использует общий `TestRunner` для:
- Подсчета пройденных/провалившихся тестов
- Вывода результатов в консоль
- Генерации итогового отчета

## 🔧 Добавление новых тестов

1. Создайте новый файл тестов (например, `performance-tests.js`)
2. Импортируйте `BaseTest` из `utils/test-config`
3. Создайте класс, наследующийся от `BaseTest`
4. Добавьте новый модуль в `run-all-tests.js`

Пример:
```javascript
const { BaseTest } = require('./utils/test-config');

class PerformanceTests extends BaseTest {
    async testLoadingSpeed() {
        console.log('\n🧪 Тест: Скорость загрузки');
        // ... ваш код теста
    }
}

module.exports = PerformanceTests;
```