const BaseTestRunner = require('./base-test-runner');

// Класс для тестов SQL функций
class SQLFunctionsTests extends BaseTestRunner {
    async testExecuteTestSQL() {
        console.log('\n🧪 Тест: Функция executeTestSQL');
        
        // Проверяем доступность функции executeTestSQL
        const executeTestSQLAvailable = await this.page.evaluate(() => {
            return typeof window.executeTestSQL === 'function';
        });
        
        if (executeTestSQLAvailable) {
            this.pass('Функция executeTestSQL доступна глобально');
        } else {
            this.fail('Функция executeTestSQL доступна глобально');
        }
        
        // Тестируем SELECT запрос
        await this.page.evaluate(() => {
            document.getElementById('sql-input').value = 'SELECT 42 as test_column;';
        });
        await this.page.click('#execute-test-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const selectResults = await this.page.$eval('#results-container', el => el.innerHTML);
        if (selectResults.includes('test_column')) {
            this.pass('Результаты SELECT запроса отображаются (текст должен содержать: "test_column")');
        } else {
            this.fail('Результаты SELECT запроса отображаются (текст должен содержать: "test_column")');
        }
        
        if (selectResults.toLowerCase().includes('success')) {
            this.pass('Показывается сообщение об успехе (текст должен содержать: "success")');
        } else {
            this.fail('Показывается сообщение об успехе (текст должен содержать: "success")');
        }
        
        // Тестируем CREATE TABLE
        await this.page.evaluate(() => {
            document.getElementById('sql-input').value = 'CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT);';
        });
        await this.page.click('#execute-test-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const createResults = await this.page.$eval('#results-container', el => el.innerHTML);
        if (createResults.toLowerCase().includes('success')) {
            this.pass('CREATE TABLE запрос выполнен успешно (текст должен содержать: "success")');
        } else {
            this.fail('CREATE TABLE запрос выполнен успешно (текст должен содержать: "success")');
        }
        
        // Тестируем обработку ошибки (пустой запрос)
        await this.page.evaluate(() => {
            document.getElementById('sql-input').value = '';
        });
        await this.page.click('#execute-test-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const errorResults = await this.page.$eval('#results-container', el => el.innerHTML);
        if (errorResults.toLowerCase().includes('error')) {
            this.pass('Ошибка при пустом запросе отображается (текст должен содержать: "error")');
        } else {
            this.fail('Ошибка при пустом запросе отображается (текст должен содержать: "error")');
        }
    }

    async testCheckSolutionSQL() {
        console.log('\n🧪 Тест: Функция checkSolutionSQL');
        
        // Проверяем доступность функции checkSolutionSQL
        const checkSolutionSQLAvailable = await this.page.evaluate(() => {
            return typeof window.checkSolutionSQL === 'function';
        });
        
        if (checkSolutionSQLAvailable) {
            this.pass('Функция checkSolutionSQL доступна глобально');
        } else {
            this.fail('Функция checkSolutionSQL доступна глобально');
        }
        
        // Проверяем кнопку "Check Solution"
        const checkSolutionButton = await this.page.$('#check-solution-btn');
        if (checkSolutionButton !== null) {
            this.pass('Кнопка "Check Solution" присутствует');
        } else {
            this.fail('Кнопка "Check Solution" присутствует');
        }
        
        // Тестируем проверку решения
        await this.page.evaluate(() => {
            document.getElementById('sql-input').value = 'SELECT * FROM students;';
        });
        
        await this.page.click('#check-solution-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Проверяем модальное окно
        const modalVisible = await this.page.evaluate(() => {
            const modal = document.getElementById('task-result-modal');
            return modal && modal.style.display !== 'none';
        });
        
        if (modalVisible) {
            this.pass('Модальное окно с результатом появилось');
        } else {
            this.fail('Модальное окно с результатом появилось');
        }
        
        const modalContent = await this.page.evaluate(() => {
            const modalBody = document.querySelector('#task-result-modal .modal-content');
            return modalBody ? modalBody.textContent : '';
        });
        
        if (modalContent && modalContent.length > 0) {
            this.pass('Модальное окно содержит результат проверки');
        } else {
            this.fail('Модальное окно содержит результат проверки');
        }
        
        // Закрываем модальное окно
        await this.page.click('#task-result-modal .close');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Тестируем ошибку для не-SELECT запроса
        await this.page.evaluate(() => {
            document.getElementById('sql-input').value = 'UPDATE students SET age = 25;';
        });
        
        await this.page.click('#check-solution-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const errorModalContent = await this.page.evaluate(() => {
            const modalBody = document.querySelector('#task-result-modal .modal-content');
            return modalBody ? modalBody.textContent : '';
        });
        
        if (errorModalContent.toLowerCase().includes('error')) {
            this.pass('Ошибка для не-SELECT запроса отображается (текст должен содержать: "error")');
        } else {
            this.fail('Ошибка для не-SELECT запроса отображается (текст должен содержать: "error")');
        }
        
        // Закрываем модальное окно
        await this.page.click('#task-result-modal .close');
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async testExecuteTestQueryButton() {
        console.log('\n🧪 Тест: Кнопка "Execute Test Query"');
        
        // Проверяем кнопку "Execute Test Query"
        const executeTestButton = await this.page.$('#execute-test-btn');
        if (executeTestButton !== null) {
            this.pass('Кнопка "Execute Test Query" присутствует');
        } else {
            this.fail('Кнопка "Execute Test Query" присутствует');
        }
        
        // Тестируем выполнение тестового запроса
        await this.page.evaluate(() => {
            document.getElementById('sql-input').value = 'SELECT 42 as answer;';
        });
        
        await this.page.click('#execute-test-btn');
        
        // Ждем результаты
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const resultsContent = await this.page.$eval('#results-container', el => el.innerHTML);
        console.log('🔍 Результаты после таймаута:', resultsContent);
        console.log('🔍 Фактическое содержимое результатов:', resultsContent);
        
        if (resultsContent.includes('42')) {
            this.pass('Результат отображается после клика по кнопке (текст должен содержать: "42")');
        } else {
            this.fail('Результат отображается после клика по кнопке (текст должен содержать: "42")');
        }
        
        if (resultsContent.includes('answer')) {
            this.pass('Название колонки отображается (текст должен содержать: "answer")');
        } else {
            this.fail('Название колонки отображается (текст должен содержать: "answer")');
        }
    }

    async testCheckTaskSolutionButton() {
        console.log('\n🧪 Тест: Кнопка "Check Task Solution"');
        
        // Проверяем кнопку "Check Task Solution"
        const checkTaskButton = await this.page.$('#check-solution-btn');
        if (checkTaskButton !== null) {
            this.pass('Кнопка "Check Task Solution" присутствует');
        } else {
            this.fail('Кнопка "Check Task Solution" присутствует');
        }
        
        // Проверяем готовность базы данных
        const dbReady = await this.page.evaluate(() => {
            return window.db && typeof window.db.exec === 'function';
        });
        
        if (!dbReady) {
            console.log('⚠️ База данных не готова, но продолжаем тест');
        }
        
        // Тестируем клик по кнопке
        await this.page.click('#check-solution-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Проверяем появление модального окна
        const modalAppeared = await this.page.evaluate(() => {
            const modal = document.getElementById('task-result-modal');
            return modal && modal.style.display !== 'none';
        });
        
        if (modalAppeared) {
            this.pass('Модальное окно появилось после клика по кнопке');
        } else {
            this.fail('Модальное окно появилось после клика по кнопке');
        }
        
        // Закрываем модальное окно
        await this.page.click('#task-result-modal .close');
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Метод для запуска всех SQL тестов
    async runAllTests() {
        console.log('\n🔧 === ТЕСТЫ SQL ФУНКЦИЙ === 🔧\n');
        
        try {
            await this.testExecuteTestSQL();
            await this.testCheckSolutionSQL();
            await this.testExecuteTestQueryButton();
            await this.testCheckTaskSolutionButton();
            
            return this.summary();
        } catch (error) {
            console.error('❌ Критическая ошибка при выполнении SQL тестов:', error);
            this.fail(`Критическая ошибка: ${error.message}`);
            return false;
        }
    }
}

module.exports = SQLFunctionsTests;