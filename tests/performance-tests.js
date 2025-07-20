const BaseTestRunner = require('./base-test-runner');

// Класс для тестов производительности
class PerformanceTests extends BaseTestRunner {
    async testPageLoadSpeed() {
        console.log('\n🧪 Тест: Скорость загрузки страницы');
        
        const startTime = Date.now();
        await this.page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        const loadTime = Date.now() - startTime;
        
        console.log(`⏱️ Время загрузки: ${loadTime}мс`);
        
        if (loadTime < 5000) {
            this.pass(`Страница загружается быстро (${loadTime}мс < 5000мс)`);
        } else {
            this.fail(`Страница загружается быстро (${loadTime}мс < 5000мс)`);
        }
    }

    async testSQLiteInitSpeed() {
        console.log('\n🧪 Тест: Скорость инициализации SQLite');
        
        const startTime = Date.now();
        
        try {
            await this.page.waitForFunction(() => {
                return window.db && typeof window.db.exec === 'function';
            }, { timeout: 8000 });
            
            const initTime = Date.now() - startTime;
            console.log(`⏱️ Время инициализации SQLite: ${initTime}мс`);
            
            if (initTime < 8000) {
                this.pass(`SQLite инициализируется быстро (${initTime}мс < 8000мс)`);
            } else {
                this.fail(`SQLite инициализируется быстро (${initTime}мс < 8000мс)`);
            }
        } catch (error) {
            console.log('⏱️ Время инициализации SQLite: >8000мс (timeout)');
            this.fail('SQLite инициализируется быстро (>8000мс < 8000мс)');
        }
    }

    async testQueryExecutionSpeed() {
        console.log('\n🧪 Тест: Скорость выполнения SQL запросов');
        
        // Вводим простой запрос
        await this.page.evaluate(() => {
            document.getElementById('sql-input').value = 'SELECT * FROM students LIMIT 5;';
        });
        
        const startTime = Date.now();
        await this.page.click('#execute-test-btn');
        
        // Ждем появления результатов
        await this.page.waitForFunction(() => {
            const results = document.getElementById('results-container');
            return results && results.innerHTML.includes('students');
        }, { timeout: 2000 });
        
        const executionTime = Date.now() - startTime;
        console.log(`⏱️ Время выполнения запроса: ${executionTime}мс`);
        
        if (executionTime < 2000) {
            this.pass(`SQL запрос выполняется быстро (${executionTime}мс < 2000мс)`);
        } else {
            this.fail(`SQL запрос выполняется быстро (${executionTime}мс < 2000мс)`);
        }
    }

    async testMemoryUsage() {
        console.log('\n🧪 Тест: Использование памяти');
        
        const memoryMetrics = await this.page.metrics();
        const memoryUsedMB = Math.round(memoryMetrics.JSHeapUsedSize / 1024 / 1024);
        
        console.log(`💾 Используется памяти: ${memoryUsedMB}MB`);
        
        if (memoryUsedMB < 100) {
            this.pass(`Приложение использует разумное количество памяти (${memoryUsedMB}MB < 100MB)`);
        } else {
            this.fail(`Приложение использует разумное количество памяти (${memoryUsedMB}MB < 100MB)`);
        }
    }

    async testResponseTimes() {
        console.log('\n🧪 Тест: Время отклика интерфейса');
        
        // Тестируем время отклика кнопки
        const startTime = Date.now();
        await this.page.click('#execute-test-btn');
        
        // Ждем любой ответ от интерфейса
        await this.page.waitForFunction(() => {
            const results = document.getElementById('results-container');
            return results && results.innerHTML !== '';
        }, { timeout: 1000 });
        
        const responseTime = Date.now() - startTime;
        console.log(`⚡ Время отклика интерфейса: ${responseTime}мс`);
        
        if (responseTime < 1000) {
            this.pass(`Интерфейс отзывчивый (${responseTime}мс < 1000мс)`);
        } else {
            this.fail(`Интерфейс отзывчивый (${responseTime}мс < 1000мс)`);
        }
    }

    // Метод для запуска всех тестов производительности
    async runAllTests() {
        console.log('\n⚡ === ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ === ⚡\n');
        
        try {
            await this.testPageLoadSpeed();
            await this.testSQLiteInitSpeed();
            await this.testQueryExecutionSpeed();
            await this.testMemoryUsage();
            await this.testResponseTimes();
            
            return this.summary();
        } catch (error) {
            console.error('❌ Критическая ошибка при выполнении тестов производительности:', error);
            this.fail(`Критическая ошибка: ${error.message}`);
            return false;
        }
    }
}

module.exports = PerformanceTests;