// Глобальные переменные
let db = null;
let SQL = null;
let currentTask = null;
let allTasks = [];

// Инициализация SQLite WebAssembly
async function initSQLite() {
    try {
        document.getElementById('loading').innerHTML = 
            'Загрузка SQLite WebAssembly модуля...';
        
        // Правильная инициализация sql.js
        // initSqlJs возвращает промис, который резолвится с SQL объектом
        SQL = await initSqlJs({
            // locateFile позволяет указать, где искать .wasm файлы
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        console.log('SQLite WebAssembly модуль загружен успешно');
        
        document.getElementById('loading').innerHTML = 
            'Создание базы данных...';
        
        // Только после успешной загрузки создаем базу данных
        db = new SQL.Database();
        console.log('База данных создана в памяти');
        
        document.getElementById('loading').innerHTML = 
            'Инициализация демо-таблиц...';
        
        // Создаем демо-таблицы
        initDemoTables();
        console.log('Демо-таблицы созданы');
        
        document.getElementById('loading').innerHTML = 
            'Загрузка задач...';
        
        // Загружаем задачи
        await loadTasks();
        console.log('Задачи загружены');
        
        // Обновляем схему
        updateSchema();
        console.log('Схема базы данных обновлена');
        
        // Показываем основной контент
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
        console.log('SQLite успешно инициализирован и готов к работе');
        
    } catch (error) {
        console.error('Ошибка инициализации SQLite:', error);
        
        // Показываем детальную ошибку пользователю
        let errorMessage = 'Ошибка загрузки SQLite: ' + error.message;
        
        if (error.message.includes('fetch')) {
            errorMessage += '<br><br>Возможные причины:<br>';
            errorMessage += '• Нет подключения к интернету<br>';
            errorMessage += '• Заблокирован доступ к sql.js.org<br>';
            errorMessage += '• Попробуйте обновить страницу';
        }
        
        document.getElementById('loading').innerHTML = 
            '<div class="error">' + errorMessage + '</div>';
    }
}

// Инициализация демо-таблиц для тестирования
function initDemoTables() {
    try {
        // Создаем таблицу users
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                age INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Создаем таблицу orders
        db.exec(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                product_name TEXT NOT NULL,
                amount DECIMAL(10,2),
                order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);
        
        // Добавляем демо-данные в таблицу users
        db.exec(`
            INSERT OR IGNORE INTO users (id, name, email, age) VALUES 
            (1, 'Алексей Иванов', 'alexey@example.com', 25),
            (2, 'Мария Петрова', 'maria@example.com', 30),
            (3, 'Иван Сидоров', 'ivan@example.com', 28),
            (4, 'Елена Козлова', 'elena@example.com', 22),
            (5, 'Дмитрий Соколов', 'dmitry@example.com', 35);
        `);
        
        // Добавляем демо-данные в таблицу orders
        db.exec(`
            INSERT OR IGNORE INTO orders (id, user_id, product_name, amount) VALUES 
            (1, 1, 'Ноутбук', 75000.00),
            (2, 1, 'Мышь', 1500.00),
            (3, 2, 'Клавиатура', 3500.00),
            (4, 3, 'Монитор', 25000.00),
            (5, 2, 'Наушники', 5500.00),
            (6, 4, 'Планшет', 30000.00),
            (7, 5, 'Телефон', 45000.00),
            (8, 3, 'Принтер', 12000.00);
        `);
        
        console.log('Демо-таблицы users и orders созданы с тестовыми данными');
    } catch (error) {
        console.error('Ошибка создания демо-таблиц:', error);
    }
}

// Загрузка задач
async function loadTasks() {
    try {
        const response = await fetch('sql-tasks/index.json');
        allTasks = await response.json();
        console.log('Загружено задач:', allTasks.length);
        
        // Показываем случайную задачу при запуске
        loadRandomTask();
    } catch (error) {
        console.error('Ошибка загрузки задач:', error);
        document.getElementById('task-content').innerHTML = 
            '<div class="error">Ошибка загрузки задач: ' + error.message + '</div>';
    }
}

// Загрузка случайной задачи
async function loadRandomTask() {
    if (allTasks.length === 0) {
        document.getElementById('task-content').innerHTML = 
            '<div class="error">Нет доступных задач</div>';
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * allTasks.length);
    const taskRef = allTasks[randomIndex];
    
    try {
        const response = await fetch(`sql-tasks/${taskRef.file}`);
        currentTask = await response.json();
        
        // Инициализируем базу данных для задачи
        initTaskDatabase();
        
        // Отображаем задачу
        displayTask();
        
        // Обновляем схему
        updateSchema();
        
    } catch (error) {
        console.error('Ошибка загрузки задачи:', error);
        document.getElementById('task-content').innerHTML = 
            '<div class="error">Ошибка загрузки задачи: ' + error.message + '</div>';
    }
}

// Инициализация базы данных для задачи
function initTaskDatabase() {
    if (!currentTask || !currentTask.initScript) return;
    
    try {
        // Выполняем скрипт инициализации
        for (const query of currentTask.initScript) {
            db.exec(query);
        }
        console.log('База данных инициализирована для задачи:', currentTask.title);
    } catch (error) {
        console.error('Ошибка инициализации базы данных для задачи:', error);
    }
}

// Отображение текущей задачи
function displayTask() {
    if (!currentTask) return;
    
    const taskContent = document.getElementById('task-content');
    taskContent.innerHTML = `
        <div class="task-header">
            <h3>${currentTask.title}</h3>
            <button onclick="loadRandomTask()" class="btn-secondary">Следующая задача</button>
        </div>
        <div class="task-description">
            <p>${currentTask.description}</p>
        </div>
        <div class="task-hint" style="display: none;">
            <p><strong>Подсказка:</strong> ${currentTask.hint}</p>
        </div>
        <button onclick="toggleHint()" class="btn-hint">Показать подсказку</button>
        <div class="task-status" id="task-status"></div>
    `;
}

// Показать/скрыть подсказку
function toggleHint() {
    const hintDiv = document.querySelector('.task-hint');
    const button = document.querySelector('.btn-hint');
    
    if (hintDiv.style.display === 'none') {
        hintDiv.style.display = 'block';
        button.textContent = 'Скрыть подсказку';
    } else {
        hintDiv.style.display = 'none';
        button.textContent = 'Показать подсказку';
    }
}

// Проверка результата запроса
function checkTaskResult(userResult) {
    if (!currentTask || !currentTask.expectedResult) return false;
    
    try {
        // Сравниваем результаты
        const expected = currentTask.expectedResult;
        
        // Проверяем количество строк
        if (userResult.length !== expected.length) {
            showTaskStatus(false, `Неверное количество строк. Ожидается: ${expected.length}, получено: ${userResult.length}`);
            return false;
        }
        
        // Проверяем каждую строку
        for (let i = 0; i < expected.length; i++) {
            const expectedRow = expected[i];
            const userRow = userResult[i];
            
            // Проверяем каждое поле
            for (const field in expectedRow) {
                if (userRow[field] !== expectedRow[field]) {
                    showTaskStatus(false, `Неверное значение в строке ${i + 1}, поле "${field}". Ожидается: ${expectedRow[field]}, получено: ${userRow[field]}`);
                    return false;
                }
            }
        }
        
        showTaskStatus(true, 'Отлично! Задача решена верно!');
        return true;
        
    } catch (error) {
        showTaskStatus(false, 'Ошибка при проверке результата: ' + error.message);
        return false;
    }
}

// Показать статус выполнения задачи
function showTaskStatus(success, message) {
    const statusDiv = document.getElementById('task-status');
    statusDiv.className = `task-status ${success ? 'success' : 'error'}`;
    statusDiv.innerHTML = message;
}

// Обновление отображения схемы базы данных
function updateSchema() {
    try {
        // Проверяем готовность
        if (!db) {
            document.getElementById('schema-content').innerHTML = 
                '<p>База данных не готова</p>';
            return;
        }
        
        // Получаем информацию о таблицах
        const stmt = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
        const tables = [];
        
        while (stmt.step()) {
            tables.push(stmt.getAsObject());
        }
        stmt.free();
        
        let schemaHTML = '<h4>Таблицы в базе данных:</h4>';
        
        if (tables.length === 0) {
            schemaHTML += '<p>Таблицы не найдены</p>';
        } else {
            tables.forEach(table => {
                schemaHTML += `<div style="margin-bottom: 15px;">`;
                schemaHTML += `<strong>${table.name}</strong><br>`;
                schemaHTML += `<code style="font-size: 12px; background: #e9ecef; padding: 5px; border-radius: 3px; display: block; margin-top: 5px;">${table.sql}</code>`;
                
                // Получаем количество записей
                try {
                    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`);
                    countStmt.step();
                    const count = countStmt.getAsObject().count;
                    countStmt.free();
                    schemaHTML += `<small style="color: #666;">Записей: ${count}</small>`;
                } catch (e) {
                    schemaHTML += `<small style="color: #666;">Не удалось получить количество записей</small>`;
                }
                
                schemaHTML += `</div>`;
            });
        }
        
        document.getElementById('schema-content').innerHTML = schemaHTML;
        
    } catch (error) {
        console.error('Ошибка обновления схемы:', error);
        document.getElementById('schema-content').innerHTML = 
            '<div class="error">Ошибка загрузки схемы: ' + error.message + '</div>';
    }
}

// Выполнение SQL запроса
function executeSQL() {
    const sqlInput = document.getElementById('sql-input');
    const resultsContainer = document.getElementById('results-container');
    const executeBtn = document.getElementById('execute-btn');
    
    const sql = sqlInput.value.trim();
    
    if (!sql) {
        resultsContainer.innerHTML = '<div class="error">Введите SQL запрос</div>';
        return;
    }
    
    // Проверяем, что SQLite полностью инициализирован
    if (!SQL) {
        resultsContainer.innerHTML = '<div class="error">SQLite WebAssembly еще загружается...</div>';
        return;
    }
    
    if (!db) {
        resultsContainer.innerHTML = '<div class="error">База данных не инициализирована</div>';
        return;
    }
    
    // Отключаем кнопку на время выполнения
    executeBtn.disabled = true;
    executeBtn.textContent = 'Выполняется...';
    
    try {
        // Определяем тип запроса
        const isSelectQuery = sql.toLowerCase().trim().startsWith('select');
        
        if (isSelectQuery) {
            // Для SELECT запросов показываем результаты в таблице
            const stmt = db.prepare(sql);
            const results = [];
            const columns = stmt.getColumnNames();
            
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            
            if (results.length === 0) {
                resultsContainer.innerHTML = '<div class="success">Запрос выполнен успешно. Результатов не найдено.</div>';
            } else {
                let tableHTML = '<div class="success">Запрос выполнен успешно. Найдено записей: ' + results.length + '</div>';
                tableHTML += '<table><thead><tr>';
                
                // Заголовки столбцов
                columns.forEach(col => {
                    tableHTML += `<th>${col}</th>`;
                });
                tableHTML += '</tr></thead><tbody>';
                
                // Данные
                results.forEach(row => {
                    tableHTML += '<tr>';
                    columns.forEach(col => {
                        let value = row[col];
                        if (value === null) value = '<em>NULL</em>';
                        if (value === undefined) value = '<em>undefined</em>';
                        tableHTML += `<td>${value}</td>`;
                    });
                    tableHTML += '</tr>';
                });
                
                tableHTML += '</tbody></table>';
                resultsContainer.innerHTML = tableHTML;
                
                // Проверяем результат задачи, если задача активна
                if (currentTask) {
                    checkTaskResult(results);
                }
            }
        } else {
            // Для других запросов (INSERT, UPDATE, DELETE, CREATE, etc.)
            const result = db.exec(sql);
            resultsContainer.innerHTML = '<div class="success">Запрос выполнен успешно.</div>';
            
            // Обновляем схему если это был DDL запрос
            if (sql.toLowerCase().includes('create') || sql.toLowerCase().includes('drop') || sql.toLowerCase().includes('alter')) {
                updateSchema();
            }
        }
        
    } catch (error) {
        console.error('Ошибка выполнения SQL:', error);
        resultsContainer.innerHTML = '<div class="error">Ошибка SQL: ' + error.message + '</div>';
    } finally {
        // Включаем кнопку обратно
        executeBtn.disabled = false;
        executeBtn.textContent = 'Выполнить запрос';
    }
}

// Установка примера запроса
function setExample(sql) {
    document.getElementById('sql-input').value = sql;
}

// Обработка нажатия Enter в текстовом поле
document.addEventListener('DOMContentLoaded', function() {
    const sqlInput = document.getElementById('sql-input');
    
    sqlInput.addEventListener('keydown', function(event) {
        // Ctrl+Enter или Cmd+Enter для выполнения запроса
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            executeSQL();
        }
    });
});

// Запуск инициализации при загрузке страницы
window.addEventListener('load', initSQLite);