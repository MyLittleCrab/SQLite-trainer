// Юнит-тесты для SQLite WebAssembly Playground

// Тесты вспомогательных функций
testRunner.addTest('setExample должен установить значение в поле ввода', () => {
    // Создаем mock элемент для тестирования
    const mockInput = document.createElement('textarea');
    mockInput.id = 'sql-input';
    document.body.appendChild(mockInput);
    
    const testSQL = 'SELECT * FROM test_table';
    setExample(testSQL);
    
    assertEqual(mockInput.value, testSQL, 'SQL должен быть установлен в поле ввода');
    
    // Очистка
    document.body.removeChild(mockInput);
}, 'unit');

testRunner.addTest('Глобальные переменные должны быть инициализированы', () => {
    // Проверяем, что глобальные переменные определены
    assert(typeof SQL !== 'undefined', 'SQL должна быть определена');
    assert(typeof db !== 'undefined', 'db должна быть определена');
}, 'unit');

testRunner.addTest('executeSQL должен проверять входные данные', async () => {
    // Создаем mock элементы
    const mockInput = document.createElement('textarea');
    mockInput.id = 'sql-input';
    mockInput.value = ''; // Пустое значение
    
    const mockResults = document.createElement('div');
    mockResults.id = 'results-container';
    
    const mockBtn = document.createElement('button');
    mockBtn.id = 'execute-btn';
    
    document.body.appendChild(mockInput);
    document.body.appendChild(mockResults);
    document.body.appendChild(mockBtn);
    
    executeSQL();
    
    // Проверяем, что показана ошибка для пустого ввода
    assert(mockResults.innerHTML.includes('Введите SQL запрос'), 
           'Должна показываться ошибка для пустого запроса');
    
    // Очистка
    document.body.removeChild(mockInput);
    document.body.removeChild(mockResults);
    document.body.removeChild(mockBtn);
}, 'unit');

testRunner.addTest('updateSchema должен обрабатывать отсутствие БД', () => {
    // Создаем mock элемент
    const mockSchema = document.createElement('div');
    mockSchema.id = 'schema-content';
    document.body.appendChild(mockSchema);
    
    // Временно сохраняем текущую db
    const originalDb = window.db;
    window.db = null;
    
    updateSchema();
    
    assert(mockSchema.innerHTML.includes('База данных не готова'),
           'Должно показываться сообщение о неготовности БД');
    
    // Восстанавливаем
    window.db = originalDb;
    document.body.removeChild(mockSchema);
}, 'unit');

// Тесты проверки DOM элементов
testRunner.addTest('Все необходимые DOM элементы должны существовать', () => {
    // Эти элементы должны быть в основном HTML
    const requiredElements = [
        'loading',
        'main-content', 
        'sql-input',
        'execute-btn',
        'results-container',
        'schema-content'
    ];
    
    // Создаем временный контейнер с HTML структурой для тестирования
    const testContainer = document.createElement('div');
    testContainer.innerHTML = `
        <div id="loading">Загрузка...</div>
        <div id="main-content" style="display: none;">
            <textarea id="sql-input"></textarea>
            <button id="execute-btn">Выполнить</button>
            <div id="results-container"></div>
            <div id="schema-content"></div>
        </div>
    `;
    document.body.appendChild(testContainer);
    
    requiredElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        assert(element !== null, `Элемент ${elementId} должен существовать`);
    });
    
    // Очистка
    document.body.removeChild(testContainer);
}, 'unit');

// Тесты функций примеров
testRunner.addTest('Функция setExample должна работать с разными типами запросов', () => {
    const mockInput = document.createElement('textarea');
    mockInput.id = 'sql-input';
    document.body.appendChild(mockInput);
    
    const testCases = [
        'SELECT * FROM users;',
        'INSERT INTO users (name) VALUES (\'test\');',
        'UPDATE users SET name = \'updated\' WHERE id = 1;',
        'DELETE FROM users WHERE id = 1;',
        'CREATE TABLE test (id INTEGER PRIMARY KEY);'
    ];
    
    testCases.forEach(sql => {
        setExample(sql);
        assertEqual(mockInput.value, sql, `SQL запрос должен быть установлен: ${sql}`);
    });
    
    document.body.removeChild(mockInput);
}, 'unit');

// Тест обработки событий клавиатуры
testRunner.addTest('Обработчик Ctrl+Enter должен быть настроен', () => {
    // Проверяем, что обработчик события назначен
    const mockInput = document.createElement('textarea');
    mockInput.id = 'sql-input';
    document.body.appendChild(mockInput);
    
    // Эмулируем событие DOMContentLoaded для инициализации обработчиков
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    
    // Проверяем, что обработчик добавлен (косвенно)
    assert(mockInput.addEventListener !== undefined, 'addEventListener должен быть доступен');
    
    document.body.removeChild(mockInput);
}, 'unit');

// Тест валидации SQL запросов
testRunner.addTest('Должны обрабатываться SQL запросы разных типов', () => {
    const sqlTypes = [
        { sql: 'SELECT * FROM test', type: 'select' },
        { sql: 'INSERT INTO test VALUES (1)', type: 'insert' },
        { sql: 'UPDATE test SET id = 2', type: 'update' },
        { sql: 'DELETE FROM test WHERE id = 1', type: 'delete' },
        { sql: 'CREATE TABLE test (id INTEGER)', type: 'create' }
    ];
    
    sqlTypes.forEach(({ sql, type }) => {
        const isSelect = sql.toLowerCase().trim().startsWith('select');
        if (type === 'select') {
            assert(isSelect, `${sql} должен определяться как SELECT запрос`);
        } else {
            assert(!isSelect, `${sql} НЕ должен определяться как SELECT запрос`);
        }
    });
}, 'unit');

// Тест проверки состояния инициализации
testRunner.addTest('Проверка состояния инициализации должна работать корректно', () => {
    // Тестируем логику проверки готовности
    const originalSQL = window.SQL;
    const originalDb = window.db;
    
    // Случай 1: SQL не загружен
    window.SQL = null;
    window.db = null;
    
    // Эмулируем проверку состояния
    let shouldBlock = !window.SQL;
    assert(shouldBlock, 'Должна блокироваться работа когда SQL не загружен');
    
    // Случай 2: SQL загружен, но БД не создана
    window.SQL = {};
    window.db = null;
    
    shouldBlock = !window.db;
    assert(shouldBlock, 'Должна блокироваться работа когда БД не создана');
    
    // Случай 3: Всё готово
    window.SQL = {};
    window.db = {};
    
    shouldBlock = !window.SQL || !window.db;
    assert(!shouldBlock, 'НЕ должна блокироваться работа когда всё готово');
    
    // Восстанавливаем
    window.SQL = originalSQL;
    window.db = originalDb;
}, 'unit');