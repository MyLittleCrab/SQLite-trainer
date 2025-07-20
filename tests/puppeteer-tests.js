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

// Класс для основных тестов
class SQLitePlaygroundTests {
    constructor(page, runner) {
        this.page = page;
        this.runner = runner;
    }

    async testPageLoad() {
        console.log('\n🧪 Тест: Загрузка главной страницы');
        console.log(`Загружаем: ${BASE_URL}/index.html`);
        
        const response = await this.page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
        console.log(`Статус ответа: ${response.status()}`);
        
        const title = await this.page.title();
        console.log(`Заголовок страницы: "${title}"`);
        await this.runner.assertContains(title, 'SQLite', 'Заголовок содержит SQLite');
        
        // Проверим содержимое страницы для отладки
        const bodyContent = await this.page.content();
        console.log(`Длина HTML: ${bodyContent.length} символов`);
        
        // Добавим скриншот для отладки
        await this.page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
        console.log('Скриншот сохранен в debug-screenshot.png');
    }

    async testUIElements() {
        console.log('\n🧪 Тест: Проверка элементов UI');
        
        const sqlInput = await this.page.$('#sql-input');
        await this.runner.assert(sqlInput !== null, 'SQL поле ввода присутствует');
        
        const runButton = await this.page.$('#execute-btn');
        await this.runner.assert(runButton !== null, 'Кнопка запуска присутствует');
        
        const results = await this.page.$('#results-container');
        await this.runner.assert(results !== null, 'Область результатов присутствует');
        
        const schema = await this.page.$('#schema-content');
        await this.runner.assert(schema !== null, 'Область схемы присутствует');
    }

    async testSQLiteInitialization() {
        console.log('\n🧪 Тест: Ожидание инициализации SQLite');
        
        // Ждем загрузки SQLite (максимум 10 секунд)
        try {
            await this.page.waitForFunction(
                () => window.db !== null && window.SQL !== null,
                { timeout: 10000 }
            );
            await this.runner.assert(true, 'SQLite WebAssembly успешно загружен');
        } catch (error) {
            await this.runner.assert(false, 'SQLite WebAssembly не загрузился в течение 10 секунд');
        }
    }

    async testSchemaDisplay() {
        console.log('\n🧪 Тест: Проверка отображения схемы');
        
        const schemaContent = await this.page.$eval('#schema-content', el => el.innerHTML);
        await this.runner.assertContains(schemaContent, 'INTEGER PRIMARY KEY', 'Схема содержит правильные типы данных');
    }

    async testExampleQueries() {
        console.log('\n🧪 Тест: Проверка примеров запросов');
        
        const exampleButtons = await this.page.$$('.example-btn');
        await this.runner.assert(exampleButtons.length > 0, 'Кнопки примеров присутствуют');
        
        if (exampleButtons.length > 0) {
            await exampleButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const inputValue = await this.page.$eval('#sql-input', el => el.value);
            await this.runner.assert(inputValue.length > 0, 'Пример запроса загружен в поле ввода');
        }
    }

    async testErrorHandling() {
        console.log('\n🧪 Тест: Проверка обработки ошибок');
        
        await this.page.evaluate(() => document.getElementById('sql-input').value = '');
        await this.page.type('#sql-input', 'SELECT * FROM nonexistent_table');
        await this.page.click('#execute-btn');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const errorResults = await this.page.$eval('#results-container', el => el.innerHTML);
        await this.runner.assertContains(errorResults.toLowerCase(), 'error', 'Ошибка правильно отображается');
    }

    async testResponsiveDesign() {
        console.log('\n🧪 Тест: Проверка responsive дизайна');
        
        await this.page.setViewport({ width: 400, height: 600 });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const containerWidth = await this.page.$eval('.container', el => el.offsetWidth);
        await this.runner.assert(containerWidth < 400, 'Контейнер адаптируется к мобильному размеру');
    }

    async testTaskSystem() {
        console.log('\n🧪 Тест: Система задач');
        
        // Проверяем наличие секции задач
        const taskSection = await this.page.$('#task-content');
        await this.runner.assert(taskSection !== null, 'Секция задач присутствует');
        
        // Проверяем заголовок задачи
        const taskHeader = await this.page.$('.task-header h3');
        await this.runner.assert(taskHeader !== null, 'Заголовок задачи отображается');
        
        const taskTitle = await this.page.evaluate(el => el.textContent, taskHeader);
        console.log(`Загружена задача: "${taskTitle}"`);
        
        // Проверяем кнопку "Следующая задача"
        const nextTaskButton = await this.page.$('.task-header button');
        await this.runner.assert(nextTaskButton !== null, 'Кнопка "Следующая задача" присутствует');
        
        // Проверяем описание задачи
        const taskDescription = await this.page.$('.task-description');
        await this.runner.assert(taskDescription !== null, 'Описание задачи присутствует');
        
        // Проверяем кнопку подсказки
        const hintButton = await this.page.$('.btn-hint');
        await this.runner.assert(hintButton !== null, 'Кнопка подсказки присутствует');
        
        // Тестируем подсказку
        await hintButton.click();
        await this.page.waitForSelector('.task-hint', { visible: true });
        const hintVisible = await this.page.$eval('.task-hint', el => el.style.display !== 'none');
        await this.runner.assert(hintVisible, 'Подсказка отображается после клика');
        
        return { taskTitle, taskHeader };
    }

    async testTaskExecution(taskTitle) {
        console.log('\n🧪 Тест: Выполнение SQL задачи');
        
        // Используем правильный SQL запрос в зависимости от загруженной задачи
        const sqlQuery = taskTitle.includes('Агрегация') 
            ? 'SELECT age, COUNT(*) as count FROM students GROUP BY age ORDER BY age;'
            : taskTitle.includes('Соединение') 
            ? "SELECT s.name, g.grade FROM students s JOIN grades g ON s.id = g.student_id WHERE g.subject = 'Математика';"
            : 'SELECT name, age FROM students WHERE age > 20;';
        
        await this.page.evaluate((query) => {
            document.getElementById('sql-input').value = query;
        }, sqlQuery);
        
        // Выполняем запрос
        await this.page.click('#execute-btn');
        
        // Ждем появления результатов
        await this.page.waitForFunction(
            () => document.querySelector('#results-container table') !== null,
            { timeout: 10000 }
        );
        
        // Проверяем статус задачи
        await this.page.waitForSelector('#task-status', { timeout: 5000 });
        
        // Ждем появления сообщения о статусе
        await this.page.waitForFunction(
            () => {
                const statusEl = document.getElementById('task-status');
                return statusEl && statusEl.textContent.trim() !== '';
            },
            { timeout: 5000 }
        );
        
        const statusClass = await this.page.$eval('#task-status', el => el.className);
        const statusText = await this.page.$eval('#task-status', el => el.textContent);
        
        console.log(`Статус задачи: ${statusClass}, текст: ${statusText}`);
        await this.runner.assert(statusClass.includes('success'), 'Задача решена успешно');
        
        console.log('✅ Задача выполнена успешно');
    }

    async testTaskSwitch(oldTaskTitle) {
        console.log('\n🧪 Тест: Смена задачи');
        
        await this.page.click('.task-header button'); // Кнопка "Следующая задача"
        
        // Даем время на обработку клика
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Ждем загрузки новой задачи
        await this.page.waitForFunction(
            (oldTitle) => {
                const newTitle = document.querySelector('.task-header h3');
                return newTitle && newTitle.textContent !== oldTitle;
            },
            { timeout: 10000 },
            oldTaskTitle
        );
        
        const newTaskHeader = await this.page.$('.task-header h3');
        const newTaskTitle = await this.page.evaluate(el => el.textContent, newTaskHeader);
        await this.runner.assert(newTaskTitle !== oldTaskTitle, 'Задача изменилась');
        
        console.log(`Новая задача: "${newTaskTitle}"`);
    }
}

// Основная функция запуска тестов
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

        // Создаем экземпляр тестов
        const tests = new SQLitePlaygroundTests(page, runner);

        // Запускаем все тесты последовательно
        await tests.testPageLoad();
        await tests.testUIElements();
        await tests.testSQLiteInitialization();
        await tests.testSchemaDisplay();
        await tests.testExampleQueries();
        await tests.testErrorHandling();
        await tests.testResponsiveDesign();
        
        const { taskTitle } = await tests.testTaskSystem();
        await tests.testTaskExecution(taskTitle);
        await tests.testTaskSwitch(taskTitle);

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
console.log('🚀 Запуск Puppeteer тестов для SQLite WebAssembly Playground\n');
runTests().then(success => {
    process.exit(success ? 0 : 1);
});