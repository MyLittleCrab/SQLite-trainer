const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Конфигурация
const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}`;

// Простой HTTP сервер
function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer((request, response) => {
            const rootDir = path.join(__dirname, '..');
            let filePath = path.join(rootDir, request.url === '/' ? '/index.html' : request.url);
            
            // Проверяем существование файла
            if (!fs.existsSync(filePath)) {
                response.writeHead(404);
                response.end('File not found');
                return;
            }
            
            // Определяем Content-Type
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.wasm': 'application/wasm'
            };
            
            const contentType = contentTypes[ext] || 'text/plain';
            
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    response.writeHead(500);
                    response.end('Server error');
                    return;
                }
                
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(data);
            });
        });
        
        server.listen(PORT, () => {
            console.log(`🚀 HTTP сервер запущен на ${BASE_URL}`);
            resolve(server);
        });
    });
}

// Утилиты для тестирования
class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }

    async assert(condition, message) {
        if (condition) {
            console.log(`✅ ${message}`);
            this.passed++;
        } else {
            console.log(`❌ ${message}`);
            this.failed++;
        }
    }

    async assertEqual(actual, expected, message) {
        await this.assert(actual === expected, 
            `${message} (ожидалось: ${expected}, получено: ${actual})`);
    }

    async assertContains(text, substring, message) {
        await this.assert(text.includes(substring), 
            `${message} (текст должен содержать: "${substring}")`);
    }

    summary() {
        console.log(`\n📊 Результаты Puppeteer тестов:`);
        console.log(`✅ Пройдено: ${this.passed}`);
        console.log(`❌ Провалено: ${this.failed}`);
        console.log(`📈 Общий результат: ${this.passed}/${this.passed + this.failed}`);
        return this.failed === 0;
    }
}

// Основные тесты
async function runTests() {
    let browser = null;
    let server = null;
    const runner = new TestRunner();

    try {
        // Запускаем сервер
        server = await startServer();
        
        // Запускаем браузер
        console.log('🌐 Запуск Chromium...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ]
        });

        const page = await browser.newPage();
        
        // Включаем консольные логи
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🔴 Browser Error: ${msg.text()}`);
            }
        });

        // Тест 1: Загрузка главной страницы
        console.log('\n🧪 Тест 1: Загрузка главной страницы');
        console.log(`Загружаем: ${BASE_URL}/index.html`);
        
        const response = await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
        console.log(`Статус ответа: ${response.status()}`);
        
        const title = await page.title();
        console.log(`Заголовок страницы: "${title}"`);
        await runner.assertContains(title, 'SQLite', 'Заголовок содержит SQLite');
        
        // Проверим содержимое страницы для отладки
        const bodyContent = await page.content();
        console.log(`Длина HTML: ${bodyContent.length} символов`);
        
        // Добавим скриншот для отладки
        await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
        console.log('Скриншот сохранен в debug-screenshot.png');
        
        // Тест 2: Проверка элементов UI
        console.log('\n🧪 Тест 2: Проверка элементов UI');
        
        const sqlInput = await page.$('#sql-input');
        await runner.assert(sqlInput !== null, 'SQL поле ввода присутствует');
        
        const runButton = await page.$('#execute-btn');
        await runner.assert(runButton !== null, 'Кнопка запуска присутствует');
        
        const results = await page.$('#results-container');
        await runner.assert(results !== null, 'Область результатов присутствует');
        
        const schema = await page.$('#schema-content');
        await runner.assert(schema !== null, 'Область схемы присутствует');

        // Тест 3: Проверка инициализации SQLite
        console.log('\n🧪 Тест 3: Ожидание инициализации SQLite');
        
        // Ждем загрузки SQLite (максимум 10 секунд)
        try {
            await page.waitForFunction(
                () => window.db !== null && window.SQL !== null,
                { timeout: 10000 }
            );
            await runner.assert(true, 'SQLite WebAssembly успешно загружен');
        } catch (error) {
            await runner.assert(false, 'SQLite WebAssembly не загрузился в течение 10 секунд');
        }

        // Тест 4: Проверка отображения схемы
        console.log('\n🧪 Тест 4: Проверка отображения схемы');
        
        const schemaContent = await page.$eval('#schema-content', el => el.innerHTML);
        await runner.assertContains(schemaContent, 'users', 'Схема содержит таблицу users');
        await runner.assertContains(schemaContent, 'orders', 'Схема содержит таблицу orders');
        await runner.assertContains(schemaContent, 'INTEGER PRIMARY KEY', 'Схема содержит правильные типы данных');

        // Тест 5: Выполнение SELECT запроса
        console.log('\n🧪 Тест 5: Выполнение SELECT запроса');
        
        // Очищаем поле ввода полностью
        await page.evaluate(() => document.getElementById('sql-input').value = '');
        
        // Ждем немного для обеспечения готовности
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await page.type('#sql-input', 'SELECT COUNT(*) as total FROM users');
        
        // Дополнительная проверка готовности SQLite
        await page.waitForFunction(
            () => window.db !== null && window.SQL !== null,
            { timeout: 5000 }
        );
        
        await page.click('#execute-btn');
        
        // Ждем завершения выполнения SQL (кнопка снова станет активной)
        await page.waitForFunction(
            () => {
                const btn = document.getElementById('execute-btn');
                return btn && !btn.disabled && btn.textContent === 'Выполнить запрос';
            },
            { timeout: 5000 }
        );
        
        // Дополнительная небольшая пауза для обеспечения обновления DOM
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const resultsContent = await page.$eval('#results-container', el => el.innerHTML);
        console.log(`Содержимое результатов: ${resultsContent.substring(0, 200)}...`);
        
        await runner.assertContains(resultsContent, 'total', 'Результат содержит колонку total');
        await runner.assertContains(resultsContent, '<table', 'Результат отображается в виде таблицы');

        // Тест 6: Очистка и новый запрос
        console.log('\n🧪 Тест 6: Очистка и новый запрос');
        
        await page.evaluate(() => document.getElementById('sql-input').value = '');
        await page.type('#sql-input', 'SELECT name FROM users LIMIT 3');
        await page.click('#execute-btn');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newResults = await page.$eval('#results-container', el => el.innerHTML);
        await runner.assertContains(newResults, 'name', 'Новый результат содержит колонку name');

        // Тест 7: Проверка примеров запросов
        console.log('\n🧪 Тест 7: Проверка примеров запросов');
        
        const exampleButtons = await page.$$('.example-btn');
        await runner.assert(exampleButtons.length > 0, 'Кнопки примеров присутствуют');
        
        if (exampleButtons.length > 0) {
            await exampleButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const inputValue = await page.$eval('#sql-input', el => el.value);
            await runner.assert(inputValue.length > 0, 'Пример запроса загружен в поле ввода');
        }

        // Тест 8: Проверка обработки ошибок
        console.log('\n🧪 Тест 8: Проверка обработки ошибок');
        
        await page.evaluate(() => document.getElementById('sql-input').value = '');
        await page.type('#sql-input', 'SELECT * FROM nonexistent_table');
        await page.click('#execute-btn');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const errorResults = await page.$eval('#results-container', el => el.innerHTML);
        await runner.assertContains(errorResults.toLowerCase(), 'error', 'Ошибка правильно отображается');

        // Тест 9: Проверка INSERT запроса
        console.log('\n🧪 Тест 9: Проверка INSERT запроса');
        
        await page.evaluate(() => document.getElementById('sql-input').value = '');
        await page.type('#sql-input', "INSERT INTO users (name, email) VALUES ('Test User', 'test@example.com')");
        await page.click('#execute-btn');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const insertResults = await page.$eval('#results-container', el => el.innerHTML);
        await runner.assertContains(insertResults, 'успешно', 'INSERT запрос выполнен успешно');

        // Тест 10: Проверка обновления схемы после INSERT
        console.log('\n🧪 Тест 10: Проверка что данные добавились');
        
        await page.evaluate(() => document.getElementById('sql-input').value = '');
        await page.type('#sql-input', "SELECT COUNT(*) as count FROM users WHERE email = 'test@example.com'");
        await page.click('#execute-btn');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const countResults = await page.$eval('#results-container', el => el.innerHTML);
        await runner.assertContains(countResults, '1', 'Новая запись найдена в базе данных');

        // Тест 11: Проверка responsive дизайна
        console.log('\n🧪 Тест 11: Проверка responsive дизайна');
        
        await page.setViewport({ width: 400, height: 600 });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const containerWidth = await page.$eval('.container', el => el.offsetWidth);
        await runner.assert(containerWidth < 400, 'Контейнер адаптируется к мобильному размеру');

        // Тест 12: Проверка производительности
        console.log('\n🧪 Тест 12: Проверка производительности');
        
        const startTime = Date.now();
        await page.evaluate(() => document.getElementById('sql-input').value = '');
        await page.type('#sql-input', 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id LIMIT 100');
        await page.click('#execute-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const endTime = Date.now();
        
        await runner.assert(endTime - startTime < 5000, 'Сложный запрос выполняется менее чем за 5 секунд');

    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении тестов:', error);
        await runner.assert(false, `Критическая ошибка: ${error.message}`);
    } finally {
        // Закрываем браузер
        if (browser) {
            await browser.close();
            console.log('🔒 Браузер закрыт');
        }
        
        // Закрываем сервер
        if (server) {
            server.close();
            console.log('🛑 HTTP сервер остановлен');
        }
    }

    return runner.summary();
}

// Запуск тестов
if (require.main === module) {
    console.log('🚀 Запуск Puppeteer тестов для SQLite WebAssembly Playground\n');
    
    runTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Фатальная ошибка:', error);
            process.exit(1);
        });
}

module.exports = { runTests, TestRunner };