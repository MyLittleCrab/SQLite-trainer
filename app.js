// Глобальные переменные / Global variables
let db = null;
let SQL = null;
let currentTask = null;
let allTasks = [];

// Функция для ожидания инициализации i18n / Function to wait for i18n initialization
async function ensureI18nInitialized() {
    let attempts = 0;
    const maxAttempts = 50; // 5 секунд максимум
    
    while ((!window.i18n || typeof window.i18n.t !== 'function') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.i18n || typeof window.i18n.t !== 'function') {
        console.error('i18n не инициализировался в течение 5 секунд');
        return false;
    }
    
    return true;
}

// Инициализация SQLite WebAssembly / SQLite WebAssembly initialization
async function initSQLite() {
    try {
        // Ждем инициализации i18n
        await ensureI18nInitialized();
        
        document.getElementById('loading').innerHTML = 
            i18n.t('loading.module');
        
        // Правильная инициализация sql.js / Proper sql.js initialization
        // initSqlJs возвращает промис, который резолвится с SQL объектом / initSqlJs returns a promise that resolves with SQL object
        SQL = await initSqlJs({
            // locateFile позволяет указать, где искать .wasm файлы / locateFile allows to specify where to look for .wasm files
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        console.log('SQLite WebAssembly модуль загружен успешно');
        
        document.getElementById('loading').innerHTML = 
            i18n.t('loading.database');
        
        // Только после успешной загрузки создаем базу данных / Only after successful loading create database
        db = new SQL.Database();
        console.log('База данных создана в памяти');
        
        document.getElementById('loading').innerHTML = 
            i18n.t('loading.tasks');
        
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
        let errorMessage = i18n.t('error.loading') + error.message;
        
        if (error.message.includes('fetch')) {
            errorMessage += '<br><br>' + i18n.t('error.causes') + '<br>';
            errorMessage += i18n.t('error.no_internet') + '<br>';
            errorMessage += i18n.t('error.blocked_access') + '<br>';
            errorMessage += i18n.t('error.try_refresh');
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
            '<div class="error">' + i18n.t('error.tasks_loading') + error.message + '</div>';
    }
}

// Загрузка случайной задачи / Loading random task
async function loadRandomTask() {
    if (allTasks.length === 0) {
        document.getElementById('task-content').innerHTML = 
            '<div class="error">' + i18n.t('error.no_tasks') + '</div>';
        return;
    }
    
    // Если есть только одна задача, загружаем её
    if (allTasks.length === 1) {
        const taskRef = allTasks[0];
        await loadTask(taskRef);
        return;
    }
    
    // Выбираем новую задачу, отличную от текущей
    let randomIndex;
    let taskRef;
    let attempts = 0;
    const maxAttempts = 50; // Предотвращаем бесконечный цикл
    
    do {
        randomIndex = Math.floor(Math.random() * allTasks.length);
        taskRef = allTasks[randomIndex];
        attempts++;
        
        // Если текущей задачи нет, берем любую
        if (!currentTask) break;
        
        // Проверяем, отличается ли новая задача от текущей
        const isDifferent = taskRef.file !== getCurrentTaskFile();
        if (isDifferent) break;
        
    } while (attempts < maxAttempts);
    
    await loadTask(taskRef);
}

// Вспомогательная функция для получения файла текущей задачи
function getCurrentTaskFile() {
    if (!currentTask) return null;
    
    // Ищем файл текущей задачи в списке всех задач
    for (const task of allTasks) {
        if (task.id === currentTask.id) {
            return task.file;
        }
        
        // Проверяем совпадение по заголовку с учетом локализации
        if (currentTask.title && task.title) {
            // Если оба заголовка - строки
            if (typeof currentTask.title === 'string' && typeof task.title === 'string') {
                if (task.title === currentTask.title) {
                    return task.file;
                }
            }
            // Если оба заголовка - объекты с локализацией
            else if (typeof currentTask.title === 'object' && typeof task.title === 'object') {
                if ((currentTask.title.en && task.title.en && currentTask.title.en === task.title.en) ||
                    (currentTask.title.ru && task.title.ru && currentTask.title.ru === task.title.ru)) {
                    return task.file;
                }
            }
            // Смешанный случай - текущая задача объект, задача из списка строка
            else if (typeof currentTask.title === 'object' && typeof task.title === 'string') {
                if (currentTask.title.en === task.title || currentTask.title.ru === task.title) {
                    return task.file;
                }
            }
            // Смешанный случай - текущая задача строка, задача из списка объект
            else if (typeof currentTask.title === 'string' && typeof task.title === 'object') {
                if (task.title.en === currentTask.title || task.title.ru === currentTask.title) {
                    return task.file;
                }
            }
        }
    }
    return null;
}

// Загрузка конкретной задачи / Loading specific task
async function loadTask(taskRef) {
    try {
        const response = await fetch(`./sql-tasks/${taskRef.file}`);
        currentTask = await response.json();
        
        console.log(`Загружена задача: ${taskRef.file}`);
        
        // Инициализируем базу данных для задачи / Initialize database for task
        initTaskDatabase();
        
        // Отображаем задачу / Display task
        displayTask();
        
        // Обновляем схему / Update schema
        updateSchema();
        
    } catch (error) {
        console.error('Ошибка загрузки задачи:', error);
        document.getElementById('task-content').innerHTML = 
            '<div class="error">' + i18n.t('error.task_loading') + error.message + '</div>';
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
        

        
        const taskTitle = typeof currentTask.title === 'object' 
            ? (currentTask.title[i18n.getCurrentLanguage()] || currentTask.title.en || currentTask.title.ru)
            : currentTask.title;
        console.log('База данных инициализирована для задачи:', taskTitle);
    } catch (error) {
        console.error('Ошибка инициализации базы данных для задачи:', error);
    }
}



// Отображение текущей задачи / Display current task
function displayTask() {
    if (!currentTask) return;
    
    const currentLang = i18n.getCurrentLanguage();
    
    // Получаем локализованные значения
    const title = typeof currentTask.title === 'object' ? currentTask.title[currentLang] || currentTask.title.en : currentTask.title;
    const description = typeof currentTask.description === 'object' ? currentTask.description[currentLang] || currentTask.description.en : currentTask.description;
    const hint = typeof currentTask.hint === 'object' ? currentTask.hint[currentLang] || currentTask.hint.en : currentTask.hint;
    
    const taskContent = document.getElementById('task-content');
    taskContent.innerHTML = `
        <div class="task-header">
            <h3>${title}</h3>
            <button onclick="loadRandomTask()" class="btn-secondary">${i18n.t('task.next_task')}</button>
        </div>
        <div class="task-description">
            <p>${description}</p>
        </div>
        <div class="task-hint" style="display: none;">
            <p><strong>${i18n.t('task.hint_label')}</strong> ${hint}</p>
        </div>
        <button onclick="toggleHint()" class="btn-hint">${i18n.t('task.show_hint')}</button>
        <div class="task-status" id="task-status"></div>
    `;
}

// Показать/скрыть подсказку / Show/hide hint
function toggleHint() {
    const hintDiv = document.querySelector('.task-hint');
    const button = document.querySelector('.btn-hint');
    
    if (hintDiv.style.display === 'none') {
        hintDiv.style.display = 'block';
        button.textContent = i18n.t('task.hide_hint');
    } else {
        hintDiv.style.display = 'none';
        button.textContent = i18n.t('task.show_hint');
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
            showTaskStatus(false, i18n.t('task.wrong_rows', {expected: expected.length, actual: userResult.length}));
            return false;
        }
        
        // Проверяем каждую строку / Check each row
        for (let i = 0; i < expected.length; i++) {
            const expectedRow = expected[i];
            const userRow = userResult[i];
            
            // Проверяем каждое поле / Check each field
            for (const field in expectedRow) {
                if (userRow[field] !== expectedRow[field]) {
                    showTaskStatus(false, i18n.t('task.wrong_value', {
                        row: i + 1, 
                        field: field, 
                        expected: expectedRow[field], 
                        actual: userRow[field]
                    }));
                    return false;
                }
            }
        }
        
        showTaskStatus(true, i18n.t('task.correct'));
        return true;
        
    } catch (error) {
        showTaskStatus(false, i18n.t('error.result_check') + error.message);
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
                '<p>' + i18n.t('error.db_not_ready') + '</p>';
            return;
        }
        
        // Получаем информацию о таблицах / Get tables information
        const stmt = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
        const tables = [];
        
        while (stmt.step()) {
            tables.push(stmt.getAsObject());
        }
        stmt.free();
        
        let schemaHTML = '<h4>' + i18n.t('schema.tables_title') + '</h4>';
        
        if (tables.length === 0) {
            schemaHTML += '<p>' + i18n.t('error.tables_not_found') + '</p>';
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
                    schemaHTML += `<small style="color: #666;">${i18n.t('schema.records_count')}${count}</small>`;
                } catch (e) {
                    schemaHTML += `<small style="color: #666;">${i18n.t('error.count_error')}</small>`;
                }
                
                schemaHTML += `</div>`;
            });
        }
        
        document.getElementById('schema-content').innerHTML = schemaHTML;
        
    } catch (error) {
        console.error('Ошибка обновления схемы:', error);
        document.getElementById('schema-content').innerHTML = 
            '<div class="error">' + i18n.t('schema.loading_error') + error.message + '</div>';
    }
}

// Выполнение SQL запроса / SQL query execution
function executeSQL() {
    const sqlInput = document.getElementById('sql-input');
    const resultsContainer = document.getElementById('results-container');
    const executeBtn = document.getElementById('execute-btn');
    
    const sql = sqlInput.value.trim();
    
    if (!sql) {
        resultsContainer.innerHTML = '<div class="error">' + i18n.t('error.enter_sql') + '</div>';
        return;
    }
    
    // Проверяем, что SQLite полностью инициализирован / Check that SQLite is fully initialized
    if (!SQL) {
        resultsContainer.innerHTML = '<div class="error">' + i18n.t('error.sqlite_loading') + '</div>';
        return;
    }
    
    if (!db) {
        resultsContainer.innerHTML = '<div class="error">' + i18n.t('error.db_not_initialized') + '</div>';
        return;
    }
    
    // Отключаем кнопку на время выполнения / Disable button during execution
    executeBtn.disabled = true;
    executeBtn.textContent = i18n.t('sql.executing');
    
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
                resultsContainer.innerHTML = '<div class="success">' + i18n.t('results.success_no_data') + '</div>';
            } else {
                let tableHTML = '<div class="success">' + i18n.t('results.success_with_count') + results.length + '</div>';
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
            resultsContainer.innerHTML = '<div class="success">' + i18n.t('results.success') + '</div>';
            
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
        resultsContainer.innerHTML = '<div class="error">' + i18n.t('error.sql_execution') + error.message + '</div>';
    } finally {
        // Включаем кнопку обратно / Enable button back
        executeBtn.disabled = false;
        executeBtn.textContent = i18n.t('sql.execute');
    }
}

// Установка примера запроса / Set example query
function setExample(sql) {
    document.getElementById('sql-input').value = sql;
}



// Функция переключения языка / Language switching function
async function changeLanguage(lang) {
    await i18n.setLanguage(lang);
}

// Инициализация интерфейса после загрузки DOM / Interface initialization after DOM load
document.addEventListener('DOMContentLoaded', async function() {
    // Ждем инициализации i18n
    await ensureI18nInitialized();
    
    // Ждем загрузки переводов для текущего языка
    await i18n.loadTranslations(i18n.getCurrentLanguage());
    
    // Устанавливаем значение селектора языка / Set language selector value
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = i18n.getCurrentLanguage();
    }
    
    // Обновляем интерфейс / Update interface
    i18n.updateUI();
    
    // Добавляем обработчик для Ctrl+Enter
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