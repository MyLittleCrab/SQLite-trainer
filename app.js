// Глобальные переменные / Global variables
let db = null;
let SQL = null;
let currentTask = null;
let allTasks = [];

// Инициализация SQLite WebAssembly / SQLite WebAssembly initialization
async function initSQLite() {
    try {
        document.getElementById('loading').innerHTML = 
            'Загрузка SQLite WebAssembly модуля...';
        
        // Правильная инициализация sql.js / Proper sql.js initialization
        // initSqlJs возвращает промис, который резолвится с SQL объектом / initSqlJs returns a promise that resolves with SQL object
        SQL = await initSqlJs({
            // locateFile позволяет указать, где искать .wasm файлы / locateFile allows to specify where to look for .wasm files
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        console.log('SQLite WebAssembly модуль загружен успешно');
        
        document.getElementById('loading').innerHTML = 
            'Создание базы данных...';
        
        // Только после успешной загрузки создаем базу данных / Only after successful loading create database
        db = new SQL.Database();
        console.log('База данных создана в памяти');
        
        document.getElementById('loading').innerHTML = 
            'Загрузка задач...';
        
        // Загружаем задачи / Load tasks
        await loadTasks();
        console.log('Задачи загружены');
        
        // Обновляем схему / Update schema
        updateSchema();
        console.log('Схема базы данных обновлена');
        
        // Показываем основной контент / Show main content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
        console.log('SQLite успешно инициализирован и готов к работе');
        
    } catch (error) {
        console.error('Ошибка инициализации SQLite:', error);
        
        // Показываем детальную ошибку пользователю / Show detailed error to user
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



// Загрузка задач / Loading tasks
async function loadTasks() {
    try {
        const response = await fetch('./sql-tasks/index.json');
        allTasks = await response.json();
        console.log('Загружено задач:', allTasks.length);
        
        // Показываем случайную задачу при запуске / Show random task at startup
        loadRandomTask();
    } catch (error) {
        console.error('Ошибка загрузки задач:', error);
        document.getElementById('task-content').innerHTML = 
            '<div class="error">Ошибка загрузки задач: ' + error.message + '</div>';
    }
}

// Загрузка случайной задачи / Loading random task
async function loadRandomTask() {
    if (allTasks.length === 0) {
        document.getElementById('task-content').innerHTML = 
            '<div class="error">Нет доступных задач</div>';
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * allTasks.length);
    const taskRef = allTasks[randomIndex];
    
    try {
        const response = await fetch(`./sql-tasks/${taskRef.file}`);
        currentTask = await response.json();
        
        // Инициализируем базу данных для задачи / Initialize database for task
        initTaskDatabase();
        
        // Отображаем задачу / Display task
        displayTask();
        
        // Обновляем схему / Update schema
        updateSchema();
        
    } catch (error) {
        console.error('Ошибка загрузки задачи:', error);
        document.getElementById('task-content').innerHTML = 
            '<div class="error">Ошибка загрузки задачи: ' + error.message + '</div>';
    }
}

// Инициализация базы данных для задачи / Database initialization for task
function initTaskDatabase() {
    if (!currentTask || !currentTask.initScript) return;
    
    try {
        // Выполняем скрипт инициализации задачи / Execute task initialization script
        for (const query of currentTask.initScript) {
            db.exec(query);
        }
        

        
        console.log('База данных инициализирована для задачи:', currentTask.title);
    } catch (error) {
        console.error('Ошибка инициализации базы данных для задачи:', error);
    }
}



// Отображение текущей задачи / Display current task
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

// Показать/скрыть подсказку / Show/hide hint
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

// Проверка результата запроса / Query result verification
function checkTaskResult(userResult) {
    if (!currentTask || !currentTask.expectedResult) return false;
    
    try {
        // Сравниваем результаты / Compare results
        const expected = currentTask.expectedResult;
        
        // Проверяем количество строк / Check number of rows
        if (userResult.length !== expected.length) {
            showTaskStatus(false, `Неверное количество строк. Ожидается: ${expected.length}, получено: ${userResult.length}`);
            return false;
        }
        
        // Проверяем каждую строку / Check each row
        for (let i = 0; i < expected.length; i++) {
            const expectedRow = expected[i];
            const userRow = userResult[i];
            
            // Проверяем каждое поле / Check each field
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

// Показать статус выполнения задачи / Show task execution status
function showTaskStatus(success, message) {
    const statusDiv = document.getElementById('task-status');
    statusDiv.className = `task-status ${success ? 'success' : 'error'}`;
    statusDiv.innerHTML = message;
}

// Обновление отображения схемы базы данных / Update database schema display
function updateSchema() {
    try {
        // Проверяем готовность / Check readiness
        if (!db) {
            document.getElementById('schema-content').innerHTML = 
                '<p>База данных не готова</p>';
            return;
        }
        
        // Получаем информацию о таблицах / Get tables information
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
                
                // Получаем количество записей / Get record count
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

// Выполнение SQL запроса / SQL query execution
function executeSQL() {
    const sqlInput = document.getElementById('sql-input');
    const resultsContainer = document.getElementById('results-container');
    const executeBtn = document.getElementById('execute-btn');
    
    const sql = sqlInput.value.trim();
    
    if (!sql) {
        resultsContainer.innerHTML = '<div class="error">Введите SQL запрос</div>';
        return;
    }
    
    // Проверяем, что SQLite полностью инициализирован / Check that SQLite is fully initialized
    if (!SQL) {
        resultsContainer.innerHTML = '<div class="error">SQLite WebAssembly еще загружается...</div>';
        return;
    }
    
    if (!db) {
        resultsContainer.innerHTML = '<div class="error">База данных не инициализирована</div>';
        return;
    }
    
    // Отключаем кнопку на время выполнения / Disable button during execution
    executeBtn.disabled = true;
    executeBtn.textContent = 'Выполняется...';
    
    try {
        // Определяем тип запроса / Determine query type
        const isSelectQuery = sql.toLowerCase().trim().startsWith('select');
        
        if (isSelectQuery) {
            // Для SELECT запросов показываем результаты в таблице / For SELECT queries show results in table
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
                
                // Заголовки столбцов / Column headers
                columns.forEach(col => {
                    tableHTML += `<th>${col}</th>`;
                });
                tableHTML += '</tr></thead><tbody>';
                
                // Данные / Data
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
                
                // Проверяем результат задачи, если задача активна / Check task result if task is active
                if (currentTask) {
                    checkTaskResult(results);
                }
            }
        } else {
            // Для других запросов (INSERT, UPDATE, DELETE, CREATE, etc.) / For other queries (INSERT, UPDATE, DELETE, CREATE, etc.)
            const result = db.exec(sql);
            resultsContainer.innerHTML = '<div class="success">Запрос выполнен успешно.</div>';
            
            // Обновляем схему для всех запросов, которые могут изменить структуру или данные / Update schema for all queries that can change structure or data
            const sqlLower = sql.toLowerCase().trim();
            if (sqlLower.includes('create') || 
                sqlLower.includes('drop') || 
                sqlLower.includes('alter') ||
                sqlLower.includes('insert') ||
                sqlLower.includes('update') ||
                sqlLower.includes('delete')) {
                updateSchema();
            }
        }
        
    } catch (error) {
        console.error('Ошибка выполнения SQL:', error);
        resultsContainer.innerHTML = '<div class="error">Ошибка SQL: ' + error.message + '</div>';
    } finally {
        // Включаем кнопку обратно / Enable button back
        executeBtn.disabled = false;
        executeBtn.textContent = 'Выполнить запрос';
    }
}

// Установка примера запроса / Set example query
function setExample(sql) {
    document.getElementById('sql-input').value = sql;
}

// Обработка нажатия Enter в текстовом поле / Handle Enter key press in text field
document.addEventListener('DOMContentLoaded', function() {
    const sqlInput = document.getElementById('sql-input');
    
    sqlInput.addEventListener('keydown', function(event) {
        // Ctrl+Enter или Cmd+Enter для выполнения запроса / Ctrl+Enter or Cmd+Enter to execute query
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            executeSQL();
        }
    });
});

// Запуск инициализации при загрузке страницы / Start initialization on page load
window.addEventListener('load', initSQLite);