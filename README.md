# SQLite Trainer - Интерактивный SQL Тренажер

*[English version below](#english-version)*

Интерактивный веб-тренажер для изучения SQL с использованием SQLite WebAssembly. Решайте задачи по SQL прямо в браузере с автоматической проверкой результатов.

## 🎯 Основные возможности

- ✅ **Интерактивные SQL задачи** - структурированная система обучения с автоматической проверкой
- ✅ **SQLite в браузере** - полнофункциональная база данных без установки дополнительного ПО  
- ✅ **Автоматическая проверка** - мгновенная валидация ваших SQL запросов
- ✅ **Современный интерфейс** - удобный редактор с подсветкой и горячими клавишами
- ✅ **Система подсказок** - получайте помощь когда застряли
- ✅ **Прогрессивные задачи** - от простых SELECT до сложных JOIN и агрегации
- ✅ **Полное тестирование** - автоматические тесты Puppeteer гарантируют стабильность

## 🚀 Быстрый старт

### Вариант 1: NPM (рекомендуется)
```bash
# Клонируйте репозиторий
git clone https://github.com/MyLittleCrab/SQLite-trainer.git
cd SQLite-trainer

# Установите зависимости
npm install

# Запустите сервер
npm start
```

Откройте `http://localhost:8000` в браузере.

## 📚 Как использовать

1. **Загрузите страницу** - дождитесь инициализации SQLite WebAssembly
2. **Изучите задачу** - прочитайте описание и требования  
3. **Анализируйте схему** - посмотрите на структуру таблиц в разделе "Схема базы данных"
4. **Пишите SQL** - введите ваш запрос в редакторе
5. **Проверяйте результат** - нажмите "Выполнить запрос" или `Ctrl+Enter`
6. **Получайте обратную связь** - система покажет правильно ли решена задача

### Горячие клавиши
- `Ctrl+Enter` / `Cmd+Enter` - выполнить SQL запрос
- Кнопка "Следующая задача" - переход к случайной задаче

## 📋 Типы задач

### 1. Простая выборка (Basic SELECT)
- Фильтрация данных с WHERE
- Сортировка с ORDER BY  
- Ограничение результатов с LIMIT

### 2. Соединение таблиц (JOINs)
- INNER JOIN, LEFT JOIN
- Связывание связанных данных
- Работа с внешними ключами

### 3. Агрегация данных 
- GROUP BY и HAVING
- Агрегатные функции (COUNT, SUM, AVG)
- Анализ данных

### 4. Продвинутые запросы
- Подзапросы (субзапросы)
- Оконные функции
- Сложная аналитика

## 🧪 Автоматическое тестирование

Проект включает полную систему автоматического тестирования:

### Запуск тестов
```bash
# Все тесты (запускает сервер и Puppeteer тесты)
npm test

# Только Puppeteer тесты (сервер должен быть запущен)
npm run test:run
```

### Типы тестов
- **12 Puppeteer тестов** - полная автоматизация браузера
- **Тестирование UI** - проверка интерфейса и взаимодействий
- **Валидация SQL** - проверка корректности выполнения запросов
- **Тестирование задач** - проверка системы автоматической проверки

### Браузерные тесты
Откройте `http://localhost:8000/tests/test.html` для запуска тестов в браузере.

## 🏗 Техническая архитектура

### Frontend
- **Vanilla JavaScript** - без фреймворков для максимальной производительности
- **Modern CSS** - адаптивный дизайн с CSS Grid/Flexbox
- **SQLite WebAssembly** - библиотека `sql.js` для работы с SQLite

### Система задач
- **JSON конфигурация** - все задачи хранятся в JSON файлах
- **Модульная структура** - легко добавлять новые задачи
- **Автоматическая инициализация** - каждая задача подготавливает свою БД
- **Валидация результатов** - точное сравнение с ожидаемыми результатами

### Файловая структура
```
SQLite-trainer/
├── app.js                 # Основная логика приложения
├── index.html             # Интерфейс пользователя  
├── package.json           # NPM зависимости и скрипты
├── sql-tasks/             # Система задач
│   ├── index.json         # Индекс всех задач
│   ├── basic_select.json  # Задачи по SELECT
│   ├── join_tables.json   # Задачи по JOIN
│   └── aggregation.json   # Задачи по агрегации
└── tests/                 # Автоматические тесты
    └── puppeteer-tests.js # Puppeteer тесты
```

## 🔧 Разработка

### Добавление новых задач

1. **Создайте JSON файл** в папке `sql-tasks/`:
```json
{
  "id": "my_task",
  "title": "Название задачи",
  "description": "Описание того, что нужно сделать",
  "initScript": [
    "CREATE TABLE example (id INTEGER, name TEXT);",
    "INSERT INTO example VALUES (1, 'test');"
  ],
  "expectedResult": [
    {"id": 1, "name": "test"}
  ],
  "hint": "Подсказка для решения",
  "solution": "SELECT * FROM example;"
}
```

2. **Добавьте в индекс** (`sql-tasks/index.json`):
```json
{
  "id": "my_task", 
  "title": "Название задачи",
  "description": "Краткое описание",
  "file": "my_task.json"
}
```

### Запуск в режиме разработки
```bash
# Запуск с автоперезагрузкой
npm start

# Запуск тестов в режиме разработки  
npm test
```

## 📊 Мониторинг и отладка

### Консоль разработчика
Откройте Developer Tools (F12) для просмотра:
- Логов инициализации SQLite
- Выполняемых SQL запросов  
- Результатов проверки задач
- Ошибок выполнения

### Отладочная информация
```javascript
// В консоли браузера доступны глобальные переменные:
console.log(db);          // SQLite Database объект
console.log(currentTask); // Текущая активная задача
console.log(allTasks);    // Все загруженные задачи
```

## 🌟 Возможности для улучшения

- [ ] Система прогресса пользователя
- [ ] Сохранение решений в localStorage
- [ ] Подсветка синтаксиса SQL
- [ ] Автодополнение SQL команд
- [ ] Экспорт/импорт прогресса
- [ ] Многоязычность интерфейса
- [ ] Система достижений
- [ ] Социальные функции (рейтинги, сравнения)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

---

# English Version

# SQLite Trainer - Interactive SQL Learning Platform

An interactive web-based SQL trainer using SQLite WebAssembly. Practice SQL queries directly in your browser with automatic result validation.

## 🎯 Key Features

- ✅ **Interactive SQL Challenges** - Structured learning system with automatic validation
- ✅ **Browser-based SQLite** - Full-featured database without additional software installation
- ✅ **Automatic Validation** - Instant feedback on your SQL queries
- ✅ **Modern Interface** - User-friendly editor with syntax highlighting and keyboard shortcuts
- ✅ **Hint System** - Get help when you're stuck
- ✅ **Progressive Tasks** - From simple SELECT to complex JOINs and aggregations
- ✅ **Comprehensive Testing** - Automated Puppeteer tests ensure stability

## 🚀 Quick Start

### Option 1: NPM (Recommended)
```bash
# Clone repository
git clone https://github.com/MyLittleCrab/SQLite-trainer.git
cd SQLite-trainer

# Install dependencies
npm install

# Start server
npm start
```

Open `http://localhost:8000` in your browser.

## 📚 How to Use

1. **Load the page** - Wait for SQLite WebAssembly initialization
2. **Study the task** - Read the description and requirements
3. **Analyze schema** - Review table structure in "Database Schema" section
4. **Write SQL** - Enter your query in the editor
5. **Check results** - Click "Execute Query" or press `Ctrl+Enter`
6. **Get feedback** - System shows whether the task is solved correctly

### Keyboard Shortcuts
- `Ctrl+Enter` / `Cmd+Enter` - Execute SQL query
- "Next Task" button - Switch to random task

## 📋 Task Types

### 1. Basic SELECT Queries
- Data filtering with WHERE
- Sorting with ORDER BY
- Result limiting with LIMIT

### 2. Table Joins
- INNER JOIN, LEFT JOIN
- Connecting related data
- Working with foreign keys

### 3. Data Aggregation
- GROUP BY and HAVING
- Aggregate functions (COUNT, SUM, AVG)
- Data analysis

### 4. Advanced Queries
- Subqueries
- Window functions
- Complex analytics

## 🧪 Automated Testing

The project includes a comprehensive automated testing system:

### Running Tests
```bash
# All tests (starts server and runs Puppeteer tests)
npm test

# Puppeteer tests only (server must be running)
npm run test:run
```

### Test Types
- **12 Puppeteer tests** - Full browser automation
- **UI Testing** - Interface and interaction validation
- **SQL Validation** - Query execution correctness
- **Task Testing** - Automatic validation system verification

### Browser Tests
Open `http://localhost:8000/tests/test.html` to run tests in browser.

## 🏗 Technical Architecture

### Frontend
- **Vanilla JavaScript** - Framework-free for maximum performance
- **Modern CSS** - Responsive design with CSS Grid/Flexbox
- **SQLite WebAssembly** - `sql.js` library for SQLite operations

### Task System
- **JSON Configuration** - All tasks stored in JSON files
- **Modular Structure** - Easy to add new tasks
- **Automatic Initialization** - Each task prepares its own database
- **Result Validation** - Precise comparison with expected results

### File Structure
```
SQLite-trainer/
├── app.js                 # Main application logic
├── index.html             # User interface
├── package.json           # NPM dependencies and scripts
├── sql-tasks/             # Task system
│   ├── index.json         # Index of all tasks
│   ├── basic_select.json  # SELECT tasks
│   ├── join_tables.json   # JOIN tasks
│   └── aggregation.json   # Aggregation tasks
└── tests/                 # Automated tests
    └── puppeteer-tests.js # Puppeteer tests
```

## 🔧 Development

### Adding New Tasks

1. **Create JSON file** in `sql-tasks/` folder:
```json
{
  "id": "my_task",
  "title": "Task Title",
  "description": "Description of what needs to be done",
  "initScript": [
    "CREATE TABLE example (id INTEGER, name TEXT);",
    "INSERT INTO example VALUES (1, 'test');"
  ],
  "expectedResult": [
    {"id": 1, "name": "test"}
  ],
  "hint": "Hint for solving",
  "solution": "SELECT * FROM example;"
}
```

2. **Add to index** (`sql-tasks/index.json`):
```json
{
  "id": "my_task",
  "title": "Task Title", 
  "description": "Brief description",
  "file": "my_task.json"
}
```

### Development Mode
```bash
# Start with auto-reload
npm start

# Run tests in development mode
npm test
```

## 📊 Monitoring and Debugging

### Developer Console
Open Developer Tools (F12) to view:
- SQLite initialization logs
- Executed SQL queries
- Task validation results
- Execution errors

### Debug Information
```javascript
// Global variables available in browser console:
console.log(db);          // SQLite Database object
console.log(currentTask); // Current active task
console.log(allTasks);    // All loaded tasks
```

## 🌟 Future Improvements

- [ ] User progress tracking system
- [ ] Save solutions to localStorage
- [ ] SQL syntax highlighting
- [ ] SQL command auto-completion
- [ ] Progress export/import
- [ ] Interface internationalization
- [ ] Achievement system
- [ ] Social features (ratings, comparisons)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.