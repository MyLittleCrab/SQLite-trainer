# Руководство по переходу на новую структуру тестов

## 🔄 Переход с monolith на модульную структуру

### Старая структура (1 файл)
```
tests/
└── puppeteer-tests.js (1031 строка) - УДАЛЕН
```

### Новая структура (модульная)
```
tests/
├── utils/
│   └── test-config.js          # Конфигурация и утилиты
├── ui-basic-tests.js           # Базовые UI тесты
├── i18n-tests.js               # Тесты интернационализации
├── task-system-tests.js        # Тесты системы задач
├── sql-function-tests.js       # Тесты SQL функций
├── performance-tests.js        # Тесты производительности (пример)
├── accessibility-tests.js      # Тесты доступности (пример)
├── run-all-tests.js           # Основной запуск
├── run-extended-tests.js      # Расширенный запуск
├── README.md                  # Документация
└── MIGRATION_GUIDE.md         # Это руководство
```

## 🚀 Как начать использовать

### 1. Базовые тесты (аналог оригинального файла)
```bash
node tests/run-all-tests.js
```

### 2. Расширенные тесты (с примерами производительности и доступности)
```bash
node tests/run-extended-tests.js
```

### 3. Отдельные группы тестов
```bash
# Только UI тесты
node -e "
const { waitForServer, TestRunner, puppeteer } = require('./tests/utils/test-config');
const UIBasicTests = require('./tests/ui-basic-tests');

(async () => {
    await waitForServer();
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const runner = new TestRunner();
    const tests = new UIBasicTests(page, runner);
    
    await tests.testPageLoad();
    await tests.testUIElements();
    // ... другие тесты
    
    await browser.close();
    console.log('UI тесты завершены');
})();
"
```

## 📊 Сравнение структур

| Аспект | Старая структура | Новая структура |
|--------|------------------|-----------------|
| **Размер файлов** | 1 файл × 1031 строка | 6 файлов × ~200 строк |
| **Читаемость** | Сложно найти нужный тест | Четкое разделение по темам |
| **Поддержка** | Сложно вносить изменения | Легко модифицировать отдельные области |
| **Тестирование** | Всё или ничего | Можно запускать по частям |
| **Расширяемость** | Файл становится огромным | Легко добавлять новые модули |
| **Командная работа** | Конфликты при слиянии | Меньше конфликтов |

## 🔧 Что изменилось в коде

### Базовый класс
```javascript
// Старый подход
class SQLitePlaygroundTests {
    constructor(page, runner) {
        this.page = page;
        this.runner = runner;
    }
}

// Новый подход
const { BaseTest } = require('./utils/test-config');

class UIBasicTests extends BaseTest {
    // constructor автоматически наследуется
}
```

### Импорты и экспорты
```javascript
// Новый модуль
const { BaseTest } = require('./utils/test-config');

class MyTests extends BaseTest {
    async testSomething() {
        // код теста
    }
}

module.exports = MyTests;
```

### Запуск тестов
```javascript
// Старый main файл
async function runTests() {
    const tests = new SQLitePlaygroundTests(page, runner);
    await tests.testPageLoad();
    await tests.testUIElements();
    // ... все тесты подряд
}

// Новый main файл
async function runAllTests() {
    const uiTests = new UIBasicTests(page, runner);
    const i18nTests = new I18nTests(page, runner);
    
    console.log('=== UI ТЕСТЫ ===');
    await uiTests.testPageLoad();
    await uiTests.testUIElements();
    
    console.log('=== I18N ТЕСТЫ ===');
    await i18nTests.testI18nSystem();
}
```

## 🎯 Преимущества нового подхода

1. **Модульность** - каждая область тестирования в отдельном файле
2. **DRY принцип** - общие утилиты вынесены в отдельный модуль
3. **Масштабируемость** - легко добавлять новые типы тестов
4. **Читаемость** - понятная структура и организация
5. **Гибкость** - можно запускать только нужные тесты
6. **Командная работа** - меньше конфликтов при работе в команде

## 🔄 Пошаговый план миграции

1. **Фаза 1: Подготовка**
   - Создать папку `utils/` и базовые классы
   - Вынести общую конфигурацию

2. **Фаза 2: Разделение по модулям**
   - Разделить большой класс на тематические файлы
   - Создать отдельные классы для каждой области

3. **Фаза 3: Создание точек входа**
   - Создать `run-all-tests.js` для базового функционала
   - Создать `run-extended-tests.js` для полного набора

4. **Фаза 4: Тестирование**
   - Убедиться что новая структура работает
   - Сравнить результаты с оригинальным файлом

5. **Фаза 5: Переход**
   - Обновить CI/CD скрипты
   - Обучить команду новой структуре
   - (Опционально) Удалить старый файл

## 🚨 Важные моменты

- Оригинальный файл `puppeteer-tests.js` полностью заменен модульной структурой
- Все тесты используют один и тот же `TestRunner` для единообразной отчетности
- Новые примеры (производительность, доступность) показывают как расширять систему
- Можно легко добавлять новые типы тестов следуя образцу
- Общий размер кода уменьшился благодаря устранению дублирования