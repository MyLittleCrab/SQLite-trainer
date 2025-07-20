const BaseTestRunner = require('./base-test-runner');

// Класс для тестов UI и основной функциональности
class UIBasicTests extends BaseTestRunner {
    async testPageLoad() {
        console.log('\n🧪 Тест: Загрузка главной страницы');
        console.log(`Загружаем: http://localhost:8000/index.html`);
        
        const response = await this.page.goto(`http://localhost:8000/index.html`, { waitUntil: 'networkidle0' });
        console.log(`Статус ответа: ${response.status()}`);
        
        const title = await this.page.title();
        console.log(`Заголовок страницы: "${title}"`);
        if (title.includes('SQLite')) {
            this.pass('Заголовок содержит SQLite (текст должен содержать: "SQLite")');
        } else {
            this.fail('Заголовок содержит SQLite (текст должен содержать: "SQLite")');
        }
        
        // Проверим содержимое страницы для отладки
        const bodyContent = await this.page.content();
        console.log(`Длина HTML: ${bodyContent.length} символов`);
        
        // Добавим скриншот для отладки
        await this.page.screenshot({ path: 'debug-screenshot.png' });
        console.log('Скриншот сохранен в debug-screenshot.png');
    }

    async testUIElements() {
        console.log('\n🧪 Тест: Проверка элементов UI');
        
        const sqlInput = await this.page.$('#sql-input');
        if (sqlInput !== null) {
            this.pass('SQL поле ввода присутствует');
        } else {
            this.fail('SQL поле ввода присутствует');
        }
        
        const runButton = await this.page.$('#execute-test-btn');
        if (runButton !== null) {
            this.pass('Кнопка запуска присутствует');
        } else {
            this.fail('Кнопка запуска присутствует');
        }
        
        const results = await this.page.$('#results-container');
        if (results !== null) {
            this.pass('Область результатов присутствует');
        } else {
            this.fail('Область результатов присутствует');
        }
        
        const schema = await this.page.$('#schema-content');
        if (schema !== null) {
            this.pass('Область схемы присутствует');
        } else {
            this.fail('Область схемы присутствует');
        }
        
        const languageSelect = await this.page.$('#language-select');
        if (languageSelect !== null) {
            this.pass('Переключатель языка присутствует');
        } else {
            this.fail('Переключатель языка присутствует');
        }
    }

    async testSQLiteInitialization() {
        console.log('\n🧪 Тест: Ожидание инициализации SQLite');
        
        try {
            await this.page.waitForFunction(() => {
                return window.db && typeof window.db.exec === 'function';
            }, { timeout: 30000 });
            this.pass('SQLite WebAssembly успешно загружен');
        } catch (error) {
            this.fail('SQLite WebAssembly не загрузился в течение 30 секунд');
        }
    }

    async testSchemaDisplay() {
        console.log('\n🧪 Тест: Проверка отображения схемы');
        const schemaContent = await this.page.$eval('#schema-content', el => el.textContent);
        if (schemaContent.includes('INTEGER PRIMARY KEY')) {
            this.pass('Схема содержит правильные типы данных (текст должен содержать: "INTEGER PRIMARY KEY")');
        } else {
            this.fail('Схема содержит правильные типы данных (текст должен содержать: "INTEGER PRIMARY KEY")');
        }
    }

    async testQueryExamples() {
        console.log('\n🧪 Тест: Проверка примеров запросов');
        
        // Ждем появления кнопок примеров
        await new Promise(resolve => setTimeout(resolve, 2000));
        const exampleButtons = await this.page.$$('.example-btn');
        if (exampleButtons.length > 0) {
            this.pass('Кнопки примеров присутствуют');
            
            // Кликаем на первую кнопку примера
            await exampleButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const inputValue = await this.page.$eval('#sql-input', el => el.value);
            if (inputValue.length > 0) {
                this.pass('Пример запроса загружен в поле ввода');
            } else {
                this.fail('Пример запроса загружен в поле ввода');
            }
        } else {
            this.fail('Кнопки примеров присутствуют');
        }
    }

    async testErrorHandling() {
        console.log('\n🧪 Тест: Проверка обработки ошибок');
        
        await this.page.evaluate(() => document.getElementById('sql-input').value = 'INVALID SQL QUERY;');
        await this.page.click('#execute-test-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const errorResults = await this.page.$eval('#results-container', el => el.textContent);
        if (errorResults.toLowerCase().includes('error')) {
            this.pass('Ошибка правильно отображается (текст должен содержать: "error")');
        } else {
            this.fail('Ошибка правильно отображается (текст должен содержать: "error")');
        }
    }

    async testResponsiveDesign() {
        console.log('\n🧪 Тест: Проверка responsive дизайна');
        
        await this.page.setViewport({ width: 375, height: 667 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const containerWidth = await this.page.$eval('.container', el => el.offsetWidth);
        if (containerWidth < 400) {
            this.pass('Контейнер адаптируется к мобильному размеру');
        } else {
            this.fail('Контейнер адаптируется к мобильному размеру');
        }
        
        await this.page.setViewport({ width: 1280, height: 720 });
    }

    async testInsertQuery() {
        console.log('\n🧪 Тест: Выполнение INSERT запроса');
        
        const insertQuery = "INSERT INTO students (name, age) VALUES ('Test User', 25);";
        await this.page.evaluate((query) => document.getElementById('sql-input').value = query, insertQuery);
        await this.page.click('#execute-test-btn');
        
        const insertSuccessful = await this.page.waitForFunction(
            () => {
                const resultsEl = document.getElementById('results-container');
                return resultsEl && (
                    resultsEl.innerHTML.includes('success') || 
                    resultsEl.innerHTML.includes('INSERT')
                );
            },
            { timeout: 5000 }
        );
        
        if (insertSuccessful) {
            this.pass('INSERT запрос выполнен успешно');
        } else {
            this.fail('INSERT запрос выполнен успешно');
        }
        
        await this.page.evaluate(() => document.getElementById('sql-input').value = 'SELECT COUNT(*) as total FROM students;');
        await this.page.click('#execute-test-btn');
        
        await this.page.waitForFunction(
            () => {
                const resultsEl = document.getElementById('results-container');
                return resultsEl && (
                    resultsEl.innerHTML.includes('total') || 
                    resultsEl.innerHTML.includes('success')
                );
            },
            { timeout: 5000 }
        );
        
        const selectContent = await this.page.$eval('#results-container', el => el.innerHTML);
        if (selectContent.includes('total') || selectContent.includes('success')) {
            this.pass('SELECT запрос после INSERT работает корректно');
        } else {
            this.fail('SELECT запрос после INSERT работает корректно');
        }
    }

    // Метод для запуска всех UI тестов
    async runAllTests() {
        console.log('\n🎯 === БАЗОВЫЕ ТЕСТЫ UI === 🎯\n');
        
        try {
            await this.testPageLoad();
            await this.testUIElements();
            await this.testSQLiteInitialization();
            await this.testSchemaDisplay();
            await this.testQueryExamples();
            await this.testErrorHandling();
            await this.testResponsiveDesign();
            await this.testInsertQuery();
            
            return this.summary();
        } catch (error) {
            console.error('❌ Критическая ошибка при выполнении UI тестов:', error);
            this.fail(`Критическая ошибка: ${error.message}`);
            return false;
        }
    }
}

module.exports = UIBasicTests;