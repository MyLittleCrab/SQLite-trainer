const puppeteer = require('puppeteer');

// Конфигурация / Configuration
const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;

// Функция ожидания готовности сервера / Server readiness waiting function
async function waitForServer(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(BASE_URL);
            if (response.ok) {
                console.log(`🌍 Сервер готов на ${BASE_URL}`);
                return true;
            }
        } catch (error) {
            // Сервер еще не готов, ждем / Server not ready yet, waiting
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Сервер не отвечает после 30 секунд ожидания');
}

// Утилиты для тестирования / Testing utilities
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

// Класс для основных тестов / Main tests class
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
        
        // Проверим содержимое страницы для отладки / Check page content for debugging
        const bodyContent = await this.page.content();
        console.log(`Длина HTML: ${bodyContent.length} символов`);
        
        // Добавим скриншот для отладки / Add screenshot for debugging
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
        
        // Проверяем наличие переключателя языка
        const languageSelect = await this.page.$('#language-select');
        await this.runner.assert(languageSelect !== null, 'Переключатель языка присутствует');
    }

    async testI18nSystem() {
        console.log('\n🧪 Тест: Проверка системы интернационализации');
        
        // Ждем загрузки i18n системы
        try {
            await this.page.waitForFunction(
                () => window.i18n !== undefined,
                { timeout: 5000 }
            );
            await this.runner.assert(true, 'Система i18n загружена');
        } catch (error) {
            await this.runner.assert(false, 'Система i18n не загрузилась');
            return;
        }
        
        // Проверяем наличие переводов
        const hasTranslations = await this.page.evaluate(() => {
            return typeof window.i18n === 'object' && 
                   typeof window.i18n.t === 'function';
        });
        await this.runner.assert(hasTranslations, 'Функция перевода i18n.t доступна');
        
        // Проверяем элементы с data-i18n атрибутами
        const i18nElements = await this.page.$$('[data-i18n]');
        await this.runner.assert(i18nElements.length > 0, 'Найдены элементы с data-i18n атрибутами');
        console.log(`Найдено ${i18nElements.length} элементов с data-i18n`);
        
        // Проверяем основные переводы
        const headerTitle = await this.page.$eval('[data-i18n="header.title"]', el => el.textContent);
        await this.runner.assert(headerTitle.length > 0, 'Заголовок переведен');
        console.log(`Заголовок: "${headerTitle}"`);
    }

    async testLanguageSwitching() {
        console.log('\n🧪 Тест: Переключение языков');
        
        // Получаем изначальный заголовок (английский)
        const initialTitle = await this.page.$eval('[data-i18n="header.title"]', el => el.textContent);
        console.log(`Изначальный заголовок: "${initialTitle}"`);
        
        // Переключаемся на русский
        await this.page.select('#language-select', 'ru');
        
        // Ждем обновления интерфейса
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Проверяем, что заголовок изменился
        const russianTitle = await this.page.$eval('[data-i18n="header.title"]', el => el.textContent);
        console.log(`Русский заголовок: "${russianTitle}"`);
        
        await this.runner.assert(
            russianTitle !== initialTitle && russianTitle.includes('тренажер'),
            'Заголовок переведен на русский'
        );
        
        // Проверяем другие элементы интерфейса
        const executeButton = await this.page.$eval('[data-i18n="sql.execute"]', el => el.textContent);
        await this.runner.assert(
            executeButton.includes('Выполнить'),
            'Кнопка "Выполнить запрос" переведена на русский'
        );
        
        // Возвращаемся на английский
        await this.page.select('#language-select', 'en');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const englishTitle = await this.page.$eval('[data-i18n="header.title"]', el => el.textContent);
        await this.runner.assert(
            englishTitle === initialTitle,
            'Заголовок вернулся к английскому'
        );
        
        // Проверяем сохранение языка в localStorage
        const savedLanguage = await this.page.evaluate(() => {
            return localStorage.getItem('sqltrainer-language');
        });
        await this.runner.assert(savedLanguage === 'en', 'Выбранный язык сохранен в localStorage');
        
        // Проверяем атрибут lang в HTML
        const htmlLang = await this.page.evaluate(() => {
            return document.documentElement.getAttribute('lang');
        });
        await this.runner.assert(htmlLang === 'en', 'Атрибут lang в HTML установлен корректно');
        
        // Дополнительно проверяем загрузку JSON файлов переводов
        await this.testI18nFileLoading();
    }
    
    async testI18nFileLoading() {
        console.log('\n🧪 Тест: Проверка загрузки JSON файлов переводов');
        
        // Проверяем загрузку английских переводов
        const enTranslations = await this.page.evaluate(async () => {
            try {
                const response = await fetch('./i18n/i18nen.json');
                return response.ok;
            } catch (error) {
                return false;
            }
        });
        await this.runner.assert(enTranslations, 'Файл английских переводов загружается');
        
        // Проверяем загрузку русских переводов
        const ruTranslations = await this.page.evaluate(async () => {
            try {
                const response = await fetch('./i18n/i18nru.json');
                return response.ok;
            } catch (error) {
                return false;
            }
        });
        await this.runner.assert(ruTranslations, 'Файл русских переводов загружается');
        
        // Проверяем содержимое переводов
        const translationsData = await this.page.evaluate(async () => {
            try {
                const [enResponse, ruResponse] = await Promise.all([
                    fetch('./i18n/i18nen.json'),
                    fetch('./i18n/i18nru.json')
                ]);
                
                const [enData, ruData] = await Promise.all([
                    enResponse.json(),
                    ruResponse.json()
                ]);
                
                return {
                    en: enData,
                    ru: ruData,
                    enKeys: Object.keys(enData).length,
                    ruKeys: Object.keys(ruData).length
                };
            } catch (error) {
                return null;
            }
        });
        
        if (translationsData) {
            await this.runner.assert(
                translationsData.enKeys > 0,
                `Английские переводы содержат ${translationsData.enKeys} секций`
            );
            
            await this.runner.assert(
                translationsData.ruKeys > 0,
                `Русские переводы содержат ${translationsData.ruKeys} секций`
            );
            
            await this.runner.assert(
                translationsData.enKeys === translationsData.ruKeys,
                'Количество секций в английском и русском переводах совпадает'
            );
            
            // Проверяем наличие ключевых переводов
            const hasKeyTranslations = translationsData.en.header && 
                                      translationsData.en.header.title &&
                                      translationsData.ru.header && 
                                      translationsData.ru.header.title;
            
            await this.runner.assert(hasKeyTranslations, 'Ключевые переводы (header.title) присутствуют');
        } else {
            await this.runner.assert(false, 'Не удалось загрузить и проверить содержимое переводов');
        }
    }

    async testSQLiteInitialization() {
        console.log('\n🧪 Тест: Ожидание инициализации SQLite');
        
        // Ждем загрузки SQLite (максимум 10 секунд) / Wait for SQLite loading (maximum 10 seconds)
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
        
        // Проверяем наличие секции задач / Check task section presence
        const taskSection = await this.page.$('#task-content');
        await this.runner.assert(taskSection !== null, 'Секция задач присутствует');
        
        // Проверяем заголовок задачи / Check task title
        const taskHeader = await this.page.$('.task-header h3');
        await this.runner.assert(taskHeader !== null, 'Заголовок задачи отображается');
        
        const taskTitle = await this.page.evaluate(el => el.textContent, taskHeader);
        console.log(`Загружена задача: "${taskTitle}"`);
        
        // Проверяем кнопку "Следующая задача" / Check "Next task" button
        const nextTaskButton = await this.page.$('.task-header button');
        await this.runner.assert(nextTaskButton !== null, 'Кнопка "Следующая задача" присутствует');
        
        // Проверяем описание задачи / Check task description
        const taskDescription = await this.page.$('.task-description');
        await this.runner.assert(taskDescription !== null, 'Описание задачи присутствует');
        
        // Проверяем кнопку подсказки / Check hint button
        const hintButton = await this.page.$('.btn-hint');
        await this.runner.assert(hintButton !== null, 'Кнопка подсказки присутствует');
        
        // Тестируем подсказку / Test hint functionality
        await hintButton.click();
        await this.page.waitForSelector('.task-hint', { visible: true });
        const hintVisible = await this.page.$eval('.task-hint', el => el.style.display !== 'none');
        await this.runner.assert(hintVisible, 'Подсказка отображается после клика');
        
        return { taskTitle, taskHeader };
    }

    async testTaskExecution(taskTitle) {
        console.log('\n🧪 Тест: Выполнение SQL задачи');
        
        // Используем правильный SQL запрос в зависимости от загруженной задачи / Use correct SQL query depending on loaded task
        const sqlQuery = taskTitle.includes('Агрегация') 
            ? 'SELECT age, COUNT(*) as count FROM students GROUP BY age ORDER BY age;'
            : taskTitle.includes('Соединение') 
            ? "SELECT s.name, g.grade FROM students s JOIN grades g ON s.id = g.student_id WHERE g.subject = 'Математика';"
            : 'SELECT name, age FROM students WHERE age > 20;';
        
        await this.page.evaluate((query) => {
            document.getElementById('sql-input').value = query;
        }, sqlQuery);
        
        // Выполняем запрос / Execute query
        await this.page.click('#execute-btn');
        
        // Ждем появления результатов / Wait for results to appear
        await this.page.waitForFunction(
            () => document.querySelector('#results-container table') !== null,
            { timeout: 10000 }
        );
        
        // Проверяем статус задачи / Check task status
        await this.page.waitForSelector('#task-status', { timeout: 5000 });
        
        // Ждем появления сообщения о статусе / Wait for status message to appear
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

    async testSchemaUpdateAfterInsert() {
        console.log('\n🧪 Тест: Обновление схемы после INSERT запроса');
        
        // Получаем первоначальное количество записей в таблице students / Get initial number of records in students table
        const initialCount = await this.page.evaluate(() => {
            const schemaContent = document.getElementById('schema-content').innerHTML;
            const match = schemaContent.match(/students.*?Записей:\s*(\d+)/s);
            return match ? parseInt(match[1]) : 0;
        });
        
        console.log(`Первоначальное количество записей в таблице students: ${initialCount}`);
        
        // Выполняем INSERT запрос / Execute INSERT query
        const insertQuery = "INSERT INTO students (name, age) VALUES ('Тестовый Студент', 25);";
        await this.page.evaluate((query) => {
            document.getElementById('sql-input').value = query;
        }, insertQuery);
        
        await this.page.click('#execute-btn');
        
        // Ждем выполнения запроса / Wait for query execution
        await this.page.waitForFunction(
            () => {
                const results = document.getElementById('results-container').innerHTML;
                return results.includes('Запрос выполнен успешно');
            },
            { timeout: 5000 }
        );
        
        // Проверяем, что схема обновилась / Check that schema updated
        await this.page.waitForFunction(
            (expectedCount) => {
                const schemaContent = document.getElementById('schema-content').innerHTML;
                const match = schemaContent.match(/students.*?Записей:\s*(\d+)/s);
                const currentCount = match ? parseInt(match[1]) : 0;
                return currentCount === expectedCount + 1;
            },
            { timeout: 5000 },
            initialCount
        );
        
        const finalCount = await this.page.evaluate(() => {
            const schemaContent = document.getElementById('schema-content').innerHTML;
            const match = schemaContent.match(/students.*?Записей:\s*(\d+)/s);
            return match ? parseInt(match[1]) : 0;
        });
        
        console.log(`Количество записей после INSERT: ${finalCount}`);
        await this.runner.assert(finalCount === initialCount + 1, 
            `Количество записей увеличилось на 1 (было: ${initialCount}, стало: ${finalCount})`);
        
        // Дополнительная проверка: выполним еще один INSERT и проверим снова / Additional check: execute another INSERT and verify again
        const secondInsertQuery = "INSERT INTO students (name, age) VALUES ('Второй Тестовый', 30);";
        await this.page.evaluate((query) => {
            document.getElementById('sql-input').value = query;
        }, secondInsertQuery);
        
        await this.page.click('#execute-btn');
        
        await this.page.waitForFunction(
            () => {
                const results = document.getElementById('results-container').innerHTML;
                return results.includes('Запрос выполнен успешно');
            },
            { timeout: 5000 }
        );
        
        await this.page.waitForFunction(
            (expectedCount) => {
                const schemaContent = document.getElementById('schema-content').innerHTML;
                const match = schemaContent.match(/students.*?Записей:\s*(\d+)/s);
                const currentCount = match ? parseInt(match[1]) : 0;
                return currentCount === expectedCount + 2;
            },
            { timeout: 5000 },
            initialCount
        );
        
        const finalCount2 = await this.page.evaluate(() => {
            const schemaContent = document.getElementById('schema-content').innerHTML;
            const match = schemaContent.match(/students.*?Записей:\s*(\d+)/s);
            return match ? parseInt(match[1]) : 0;
        });
        
        console.log(`Количество записей после второго INSERT: ${finalCount2}`);
        await this.runner.assert(finalCount2 === initialCount + 2, 
            `Количество записей увеличилось на 2 (было: ${initialCount}, стало: ${finalCount2})`);
    }

    async testTaskSwitch(oldTaskTitle) {
        console.log('\n🧪 Тест: Смена задачи');
        
        await this.page.click('.task-header button'); // Кнопка "Следующая задача" / "Next task" button
        
        // Даем время на обработку клика / Give time to process click
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Ждем загрузки новой задачи / Wait for new task loading
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

// Основная функция запуска тестов / Main test execution function
async function runTests() {
    let browser = null;
    const runner = new TestRunner();

    try {
        // Ждем готовности сервера / Wait for server readiness
        await waitForServer();
        
        // Запускаем браузер / Launch browser
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
        
        // Включаем консольные логи / Enable console logs
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🔴 Browser Error: ${msg.text()}`);
            }
        });

        // Создаем экземпляр тестов / Create test instance
        const tests = new SQLitePlaygroundTests(page, runner);

        // Запускаем все тесты последовательно / Run all tests sequentially
        await tests.testPageLoad();
        await tests.testUIElements();
        await tests.testI18nSystem();
        await tests.testLanguageSwitching();
        await tests.testSQLiteInitialization();
        await tests.testSchemaDisplay();
        await tests.testExampleQueries();
        await tests.testErrorHandling();
        await tests.testResponsiveDesign();
        
        const { taskTitle } = await tests.testTaskSystem();
        await tests.testTaskExecution(taskTitle);
        await tests.testSchemaUpdateAfterInsert();
        await tests.testTaskSwitch(taskTitle);

    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении тестов:', error);
        await runner.assert(false, `Критическая ошибка: ${error.message}`);
    } finally {
        // Закрываем браузер / Close browser
        if (browser) {
            await browser.close();
            console.log('🔒 Браузер закрыт');
        }
    }

    return runner.summary();
}

// Запуск тестов / Run tests
console.log('🚀 Запуск Puppeteer тестов для SQLite WebAssembly Playground\n');
runTests().then(success => {
    process.exit(success ? 0 : 1);
});