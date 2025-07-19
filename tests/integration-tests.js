// Интеграционные тесты для SQLite WebAssembly Playground

// Хелпер для ожидания инициализации SQLite
async function waitForSQLiteInit() {
    let attempts = 0;
    const maxAttempts = 50; // 5 секунд максимум
    
    while (attempts < maxAttempts) {
        if (window.SQL && window.db) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    throw new Error('SQLite не инициализировался в течение 5 секунд');
}

// Хелпер для создания тестовой базы данных
async function createTestDatabase() {
    await waitForSQLiteInit();
    
    // Создаем отдельную тестовую базу данных
    const testDb = new window.SQL.Database();
    
    // Создаем тестовую таблицу
    testDb.exec(`
        CREATE TABLE test_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            age INTEGER
        );
    `);
    
    return testDb;
}

// Тест инициализации SQLite
testRunner.addTest('SQLite должен инициализироваться корректно', async () => {
    await waitForSQLiteInit();
    
    assert(window.SQL !== null && window.SQL !== undefined, 'SQL объект должен быть доступен');
    assert(window.db !== null && window.db !== undefined, 'База данных должна быть создана');
    assert(typeof window.SQL.Database === 'function', 'SQL.Database должна быть функцией-конструктором');
}, 'integration');

// Тест создания таблиц
testRunner.addTest('Должны создаваться таблицы с правильной структурой', async () => {
    const testDb = await createTestDatabase();
    
    // Проверяем, что таблица создана
    const result = testDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='test_users';");
    
    assert(result.length > 0, 'Таблица test_users должна существовать');
    assert(result[0].values.length > 0, 'Таблица должна быть найдена в sqlite_master');
    assertEqual(result[0].values[0][0], 'test_users', 'Имя таблицы должно совпадать');
    
    testDb.close();
}, 'integration');

// Тест вставки данных
testRunner.addTest('Должны вставляться данные в таблицу', async () => {
    const testDb = await createTestDatabase();
    
    // Вставляем тестовые данные
    testDb.exec(`
        INSERT INTO test_users (name, email, age) VALUES 
        ('Тестовый Пользователь', 'test@example.com', 25),
        ('Другой Пользователь', 'other@example.com', 30);
    `);
    
    // Проверяем, что данные вставились
    const result = testDb.exec('SELECT COUNT(*) as count FROM test_users;');
    assertEqual(result[0].values[0][0], 2, 'Должно быть вставлено 2 записи');
    
    testDb.close();
}, 'integration');

// Тест выборки данных
testRunner.addTest('Должны правильно извлекаться данные из таблицы', async () => {
    const testDb = await createTestDatabase();
    
    // Вставляем тестовые данные
    testDb.exec("INSERT INTO test_users (name, email, age) VALUES ('Тест', 'test@test.com', 25);");
    
    // Извлекаем данные
    const result = testDb.exec('SELECT name, email, age FROM test_users WHERE name = "Тест";');
    
    assert(result.length > 0, 'Результат запроса не должен быть пустым');
    assert(result[0].values.length > 0, 'Должна быть найдена хотя бы одна запись');
    
    const row = result[0].values[0];
    assertEqual(row[0], 'Тест', 'Имя должно совпадать');
    assertEqual(row[1], 'test@test.com', 'Email должен совпадать');
    assertEqual(row[2], 25, 'Возраст должен совпадать');
    
    testDb.close();
}, 'integration');

// Тест обновления данных
testRunner.addTest('Должны обновляться существующие записи', async () => {
    const testDb = await createTestDatabase();
    
    // Вставляем и обновляем данные
    testDb.exec("INSERT INTO test_users (name, email, age) VALUES ('Обновляемый', 'update@test.com', 20);");
    testDb.exec("UPDATE test_users SET age = 21 WHERE name = 'Обновляемый';");
    
    // Проверяем обновление
    const result = testDb.exec('SELECT age FROM test_users WHERE name = "Обновляемый";');
    assertEqual(result[0].values[0][0], 21, 'Возраст должен быть обновлен');
    
    testDb.close();
}, 'integration');

// Тест удаления данных
testRunner.addTest('Должны удаляться записи из таблицы', async () => {
    const testDb = await createTestDatabase();
    
    // Вставляем и удаляем данные
    testDb.exec("INSERT INTO test_users (name, email, age) VALUES ('Удаляемый', 'delete@test.com', 30);");
    
    let result = testDb.exec('SELECT COUNT(*) as count FROM test_users;');
    assertEqual(result[0].values[0][0], 1, 'Должна быть 1 запись перед удалением');
    
    testDb.exec("DELETE FROM test_users WHERE name = 'Удаляемый';");
    
    result = testDb.exec('SELECT COUNT(*) as count FROM test_users;');
    assertEqual(result[0].values[0][0], 0, 'Должно быть 0 записей после удаления');
    
    testDb.close();
}, 'integration');

// Тест JOIN запросов
testRunner.addTest('Должны работать JOIN запросы', async () => {
    const testDb = await createTestDatabase();
    
    // Создаем связанную таблицу
    testDb.exec(`
        CREATE TABLE test_orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            product TEXT,
            FOREIGN KEY (user_id) REFERENCES test_users (id)
        );
    `);
    
    // Вставляем связанные данные
    testDb.exec("INSERT INTO test_users (name, email) VALUES ('Покупатель', 'buyer@test.com');");
    testDb.exec("INSERT INTO test_orders (user_id, product) VALUES (1, 'Тестовый товар');");
    
    // Выполняем JOIN
    const result = testDb.exec(`
        SELECT u.name, o.product 
        FROM test_users u 
        JOIN test_orders o ON u.id = o.user_id;
    `);
    
    assert(result.length > 0, 'JOIN запрос должен вернуть результат');
    assertEqual(result[0].values[0][0], 'Покупатель', 'Имя пользователя должно совпадать');
    assertEqual(result[0].values[0][1], 'Тестовый товар', 'Название товара должно совпадать');
    
    testDb.close();
}, 'integration');

// Тест агрегатных функций
testRunner.addTest('Должны работать агрегатные функции', async () => {
    const testDb = await createTestDatabase();
    
    // Вставляем данные для агрегации
    testDb.exec(`
        INSERT INTO test_users (name, age) VALUES 
        ('Пользователь1', 20),
        ('Пользователь2', 25),
        ('Пользователь3', 30);
    `);
    
    // Тестируем различные агрегатные функции
    let result = testDb.exec('SELECT COUNT(*) as count FROM test_users;');
    assertEqual(result[0].values[0][0], 3, 'COUNT должен вернуть 3');
    
    result = testDb.exec('SELECT AVG(age) as avg_age FROM test_users;');
    assertEqual(result[0].values[0][0], 25, 'Средний возраст должен быть 25');
    
    result = testDb.exec('SELECT MIN(age) as min_age, MAX(age) as max_age FROM test_users;');
    assertEqual(result[0].values[0][0], 20, 'Минимальный возраст должен быть 20');
    assertEqual(result[0].values[0][1], 30, 'Максимальный возраст должен быть 30');
    
    testDb.close();
}, 'integration');

// Тест транзакций
testRunner.addTest('Должны работать транзакции', async () => {
    const testDb = await createTestDatabase();
    
    try {
        testDb.exec('BEGIN TRANSACTION;');
        testDb.exec("INSERT INTO test_users (name, email) VALUES ('Транзакция1', 'trans1@test.com');");
        testDb.exec("INSERT INTO test_users (name, email) VALUES ('Транзакция2', 'trans2@test.com');");
        testDb.exec('COMMIT;');
        
        // Проверяем, что данные сохранились
        const result = testDb.exec('SELECT COUNT(*) as count FROM test_users;');
        assertEqual(result[0].values[0][0], 2, 'Должно быть 2 записи после коммита');
        
    } catch (error) {
        testDb.exec('ROLLBACK;');
        throw error;
    }
    
    testDb.close();
}, 'integration');

// Тест уникальных ограничений
testRunner.addTest('Должны работать ограничения уникальности', async () => {
    const testDb = await createTestDatabase();
    
    // Вставляем первую запись
    testDb.exec("INSERT INTO test_users (name, email) VALUES ('Уникальный', 'unique@test.com');");
    
    // Попытка вставить дублирующийся email должна провалиться
    let errorOccurred = false;
    try {
        testDb.exec("INSERT INTO test_users (name, email) VALUES ('Другой', 'unique@test.com');");
    } catch (error) {
        errorOccurred = true;
        assert(error.message.includes('UNIQUE'), 'Ошибка должна содержать UNIQUE');
    }
    
    assert(errorOccurred, 'Должна возникнуть ошибка при нарушении уникальности');
    
    testDb.close();
}, 'integration');

// Тест работы с датами
testRunner.addTest('Должны работать функции даты и времени', async () => {
    const testDb = await createTestDatabase();
    
    // Создаем таблицу с датами
    testDb.exec(`
        CREATE TABLE test_events (
            id INTEGER PRIMARY KEY,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
    testDb.exec("INSERT INTO test_events (name) VALUES ('Событие');");
    
    // Проверяем работу с датами
    const result = testDb.exec("SELECT datetime(created_at) as formatted_date FROM test_events;");
    
    assert(result.length > 0, 'Должен быть результат запроса с датой');
    assert(result[0].values[0][0].includes('-'), 'Дата должна быть отформатирована');
    
    testDb.close();
}, 'integration');