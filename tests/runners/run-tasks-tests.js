const { waitForServer, TestRunner, puppeteer } = require('../utils/test-config');
const TaskSystemTests = require('../task-system-tests');

async function runTasksTests() {
    console.log('📝 Запуск тестов системы задач...\n');
    
    try {
        await waitForServer(3);
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const runner = new TestRunner();
        
        const taskTests = new TaskSystemTests(page, runner);
        
        // Загрузка страницы
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        
        // Запуск всех тестов системы задач
        await taskTests.testTaskSystem();
        await taskTests.testTaskFieldsLocalization();
        await taskTests.testTaskExecution();
        await taskTests.testTaskSwitching();
        
        await browser.close();
        const success = runner.summary();
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении тестов системы задач:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runTasksTests();
}

module.exports = runTasksTests;