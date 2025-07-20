const { BaseTest, BASE_URL } = require('./utils/test-config');

// Класс для тестов UI и основной функциональности
class UIBasicTests extends BaseTest {
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
        
        const runButton = await this.page.$('#execute-test-btn');
        await this.runner.assert(runButton !== null, 'Кнопка запуска присутствует');
        
        const results = await this.page.$('#results-container');
        await this.runner.assert(results !== null, 'Область результатов присутствует');
        
        const schema = await this.page.$('#schema-content');
        await this.runner.assert(schema !== null, 'Область схемы присутствует');
        
        // Проверяем наличие переключателя языка
        const languageSelect = await this.page.$('#language-select');
        await this.runner.assert(languageSelect !== null, 'Переключатель языка присутствует');
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
        await this.page.click('#execute-test-btn');
        
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

    async testInsertQuery() {
        console.log('\n🧪 Тест: Выполнение INSERT запроса');
        
        // Выполняем INSERT запрос
        const insertQuery = "INSERT INTO students (name, age) VALUES ('Test Student', 25);";
        await this.page.evaluate((query) => {
            document.getElementById('sql-input').value = query;
        }, insertQuery);
        
        await this.page.click('#execute-test-btn');
        
        // Ждем выполнения запроса
        await this.page.waitForFunction(
            () => {
                const results = document.getElementById('results-container').innerHTML;
                return results.includes('Query executed successfully') || 
                       results.includes('Запрос выполнен успешно') ||
                       results.includes('success');
            },
            { timeout: 10000 }
        );
        
        // Проверяем что запрос выполнился успешно
        const resultsContent = await this.page.$eval('#results-container', el => el.innerHTML);
        const insertSuccessful = resultsContent.includes('success') || 
                                resultsContent.includes('успешно') ||
                                resultsContent.includes('Query executed successfully');
        
        await this.runner.assert(insertSuccessful, 'INSERT запрос выполнен успешно');
        
        // Дополнительно проверяем что можем выполнить SELECT для проверки вставки
        await this.page.evaluate(() => {
            document.getElementById('sql-input').value = "SELECT COUNT(*) as total FROM students;";
        });
        
        await this.page.click('#execute-test-btn');
        
        await this.page.waitForFunction(
            () => {
                const results = document.getElementById('results-container').innerHTML;
                return results.includes('total') || results.includes('success');
            },
            { timeout: 5000 }
        );
        
        const selectContent = await this.page.$eval('#results-container', el => el.innerHTML);
        await this.runner.assert(
            selectContent.includes('total') || selectContent.includes('success'),
            'SELECT запрос после INSERT работает корректно'
        );
    }
}

module.exports = UIBasicTests;