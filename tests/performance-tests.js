const { BaseTest } = require('./utils/test-config');

// Класс для тестов производительности
class PerformanceTests extends BaseTest {
    async testPageLoadSpeed() {
        console.log('\n🧪 Тест: Скорость загрузки страницы');
        
        const startTime = Date.now();
        
        // Измеряем время загрузки страницы
        await this.page.goto(`http://localhost:8000/index.html`, { 
            waitUntil: 'networkidle0' 
        });
        
        const loadTime = Date.now() - startTime;
        console.log(`⏱️ Время загрузки: ${loadTime}мс`);
        
        // Проверяем что страница загружается быстро (менее 5 секунд)
        await this.runner.assert(
            loadTime < 5000, 
            `Страница загружается быстро (${loadTime}мс < 5000мс)`
        );
    }

    async testSQLiteInitSpeed() {
        console.log('\n🧪 Тест: Скорость инициализации SQLite');
        
        const startTime = Date.now();
        
        // Ждем инициализации SQLite
        try {
            await this.page.waitForFunction(
                () => window.db !== null && window.SQL !== null,
                { timeout: 10000 }
            );
            
            const initTime = Date.now() - startTime;
            console.log(`⏱️ Время инициализации SQLite: ${initTime}мс`);
            
            // Проверяем что SQLite инициализируется быстро (менее 8 секунд)
            await this.runner.assert(
                initTime < 8000, 
                `SQLite инициализируется быстро (${initTime}мс < 8000мс)`
            );
            
        } catch (error) {
            await this.runner.assert(false, 'SQLite не инициализировался в течение 10 секунд');
        }
    }

    async testQueryExecutionSpeed() {
        console.log('\n🧪 Тест: Скорость выполнения SQL запросов');
        
        // Выполняем простой запрос и измеряем время
        const startTime = Date.now();
        
        await this.page.evaluate(() => {
            document.getElementById('sql-input').value = 'SELECT COUNT(*) FROM students';
        });
        
        await this.page.click('#execute-test-btn');
        
        // Ждем появления результатов
        await this.page.waitForFunction(
            () => {
                const results = document.getElementById('results-container').innerHTML;
                return results.includes('Query executed successfully') || 
                       results.includes('Запрос выполнен успешно');
            },
            { timeout: 5000 }
        );
        
        const executionTime = Date.now() - startTime;
        console.log(`⏱️ Время выполнения запроса: ${executionTime}мс`);
        
        // Проверяем что запрос выполняется быстро (менее 2 секунд)
        await this.runner.assert(
            executionTime < 2000, 
            `SQL запрос выполняется быстро (${executionTime}мс < 2000мс)`
        );
    }

    async testMemoryUsage() {
        console.log('\n🧪 Тест: Использование памяти');
        
        // Получаем информацию о памяти в браузере
        const memoryInfo = await this.page.evaluate(() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });
        
        if (memoryInfo) {
            const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
            console.log(`💾 Используется памяти: ${usedMB}MB`);
            
            // Проверяем что приложение использует разумное количество памяти (менее 100MB)
            await this.runner.assert(
                usedMB < 100, 
                `Приложение использует разумное количество памяти (${usedMB}MB < 100MB)`
            );
        } else {
            console.log('ℹ️ Информация о памяти недоступна в этом браузере');
            await this.runner.assert(true, 'Тест памяти пропущен (API недоступно)');
        }
    }

    async testResponseTimes() {
        console.log('\n🧪 Тест: Время отклика интерфейса');
        
        // Тестируем время отклика на клик по кнопке
        const startTime = Date.now();
        
        await this.page.click('#execute-test-btn');
        
        // Ждем любого изменения в контейнере результатов
        await this.page.waitForFunction(
            () => {
                const results = document.getElementById('results-container').innerHTML;
                return results.trim().length > 0;
            },
            { timeout: 3000 }
        );
        
        const responseTime = Date.now() - startTime;
        console.log(`⚡ Время отклика интерфейса: ${responseTime}мс`);
        
        // Проверяем что интерфейс отзывчивый (менее 1 секунды)
        await this.runner.assert(
            responseTime < 1000, 
            `Интерфейс отзывчивый (${responseTime}мс < 1000мс)`
        );
    }
}

module.exports = PerformanceTests;