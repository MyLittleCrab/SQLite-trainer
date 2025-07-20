const BaseTestRunner = require('../base-test-runner');
const PerformanceTests = require('../performance-tests');

async function runPerformanceTests() {
    console.log('⚡ Запуск тестов производительности...\n');
    
    await BaseTestRunner.waitForServer();
    
    const perfTests = new PerformanceTests();
    
    try {
        await perfTests.init();
        const success = await perfTests.runAllTests();
        await perfTests.cleanup();
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении тестов производительности:', error);
        await perfTests.cleanup();
        process.exit(1);
    }
}

runPerformanceTests();