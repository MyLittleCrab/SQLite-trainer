const { waitForServer, TestRunner, puppeteer } = require('../utils/test-config');
const SQLFunctionTests = require('../sql-function-tests');

async function runSQLTests() {
    console.log('🔧 Запуск тестов SQL функций...\n');
    
    try {
        await waitForServer(3);
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const runner = new TestRunner();
        
        const sqlTests = new SQLFunctionTests(page, runner);
        
        // Загрузка страницы
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        
        // Запуск всех SQL тестов
        await sqlTests.testExecuteTestSQL();
        await sqlTests.testCheckSolutionSQL();
        await sqlTests.testExecuteTestButton();
        await sqlTests.testCheckSolutionButton();
        
        await browser.close();
        const success = runner.summary();
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении SQL тестов:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runSQLTests();
}

module.exports = runSQLTests;