const { waitForServer, TestRunner, puppeteer } = require('../utils/test-config');
const PerformanceTests = require('../performance-tests');

async function runPerformanceTests() {
    console.log('⚡ Запуск тестов производительности...\n');
    
    try {
        await waitForServer(3);
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const runner = new TestRunner();
        
        const perfTests = new PerformanceTests(page, runner);
        
        // Загрузка страницы
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        
        // Запуск всех тестов производительности
        await perfTests.testPageLoadTime();
        await perfTests.testSQLiteInitTime();
        await perfTests.testQueryExecutionTime();
        await perfTests.testMemoryUsage();
        await perfTests.testUIResponseTimes();
        await perfTests.testBatchQueryPerformance();
        
        await browser.close();
        const success = runner.summary();
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении тестов производительности:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runPerformanceTests();
}

module.exports = runPerformanceTests;