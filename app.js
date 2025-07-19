// Глобальные переменные
let db = null;
let SQL = null;

// Инициализация SQLite WebAssembly
async function initSQLite() {
    try {
        // Загружаем SQLite WebAssembly
        SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        // Создаем новую базу данных в памяти
        db = new SQL.Database();
        
        // Создаем примерные таблицы с данными
        createSampleData();
        
        // Обновляем схему
        updateSchema();
        
        // Показываем основной контент
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
        console.log('SQLite успешно инициализирован');
        
    } catch (error) {
        console.error('Ошибка инициализации SQLite:', error);
        document.getElementById('loading').innerHTML = 
            '<div class="error">Ошибка загрузки SQLite: ' + error.message + '</div>';
    }
}

// Создание примерных данных
function createSampleData() {
    // Создаем таблицу пользователей
    db.exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            age INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
    // Добавляем примерных пользователей
    db.exec(`
        INSERT INTO users (name, email, age) VALUES 
        ('Алексей Петров', 'alexey@example.com', 25),
        ('Мария Иванова', 'maria@example.com', 30),
        ('Дмитрий Сидоров', 'dmitry@example.com', 28),
        ('Елена Козлова', 'elena@example.com', 22);
    `);
    
    // Создаем таблицу заказов
    db.exec(`
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_name TEXT NOT NULL,
            amount REAL NOT NULL,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    `);
    
    // Добавляем примерные заказы
    db.exec(`
        INSERT INTO orders (user_id, product_name, amount) VALUES 
        (1, 'Ноутбук', 75000.00),
        (2, 'Смартфон', 25000.00),
        (1, 'Мышь', 1500.00),
        (3, 'Клавиатура', 3000.00),
        (4, 'Монитор', 20000.00);
    `);
}

// Обновление отображения схемы базы данных
function updateSchema() {
    try {
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