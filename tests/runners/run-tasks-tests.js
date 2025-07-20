const BaseTestRunner = require('../base-test-runner');
const TaskSystemTests = require('../task-system-tests');

async function runTasksTests() {
    console.log('📝 Запуск тестов системы задач...\n');
    
    await BaseTestRunner.waitForServer();
    
    const taskTests = new TaskSystemTests();
    
    try {
        await taskTests.init();
        const success = await taskTests.runAllTests();
        await taskTests.cleanup();
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении тестов задач:', error);
        await taskTests.cleanup();
        process.exit(1);
    }
}

runTasksTests();