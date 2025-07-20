const { waitForServer, TestRunner, puppeteer } = require('../utils/test-config');
const UIBasicTests = require('../ui-basic-tests');

async function runUITests() {
    console.log('🎯 Запуск UI тестов...\n');
    
    try {
        await waitForServer(3);
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const runner = new TestRunner();
        
        const uiTests = new UIBasicTests(page, runner);
        
        // Загрузка страницы
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        
        // Запуск всех UI тестов
        await uiTests.testPageLoad();
        await uiTests.testUIElements();
        await uiTests.testSQLiteInitialization();
        await uiTests.testSchemaDisplay();
        await uiTests.testExampleQueries();
        await uiTests.testErrorHandling();
        await uiTests.testResponsiveDesign();
        await uiTests.testInsertQuery();
        
        await browser.close();
        const success = runner.summary();
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении UI тестов:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runUITests();
}

module.exports = runUITests;