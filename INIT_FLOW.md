# Процесс инициализации SQLite WebAssembly

## 🔄 Последовательность загрузки

### 1. Загрузка HTML страницы
```
Browser loads index.html
├── CSS стили загружены
├── HTML структура создана
└── JavaScript файлы начинают загружаться
```

### 2. Загрузка JavaScript библиотек
```
<script src="https://sql.js.org/dist/sql-wasm.js"></script>
├── Загружается JavaScript обертка для SQLite
├── Регистрируется глобальная функция initSqlJs()
└── НО WebAssembly модуль еще НЕ загружен!
```

### 3. Инициализация при загрузке страницы
```javascript
window.addEventListener('load', initSQLite)
```

### 4. Асинхронная загрузка WebAssembly
```javascript
async function initSQLite() {
    // ⚠️ ВАЖНО: это АСИНХРОННАЯ операция!
    SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    // ✅ Только ПОСЛЕ этого момента SQLite готов к использованию
    db = new SQL.Database();
}
```

## 📋 Что происходит внутри initSqlJs()

### Этап 1: Загрузка WASM файла
```
initSqlJs() вызов
├── Загрузка sqlite-wasm.wasm (несколько мегабайт)
├── Компиляция WebAssembly модуля
├── Инициализация рабочей среды WASM
└── Создание JavaScript API оберток
```

### Этап 2: Возврат SQL объекта
```javascript
const SQL = await initSqlJs({...});
// SQL теперь содержит:
// ├── SQL.Database - конструктор базы данных
// ├── SQL.Statement - работа с подготовленными запросами  
// └── Другие утилиты
```

### Этап 3: Создание экземпляра БД
```javascript
db = new SQL.Database();
// ├── Создается база данных в памяти WASM
// ├── Инициализируются внутренние структуры SQLite
// └── База готова к выполнению SQL команд
```

## ⚡ Правильная последовательность

### ❌ НЕПРАВИЛЬНО (до исправления):
```javascript
async function initSQLite() {
    SQL = await initSqlJs({...});
    db = new SQL.Database();        // Может выполниться ДО завершения загрузки!
    createSampleData();             // Может выполниться ДО готовности БД!
    updateSchema();                 // Может выполниться ДО готовности!
}
```

### ✅ ПРАВИЛЬНО (после исправления):
```javascript
async function initSQLite() {
    try {
        // Шаг 1: Ждем полной загрузки WebAssembly
        SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        console.log('✅ WebAssembly модуль загружен');
        
        // Шаг 2: Создаем БД только после загрузки
        db = new SQL.Database();
        console.log('✅ База данных создана');
        
        // Шаг 3: Инициализируем данные только после создания БД
        createSampleData();
        console.log('✅ Данные созданы');
        
        // Шаг 4: Обновляем UI только после готовности всего
        updateSchema();
        showMainContent();
        console.log('✅ Готово к использованию');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
}
```

## 🕐 Временные интервалы

На медленном соединении процесс может занимать:
- **HTML + CSS**: 100-500ms
- **JavaScript библиотеки**: 200-1000ms  
- **WebAssembly модуль**: 1-5 секунд ⚠️
- **Инициализация БД**: 10-50ms
- **Создание данных**: 10-100ms

**Итого: 1.5-6.5 секунд до полной готовности**

## 🛡️ Защита от преждевременного использования

### Проверки в executeSQL():
```javascript
function executeSQL() {
    // Проверка 1: Есть ли SQL модуль?
    if (!SQL) {
        show('SQLite WebAssembly еще загружается...');
        return;
    }
    
    // Проверка 2: Есть ли экземпляр БД?
    if (!db) {
        show('База данных не инициализирована');
        return;
    }
    
    // ✅ Безопасно выполнять SQL
    const result = db.exec(sql);
}
```

### Проверки в updateSchema():
```javascript
function updateSchema() {
    if (!db) {
        show('База данных не готова');
        return;
    }
    
    // ✅ Безопасно читать схему
    const tables = db.exec("SELECT ...");
}
```

## 🎯 Ключевые моменты

1. **`await` критически важен** - без него код попытается использовать БД до ее готовности

2. **Последовательность имеет значение** - каждый шаг зависит от предыдущего

3. **Обработка ошибок обязательна** - загрузка WebAssembly может не сработать

4. **UI обратная связь желательна** - пользователь должен видеть прогресс

5. **Проверки готовности нужны** - защита от race conditions

## 🚀 Результат правильной инициализации

После успешного завершения `initSQLite()`:
- ✅ WebAssembly модуль загружен и скомпилирован
- ✅ SQLite engine готов к работе  
- ✅ База данных создана в памяти
- ✅ Тестовые таблицы и данные добавлены
- ✅ UI показывает готовую к использованию систему
- ✅ Все SQL операции будут работать корректно